import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerformanceIndices1712000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Patient Indices
        await queryRunner.query(`CREATE INDEX "IDX_patient_tenant_dob" ON "patients" ("tenant_id", "date_of_birth");`);
        
        // 2. Encounter Indices
        await queryRunner.query(`CREATE INDEX "IDX_encounter_patient_tenant" ON "encounters" ("patient_id", "tenant_id");`);
        await queryRunner.query(`CREATE INDEX "IDX_encounter_created_at" ON "encounters" ("created_at");`);

        // 3. EMR Note Indices
        await queryRunner.query(`CREATE INDEX "IDX_emr_note_patient_tenant" ON "emr_notes" ("patient_id", "tenant_id");`);

        // 4. Appointment Indices
        await queryRunner.query(`CREATE INDEX "IDX_appointment_date_tenant" ON "appointments" ("appointment_date", "tenant_id");`);
        await queryRunner.query(`CREATE INDEX "IDX_appointment_status" ON "appointments" ("status");`);

        // 5. Invoice Indices
        await queryRunner.query(`CREATE INDEX "IDX_invoice_patient_status" ON "invoices" ("patient_id", "status");`);
        await queryRunner.query(`CREATE INDEX "IDX_invoice_tenant_created" ON "invoices" ("tenant_id", "created_at");`);

        // 6. User Indices
        await queryRunner.query(`CREATE INDEX "IDX_user_tenant_role" ON "users" ("tenant_id", "role");`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_patient_tenant_dob";`);
        await queryRunner.query(`DROP INDEX "IDX_encounter_patient_tenant";`);
        await queryRunner.query(`DROP INDEX "IDX_encounter_created_at";`);
        await queryRunner.query(`DROP INDEX "IDX_emr_note_patient_tenant";`);
        await queryRunner.query(`DROP INDEX "IDX_appointment_date_tenant";`);
        await queryRunner.query(`DROP INDEX "IDX_appointment_status";`);
        await queryRunner.query(`DROP INDEX "IDX_invoice_patient_status";`);
        await queryRunner.query(`DROP INDEX "IDX_invoice_tenant_created";`);
        await queryRunner.query(`DROP INDEX "IDX_user_tenant_role";`);
    }
}
