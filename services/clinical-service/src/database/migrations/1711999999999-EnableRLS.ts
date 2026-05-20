import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableRLS1711999999999 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create the tenant context function
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION get_current_tenant() RETURNS uuid AS $$
                SELECT NULLIF(current_setting('app.current_tenant', true), '')::uuid;
            $$ LANGUAGE sql STABLE;
        `);

        // 2. Enable RLS on core tables
        const tables = [
            'patients', 'emr_notes', 'encounters', 'invoices', 'appointments', 
            'admissions', 'billing', 'inventory', 'pharmacy_dispense', 'lab_orders'
        ];

        for (const table of tables) {
            await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
            await queryRunner.query(`
                CREATE POLICY tenant_isolation_policy ON "${table}"
                USING (tenant_id = get_current_tenant());
            `);
            // Also allow the app user to bypass RLS if needed (e.g. for super_admin)
            // But for now, we enforce it strictly.
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tables = [
            'patients', 'emr_notes', 'encounters', 'invoices', 'appointments', 
            'admissions', 'billing', 'inventory', 'pharmacy_dispense', 'lab_orders'
        ];

        for (const table of tables) {
            await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON "${table}";`);
            await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`);
        }
        await queryRunner.query(`DROP FUNCTION IF EXISTS get_current_tenant();`);
    }
}
