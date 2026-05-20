/**
 * TypeORM CLI Data Source
 * -----------------------
 * Used exclusively by the TypeORM CLI for generating and running migrations.
 * The application uses TypeOrmModule.forRoot() in app.module.ts at runtime.
 *
 * Usage:
 *   npm run migration:generate -- src/migrations/MigrationName
 *   npm run migration:run
 *   npm run migration:revert
 *   npm run migration:show
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';

// ─── Entities ───────────────────────────────────────────────────────────────
import { Hospital } from './entities/hospital.entity';
import { User } from './entities/user.entity';
import { Patient } from './entities/patient.entity';
import { Encounter } from './entities/encounter.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Claim } from './entities/claim.entity';
import { Payment } from './entities/payment.entity';
import { RcmEntry } from './entities/rcm-entry.entity';
import { EmrNote } from './entities/emr-note.entity';
import { Prescription } from './entities/prescription.entity';
import { PrescriptionItem } from './entities/prescription-item.entity';
import { LabOrder } from './entities/lab-order.entity';
import { LabTestCatalog } from './entities/lab-test-catalog.entity';
import { DrugCatalog } from './entities/drug-catalog.entity';
import { Department } from './entities/department.entity';
import { OpdQueue } from './entities/opd-queue.entity';
import { PharmacyDispense } from './entities/pharmacy-dispense.entity';
import { SurgeryBlock } from './entities/surgery-block.entity';
import { AbhaProfile } from './entities/abha-profile.entity';
import { AuditLog } from './audit-log/audit-log.entity';
import { Appointment } from './entities/appointment.entity';
import { Ward } from './entities/ward.entity';
import { Bed } from './entities/bed.entity';
import { Admission } from './entities/admission.entity';
import { VitalSign } from './entities/vital-sign.entity';
import { Stock } from './entities/stock.entity';
import { StockTransaction } from './entities/stock-transaction.entity';
import { StaffAttendance } from './entities/staff-attendance.entity';
import { StaffRoster } from './entities/staff-roster.entity';
import { AnalyticsReport } from './entities/analytics-report.entity';
import { Notification } from './entities/notification.entity';
import { AdtLog } from './entities/adt-log.entity';
import { ErCase } from './er/er-case.entity';
import { RadiologyReport } from './radiology/radiology-report.entity';
import { Document } from './documents/document.entity';
import { Asset } from './assets/asset.entity';
import { ServiceCatalog } from './billing/service-catalog.entity';
import { HospitalSettings } from './entities/hospital-settings.entity';
import { PatientConsent } from './entities/patient-consent.entity';

function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Migration CLI: ${name} environment variable is required`);
  return val;
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: required('DB_USER'),
  password: required('DB_PASS'),
  database: required('DB_NAME'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,

  entities: [
    Hospital, User, Patient, Encounter, Invoice, InvoiceItem,
    Claim, Payment, RcmEntry, EmrNote, Prescription, PrescriptionItem, LabOrder,
    PharmacyDispense, SurgeryBlock, AbhaProfile, AuditLog,
    Appointment, Ward, Bed, Admission, VitalSign, Stock, StockTransaction,
    StaffAttendance, StaffRoster, AnalyticsReport, Notification, AdtLog,
    ErCase, RadiologyReport, Document, Asset, ServiceCatalog,
    HospitalSettings, PatientConsent,
    LabTestCatalog, DrugCatalog, Department, OpdQueue,
  ],

  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',

  // Never auto-sync via CLI data source — use migrations only
  synchronize: false,
  logging: ['migration'],
});
