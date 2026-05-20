import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * InitialSchema — creates all tables for RSM HMS v1.
 *
 * Generated reference migration. In production, run:
 *   npm run migration:run
 *
 * To regenerate from the current entity state against a live DB:
 *   npm run migration:generate -- src/migrations/InitialSchema
 */
export class InitialSchema1743000000000 implements MigrationInterface {
  name = 'InitialSchema1743000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Extensions ────────────────────────────────────────────────────────
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── hospital ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hospital" (
        "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name"       VARCHAR(255) NOT NULL,
        "address"    TEXT,
        "phone"      VARCHAR(30),
        "email"      VARCHAR(255),
        "tenantId"   VARCHAR(50) NOT NULL UNIQUE,
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── user ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id"                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"             VARCHAR(50) NOT NULL,
        "email"                VARCHAR(255) NOT NULL,
        "password"             VARCHAR(255) NOT NULL,
        "firstName"            VARCHAR(100),
        "lastName"             VARCHAR(100),
        "role"                 VARCHAR(50) NOT NULL DEFAULT 'receptionist',
        "isActive"             BOOLEAN NOT NULL DEFAULT true,
        "failedLoginAttempts"  INT NOT NULL DEFAULT 0,
        "lockedUntil"          TIMESTAMPTZ,
        "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE ("tenantId", "email")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_tenant" ON "user" ("tenantId")`);

    // ── patient ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "patient" (
        "id"                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"          VARCHAR(50) NOT NULL,
        "mrn"               VARCHAR(30) NOT NULL,
        "firstName"         TEXT,
        "lastName"          TEXT,
        "dob"               DATE,
        "gender"            VARCHAR(10),
        "contactNumber"     TEXT,
        "email"             TEXT,
        "address"           TEXT,
        "bloodGroup"        VARCHAR(10),
        "insuranceProvider" TEXT,
        "department"        VARCHAR(100),
        "isActive"          BOOLEAN NOT NULL DEFAULT true,
        "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at"        TIMESTAMPTZ
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_patient_tenant" ON "patient" ("tenantId")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_patient_tenant_mrn" ON "patient" ("tenantId", "mrn")`);

    // ── encounter ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "encounter" (
        "id"             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"       VARCHAR(50) NOT NULL,
        "patientId"      UUID REFERENCES "patient"("id") ON DELETE SET NULL,
        "type"           VARCHAR(50),
        "status"         VARCHAR(50) NOT NULL DEFAULT 'active',
        "chiefComplaint" TEXT,
        "diagnosis"      TEXT,
        "notes"          TEXT,
        "startedAt"      TIMESTAMPTZ,
        "endedAt"        TIMESTAMPTZ,
        "providerId"     UUID,
        "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at"     TIMESTAMPTZ
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_encounter_tenant" ON "encounter" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_encounter_patient" ON "encounter" ("patientId")`);

    // ── audit_log ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_log" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"    VARCHAR(50),
        "userId"      VARCHAR(255),
        "action"      VARCHAR(100) NOT NULL,
        "entityName"  VARCHAR(100) NOT NULL,
        "entityId"    VARCHAR(255),
        "oldValues"   JSONB,
        "newValues"   JSONB,
        "ipAddress"   VARCHAR(50),
        "userAgent"   TEXT,
        "prevHash"    VARCHAR(64),
        "entryHash"   VARCHAR(64),
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_tenant" ON "audit_log" ("tenantId")`);

    // ── appointment ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appointment" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"      VARCHAR(50) NOT NULL,
        "patientId"     UUID,
        "providerId"    UUID,
        "scheduledAt"   TIMESTAMPTZ NOT NULL,
        "duration"      INT NOT NULL DEFAULT 30,
        "type"          VARCHAR(50),
        "status"        VARCHAR(50) NOT NULL DEFAULT 'scheduled',
        "notes"         TEXT,
        "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_appointment_tenant" ON "appointment" ("tenantId")`);

    // ── ward ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ward" (
        "id"        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"  VARCHAR(50) NOT NULL,
        "name"      VARCHAR(100) NOT NULL,
        "type"      VARCHAR(50),
        "capacity"  INT NOT NULL DEFAULT 0,
        "floor"     INT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── bed ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bed" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"    VARCHAR(50) NOT NULL,
        "wardId"      UUID REFERENCES "ward"("id") ON DELETE SET NULL,
        "number"      VARCHAR(20) NOT NULL,
        "type"        VARCHAR(50),
        "status"      VARCHAR(30) NOT NULL DEFAULT 'available',
        "patientId"   UUID,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bed_tenant" ON "bed" ("tenantId")`);

    // ── admission ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admission" (
        "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"        VARCHAR(50) NOT NULL,
        "patientId"       UUID,
        "bedId"           UUID,
        "wardId"          UUID,
        "admittedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        "dischargedAt"    TIMESTAMPTZ,
        "status"          VARCHAR(30) NOT NULL DEFAULT 'admitted',
        "admissionReason" TEXT,
        "dischargeNotes"  TEXT,
        "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── vital_sign ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vital_sign" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"     VARCHAR(50) NOT NULL,
        "patientId"    UUID NOT NULL,
        "encounterId"  UUID,
        "recordedBy"   UUID,
        "temperature"  FLOAT,
        "systolic"     INT,
        "diastolic"    INT,
        "heartRate"    INT,
        "spo2"         FLOAT,
        "weight"       FLOAT,
        "height"       FLOAT,
        "bmi"          FLOAT,
        "respiratoryRate" INT,
        "recordedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vital_patient" ON "vital_sign" ("patientId")`);

    // ── emr_note ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "emr_note" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"     VARCHAR(50) NOT NULL,
        "patientId"    UUID NOT NULL,
        "encounterId"  UUID,
        "authorId"     UUID,
        "type"         VARCHAR(50) NOT NULL DEFAULT 'progress',
        "subjective"   TEXT,
        "objective"    TEXT,
        "assessment"   TEXT,
        "plan"         TEXT,
        "content"      TEXT,
        "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── prescription ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "prescription" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"    VARCHAR(50) NOT NULL,
        "patientId"   UUID NOT NULL,
        "encounterId" UUID,
        "prescriberId" UUID,
        "drugName"    VARCHAR(255) NOT NULL,
        "dosage"      VARCHAR(100),
        "frequency"   VARCHAR(100),
        "duration"    VARCHAR(100),
        "route"       VARCHAR(50),
        "instructions" TEXT,
        "status"      VARCHAR(30) NOT NULL DEFAULT 'active',
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── lab_order ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lab_order" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"     VARCHAR(50) NOT NULL,
        "patientId"    UUID NOT NULL,
        "encounterId"  UUID,
        "orderedBy"    UUID,
        "testName"     VARCHAR(255) NOT NULL,
        "testCode"     VARCHAR(50),
        "priority"     VARCHAR(20) NOT NULL DEFAULT 'routine',
        "status"       VARCHAR(30) NOT NULL DEFAULT 'pending',
        "result"       TEXT,
        "resultValue"  VARCHAR(100),
        "referenceRange" VARCHAR(100),
        "unit"         VARCHAR(30),
        "resultedAt"   TIMESTAMPTZ,
        "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── pharmacy_dispense ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pharmacy_dispense" (
        "id"             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"       VARCHAR(50) NOT NULL,
        "patientId"      UUID,
        "prescriptionId" UUID,
        "drugName"       VARCHAR(255) NOT NULL,
        "quantity"       INT NOT NULL DEFAULT 1,
        "dispensedBy"    UUID,
        "dispensedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        "batchNo"        VARCHAR(50),
        "expiryDate"     DATE,
        "status"         VARCHAR(30) NOT NULL DEFAULT 'dispensed',
        "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── invoice / invoice_item ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"    VARCHAR(50) NOT NULL,
        "patientId"   UUID,
        "encounterId" UUID,
        "invoiceNo"   VARCHAR(50) NOT NULL,
        "status"      VARCHAR(30) NOT NULL DEFAULT 'draft',
        "total"       NUMERIC(12,2) NOT NULL DEFAULT 0,
        "paid"        NUMERIC(12,2) NOT NULL DEFAULT 0,
        "currency"    VARCHAR(5) NOT NULL DEFAULT 'INR',
        "notes"       TEXT,
        "issuedAt"    TIMESTAMPTZ,
        "dueAt"       TIMESTAMPTZ,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice_item" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"    VARCHAR(50) NOT NULL,
        "invoiceId"   UUID REFERENCES "invoice"("id") ON DELETE CASCADE,
        "description" TEXT NOT NULL,
        "quantity"    INT NOT NULL DEFAULT 1,
        "unitPrice"   NUMERIC(12,2) NOT NULL,
        "total"       NUMERIC(12,2) NOT NULL,
        "category"    VARCHAR(50),
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── claim ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "claim" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"    VARCHAR(50) NOT NULL,
        "patientId"   UUID,
        "invoiceId"   UUID,
        "payer"       VARCHAR(255),
        "amount"      NUMERIC(12,2),
        "status"      VARCHAR(30) NOT NULL DEFAULT 'submitted',
        "icdCode"     VARCHAR(20),
        "submittedAt" TIMESTAMPTZ,
        "settledAt"   TIMESTAMPTZ,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── payment ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment" (
        "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"   VARCHAR(50) NOT NULL,
        "invoiceId"  UUID,
        "patientId"  UUID,
        "amount"     NUMERIC(12,2) NOT NULL,
        "method"     VARCHAR(50),
        "status"     VARCHAR(30) NOT NULL DEFAULT 'completed',
        "reference"  VARCHAR(100),
        "paidAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── er_case ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "er_case" (
        "id"               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"         VARCHAR(50) NOT NULL,
        "patient"          VARCHAR(255),
        "patientId"        UUID,
        "level"            VARCHAR(50),
        "condition"        TEXT,
        "status"           VARCHAR(30) NOT NULL DEFAULT 'Triaged',
        "assignedDoctorId" UUID,
        "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── patient_consent ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "patient_consent" (
        "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"        VARCHAR(50) NOT NULL,
        "patientId"       UUID NOT NULL,
        "consentType"     VARCHAR(30) NOT NULL,
        "status"          VARCHAR(20) NOT NULL DEFAULT 'granted',
        "expiresAt"       TIMESTAMPTZ,
        "consentText"     TEXT,
        "documentVersion" VARCHAR(20),
        "recordedBy"      UUID,
        "ipAddress"       VARCHAR(50),
        "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_consent_patient" ON "patient_consent" ("tenantId", "patientId")`);

    // ── hospital_settings ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hospital_settings" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"      VARCHAR(50) NOT NULL UNIQUE,
        "hospitalName"  VARCHAR(255),
        "theme"         VARCHAR(20) NOT NULL DEFAULT 'light',
        "autoLogout"    INT NOT NULL DEFAULT 30,
        "notifications" BOOLEAN NOT NULL DEFAULT true,
        "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── surgery_block ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "surgery_block" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"    VARCHAR(50) NOT NULL,
        "patientId"   UUID,
        "surgeonId"   UUID,
        "theatre"     VARCHAR(50),
        "procedure"   TEXT,
        "scheduledAt" TIMESTAMPTZ,
        "duration"    INT,
        "status"      VARCHAR(30) NOT NULL DEFAULT 'scheduled',
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── stock / stock_transaction ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"     VARCHAR(50) NOT NULL,
        "itemName"     VARCHAR(255) NOT NULL,
        "category"     VARCHAR(50),
        "unit"         VARCHAR(20),
        "quantity"     NUMERIC(12,2) NOT NULL DEFAULT 0,
        "reorderLevel" NUMERIC(12,2),
        "unitPrice"    NUMERIC(12,2),
        "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock_transaction" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"    VARCHAR(50) NOT NULL,
        "stockId"     UUID REFERENCES "stock"("id") ON DELETE SET NULL,
        "type"        VARCHAR(10) NOT NULL,
        "quantity"    NUMERIC(12,2) NOT NULL,
        "reason"      TEXT,
        "performedBy" UUID,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── abha_profile ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "abha_profile" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"    VARCHAR(50) NOT NULL,
        "patientId"   UUID,
        "abhaNumber"  VARCHAR(20),
        "abhaAddress" VARCHAR(100),
        "verified"    BOOLEAN NOT NULL DEFAULT false,
        "linkedAt"    TIMESTAMPTZ,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── rcm_entry ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rcm_entry" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"    VARCHAR(50) NOT NULL,
        "patientId"   UUID,
        "encounterId" UUID,
        "icdCode"     VARCHAR(20),
        "cptCode"     VARCHAR(20),
        "amount"      NUMERIC(12,2),
        "status"      VARCHAR(30) NOT NULL DEFAULT 'pending',
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── notification ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification" (
        "id"        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"  VARCHAR(50) NOT NULL,
        "userId"    UUID,
        "type"      VARCHAR(50),
        "title"     VARCHAR(255),
        "message"   TEXT,
        "isRead"    BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── adt_log ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "adt_log" (
        "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"   VARCHAR(50) NOT NULL,
        "patientId"  UUID,
        "action"     VARCHAR(30) NOT NULL,
        "wardId"     UUID,
        "bedId"      UUID,
        "performedBy" UUID,
        "notes"      TEXT,
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── staff_attendance / staff_roster ───────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "staff_roster" (
        "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"   VARCHAR(50) NOT NULL,
        "userId"     UUID NOT NULL,
        "department" VARCHAR(100),
        "shift"      VARCHAR(50),
        "startDate"  DATE,
        "endDate"    DATE,
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "staff_attendance" (
        "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"   VARCHAR(50) NOT NULL,
        "userId"     UUID NOT NULL,
        "date"       DATE NOT NULL,
        "checkIn"    TIMESTAMPTZ,
        "checkOut"   TIMESTAMPTZ,
        "status"     VARCHAR(20) NOT NULL DEFAULT 'present',
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── analytics_report ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "analytics_report" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenantId"    VARCHAR(50) NOT NULL,
        "reportType"  VARCHAR(50) NOT NULL,
        "period"      VARCHAR(30),
        "data"        JSONB,
        "generatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // ── typeorm_migrations (self) — TypeORM creates this automatically
    // No action needed here.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'analytics_report', 'staff_attendance', 'staff_roster',
      'adt_log', 'notification', 'rcm_entry', 'abha_profile',
      'stock_transaction', 'stock', 'surgery_block',
      'hospital_settings', 'patient_consent', 'er_case',
      'payment', 'claim', 'invoice_item', 'invoice',
      'pharmacy_dispense', 'lab_order', 'prescription',
      'emr_note', 'vital_sign', 'admission', 'bed', 'ward',
      'appointment', 'audit_log', 'encounter', 'patient', 'user', 'hospital',
    ];
    for (const t of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${t}" CASCADE`);
    }
  }
}
