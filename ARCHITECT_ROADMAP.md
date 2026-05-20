# RSM HMS — Senior Architect Production-Readiness Roadmap

> **Prepared by:** Senior Architect Review  
> **Date:** May 2026  
> **Classification:** Internal Technical Strategy  
> **Status:** Actionable — Implement Immediately

---

## 1. Senior Architect Summary

### Current State

RSM HMS has a technically ambitious foundation. The clinical-service backend is a well-structured NestJS monolith with over 40 imported modules, TypeORM entity management, Winston logging, Sentry integration, Prometheus metrics, CSRF middleware, tenant middleware, RBAC guards, JWT via HttpOnly cookies, and a single migration file covering the initial schema. The React frontend uses Zod + React Hook Form, a proper Zustand auth store, and an HTTP client that correctly reads CSRF tokens from cookies instead of localStorage.

However, a detailed review of the actual source code reveals a gap between architectural intent and implementation completeness. The following are confirmed code-level findings — not guesses:

| Finding | File | Severity |
|---|---|---|
| `Prescription` entity has no `encounterId` | `prescription.entity.ts` | Critical |
| `LabOrder` entity has no `encounterId`, no `patientId` | `lab-order.entity.ts` | Critical |
| `PharmacyService.dispenseMedication` has no DB transaction | `pharmacy.service.ts` | Critical |
| `EncountersController` has no `@UseGuards(RolesGuard)` | `encounters.controller.ts` | Critical |
| `PrescriptionStatus` is 'Transmitted'\|'Queued'\|'Failed' — e-Rx states, not clinical workflow states | `prescription.entity.ts` | High |
| `LabOrderStatus` is 'Pending'\|'Collected'\|'In Process'\|'Resulted' — missing 'Verified'/'Cancelled' | `lab-order.entity.ts` | High |
| `Encounter.vitals` is a JSON blob on the encounter, not a linked `VitalSign` entity | `encounter.entity.ts` | High |
| `EncounterStatus` missing AWAITING_LAB, AWAITING_PAYMENT, ADMITTED states | `encounter.entity.ts` | High |
| `BillingController` has no item-level invoice management endpoints | `billing.controller.ts` | High |
| `LisService.createOrder` auto-generates random MRN when not provided | `lis.service.ts` | High |
| `OpdController` has no `PATCH /opd/queue/:id/status` endpoint | `opd.controller.ts` | High |
| No `PrescriptionItem` entity — single text medication field | `prescription.entity.ts` | High |
| No `LabTestCatalog`, `DrugCatalog` entities | `entities/` | Medium |
| No `Department` entity | `entities/` | Medium |
| `synchronize: process.env.NODE_ENV !== 'production'` — auto-sync ON in staging/QA | `app.module.ts:166` | High |
| Only one migration exists — schema drift risk between code and DB | `migrations/` | High |
| CORS allowlist contains hardcoded development origins | `main.ts` | Medium |
| `Invoice` entity has no `paidAmount` field for partial payment tracking | `invoice.entity.ts` | Medium |

### The Core Problem

The system looks complete from the outside. Every module exists. The UI is polished. But the clinical data model is fractured — prescriptions are not linked to encounters, lab orders are not linked to patients by ID (only by name string), pharmacy dispense has no transaction safety, and billing cannot build a real encounter-linked invoice because the encounter-to-order chain is broken. This is the MVP Illusion: a product that appears complete but cannot safely run a single end-to-end patient workflow without leaving orphaned or inconsistent data.

### Why Healthcare Requires Exceptional Standards

A hospital software failure is not a UX inconvenience — it is a patient safety event.

- **Persistence**: If a prescription is saved but not linked to the encounter, the doctor's order disappears from the patient record. A pharmacist may dispense without context. A different doctor may not see the medication history.
- **Traceability**: Healthcare regulators, legal proceedings, and insurance auditors require an unbroken chain of who ordered what, when, and why. `orderedBy: data.orderedBy || 'System'` (actual code in `lis.service.ts`) is not acceptable.
- **Auditability**: The audit log entity exists. It is not yet called from pharmacy dispense or billing payment flows — both of which are financial mutations that must be immutably recorded.
- **Transaction Safety**: The pharmacy dispense service calls `inventoryService.deductStock()` and then `rxRepo.save()` in sequence with no wrapping transaction (confirmed in `pharmacy.service.ts`). If the dispense save fails, stock is already deducted. The inventory is now wrong. In a live hospital, this means a drug is counted as dispensed but the patient record shows no dispense.
- **Role Security**: `EncountersController` has no `@UseGuards(RolesGuard)` decorator. A receptionist or billing officer can currently call `POST /api/v1/encounters` and create a clinical encounter. This is a HIPAA-relevant access control failure.

---

## 2. Immediate Strategic Decision — Temporary Feature Freeze

**Recommendation: Pause all new feature development immediately.**

This is a business decision as much as a technical one. Adding AI diagnosis suggestions, barcode scanning, or multi-branch features to a system where pharmacy dispense has no transaction safety is not progress — it is building on an unstable foundation.

### Allowed During the Freeze

The following work is explicitly allowed and prioritized:

- Completing and linking existing entities (adding `encounterId`, `patientId` foreign keys)
- Adding missing state machine transitions to existing status enums
- Wrapping critical service operations in database transactions
- Adding `@UseGuards(RolesGuard)` to controllers that are missing it
- Writing the missing migration files for schema changes
- Setting `synchronize: false` unconditionally and enforcing migrations
- Building the missing API endpoints required for existing UI screens
- Replacing any remaining mock data arrays in frontend components with real API calls
- Adding structured audit log calls to pharmacy, lab, and billing mutations
- Adding unit and integration tests for all critical service methods
- Fixing partial payment tracking in the `Invoice` entity
- Performance and correctness fixes

### Not Allowed During the Freeze

The following must be deferred until the core is production-grade:

- AI diagnosis suggestions or clinical decision support
- Advanced analytics dashboards beyond basic operational reports
- Barcode medication administration (BCMA — the `BCMA.jsx` page exists but is not a priority now)
- Offline mode / Progressive Web App
- Complex insurance/TPA claim processing
- Multi-branch financial consolidation
- PACS/radiology imaging integration
- Telemedicine video module
- ABDM/ABHA integration expansion
- Patient portal

---

## 3. Core Architecture Principle — Encounter as the System Spine

Every clinical and financial object in RSM HMS must trace back to a single `Encounter`. This is not aspirational — it is the correction that fixes the current disconnection.

```
Patient
  └── Encounter  (the spine)
        ├── Appointment           (how the encounter was initiated)
        ├── OPDQueue entry        (where the patient waits)
        ├── VitalSign[]           (separate records, not JSON blob)
        ├── EMRNote[]             (doctor's notes, all versions)
        ├── Prescription[]        (MUST add encounterId FK)
        │     └── PrescriptionItem[]  (individual drug lines)
        ├── LabOrder[]            (MUST add encounterId + patientId FK)
        │     └── LabResult[]     (per-test results)
        ├── PharmacyDispense[]    (linked to prescription)
        ├── Invoice               (one per encounter, linked by encounterId)
        │     └── InvoiceItem[]   (consultation, lab, drugs, procedures)
        ├── Payment[]             (payments against the invoice)
        ├── Admission             (if IPD — linked to same encounter)
        └── DischargeSummary      (closes the encounter)
```

### Why This Matters in Practice

Right now, a `Prescription` has a `patientId` and `tenantId` but no `encounterId`. A `LabOrder` has a `patientName` string (encrypted) and `mrn` but no `patientId` UUID and no `encounterId`. This means:

- The patient timeline cannot be reconstructed from database queries — it requires joining on name strings, which breaks as soon as a patient name has a typo
- An invoice cannot auto-populate from encounter orders because the billing service cannot reliably find all prescriptions and lab orders for a given encounter
- The pharmacy queue cannot show "pending dispense for today's OPD" because `PharmacyDispense` is not linked to `Prescription`, which is not linked to `Encounter`

**The fix is two FK columns and one migration.** This is the most important structural change in the entire roadmap.

---

## 4. Required Database Foundation

The following table lists every entity that must exist, its current status in the codebase, and what is missing.

### Existing Entities (need correction/extension)

#### `Encounter` (`encounter.entity.ts`)
- **Purpose**: Central clinical event record tying all patient activities together
- **Missing**: `appointmentId` FK, `opdQueueId` FK, proper status enum expansion
- **Fix Required**: Expand `EncounterStatus` to include `AWAITING_LAB`, `AWAITING_PAYMENT`, `ADMITTED`
- **Current status field**: `'Planned' | 'Arrived' | 'InProgress' | 'Discharged' | 'Cancelled'`
- **Required status field**: `'Planned' | 'Arrived' | 'InProgress' | 'AwaitingLab' | 'AwaitingPayment' | 'Admitted' | 'Discharged' | 'Cancelled'`
- **Tenant isolation**: `tenantId` column exists ✓

#### `Prescription` (`prescription.entity.ts`)
- **Purpose**: Doctor's drug orders for a patient
- **Critical missing**: `encounterId` FK column — prescriptions are floating, unlinked to clinical context
- **Critical missing**: `PrescriptionItem` sub-entity — current design stores a single `medication: text` field, making multi-drug prescriptions impossible to structure
- **Status enum broken**: Current `PrescriptionStatus = 'Transmitted' | 'Queued' | 'Failed'` describes e-Rx routing states, not clinical workflow states
- **Required status**: `'Draft' | 'Signed' | 'PartiallyDispensed' | 'Dispensed' | 'Cancelled'`
- **Tenant isolation**: `tenantId` exists ✓

#### `LabOrder` (`lab-order.entity.ts`)
- **Purpose**: Doctor's laboratory test requests
- **Critical missing**: `encounterId` FK — not linked to clinical context
- **Critical missing**: `patientId` UUID FK — currently stores only `patientName` (encrypted text) and `mrn` string. Cannot join to patient record
- **Critical missing**: `LabResult` sub-entity — current design stores a single result value, unit, and interpretation directly on `LabOrder`. A multi-panel test (e.g., CBC with 10 parameters) cannot be represented
- **Missing**: 'Verified' and 'Cancelled' in `LabOrderStatus`
- **Tenant isolation**: `tenantId` exists ✓

#### `Invoice` (`invoice.entity.ts`)
- **Purpose**: Financial record of charges for an encounter
- **Has**: `encounterId` ✓
- **Missing**: `paidAmount` — cannot track partial payments without this field
- **Missing**: `dueAmount` — can be computed but having it stored prevents re-computation errors
- **Issue**: `InvoiceStatus` uses 'Draft'/'Unpaid'/'Partial'/'Paid'/'Void' — rename 'Unpaid' to 'Pending' and add 'Refunded' for consistency with described state machine
- **Tenant isolation**: `tenantId` exists ✓

#### `PharmacyDispense` (`pharmacy-dispense.entity.ts`)
- **Purpose**: Record of drugs dispensed to a patient
- **Check required**: Must verify `prescriptionId` FK exists. The `dispenseMedication` service method does not use a `prescriptionId` in the current implementation.
- **Tenant isolation**: `tenantId` must be present ✓

### Missing Entities — Must Create

#### `PrescriptionItem`
- **Purpose**: Individual drug line within a prescription
- **Required fields**: `prescriptionId` (FK), `drugName`, `drugCode` (FK to DrugCatalog), `dosage`, `frequency`, `duration`, `quantity`, `route`, `dispensedQty` (default 0), `status`
- **Why required**: Current single-text prescription cannot support multi-drug orders, partial dispense tracking, or automated stock deduction per drug
- **Tenant isolation**: Inherited through `Prescription.tenantId`, but add `tenantId` column for RLS

#### `LabTestCatalog`
- **Purpose**: Master list of available lab tests with pricing
- **Required fields**: `tenantId`, `testCode`, `testName`, `category`, `unitPrice`, `turnaroundHours`, `isActive`
- **Why required**: `LisService.createOrder` currently stores `testProfile` as free text. Cannot auto-generate invoice items without a price reference. Cannot build a structured lab worklist.

#### `LabResult`
- **Purpose**: Individual test result within a lab order (one order = multiple test results for panels)
- **Required fields**: `labOrderId` (FK), `testCatalogId` (FK), `parameter`, `value`, `unit`, `referenceRange`, `interpretation`, `verifiedBy`, `verifiedAt`
- **Why required**: Current `LabOrder` entity stores one result value. CBC, LFT, RFT, and metabolic panels have 5–20 individual parameters.

#### `DrugCatalog`
- **Purpose**: Master list of drugs available in the pharmacy
- **Required fields**: `tenantId`, `genericName`, `brandName`, `category`, `unitPrice`, `dispensingUnit`, `isActive`
- **Why required**: `PharmacyService` references drug names as free strings. Cannot enforce consistent drug naming, pricing, or stock tracking without a catalog.

#### `Department`
- **Purpose**: Hospital departments (Cardiology, Orthopedics, Pediatrics, etc.)
- **Required fields**: `tenantId`, `name`, `code`, `type` (OPD/IPD/ER), `headDoctorId`, `isActive`
- **Why required**: `OpdController.registerWalkIn` currently takes a `department` string. Without a `Department` entity, department-based routing, capacity planning, and doctor assignment cannot be validated.

#### `OPDQueue` (as a proper entity)
- **Purpose**: Track a patient's position and status in the outpatient queue
- **Required fields**: `tenantId`, `encounterId`, `patientId`, `appointmentId`, `department`, `queueNumber`, `status` (`Waiting`|`InConsultation`|`Completed`|`Skipped`|`Left`), `tokenTime`, `calledAt`, `completedAt`, `assignedDoctorId`
- **Why required**: The current `OpdService.getQueue()` fetches encounters in progress. It is not a proper queue — it cannot track wait times, assign token numbers, or manage doctor-to-patient routing.

---

## 5. Backend Hardening Plan

### 5.1 TypeORM Configuration — Fix Immediately

**Current code** (`app.module.ts:166`):
```typescript
synchronize: process.env.NODE_ENV !== 'production',
```

**Problem**: In staging, QA, and local environments pointed at a shared database, TypeORM auto-sync can silently alter or drop columns. Any schema mismatch between deployed code and DB will be auto-resolved by TypeORM — potentially destroying data.

**Required change**:
```typescript
synchronize: false, // ALWAYS. Use migrations. No exceptions.
```

Then create a migration for every entity change:
```bash
npm run migration:generate -- src/migrations/AddEncounterIdToPrescription
npm run migration:generate -- src/migrations/AddPatientIdToLabOrder
npm run migration:generate -- src/migrations/AddPrescriptionItemTable
npm run migration:generate -- src/migrations/ExpandPrescriptionStatus
npm run migration:generate -- src/migrations/AddPaidAmountToInvoice
npm run migration:generate -- src/migrations/AddDepartmentTable
npm run migration:generate -- src/migrations/AddOPDQueueTable
```

Run `npm run migration:show` before every deployment to confirm pending migrations.

### 5.2 Global ValidationPipe — Already Exists, Verify Configuration

`main.ts` already configures `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`. **Confirm this is applied globally and not overridden at module level.** The `EncountersController` `PATCH :id/status` endpoint takes `@Body('status')` as a raw string with no DTO validation — this must be replaced with a typed DTO:

```typescript
// dto/update-encounter-status.dto.ts
export class UpdateEncounterStatusDto {
  @IsEnum(EncounterStatus)
  status: EncounterStatus;
}
```

### 5.3 Add Missing RBAC Guard to EncountersController

**Current code** (`encounters.controller.ts`): No `@UseGuards(RolesGuard)` decorator.

**Required** — add immediately:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('encounters')
export class EncountersController {
```

And add `@Roles(...)` to every method. Default to `hospital_admin` or `doctor` for clinical encounter creation.

### 5.4 Default-Deny Architecture

All controllers must use `@UseGuards(JwtAuthGuard, RolesGuard)` at the class level. Specific methods that need broader access (like GET for dashboards) can override. The current pattern mixes `@UseGuards` at class level for some controllers (`OpdController`, `PharmacyController`, `LisController`) and no guard at all for others (`EncountersController`, `BillingController` — which uses `@Roles` without a guard).

**Audit required on every controller**:
```bash
grep -rn "@Controller" services/clinical-service/src --include="*.ts" | \
  while read line; do
    file=$(echo $line | cut -d: -f1)
    grep -L "@UseGuards" $file
  done
```

Run this and fix every file it returns.

### 5.5 API Response Standardization

`ApiResponseInterceptor` exists and is registered globally. Verify it wraps all responses including validation errors. The `BillingController.collectPayment` currently throws `BadRequestException` inside a service call — confirm the `AllExceptionsFilter` catches this and returns a structured response instead of leaking stack traces.

### 5.6 Pagination on All List Endpoints

`EncountersController` uses `PaginationDto` — good. `LisController.getOrders` has `take: 50` hardcoded. `BillingController.getInvoices` has `take: 50` hardcoded. `PharmacyController.getDispenses` has `take: 50` hardcoded.

**Required**: Extract pagination to a shared `PaginationDto` (`page`, `limit`, `sortBy`, `sortOrder`) and apply to all list endpoints. Add total count to the response envelope.

### 5.7 Structured Logging and Correlation IDs

Winston is already configured. `RequestIdMiddleware` exists. Verify that:
- The correlation/request ID is injected into all log entries
- Service-level errors are logged with patient context (tenantId, encounterId) but NOT with PHI values in plain text
- Slow query logging is enabled in TypeORM (`logging: ['error', 'slow_query']`, `maxQueryExecutionTime: 1000`)

### 5.8 Environment Configuration Validation

Add a Joi or `class-validator` based config validation schema that runs at startup and throws if required env vars are missing. The existing `throwError` helper in `app.module.ts` is a partial implementation — replace it with a `ConfigModule.forRoot({ validationSchema: ... })` pattern so validation happens before the application boots, not at runtime when a specific code path is hit.

### 5.9 Add Queue/Background Job Support

Install `@nestjs/bull` or `@nestjs/bullmq`. Defer the following operations to queues instead of running in the request cycle:
- Audit log writes (high volume, not user-blocking)
- Notification delivery
- Report generation
- Daily IPD bed charge calculation

---

## 6. Frontend Stabilization Plan

### 6.1 Replace Remaining Mock Data

The `OPD.jsx` component is already connected to real APIs (`api.get('/opd/queue')`, `api.get('/opd/stats')`). Audit every page in `frontend/src/pages/` for mock arrays:

```bash
grep -rn "useState\(\[" frontend/src/pages --include="*.jsx"
grep -rn "const.*=\s*\[" frontend/src/pages --include="*.jsx" | grep -v "import"
```

Any component that initializes state with a hardcoded array is a candidate for API replacement.

### 6.2 TanStack Query for Server State

The current pattern uses `useState` + `useEffect` + manual `api.get()` calls. This is error-prone: there is no automatic refetch on window focus, no stale-while-revalidate, no cache deduplication, and no loading/error states managed centrally.

**Required**: Install `@tanstack/react-query`. Migrate all data-fetching `useEffect` patterns to `useQuery` hooks. Example for OPD queue:

```javascript
const { data: queue, isLoading, error } = useQuery({
  queryKey: ['opd-queue', tenantId],
  queryFn: () => api.get('/opd/queue').then(r => r.json()).then(j => j.data ?? j),
  refetchInterval: 30_000, // Auto-refresh every 30s for live queue
  staleTime: 10_000,
});
```

### 6.3 Zustand Scope — Enforce the Boundary

Current `authStore.js` correctly manages only auth state. Add two more Zustand stores with clear boundaries:

- `patientStore.js`: active patient context (patientId, mrn, name, encounterId) — set when any screen becomes "patient-scoped"
- `workspaceStore.js`: active encounter, current tab/section in the doctor workspace

Do NOT use Zustand for server data (patient list, queue data, invoices). That belongs in TanStack Query.

### 6.4 Form Validation — Already Partially Implemented

`OPD.jsx` already uses React Hook Form + Zod. Audit other forms for compliance. Priority forms requiring this pattern:

- Patient registration
- Appointment booking
- Prescription creation
- Lab order creation  
- Billing payment collection

### 6.5 Module-Level Error Boundaries

The `ErrorBoundary.jsx` component exists. Wrap each major module route:

```jsx
<ErrorBoundary fallback={<ErrorState module="Pharmacy" />}>
  <Route path="/pharmacy/*" element={<PharmacyModule />} />
</ErrorBoundary>
```

A crash in the Pharmacy module should not bring down the Doctor Workspace.

### 6.6 Unified Patient Workspace

The `workspace/` directory exists under pages. This must become the single destination when a doctor selects a patient. It should render:

1. **Left Panel**: Patient header (from PatientBanner.jsx — already exists), encounter context, vital summary
2. **Main Panel**: Tab-based — Notes, Prescriptions, Lab Orders, History
3. **Right Panel**: Quick actions — add note, order lab, prescribe

This screen consumes the patient timeline API (`GET /api/v1/encounters/patient/:patientId`) which is already implemented.

### 6.7 Browser Refresh Persistence

After a browser refresh, the current user's auth state is reconstructed by calling `/auth/me` (cookie-based, already implemented in `api.js`). Verify that:
- The active patient context is stored in URL params, not just Zustand state (so refresh to `/workspace/patient/:patientId` reloads the correct patient)
- The TanStack Query cache handles the `/patients/:id` refetch on mount

---

## 7. Critical Workflow Implementation Plan — Vertical Slices

Build complete vertical slices instead of completing one layer (all controllers, then all services) at a time. A vertical slice is end-to-end functionality for one real workflow.

### Slice 1 — Patient Registration → OPD Queue

**Current gaps**: `OpdController.registerWalkIn` creates a new patient and an OPD queue entry but `department` is stored as a free-text string. No `Department` entity validation. No `OPDQueue` entity — the service likely creates an `Encounter` directly.

**Required APIs (verify/fix existing)**:
```
POST   /api/v1/patients                      — Create patient, generate MRN
GET    /api/v1/patients                      — Search by name/MRN (pagination required)
GET    /api/v1/patients/:id                  — Get full patient profile
POST   /api/v1/appointments                  — Book appointment
PATCH  /api/v1/appointments/:id/status       — Arrive/Cancel/No-show
POST   /api/v1/opd/check-in                  — Create OPDQueue entry + Encounter
GET    /api/v1/opd/queue                     — Live queue (already exists)
PATCH  /api/v1/opd/queue/:id/status          — NEW: Update queue entry status (Waiting → InConsultation)
```

**Database changes required**:
- Add `OPDQueue` entity with proper fields
- Add `Department` entity
- Create migration

---

### Slice 2 — OPD Queue → Doctor Consultation

**Current gaps**: `EncountersController` exists and has `GET`, `POST`, `PATCH :id/status`. Missing RBAC. The `POST /encounters/seed-demo` endpoint must be removed before production.

**Required APIs**:
```
POST   /api/v1/encounters                          — Start encounter (no seed-demo in prod)
PATCH  /api/v1/encounters/:id/status               — Transition status (with DTO validation)
POST   /api/v1/vitals                              — Create VitalSign record (NOT a JSON blob on Encounter)
GET    /api/v1/vitals/encounter/:encounterId       — Get all vitals for an encounter
POST   /api/v1/emr/notes                           — Create EMR note
GET    /api/v1/emr/notes/encounter/:encounterId    — Get all notes for encounter
GET    /api/v1/patients/:id/timeline               — Chronological patient history across all encounters
```

**Database changes required**:
- `Encounter`: Add `appointmentId`, `opdQueueId` FK columns
- `VitalSign`: Verify it has `encounterId` FK (it likely does — `vital-sign.entity.ts` exists)
- `EMRNote`: Verify it has `encounterId` FK (`emr-note.entity.ts` exists)
- Remove the `vitals` JSON blob from `Encounter.vitals` after migrating to proper VitalSign records

---

### Slice 3 — Doctor Orders → Invoice Creation

**This is the most broken slice.** Neither `Prescription` nor `LabOrder` has `encounterId`. Invoice items cannot be auto-generated from doctor orders.

**Required database changes (CRITICAL)**:
1. Add `encounterId` column to `prescriptions` table
2. Add `patientId` UUID column to `lab_orders` table (replace name-string join)
3. Add `encounterId` column to `lab_orders` table
4. Create `prescription_items` table
5. Create `lab_test_catalog` table
6. Create `drug_catalog` table
7. Migrate all of the above

**Required APIs**:
```
POST   /api/v1/prescriptions                       — Create prescription (encounterId required)
POST   /api/v1/prescriptions/:id/items             — Add drug to prescription
GET    /api/v1/prescriptions/encounter/:id         — Get prescriptions for encounter
POST   /api/v1/lab-orders                          — Create lab order (encounterId required)
GET    /api/v1/lab-orders/encounter/:id            — Get lab orders for encounter
POST   /api/v1/billing/invoices                    — Create invoice for encounter (NEW)
POST   /api/v1/billing/invoices/:id/items          — Add item to invoice (NEW)
PATCH  /api/v1/billing/invoices/:id/status         — Update invoice status (NEW)
GET    /api/v1/billing/invoices/:id                — Get full invoice with items (NEW)
```

**Auto-invoice generation logic**: When a doctor signs a prescription or creates a lab order, the billing service must atomically add `InvoiceItem` records to the encounter's draft invoice.

---

### Slice 4 — Pharmacy Execution

**Current critical issue**: `PharmacyService.dispenseMedication` has no transaction. Stock is deducted before dispense is recorded. If dispense save fails, inventory is incorrect.

**Required rewrite of `dispenseMedication`**:
```typescript
async dispenseMedication(tenantId: string, dto: DispenseMedicationDto) {
  return await this.dataSource.transaction(async (manager) => {
    // 1. Load prescription item and validate
    const rxItem = await manager.findOneOrFail(PrescriptionItem, {
      where: { id: dto.prescriptionItemId, tenantId }
    });
    
    // 2. Check and lock stock
    const stock = await manager.findOneOrFail(Stock, {
      where: { tenantId, drugCode: rxItem.drugCode },
      lock: { mode: 'pessimistic_write' }
    });
    if (stock.quantity < rxItem.quantity) throw new BadRequestException('Insufficient stock');
    
    // 3. Create dispense record
    const dispense = manager.create(PharmacyDispense, {
      tenantId, prescriptionId: rxItem.prescriptionId,
      prescriptionItemId: rxItem.id, patientId: rxItem.patientId, ...
    });
    await manager.save(dispense);
    
    // 4. Deduct stock
    stock.quantity -= rxItem.quantity;
    await manager.save(stock);
    
    // 5. Create stock transaction log
    await manager.save(StockTransaction, {
      tenantId, stockId: stock.id, type: 'Dispense',
      quantity: -rxItem.quantity, reference: dispense.id, ...
    });
    
    // 6. Create invoice item
    await manager.save(InvoiceItem, { ... });
    
    // 7. Update prescription item status
    rxItem.status = 'Dispensed';
    await manager.save(rxItem);
    
    // 8. Write audit log
    await this.auditLogService.log({ ... });
    
    return dispense;
  });
}
```

**Required APIs**:
```
GET    /api/v1/pharmacy/dispense-queue             — NEW: Prescriptions pending dispense
PATCH  /api/v1/prescriptions/:id/dispense          — Dispense a prescription item (transaction-safe)
GET    /api/v1/inventory/stock                     — Current stock levels
POST   /api/v1/inventory/stock-transactions        — Manual stock entry/adjustment
```

---

### Slice 5 — Laboratory Execution

**Current gap**: `LisController` is missing `PATCH :id/sample-collected` and `PATCH :id/verify` endpoints. Results cannot be added to the patient timeline because `LabOrder` has no `encounterId`.

**Required APIs**:
```
GET    /api/v1/lab/orders                         — Lab worklist (all orders)
GET    /api/v1/lab/orders/:id                     — Single order detail
PATCH  /api/v1/lab-orders/:id/sample-collected    — NEW: Mark sample as collected
PATCH  /api/v1/lab-orders/:id/result              — Enter results (already exists)
PATCH  /api/v1/lab-orders/:id/verify              — NEW: Verify results (second-eye check)
PATCH  /api/v1/lab-orders/:id/cancel              — NEW: Cancel order
```

**Fix in `LisService.createOrder`**: Remove `mrn: data.mrn || \`MRN-${randomInt(1000, 9999)}\`` — MRN must always come from the validated patient record.

---

### Slice 6 — Billing and Payment

**Current gap**: `BillingController` has only `GET /invoices`, `POST /pay`, `GET /stats`, `GET /catalog`. It cannot create invoices, add items, or manage status transitions.

**Required**: Rebuild the billing controller to cover the full invoice lifecycle.

```
GET    /api/v1/billing/invoices                    — List invoices (paginated)
POST   /api/v1/billing/invoices                    — Create draft invoice for encounter
GET    /api/v1/billing/invoices/:id                — Full invoice with items
POST   /api/v1/billing/invoices/:id/items          — Add item to invoice
DELETE /api/v1/billing/invoices/:id/items/:itemId  — Remove item (AUTHORIZED roles only)
PATCH  /api/v1/billing/invoices/:id/discount       — Apply discount (supervisor role)
POST   /api/v1/billing/invoices/:id/pay            — Collect payment (transaction-safe)
PATCH  /api/v1/billing/invoices/:id/status         — Status transitions
GET    /api/v1/billing/invoices/:id/receipt        — Generate receipt data
```

**`BillingService.collectPayment` must be transaction-safe**:
- Validate invoice is in `Pending` or `Partial` state
- Create payment record
- Update `invoice.paidAmount += payment.amount`
- Recalculate balance
- Transition invoice status to `Partial` or `Paid`
- Write audit log
- Commit or rollback atomically

---

### Slice 7 — IPD Admission and Discharge

**Current state**: `Admission`, `Ward`, `Bed` entities exist. `AdtModule` exists. The `IPD.jsx` page exists. However, without Slices 1–6 being stable, IPD is the last slice to build.

**Required APIs**:
```
POST   /api/v1/admissions                          — Admit patient (transaction: create admission + assign bed + update encounter)
PATCH  /api/v1/beds/:id/assign                     — Assign bed to admission
PATCH  /api/v1/beds/:id/release                    — Release bed on discharge
POST   /api/v1/discharge-summaries                 — Create discharge summary
POST   /api/v1/billing/ipd/daily-charges           — Cron-triggered daily bed charge
PATCH  /api/v1/admissions/:id/status               — Status transitions
```

---

## 8. Transaction-Safe Workflow Requirements

The following workflows must be wrapped in `DataSource.transaction()`. No partial writes are acceptable.

### Pharmacy Dispense Transaction
All 8 steps listed in Slice 4 must succeed together or all roll back. The critical invariant: **stock quantity and dispense records must always agree.**

### Lab Order Creation Transaction
```
BEGIN
  INSERT INTO lab_orders (encounterId, patientId, ...)
  INSERT INTO invoice_items (invoiceId, labOrderId, ...)
  INSERT INTO audit_log (action: 'LAB_ORDER_CREATED', ...)
COMMIT / ROLLBACK on any failure
```

### IPD Admission Transaction
```
BEGIN
  INSERT INTO admissions (encounterId, patientId, ...)
  UPDATE beds SET status = 'Occupied', admissionId = ... WHERE id = ?
  UPDATE encounters SET status = 'Admitted' WHERE id = ?
  INSERT INTO adt_logs (type: 'Admission', ...)
  INSERT INTO invoice_items (type: 'AdmissionCharge', ...)
  INSERT INTO audit_log (...)
COMMIT / ROLLBACK on any failure
```

If the bed is already occupied by another patient (race condition), the transaction rolls back and the admission is rejected with a clear error message.

### Payment Transaction
```
BEGIN
  SELECT invoice FOR UPDATE (pessimistic lock)
  INSERT INTO payments (invoiceId, amount, ...)
  UPDATE invoices SET paid_amount = paid_amount + ?, status = ? WHERE id = ?
  INSERT INTO audit_log (action: 'PAYMENT_COLLECTED', ...)
COMMIT / ROLLBACK on any failure
```

---

## 9. State Machine Design

Status fields must be treated as state machines — only allowed transitions are permitted by the service layer. The service must throw if an invalid transition is attempted.

### Encounter Status Machine
```
Planned → Arrived → InProgress → AwaitingLab → InProgress (when results arrive)
                  → AwaitingPayment → Discharged
                  → Admitted (IPD path)
Any state → Cancelled (with RBAC: only admin/doctor)
```

### Prescription Status Machine
```
Draft → Signed → PartiallyDispensed → Dispensed
     → Cancelled (only if not yet dispensed)
```

**Enforcement in service**:
```typescript
const VALID_TRANSITIONS: Record<PrescriptionStatus, PrescriptionStatus[]> = {
  Draft: ['Signed', 'Cancelled'],
  Signed: ['PartiallyDispensed', 'Cancelled'],
  PartiallyDispensed: ['Dispensed', 'Cancelled'],
  Dispensed: [], // Terminal state
  Cancelled: [], // Terminal state
};
```

### Lab Order Status Machine
```
Ordered → SampleCollected → InProgress → ResultEntered → Verified → Delivered
Any non-terminal → Cancelled (supervisor only)
```

### Invoice Status Machine
```
Draft → Pending → PartiallyPaid → Paid
     → Cancelled (only in Draft/Pending, supervisor only)
Paid → Refunded (supervisor only, with audit log)
```

### Appointment Status Machine
```
Booked → Arrived → InConsultation → Completed
       → Cancelled
       → NoShow (end-of-day sweep)
```

---

## 10. Security and Compliance Next Steps

### Confirmed Good Practices (Keep)
- HttpOnly cookie-based JWT — implemented correctly in `main.ts` and `api.js`
- CSRF token via cookie + header — `CsrfMiddleware` exists, `api.js` reads it correctly
- `helmet` enabled globally in `main.ts`
- `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`
- Tenant middleware enforces `tenantId` from JWT context, not from client payload (verify this is true in `TenantMiddleware`)
- Field-level encryption transformer on PHI fields (names, diagnoses) — `DataEncryptionTransformer` in use

### Required Fixes

**Secrets Management**:
- Audit all `.env` files and confirm no secrets are committed to version control
- Add `.env*` to `.gitignore` if not already present
- Move `COOKIE_SECRET`, `JWT_SECRET`, `DB_PASSWORD`, `ENCRYPTION_KEY` to a secrets manager (AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault) for production

**TypeORM `synchronize`**: Set to `false` unconditionally (covered in Section 5.1)

**tenantId Enforcement**: Verify `TenantMiddleware` sets `req.tenantId` from the JWT payload only. Search for any service method that accepts `tenantId` from `req.body` and remove that path:
```bash
grep -rn "body.tenantId\|req.body.*tenantId" services/ --include="*.ts"
```

**Brute-Force Protection**: The `User` entity has `failedLoginAttempts` and `lockedUntil` fields. Verify the auth service increments these on failed login and blocks the account after N failures (typically 5). Check `ThrottlerGuard` is specifically applied to `POST /auth/login`.

**Audit Log Completeness**: The `AuditLog` entity and `AuditLogModule` exist. Confirm audit log calls are made for:
- `LOGIN`, `FAILED_LOGIN` — in auth service
- `CREATE`, `UPDATE`, `DELETE` — in patient, encounter, prescription, lab order, dispense services
- `PAYMENT_COLLECTED` — in billing service
- `VIEW_PATIENT_RECORD` — in patient GET endpoints (especially for sensitive contexts)
- `EXPORT`, `PRINT` — when report/PDF generation is added

**CORS in Production**: `main.ts` hardcodes `'http://localhost:5173'` as an allowed origin. This must be replaced with an environment variable:
```typescript
origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:5173'],
```

**File Upload Security** (when documents/attachments are added):
- Validate MIME type server-side (not client `Content-Type` header — use `file-type` library)
- Enforce file size limits (`multer` options)
- Store files outside the web root or in object storage (S3/Azure Blob)
- Never execute uploaded files

---

## 11. Audit Logging Design

### Required Schema

The `AuditLog` entity should have these fields (extend `audit-log.entity.ts` as needed):

```typescript
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() tenantId: string;
  @Column({ nullable: true }) actorUserId: string;
  @Column({ nullable: true }) actorRole: string;
  @Column() action: string;           // 'LOGIN' | 'CREATE' | 'UPDATE' | 'DELETE' | 'PAYMENT_COLLECTED' | ...
  @Column({ nullable: true }) entityName: string;    // 'Patient' | 'Prescription' | 'Invoice'
  @Column({ nullable: true }) entityId: string;
  @Column({ type: 'jsonb', nullable: true }) oldValues: object;
  @Column({ type: 'jsonb', nullable: true }) newValues: object;
  @Column({ nullable: true }) ipAddress: string;
  @Column({ nullable: true }) userAgent: string;
  @Column({ nullable: true }) correlationId: string;
  @CreateDateColumn() createdAt: Date;
  // NO updatedAt — audit logs are append-only
  // NO deletedAt — audit logs are NEVER soft-deleted
}
```

### Enforcement Rules

1. **Append-Only**: No `UPDATE` or `DELETE` SQL must ever execute against the `audit_logs` table. Enforce with a DB-level constraint or a read-only database user for the audit log schema.

2. **Soft Delete Everywhere Else**: Clinical records (`Patient`, `Encounter`, `Prescription`, `LabOrder`, `Invoice`) must use `@DeleteDateColumn()` (soft delete) — never `DELETE`. The `Encounter` entity already has this. Apply to all clinical entities.

3. **PHI in Audit Logs**: Store entity IDs and field names in audit logs, not PHI values in plaintext. If storing `oldValues`/`newValues`, ensure the encryption transformer is applied or values are stripped before logging.

4. **Async Audit Logging**: Route audit log writes through a Bull queue to prevent slow writes blocking the HTTP response. The audit data must be complete before the response is sent, but the write can be async.

---

## 12. MVP Production Scope

### Include in First Production Build

| Module | Status | Action |
|---|---|---|
| Login + JWT session | ✓ Exists | Verify brute-force protection, HttpOnly cookie |
| RBAC | ✓ Exists | Add missing `@UseGuards` to controllers |
| Tenant isolation | ✓ Exists | Verify tenantId never from client payload |
| Patient registration | ✓ Exists | Connect to real API, remove any mock data |
| Appointments | ✓ Exists | Add status machine enforcement |
| Walk-in check-in | ✓ Exists | Build proper OPDQueue entity |
| OPD queue | ✓ Exists | Add queue status update endpoint |
| Encounter | ✓ Exists | Add RBAC, expand status, add FKs |
| Vitals | ✓ Exists | Verify encounterId FK, remove vitals JSON blob from Encounter |
| EMR notes | ✓ Exists | Verify encounterId FK |
| Prescription | ✗ Incomplete | Add encounterId, add PrescriptionItem, fix status enum |
| Lab order | ✗ Incomplete | Add encounterId + patientId FK, fix status, add result sub-entity |
| Lab result entry | ✗ Incomplete | Add verify endpoint, link to patient timeline |
| Pharmacy dispense | ✗ No transaction | Rebuild with transaction safety |
| Billing and payment | ✗ Incomplete | Add item management, fix payment transaction |
| Patient timeline | ✓ Partial | Works after encounter FKs are fixed |
| Basic IPD | ✓ Entities exist | Build after OPD slices are stable |
| Audit logs | ✓ Module exists | Add calls to pharmacy, lab, billing mutations |
| Basic operational reports | — | Build after data model is correct |

### Exclude from First Production Build

- AI diagnosis suggestions
- Complex insurance/TPA claim workflows
- Barcode medication administration (BCMA module)
- Offline/PWA mode
- Multi-branch financial consolidation
- PACS / radiology imaging
- Telemedicine video
- ABDM/ABHA integration (beyond basic ABHA profile storage)
- Advanced analytics (beyond operational reports)

---

## 13. 30-Day Implementation Plan

### Week 1 — Architecture and Security Cleanup (Days 1–7)

**Day 1–2: Database and Configuration**
- Set `synchronize: false` unconditionally in `app.module.ts`
- Run `npm run migration:show` against the dev database to capture drift
- Add `encounterId` column to `prescriptions` and `lab_orders` tables via migration
- Add `patientId` UUID column to `lab_orders` via migration
- Add `paidAmount` to `invoices` via migration
- Verify all migrations run cleanly on a fresh PostgreSQL instance

**Day 3–4: Security Hardening**
- Add `@UseGuards(JwtAuthGuard, RolesGuard)` to `EncountersController`
- Audit every controller — add missing guards
- Replace `@Body('status')` in `EncountersController` with typed DTO
- Replace hardcoded CORS origin with environment variable
- Verify `tenantId` never accepted from request body in any service
- Verify brute-force protection is active on `POST /auth/login`

**Day 5–6: Code Quality Cleanup**
- Remove `POST /encounters/seed-demo` endpoint
- Remove all `randomInt` MRN generation from services
- Replace `orderedBy: data.orderedBy || 'System'` with authenticated user ID
- Move `DEFAULT_CATALOG` seed data from in-memory array to a proper seed migration
- Add correlation ID to all service log calls
- Add `maxQueryExecutionTime: 1000` to TypeORM config

**Day 7: Review and Deploy**
- Run `npm run lint` and fix all errors
- Run existing test suite — note which tests fail
- Deploy to staging against PostgreSQL (not SQLite)
- Verify health check endpoint responds

---

### Week 2 — Patient and Encounter Backbone (Days 8–14)

**Day 8–9: Create Missing Entities and Migrations**
- Create `Department` entity and migration
- Create `OPDQueue` entity and migration
- Create `PrescriptionItem` entity and migration
- Create `LabTestCatalog` entity and migration (basic, for price lookup)

**Day 10–11: OPD Queue Workflow**
- Build `PATCH /opd/queue/:id/status` endpoint
- Build proper `OPDQueue` service (create entry, list by department, update status)
- Update `OpdService.registerWalkIn` to create both `OPDQueue` entry and `Encounter` in a transaction
- Connect `OPD.jsx` to the updated queue status endpoint

**Day 12–13: Patient Timeline**
- Build `GET /patients/:id/timeline` — a single aggregated query joining encounters, prescriptions, lab orders, vitals
- Connect the patient workspace frontend to this endpoint
- Verify refresh restores patient context from URL params

**Day 14: Test and Validate**
- Write integration tests for patient registration → check-in → queue flow
- Manual end-to-end test: register patient, check in, appear in OPD queue

---

### Week 3 — Clinical Orders and Billing (Days 15–21)

**Day 15–16: Prescription Rebuild**
- Add `encounterId` FK to `Prescription`
- Rebuild `PrescriptionStatus` enum to `Draft | Signed | PartiallyDispensed | Dispensed | Cancelled`
- Build `POST /prescriptions` (requires encounterId)
- Build `POST /prescriptions/:id/items` (add drug line)
- Build `GET /prescriptions/encounter/:id`
- Add state machine validation to `PrescriptionService`

**Day 17–18: Lab Order Rebuild**
- Add `encounterId` and `patientId` FK to `LabOrder`
- Remove random MRN generation
- Build `POST /lab-orders` (requires encounterId, patientId)
- Build `PATCH /lab-orders/:id/sample-collected`
- Build `PATCH /lab-orders/:id/verify`
- Build `GET /lab-orders/encounter/:id`

**Day 19–20: Billing Rebuild**
- Add `paidAmount` column to `Invoice`
- Build `POST /billing/invoices` (create draft invoice for encounter)
- Build `POST /billing/invoices/:id/items`
- Rebuild `POST /billing/invoices/:id/pay` as transaction-safe
- Build `PATCH /billing/invoices/:id/status`
- Auto-create invoice items from prescription and lab order creation

**Day 21: Integration**
- Wire doctor workspace frontend to prescription and lab order APIs
- Wire billing frontend to new invoice management endpoints
- Verify invoice auto-populates when doctor creates orders

---

### Week 4 — Pharmacy, Lab Execution, and Stabilization (Days 22–30)

**Day 22–23: Pharmacy Transaction Safety**
- Rebuild `PharmacyService.dispenseMedication` with `DataSource.transaction`
- Build `GET /pharmacy/dispense-queue` (prescriptions in Signed/PartiallyDispensed state)
- Verify stock deduction and dispense record are atomic
- Add audit log call to dispense service

**Day 24–25: Lab Result and Verification**
- Build `LabResult` sub-entity if needed (or confirm single-result is sufficient for MVP)
- Build `PATCH /lab-orders/:id/result` refinement (requires authenticated technician ID)
- Build `PATCH /lab-orders/:id/verify` (second technician sign-off)
- Verify lab results appear in patient timeline after verification

**Day 26–27: Payment Workflow**
- Rebuild payment flow as transaction-safe
- Add `Payment` entity validation (prevent double payment)
- Build receipt data endpoint
- Verify encounter auto-closes after payment in Paid status

**Day 28–29: Testing**
- Write unit tests for `PharmacyService.dispenseMedication` (mock DataSource transaction)
- Write integration tests for billing payment (verify invoice status transitions)
- Write RBAC tests (unauthorized roles denied on clinical endpoints)
- Write tenant isolation tests (tenantId A cannot access tenantId B data)

**Day 30: Production Readiness Checklist**
- Run all gate checks (Section 16)
- Fix any failing checks
- Update deployment documentation
- Final staging deployment with production-like data volume

---

## 14. 60-Day and 90-Day Roadmap

### Days 31–60: IPD, Reports, and Performance

- IPD admission and bed management (full transactional workflow)
- Daily bed charge cron job via `@nestjs/schedule`
- Discharge summary creation and encounter closure
- Basic operational reports: Daily OPD census, Revenue summary, Lab turnaround times
- WebSocket-based OPD queue updates (replace 30s polling)
- Push notifications for lab results and queue calls
- Performance optimization: add database indexes based on slow query logs, add Redis caching for catalog data
- Improved doctor workspace: keyboard shortcuts, quick prescription templates

### Days 61–90: Advanced Features and Production Hardening

- Insurance / TPA claim workflow (basic — linking encounter to claim)
- Barcode/QR support for patient identification at check-in
- Advanced analytics: bed occupancy, revenue per department, doctor productivity
- Multi-branch feature foundation (schema changes for branch concept)
- Enhanced inventory forecasting (consumption trends)
- Clinical note templates for common diagnoses
- Production observability: Prometheus metrics dashboards, alerting rules
- Disaster recovery drill: backup restore test, failover test

---

## 15. Testing Strategy

### Unit Tests (NestJS services, no DB)

Required for every service that has business logic:
- `PrescriptionService`: test status machine transitions (invalid transition throws)
- `PharmacyService.dispenseMedication`: mock transaction, assert all 8 steps
- `BillingService.collectPayment`: test partial payment, overpayment rejection
- `LisService.enterResult`: test invalid state transition rejection

### Integration Tests (API endpoints with test DB)

Required end-to-end API tests using a test PostgreSQL database:
- Patient registration → MRN uniqueness per tenant
- Walk-in → OPD queue → encounter creation (verify all three DB records created)
- Prescription creation → invoice item auto-creation
- Lab order creation → invoice item auto-creation
- Pharmacy dispense → stock deduction atomicity (verify rollback on failure)
- Payment → invoice status transition

### RBAC Tests

For every controller, test that:
- Unauthenticated requests return 401
- Wrong-role requests return 403
- Correct-role requests return 200/201

### Tenant Isolation Tests

For every list/detail endpoint, test that:
- Tenant A's data is not accessible with Tenant B's JWT
- TenantId from JWT is used, not from request body

### Must-Have Test Workflows (End-to-End)

1. Patient registration → appointment → check-in → OPD queue → encounter → vitals → EMR note → prescription → lab order → invoice draft
2. Prescription → pharmacy dispense queue → dispense → stock deduction → invoice item update
3. Lab order → sample collected → result entered → verified → appears in patient timeline
4. Invoice → payment collected → status change to Paid → receipt data returned
5. Unauthorized user role denied on clinical endpoint
6. Tenant A cannot read Tenant B's patient records

---

## 16. Production Readiness Gates

Run this checklist before declaring the system production-ready.

### Gate 1: Data Persistence

- [ ] No `useState([...])` initialization with hardcoded data in critical pages
- [ ] No service method that returns mock/hardcoded data in production code path
- [ ] Browser refresh on `/workspace/patient/:id` reloads correct patient from API
- [ ] All clinical writes (prescription, lab order, dispense) persist to PostgreSQL
- [ ] Verify by: create a prescription, restart the backend, confirm prescription is still visible

### Gate 2: Security

- [ ] All controllers have `@UseGuards(JwtAuthGuard, RolesGuard)`
- [ ] All controller methods have explicit `@Roles(...)` decorator
- [ ] `synchronize: false` in production TypeORM config
- [ ] `tenantId` never accepted from `req.body` in any service
- [ ] No secrets in committed code (run `git grep -i "password\|secret\|key" -- '*.ts' '*.js'`)
- [ ] Audit logs are written for all PHI mutations
- [ ] Login brute-force protection is active
- [ ] CORS allowlist contains only production frontend URL(s)

### Gate 3: Reliability

- [ ] Pharmacy dispense is wrapped in a DB transaction
- [ ] Payment collection is wrapped in a DB transaction
- [ ] IPD admission is wrapped in a DB transaction
- [ ] All controllers return structured error responses (no raw stack traces)
- [ ] All list APIs have pagination (no `take: 50` hardcoded)
- [ ] `npm run migration:show` returns no pending migrations on production DB
- [ ] Database backup has been tested — restore succeeds

### Gate 4: Usability

- [ ] Receptionist can register a walk-in patient and see them in OPD queue in under 2 minutes
- [ ] Doctor can open patient, see previous history, add note, and sign prescription from one screen
- [ ] Pharmacist can see pending dispense queue, process dispense, and confirm stock deduction
- [ ] Lab technician can see ordered tests, mark sample collected, enter results, and verify
- [ ] Billing staff can open an encounter invoice, see auto-populated items, and collect payment

### Gate 5: Observability

- [ ] Structured JSON logs are written to stdout (Winston is configured)
- [ ] Every log entry has `tenantId`, `correlationId`, `userId` (where available)
- [ ] Sentry DSN is configured in production — `process.env.SENTRY_DSN` is set
- [ ] Health check endpoint `GET /api/v1/health` returns 200 with DB connectivity check
- [ ] Prometheus metrics endpoint is secured (not publicly accessible)
- [ ] Audit log table is queryable by admin with date range and actor filters

---

## 17. Recommended Development Order

Execute in this exact sequence. Do not start a step before the previous one is verified working.

```
1.  synchronize: false + pending migrations            (prevents schema accidents)
2.  Add encounterId FK to prescriptions and lab_orders  (fixes the clinical spine)
3.  Add @UseGuards to EncountersController              (closes RBAC gap)
4.  Audit all controllers for missing guards            (closes all RBAC gaps)
5.  Create OPDQueue entity + migration                  (formalizes the queue)
6.  Create PrescriptionItem entity + migration          (enables multi-drug Rx)
7.  Create Department entity + migration                (validates routing)
8.  Rebuild OPD check-in as a transaction               (opd queue + encounter atomically)
9.  Rebuild PrescriptionService with correct status machine
10. Rebuild LabOrderService with encounterId + patientId
11. Build invoice auto-creation from doctor orders
12. Rebuild PharmacyService.dispenseMedication with transaction
13. Rebuild BillingService.collectPayment with transaction
14. Build patient timeline API
15. Connect doctor workspace frontend to all new APIs
16. Write RBAC and tenant isolation tests
17. Write integration tests for pharmacy and billing transactions
18. IPD admission transaction
19. Discharge summary
20. Basic reports
21. WebSocket queue
22. Advanced features
```

---

## 18. Final Senior Architect Recommendation

### Summary Assessment

RSM HMS is not a prototype — it is a real, partially implemented hospital management system with a strong technical stack, correct security architecture, and a thoughtful data model that is approximately 60% connected. The work that remains is not glamorous: it is foreign key columns, transaction wrappers, status enum corrections, and missing controller guards. This unglamorous work is the difference between a demo and a hospital that can safely operate on it.

### The MVP Illusion — The Biggest Risk

The greatest risk today is that the system **looks** like it works. The OPD queue loads real data. The billing screen shows real invoices. The pharmacy shows real dispenses. But:

- A prescription saved today has no `encounterId`. It will never appear in the doctor's encounter view for that patient unless you search for it directly.
- A lab result entered today has no `patientId` UUID. If two patients have similar names, the join is ambiguous.
- A pharmacy dispense executed today has no transaction. Every dispense is one failed database write away from incorrect inventory.

These are not future concerns. They are data corruption scenarios in the current code.

### The First Perfect Workflow

Before adding anything new, make one workflow absolutely production-grade:

```
Patient Registration
  → Walk-in Check-in (transaction: OPDQueue + Encounter)
  → OPD Queue (queue management, status updates)
  → Doctor Opens Encounter (RBAC-protected)
  → Vitals Entry (linked to encounter)
  → Doctor EMR Note (linked to encounter)
  → Prescription (linked to encounter, signed, items structured)
  → Lab Order (linked to encounter and patientId)
  → Invoice Auto-Created (from orders, linked to encounter)
  → Pharmacy Dispense (transaction-safe, stock deducted atomically)
  → Lab Result + Verify
  → Payment Collected (transaction-safe, invoice status transitions)
  → Encounter Closed
```

When this workflow can be executed 100 times in a row without a data inconsistency, without a missing audit log, without an unauthorized access, and with sub-3-second response times — that is the production-readiness milestone.

### Measuring Success

Do not measure success by the number of modules deployed. Measure it by:

1. **Persistence**: Every clinical action creates a database record with the correct foreign keys
2. **Traceability**: Given a patient and date, reconstruct the complete encounter in 5 seconds from the audit log
3. **Auditability**: Every prescription, dispense, and payment has an immutable audit trail with actor and timestamp
4. **Security**: No unauthorized role has ever successfully called a clinical or financial endpoint
5. **Transaction Safety**: Zero inventory discrepancies. Zero partially saved clinical orders.
6. **Speed**: Receptionist check-in under 30 seconds. Doctor consultation documentation under 3 minutes. Pharmacist dispense confirmation under 60 seconds.

The technical foundation in RSM HMS is genuinely strong. The architecture decisions are correct. The data encryption, CSRF protection, HttpOnly cookies, audit log entity, and tenant middleware show that the engineering team understands what a healthcare system needs. The remaining work is connecting that foundation to reliable, consistent, transaction-safe data flows — and that work is entirely achievable in the 30 days mapped above.

---

*End of RSM HMS Senior Architect Production-Readiness Roadmap*
