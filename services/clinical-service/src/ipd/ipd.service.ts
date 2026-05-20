import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Encounter } from '../entities/encounter.entity';

@Injectable()
export class IpdService {
  constructor(
    @InjectRepository(Encounter)
    private readonly encounterRepo: Repository<Encounter>
  ) {}

  async getPatients(tenantId: string) {
    const encounters = await this.encounterRepo.find({
      where: { 
        tenantId, 
        type: 'IPD', 
        status: 'InProgress' 
      },
      order: { admissionDate: 'DESC' }
    });

    return encounters.map(e => ({
      id: `IPD-${e.id.split('-')[0].toUpperCase()}`,
      name: e.patientName,
      bed: e.location || 'Unassigned', // Using location as proxy for bed
      consultant: e.practitionerName || 'Unassigned',
      admDate: e.admissionDate,
      days: this.calculateDays(e.admissionDate),
      dx: e.diagnosis || 'Observation',
      status: e.status === 'InProgress' ? 'Stable' : 'Critical'
    }));
  }

  async admitPatient(tenantId: string, data: any) {
    const encounter = this.encounterRepo.create({
      tenantId,
      patientName: data.name,
      patientId: data.patientId || 'ipd-walkin',
      type: 'IPD',
      status: 'InProgress',
      admissionDate: new Date().toISOString().split('T')[0],
      diagnosis: data.dx,
      location: data.bed || 'Ward A-01',
      practitionerName: data.consultant
    });
    
    return await this.encounterRepo.save(encounter);
  }

  private calculateDays(admissionDate: string): number {
    const start = new Date(admissionDate);
    const diff = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }
}
