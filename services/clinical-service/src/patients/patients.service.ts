import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient, BloodGroup } from '../entities/patient.entity';
import { Encounter } from '../entities/encounter.entity';
import { Prescription } from '../entities/prescription.entity';
import { LabOrder } from '../entities/lab-order.entity';
import { VitalSign } from '../entities/vital-sign.entity';
import { EmrNote } from '../entities/emr-note.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';
import { PatientsCacheService } from './patients-cache.service';
import { randomInt } from 'crypto';

@Injectable()
export class PatientsService {
    constructor(
        @InjectRepository(Patient)
        private readonly patientRepo: Repository<Patient>,
        @InjectRepository(Encounter)
        private readonly encounterRepo: Repository<Encounter>,
        @InjectRepository(Prescription)
        private readonly rxRepo: Repository<Prescription>,
        @InjectRepository(LabOrder)
        private readonly labOrderRepo: Repository<LabOrder>,
        @InjectRepository(VitalSign)
        private readonly vitalRepo: Repository<VitalSign>,
        @InjectRepository(EmrNote)
        private readonly emrNoteRepo: Repository<EmrNote>,
        private readonly cacheService: PatientsCacheService,
    ) { }

    /** Generate MRN: MRN-YYYYMMDD-RANDOM (uses crypto, not Math.random) */
    private generateMrn(): string {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = randomInt(1000, 9999);
        return `MRN-${date}-${rand}`;
    }

    async findAll(tenantId: string, query: PaginationDto) {
        const { page = 1, limit = 10, search = '' } = query;
        const queryBuilder = this.patientRepo.createQueryBuilder('p')
            .where('p.tenantId = :tenantId', { tenantId })
            .andWhere('p.isActive = :isActive', { isActive: true });

        if (search) {
            queryBuilder.andWhere(
                '(p.firstName LIKE :search OR p.lastName LIKE :search OR p.mrn LIKE :search)',
                { search: `%${search}%` }
            );
        }

        const [data, total] = await queryBuilder
            .orderBy('p.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return createPaginatedResponse(data.map(p => this.serialize(p)), total, page, limit);
    }

    async findOne(id: string, tenantId: string) {
        // 1. Check Cache
        const cached = await this.cacheService.getPatient(tenantId, id);
        if (cached) return this.serialize(cached);

        // 2. Fallback to DB
        const patient = await this.patientRepo.findOne({
            where: { id, tenantId, isActive: true }
        });
        if (!patient) throw new NotFoundException(`Patient ${id} not found`);
        
        // 3. Update Cache
        await this.cacheService.setPatient(tenantId, patient);
        
        return this.serialize(patient);
    }

    async create(dto: CreatePatientDto & { encounterType?: string, department?: string }, tenantId: string) {
        return await this.patientRepo.manager.transaction(async (manager) => {
            const patient = manager.create(Patient, {
                ...dto,
                tenantId,
                mrn: this.generateMrn(),
                isActive: true,
            });
            const savedPatient = await manager.save(patient);

            // Atomic Encounter Creation (Queueing)
            if (dto.encounterType || dto.department) {
                const encounter = manager.create(Encounter, {
                    tenantId,
                    patientId: savedPatient.id,
                    patientName: `${savedPatient.firstName} ${savedPatient.lastName}`,
                    type: (dto.encounterType as any) || 'OPD',
                    status: 'Planned',
                    diagnosis: dto.department || 'General Medicine',
                    admissionDate: new Date().toISOString().split('T')[0],
                });
                await manager.save(encounter);
            }

            return this.serialize(savedPatient);
        });
    }

    async update(id: string, tenantId: string, dto: Partial<CreatePatientDto>) {
        const patient = await this.patientRepo.findOne({ where: { id, tenantId } });
        if (!patient) throw new NotFoundException(`Patient ${id} not found`);
        Object.assign(patient, dto);
        const saved = await this.patientRepo.save(patient);
        
        // Invalidate Cache
        await this.cacheService.invalidatePatient(tenantId, id);
        
        return this.serialize(saved);
    }

    async deactivate(id: string, tenantId: string) {
        const patient = await this.patientRepo.findOne({ where: { id, tenantId } });
        if (!patient) throw new NotFoundException(`Patient ${id} not found`);

        // Soft-delete: sets deleted_at timestamp — record is never physically removed (HIPAA)
        await this.patientRepo.softRemove(patient);

        // Invalidate Cache
        await this.cacheService.invalidatePatient(tenantId, id);

        return { message: 'Patient deactivated successfully' };
    }

    /**
     * Patient timeline: chronological union of encounters, prescriptions,
     * lab orders, vitals, and EMR notes for a single patient.
     * All scoped to tenantId for tenant isolation.
     */
    async getTimeline(patientId: string, tenantId: string) {
        const patient = await this.patientRepo.findOne({ where: { id: patientId, tenantId } });
        if (!patient) throw new NotFoundException(`Patient ${patientId} not found`);

        const [encounters, prescriptions, labOrders, vitals, emrNotes] = await Promise.all([
            this.encounterRepo.find({ where: { patientId, tenantId }, order: { createdAt: 'DESC' } }),
            this.rxRepo.find({ where: { patientId, tenantId }, order: { prescribedAt: 'DESC' } }),
            this.labOrderRepo.find({ where: { patientId, tenantId }, order: { createdAt: 'DESC' } }),
            this.vitalRepo.find({ where: { patientId, tenantId }, order: { recordedAt: 'DESC' } }),
            this.emrNoteRepo.find({ where: { patientId, tenantId }, order: { createdAt: 'DESC' } }),
        ]);

        // Merge into a single timeline with typed events, sorted newest first
        const events = [
            ...encounters.map((e) => ({
                type: 'encounter' as const,
                date: e.createdAt,
                id: e.id,
                summary: `${e.type} encounter — ${e.status}`,
                data: e,
            })),
            ...prescriptions.map((rx) => ({
                type: 'prescription' as const,
                date: rx.prescribedAt,
                id: rx.id,
                summary: `Prescription — ${rx.status}`,
                data: rx,
            })),
            ...labOrders.map((lo) => ({
                type: 'lab_order' as const,
                date: lo.createdAt,
                id: lo.id,
                summary: `Lab order: ${lo.testProfile} — ${lo.status}`,
                data: lo,
            })),
            ...vitals.map((v) => ({
                type: 'vital' as const,
                date: v.recordedAt,
                id: v.id,
                summary: 'Vitals recorded',
                data: v,
            })),
            ...emrNotes.map((n) => ({
                type: 'emr_note' as const,
                date: n.createdAt,
                id: n.id,
                summary: `${n.type}: ${n.status}`,
                data: n,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return { patient, events };
    }

    /** Seed demo patients if tenant has none */
    async seedDemoPatients(tenantId: string) {
        const existing = await this.patientRepo.count({ where: { tenantId } });
        if (existing > 0) return { seeded: false, count: existing };

        const demos = [
            { firstName: 'Michael', lastName: 'Lawson', mrn: 'MRN-20260315-4921', dob: '1978-04-12', gender: 'male' as const, bloodGroup: 'O+' as BloodGroup, contactNumber: '+1-555-0101', email: 'michael.lawson@email.com', tenantId, isActive: true },
            { firstName: 'Sarah', lastName: 'Jenkins', mrn: 'MRN-20260317-4922', dob: '1990-09-23', gender: 'female' as const, bloodGroup: 'A+' as BloodGroup, contactNumber: '+1-555-0102', email: 'sarah.jenkins@email.com', tenantId, isActive: true },
            { firstName: 'David', lastName: 'Chen', mrn: 'MRN-20260318-4923', dob: '1965-02-17', gender: 'male' as const, bloodGroup: 'B+' as BloodGroup, contactNumber: '+1-555-0103', email: 'david.chen@email.com', tenantId, isActive: true },
            { firstName: 'Priya', lastName: 'Sharma', mrn: 'MRN-20260319-4924', dob: '1985-07-05', gender: 'female' as const, bloodGroup: 'AB-' as BloodGroup, contactNumber: '+1-555-0104', email: 'priya.sharma@email.com', tenantId, isActive: true },
            { firstName: 'James', lastName: 'Walker', mrn: 'MRN-20260320-4925', dob: '1952-11-30', gender: 'male' as const, bloodGroup: 'O-' as BloodGroup, contactNumber: '+1-555-0105', email: 'j.walker@email.com', tenantId, isActive: true },
        ];

        const entities = demos.map(d => this.patientRepo.create(d));
        const saved = await this.patientRepo.save(entities);
        return { seeded: true, count: saved.length };
    }

    private serialize(p: Patient) {
        return {
            id: p.id,
            mrn: p.mrn,
            firstName: p.firstName,
            lastName: p.lastName,
            fullName: `${p.firstName} ${p.lastName}`,
            dob: p.dob,
            gender: p.gender,
            bloodGroup: p.bloodGroup,
            contactNumber: p.contactNumber,
            email: p.email,
            address: p.address,
            nationality: p.nationality,
            insuranceProvider: p.insuranceProvider,
            insuranceNumber: p.insuranceNumber,
            emergencyContact: p.emergencyContact,
            isActive: p.isActive,
            createdAt: p.createdAt,
        };
    }
}
