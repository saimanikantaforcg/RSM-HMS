import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { Patient } from './../src/entities/patient.entity';
import * as jwt from 'jsonwebtoken';

/** Helper: mint a test JWT for a given tenant and role */
function mintToken(tenantId: string, role = 'hospital_admin') {
  return jwt.sign(
    { sub: `test-user-${tenantId}`, tenantId, role, permissions: ['*:*'], jti: `jti-${tenantId}` },
    'test-secret',
    { expiresIn: '1h' },
  );
}

describe('Clinical Hardening (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Set mandatory env vars for production hardening validation
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.COOKIE_SECRET = 'test-cookie-secret';
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.DB_TYPE = 'sqlite';
    process.env.DB_NAME = ':memory:';
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PHI Encryption-at-Rest', () => {
    it('should store patient name in encrypted format in DB but decrypted in response', async () => {
      // 1. Create a patient via API
      const patientDto = {
        firstName: 'Hardened',
        lastName: 'Patient',
        dob: '1980-01-01',
        gender: 'male',
        contactNumber: '+1234567890',
        email: 'hardened@hms.local',
      };

      // We skip Auth for simplicity in this specific unit/integration hybrid if possible,
      // but here we should follow the flow. 
      // For now, let's assume we use a seed or a mock token.
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${mintToken('tenant-alpha')}`)
        .send(patientDto);

      // 2. Check the decrypted response
      expect(response.status).toBe(201);
      const patient = response.body.data ?? response.body;
      expect(patient.firstName).toBe('Hardened');

      // 3. SECRECY CHECK: Query the raw database directly to see the encrypted value
      const rawResult = await dataSource.query(`SELECT * FROM patients WHERE id = '${patient.id}'`);
      const rawPatient = rawResult[0];

      // The raw firstName in DB should NOT be 'Hardened'
      expect(rawPatient.first_name).not.toBe('Hardened');
      expect(rawPatient.first_name).toContain(':'); // Ciphertext format: iv:authTag:content
    });
  });

  describe('Multi-Tenancy RLS (Level 1: Application Boundary)', () => {
    it('should NOT allow Tenant B to see Tenant A records', async () => {
      // 1. Create record as Tenant A
      const pA = await request(app.getHttpServer())
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${mintToken('tenant-alpha')}`)
        .send({ firstName: 'Alpha', lastName: 'Patient', dob: '1990-01-01', gender: 'female' });

      const patientId = (pA.body.data ?? pA.body).id;

      // 2. Attempt to read as Tenant B
      const pB = await request(app.getHttpServer())
        .get(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${mintToken('tenant-beta')}`);

      // Should fail or return 404
      expect(pB.status).toBe(404);
    });
  });
});
