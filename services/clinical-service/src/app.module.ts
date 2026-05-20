import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { ScheduleModule } from '@nestjs/schedule';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import * as Sentry from '@sentry/nestjs';
// import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ─── Helper function for required env vars ──────────────────────────────────
function throwError(message: string): never {
  throw new Error(`Configuration Error: ${message}. Please set the required environment variable.`);
}

// ─── Entities ─────────────────────────────────────────────────────────────
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
import { PatientConsent } from './entities/patient-consent.entity';

// ─── Auth (Security Layer) ─────────────────────────────────────────────────
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { StructuredLoggerInterceptor } from './common/interceptors/structured-logger.interceptor';
import { RlsContextInterceptor } from './common/interceptors/rls-context.interceptor';

// ─── Audit Log ─────────────────────────────────────────────────────────────
import { AuditLogModule } from './audit-log/audit-log.module';

// ─── Batch A: Clinical Core ────────────────────────────────────────────────
import { OpdModule } from './opd/opd.module';
import { IpdModule } from './ipd/ipd.module';
import { LisModule } from './lis/lis.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
// ─── Batch B: Financial ───────────────────────────────────────────────────
import { BillingModule } from './billing/billing.module';
import { RcmModule } from './rcm/rcm.module';
import { ClaimsModule } from './claims/claims.module';
import { PaymentsModule } from './payments/payments.module';
// ─── Patients (TypeORM-backed module) ────────────────────────────────────
import { PatientsModule } from './patients/patients.module';
// ─── Batch C: Patient Admin ───────────────────────────────────────────────
import { AppointmentsModule } from './appointments/appointments.module';
import { AdtModule } from './adt/adt.module';
import { BedsModule } from './beds/beds.module';
import { PortalModule } from './portal/portal.module';
import { TelemedModule } from './telemed/telemed.module';
import { EncountersModule } from './encounters/encounters.module';
// ─── Batch D: Clinical Specialty & Diagnostics ────────────────────────────
import { EmrModule } from './emr/emr.module';
import { OtModule } from './ot/ot.module';
import { ErModule } from './er/er.module';
import { EprescribingModule } from './eprescribing/eprescribing.module';
import { RadiologyModule } from './radiology/radiology.module';
// ─── Batch E: Compliance & ABDM ───────────────────────────────────────────
import { AbdmModule } from './abdm/abdm.module';
// ─── Batch E: Operations & Analytics ─────────────────────────────────────
import { InventoryModule } from './inventory/inventory.module';
import { AssetsModule } from './assets/assets.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { PhysiciansModule } from './physicians/physicians.module';
import { ComplianceModule } from './compliance/compliance.module';
import { DocumentsModule } from './documents/documents.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { VitalsModule } from './vitals/vitals.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ConsentModule } from './consent/consent.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ─── Phase 2: Observability (Prometheus + Sentry) ─────────────────────
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),

    // ─── Rate Limiting (100 req / min on all endpoints) ───────────────────
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // ─── Cache (Redis in prod, in-memory in dev/test) ─────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        if (process.env.USE_REDIS_MOCK !== 'true' && process.env.REDIS_HOST) {
          return {
            store: await redisStore({
              host: process.env.REDIS_HOST || 'localhost',
              port: Number(process.env.REDIS_PORT || 6379),
            }),
            ttl: 60_000, // 60 seconds default TTL
          };
        }
        // In-memory fallback for dev/test
        return { ttl: 60_000 };
      },
    }),

    // ─── Event Emitter (used for SSE real-time updates) ───────────────────
    EventEmitterModule.forRoot({ wildcard: false }),

    // ─── Scheduled Jobs (data retention, nightly tasks) ────────────────
    ScheduleModule.forRoot(),

    // ─── Database (TypeORM + PostgreSQL / SQLite fallback) ────────────────
    TypeOrmModule.forRoot({
      type: (process.env.DB_TYPE === 'postgres' ? 'postgres' : 'sqlite') as any,
      ...(process.env.DB_TYPE === 'postgres'
        ? {
            host: process.env.DB_HOST || throwError('DB_HOST is required'),
            port: Number(process.env.DB_PORT || throwError('DB_PORT is required')),
            username: process.env.DB_USER || throwError('DB_USER is required'),
            password: process.env.DB_PASS || throwError('DB_PASS is required'),
            database: process.env.DB_NAME || throwError('DB_NAME is required'),
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
          }
        : { database: process.env.DB_NAME || 'hms_dev.sqlite' }
      ),
      entities: [
        Hospital, User, Patient, Encounter, Invoice, AuditLog, InvoiceItem, 
        Claim, Payment, RcmEntry, EmrNote, Prescription, PrescriptionItem, LabOrder, 
        PharmacyDispense, SurgeryBlock, AbhaProfile, 
        Appointment, Ward, Bed, Admission, VitalSign, Stock, StockTransaction,
        StaffAttendance, StaffRoster, AnalyticsReport, Notification, AdtLog, PatientConsent,
        LabTestCatalog, DrugCatalog, Department, OpdQueue
      ],
      synchronize: process.env.DB_TYPE !== 'postgres', // true for SQLite dev; use migrations in postgres/prod
      logging: process.env.NODE_ENV !== 'production' ? ['error', 'warn', 'query'] : ['error'],
      maxQueryExecutionTime: 1000, // Log queries slower than 1s
      autoLoadEntities: true,
      extra: {
        max: 20,                // Connection pool size
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
    }),

    // ─── Auth Module (provides JWT, Passport, guards) ─────────────────────
    AuthModule,

    // ─── HIPAA Audit Trail ────────────────────────────────────────────────
    AuditLogModule,

    // ─── All Domain Modules ───────────────────────────────────────────────
    OpdModule, IpdModule, LisModule, PharmacyModule,
    BillingModule, RcmModule, ClaimsModule, PaymentsModule,
    PatientsModule,
    AppointmentsModule, AdtModule, BedsModule, PortalModule, TelemedModule, EncountersModule,
    EmrModule, OtModule, ErModule, EprescribingModule, RadiologyModule,
    InventoryModule, AssetsModule, SchedulingModule, PhysiciansModule,
    ComplianceModule, DocumentsModule, AnalyticsModule, VitalsModule, SettingsModule, UsersModule,
    AbdmModule, NotificationsModule, ConsentModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ─── GLOBAL JWT GUARD — enforces auth on every route by default ──────
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // ─── GLOBAL ROLES GUARD — checks @Roles() decorator on routes ────────
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // ─── GLOBAL THROTTLE GUARD ───────────────────────────────────────────
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ─── GLOBAL RESPONSE INTERCEPTOR ────────────────────────────────────
    {
      provide: APP_INTERCEPTOR,
      useClass: StructuredLoggerInterceptor, // Replaces basic LoggingInterceptor
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RlsContextInterceptor,
    },
    // ─── CUSTOM METRICS PROVIDERS ───────────────────────────────────────
    makeCounterProvider({
      name: 'http_errors_total',
      help: 'Total number of HTTP errors grouped by status code',
      labelNames: ['method', 'status', 'path'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request latency in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5],
    }),
    makeGaugeProvider({
      name: 'active_sse_connections',
      help: 'Total number of active SSE clients',
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Phase 1: Request Tracking & Multi-tenancy Isolation
    consumer
      .apply(RequestIdMiddleware, TenantMiddleware)
      .forRoutes('*');

    // Phase 2: CSRF Double-Submit Cookie (applied after cookie-parser in main.ts)
    consumer
      .apply(CsrfMiddleware)
      .forRoutes('*');
  }
}
