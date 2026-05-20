import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ProductionFoundation — V2 schema changes for RSM HMS production-readiness.
 *
 * Changes:
 *  1. encounters          — add appointment_id, opd_queue_id columns
 *  2. prescriptions       — drop old columns, add encounter_id, prescribed_by_id,
 *                           prescribed_by_name, notes; migrate status enum
 *  3. prescription_items  — new table
 *  4. lab_orders          — add encounter_id, patient_id, ordered_by_id, ordered_by_name,
 *                           verified_by_id, verified_at, sample_collected_at,
 *                           sample_collected_by, test_catalog_id; migrate status enum
 *  5. invoices            — add paid_amount; migrate status values
 *  6. pharmacy_dispenses  — add prescription_id, prescription_item_id, patient_id
 *  7. departments         — new table
 *  8. opd_queue           — new table
 *  9. lab_test_catalog    — new table
 * 10. drug_catalog        — new table
 */
export class ProductionFoundation1748000000000 implements MigrationInterface {
  name = 'ProductionFoundation1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. encounters — new FK columns ────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "encounters"
        ADD COLUMN IF NOT EXISTS "appointment_id"  UUID,
        ADD COLUMN IF NOT EXISTS "opd_queue_id"    UUID
    `);

    // ── 2. prescriptions — structural rebuild ─────────────────────────────
    // Add new columns first (nullable initially for backfill)
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
        ADD COLUMN IF NOT EXISTS "encounter_id"        UUID,
        ADD COLUMN IF NOT EXISTS "prescribed_by_id"    VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "prescribed_by_name"  VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "notes"               TEXT
    `);

    // Backfill: set encounter_id to own id as a placeholder for existing rows
    await queryRunner.query(`
      UPDATE "prescriptions" SET "encounter_id" = id WHERE "encounter_id" IS NULL
    `);
    await queryRunner.query(`
      UPDATE "prescriptions" SET "prescribed_by_id" = 'migrated' WHERE "prescribed_by_id" IS NULL
    `);

    // Enforce NOT NULL after backfill
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
        ALTER COLUMN "encounter_id"     SET NOT NULL,
        ALTER COLUMN "prescribed_by_id" SET NOT NULL
    `);

    // Drop the old monolithic single-text drug columns
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
        DROP COLUMN IF EXISTS "medication",
        DROP COLUMN IF EXISTS "instructions",
        DROP COLUMN IF EXISTS "pharmacy"
    `);

    // Migrate old e-Rx status values to clinical workflow states
    await queryRunner.query(`
      UPDATE "prescriptions"
        SET "status" = CASE
          WHEN "status" IN ('Transmitted', 'Queued', 'Failed') THEN 'Signed'
          ELSE "status"
        END
      WHERE "status" NOT IN ('Draft', 'Signed', 'PartiallyDispensed', 'Dispensed', 'Cancelled')
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_rx_tenant_encounter"
        ON "prescriptions" ("tenant_id", "encounter_id")
    `);

    // ── 3. prescription_items — new table ─────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "prescription_items" (
        "id"                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"            VARCHAR(50) NOT NULL,
        "prescription_id"      UUID        NOT NULL
                                 REFERENCES "prescriptions"("id") ON DELETE CASCADE,
        "drug_name"            VARCHAR(255) NOT NULL,
        "drug_catalog_id"      UUID,
        "dosage"               VARCHAR(100),
        "frequency"            VARCHAR(100),
        "duration"             VARCHAR(100),
        "route"                VARCHAR(100),
        "quantity_ordered"     INT          NOT NULL DEFAULT 1,
        "quantity_dispensed"   INT          NOT NULL DEFAULT 0,
        "instructions"         TEXT,
        "status"               VARCHAR(30)  NOT NULL DEFAULT 'Pending',
        "created_at"           TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMPTZ  NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_rx_items_tenant_rx"
        ON "prescription_items" ("tenant_id", "prescription_id")
    `);

    // ── 4. lab_orders — structural additions ──────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "lab_orders"
        ADD COLUMN IF NOT EXISTS "encounter_id"          UUID,
        ADD COLUMN IF NOT EXISTS "patient_id"            UUID,
        ADD COLUMN IF NOT EXISTS "ordered_by_id"         VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "ordered_by_name"       VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "test_catalog_id"       UUID,
        ADD COLUMN IF NOT EXISTS "verified_by_id"        VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "verified_at"           TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "sample_collected_at"   TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "sample_collected_by"   VARCHAR(255)
    `);

    // Backfill required columns on existing rows
    await queryRunner.query(`
      UPDATE "lab_orders" SET "encounter_id"  = id         WHERE "encounter_id"  IS NULL
    `);
    await queryRunner.query(`
      UPDATE "lab_orders" SET "patient_id"    = id         WHERE "patient_id"    IS NULL
    `);
    await queryRunner.query(`
      UPDATE "lab_orders" SET "ordered_by_id" = 'migrated' WHERE "ordered_by_id" IS NULL
    `);

    // Enforce NOT NULL after backfill
    await queryRunner.query(`
      ALTER TABLE "lab_orders"
        ALTER COLUMN "encounter_id"  SET NOT NULL,
        ALTER COLUMN "patient_id"    SET NOT NULL,
        ALTER COLUMN "ordered_by_id" SET NOT NULL
    `);

    // Migrate old status values to the new enum
    await queryRunner.query(`
      UPDATE "lab_orders" SET "status" = CASE
        WHEN "status" = 'Pending'    THEN 'Ordered'
        WHEN "status" = 'Collected'  THEN 'SampleCollected'
        WHEN "status" = 'In Process' THEN 'InProgress'
        WHEN "status" = 'Resulted'   THEN 'ResultEntered'
        ELSE "status"
      END
      WHERE "status" NOT IN (
        'Ordered', 'SampleCollected', 'InProgress',
        'ResultEntered', 'Verified', 'Delivered', 'Cancelled'
      )
    `);

    // Drop old single ordered_by column (replaced by ordered_by_id + ordered_by_name)
    await queryRunner.query(`ALTER TABLE "lab_orders" DROP COLUMN IF EXISTS "ordered_by"`);

    // Normalise resulted_at column type to timestamptz
    await queryRunner.query(`
      ALTER TABLE "lab_orders"
        ALTER COLUMN "resulted_at" TYPE TIMESTAMPTZ
          USING "resulted_at"::TIMESTAMPTZ
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_lab_tenant_encounter"
        ON "lab_orders" ("tenant_id", "encounter_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_lab_tenant_patient"
        ON "lab_orders" ("tenant_id", "patient_id")
    `);

    // ── 5. invoices — add paid_amount, migrate status values ──────────────
    await queryRunner.query(`
      ALTER TABLE "invoices"
        ADD COLUMN IF NOT EXISTS "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0
    `);

    // Migrate old status names to new canonical names
    await queryRunner.query(`
      UPDATE "invoices" SET "status" = CASE
        WHEN "status" = 'Unpaid'  THEN 'Pending'
        WHEN "status" = 'Partial' THEN 'PartiallyPaid'
        WHEN "status" = 'Void'    THEN 'Cancelled'
        ELSE "status"
      END
      WHERE "status" NOT IN ('Draft', 'Pending', 'PartiallyPaid', 'Paid', 'Cancelled', 'Refunded')
    `);

    // ── 6. pharmacy_dispenses — add FK traceability columns ───────────────
    await queryRunner.query(`
      ALTER TABLE "pharmacy_dispenses"
        ADD COLUMN IF NOT EXISTS "prescription_id"       UUID,
        ADD COLUMN IF NOT EXISTS "prescription_item_id"  UUID,
        ADD COLUMN IF NOT EXISTS "patient_id"            UUID
    `);

    // ── 7. departments — new table ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "departments" (
        "id"                 UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"          VARCHAR(50)  NOT NULL,
        "name"               VARCHAR(255) NOT NULL,
        "code"               VARCHAR(20)  NOT NULL,
        "type"               VARCHAR(30)  NOT NULL DEFAULT 'OPD',
        "head_doctor_id"     UUID,
        "head_doctor_name"   VARCHAR(255),
        "daily_opd_capacity" INT          NOT NULL DEFAULT 0,
        "is_active"          BOOLEAN      NOT NULL DEFAULT true,
        "created_at"         TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"         TIMESTAMPTZ  NOT NULL DEFAULT now(),
        UNIQUE ("tenant_id", "code")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_departments_tenant" ON "departments" ("tenant_id")
    `);

    // ── 8. opd_queue — new table ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "opd_queue" (
        "id"                       UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"                VARCHAR(50)  NOT NULL,
        "encounter_id"             UUID         NOT NULL,
        "patient_id"               UUID         NOT NULL,
        "patient_name"             VARCHAR(255),
        "mrn"                      VARCHAR(30),
        "appointment_id"           UUID,
        "department_id"            UUID,
        "department_name"          VARCHAR(255),
        "assigned_doctor_id"       UUID,
        "assigned_doctor_name"     VARCHAR(255),
        "token_number"             VARCHAR(20),
        "status"                   VARCHAR(30)  NOT NULL DEFAULT 'Waiting',
        "called_at"                TIMESTAMPTZ,
        "consultation_started_at"  TIMESTAMPTZ,
        "completed_at"             TIMESTAMPTZ,
        "chief_complaint"          TEXT,
        "wait_minutes"             INT          NOT NULL DEFAULT 0,
        "created_at"               TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"               TIMESTAMPTZ  NOT NULL DEFAULT now(),
        UNIQUE ("tenant_id", "encounter_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_opd_queue_tenant_dept"
        ON "opd_queue" ("tenant_id", "department_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_opd_queue_tenant_status"
        ON "opd_queue" ("tenant_id", "status")
    `);

    // ── 9. lab_test_catalog — new table ────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lab_test_catalog" (
        "id"                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"         VARCHAR(50) NOT NULL,
        "test_code"         VARCHAR(50) NOT NULL,
        "test_name"         VARCHAR(255) NOT NULL,
        "category"          VARCHAR(100),
        "description"       TEXT,
        "unit_price"        DECIMAL(10,2) NOT NULL DEFAULT 0,
        "tax_rate"          DECIMAL(5,2)  NOT NULL DEFAULT 18,
        "turnaround_hours"  INT           NOT NULL DEFAULT 24,
        "sample_type"       VARCHAR(100),
        "is_active"         BOOLEAN       NOT NULL DEFAULT true,
        "requires_fasting"  BOOLEAN       NOT NULL DEFAULT false,
        "created_at"        TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMPTZ   NOT NULL DEFAULT now(),
        UNIQUE ("tenant_id", "test_code")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_lab_catalog_tenant" ON "lab_test_catalog" ("tenant_id")
    `);

    // ── 10. drug_catalog — new table ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "drug_catalog" (
        "id"                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"             VARCHAR(50)  NOT NULL,
        "drug_code"             VARCHAR(50)  NOT NULL,
        "generic_name"          VARCHAR(255) NOT NULL,
        "brand_name"            VARCHAR(255),
        "category"              VARCHAR(100),
        "form"                  VARCHAR(100),
        "strength"              VARCHAR(100),
        "dispensing_unit"       VARCHAR(100),
        "unit_price"            DECIMAL(10,2) NOT NULL DEFAULT 0,
        "tax_rate"              DECIMAL(5,2)  NOT NULL DEFAULT 12,
        "requires_prescription" BOOLEAN       NOT NULL DEFAULT true,
        "is_active"             BOOLEAN       NOT NULL DEFAULT true,
        "reorder_level"         INT           NOT NULL DEFAULT 10,
        "created_at"            TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"            TIMESTAMPTZ   NOT NULL DEFAULT now(),
        UNIQUE ("tenant_id", "drug_code")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_drug_catalog_tenant" ON "drug_catalog" ("tenant_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse in reverse order

    // 10. drug_catalog
    await queryRunner.query(`DROP TABLE IF EXISTS "drug_catalog"`);

    // 9. lab_test_catalog
    await queryRunner.query(`DROP TABLE IF EXISTS "lab_test_catalog"`);

    // 8. opd_queue
    await queryRunner.query(`DROP TABLE IF EXISTS "opd_queue"`);

    // 7. departments
    await queryRunner.query(`DROP TABLE IF EXISTS "departments"`);

    // 6. pharmacy_dispenses — remove added columns
    await queryRunner.query(`
      ALTER TABLE "pharmacy_dispenses"
        DROP COLUMN IF EXISTS "prescription_id",
        DROP COLUMN IF EXISTS "prescription_item_id",
        DROP COLUMN IF EXISTS "patient_id"
    `);

    // 5. invoices — remove paid_amount (status rename is not safely reversible)
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN IF EXISTS "paid_amount"`);

    // 4. lab_orders — restore ordered_by, remove added columns
    await queryRunner.query(`
      ALTER TABLE "lab_orders"
        ADD COLUMN IF NOT EXISTS "ordered_by" VARCHAR(255) DEFAULT 'System'
    `);
    await queryRunner.query(`
      ALTER TABLE "lab_orders"
        DROP COLUMN IF EXISTS "encounter_id",
        DROP COLUMN IF EXISTS "patient_id",
        DROP COLUMN IF EXISTS "ordered_by_id",
        DROP COLUMN IF EXISTS "ordered_by_name",
        DROP COLUMN IF EXISTS "test_catalog_id",
        DROP COLUMN IF EXISTS "verified_by_id",
        DROP COLUMN IF EXISTS "verified_at",
        DROP COLUMN IF EXISTS "sample_collected_at",
        DROP COLUMN IF EXISTS "sample_collected_by"
    `);

    // 3. prescription_items
    await queryRunner.query(`DROP TABLE IF EXISTS "prescription_items"`);

    // 2. prescriptions — restore old columns, remove new ones
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
        ADD COLUMN IF NOT EXISTS "medication"   TEXT,
        ADD COLUMN IF NOT EXISTS "instructions" TEXT,
        ADD COLUMN IF NOT EXISTS "pharmacy"     VARCHAR(255)
    `);
    await queryRunner.query(`
      ALTER TABLE "prescriptions"
        DROP COLUMN IF EXISTS "encounter_id",
        DROP COLUMN IF EXISTS "prescribed_by_id",
        DROP COLUMN IF EXISTS "prescribed_by_name",
        DROP COLUMN IF EXISTS "notes"
    `);

    // 1. encounters — remove added FK columns
    await queryRunner.query(`
      ALTER TABLE "encounters"
        DROP COLUMN IF EXISTS "appointment_id",
        DROP COLUMN IF EXISTS "opd_queue_id"
    `);
  }
}
