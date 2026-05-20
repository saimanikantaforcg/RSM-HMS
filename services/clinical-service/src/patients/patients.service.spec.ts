import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Patient } from '../entities/patient.entity';
import { Encounter } from '../entities/encounter.entity';
import { PatientsCacheService } from './patients-cache.service';
import { NotFoundException } from '@nestjs/common';

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
};

const mockPatientRepo = () => ({
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn().mockResolvedValue(undefined),
  manager: {
    transaction: jest.fn().mockImplementation(async (cb: any) => {
      // Simulate a manager with create/save for the transaction callback
      const mockManager = {
        create: jest.fn().mockImplementation((_Entity: any, data: any) => data),
        save: jest.fn().mockImplementation(async (data: any) => ({ id: 'patient-1', mrn: 'MRN-TEST', ...data })),
        findOne: jest.fn().mockResolvedValue(null),
      };
      return cb(mockManager);
    }),
  },
});

const mockEncounterRepo = () => ({
  find: jest.fn().mockResolvedValue([]),
});

const mockCacheService = {
  getPatient: jest.fn().mockResolvedValue(null),
  setPatient: jest.fn().mockResolvedValue(undefined),
  invalidatePatient: jest.fn().mockResolvedValue(undefined),
};

describe('PatientsService', () => {
  let service: PatientsService;
  let repo: ReturnType<typeof mockPatientRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: getRepositoryToken(Patient), useFactory: mockPatientRepo },
        { provide: getRepositoryToken(Encounter), useFactory: mockEncounterRepo },
        { provide: PatientsCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    repo = module.get(getRepositoryToken(Patient));
  });

  describe('findAll', () => {
    it('should paginate and filter by tenantId using query builder', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: '1', firstName: 'John' }], 1]);
      const result = await service.findAll('tenant-1', { page: 1, limit: 10 });
      
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
      expect(repo.createQueryBuilder).toHaveBeenCalledWith('p');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('p.tenantId = :tenantId', { tenantId: 'tenant-1' });
    });
  });

  describe('create', () => {
    it('should save a new patient with MRN', async () => {
      const dto = { firstName: 'Jane', lastName: 'Doe', dob: '1990-01-01', gender: 'female' as any };

      const result = await service.create(dto, 'tenant-1');
      expect(result.firstName).toEqual('Jane');
      expect(result.mrn).toMatch(/^MRN-/);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if patient does not exist for tenant', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('invalid-id', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('should soft-delete the patient instead of hard deleting', async () => {
      const patient = { id: 'patient-1', isActive: true, tenantId: 'tenant-1' };
      repo.findOne.mockResolvedValue(patient);

      const result = await service.deactivate('patient-1', 'tenant-1');
      expect(result.message).toBe('Patient deactivated successfully');
      expect(repo.softRemove).toHaveBeenCalledWith(patient);
    });
  });
});
