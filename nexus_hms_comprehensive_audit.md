# RSM HMS — Comprehensive System Audit & Strategic Improvement Report

**Date:** May 19, 2026  
**Auditor:** Senior Software Architect & Healthcare Product Consultant  
**Project:** RSM Hospital Management System (HMS)  
**Technology Stack:** React.js / Vite / Tailwind CSS (Frontend); NestJS / Node.js (Backend); SQLite / PostgreSQL (Database)

---

## 1. Executive Summary

### Overall System Health
RSM HMS boasts a highly modern, aesthetically premium frontend architecture leveraging React and Tailwind CSS, coupled with a solid modular NestJS backend. The foundational layers (Authentication, Multi-tenancy, API interceptors) reflect a strong commitment to enterprise standards. However, the system currently lacks true end-to-end data persistence across all clinical modules, heavily relying on "mock arrays" and frontend-only state in several areas (e.g., Pharmacy, Diagnostics, IPD). 

### Production Readiness Rating: 4.5 / 10 (Development/MVP Phase)
While Identity Management, Patient Registry, and UI components are robust, the absence of fully wired database tables for complex workflows (Billing, Labs, Pharmacy) and critical security hardening (Secrets management, immutable audit logs) prevents this from being safely deployed in a live clinical setting.

### Key Strengths
- **Beautiful, Modern UX:** The interface is best-in-class, utilizing skeleton loaders, clean typography, and intuitive layouts (e.g., Patient Workspace, Ward Grids).
- **Solid Backend Framework:** NestJS’s modularity, `@Roles` guards, and TypeORM entities are structurally sound.
- **Security Baseline:** Implementation of Helmet, rate-limiting (`ThrottlerGuard`), and bcrypt password hashing.

### Key Risks
- **Data Persistence Gaps:** Many frontend modules (OPD queue, Lab orders) do not fully round-trip to the database, relying on partial or mock implementations.
- **Architectural Debt:** Use of `synchronize: process.env.NODE_ENV !== 'production'` in TypeORM poses a catastrophic risk if misconfigured.
- **Missing Clinical Interlock:** Pharmacy and Billing modules are largely disconnected from Doctor Prescriptions and Lab Orders.

### Immediate Priorities
1. **Connect the Dots (APIs):** Wire all frontend actions (Admissions, Lab result entry, Dispensing) to physical TypeORM entities.
2. **Security Hardening:** Move all hardcoded secrets to environment variables and enforce strict CSRF protection.
3. **Clinical Workflows:** Finalize the Encounter-to-Billing data pipeline so a consultation automatically generates an invoice.

---

## 2. Product Vision Review

### Flow & Usability
The software’s flow is visually stunning, but currently slightly disjointed. Hospital-friendly software requires **minimal clicks** and **keyboard-first** data entry for high-volume users like Receptionists and Lab Techs. 

### Recommendations for a Compact, Advanced App
- **Action-Oriented Dashboards:** Instead of generic stats, users should see their immediate tasks (e.g., Nurse Dashboard: "Vitals Due," Doctor Dashboard: "Waiting Patients").
- **Unified Command Palette:** Implement a `Ctrl+K` global search to instantly jump to a patient MRN from anywhere, bypassing menus entirely.
- **Smart Defaults:** Pre-fill fields based on context (e.g., Lab tests automatically defaulting to 'Routine' priority unless overridden).

---

## 3. End-to-End Hospital Workflow Audit

### 3.1 Patient Registration & Appointment
- **Expected:** Receptionist enters demographics; a unique MRN is generated; appointment is booked against a doctor's schedule.
- **Current Gap:** Walk-in registration exists, but scheduling lacks a robust `Appointment` state machine (Arrived, Cancelled, No-Show).
- **Req. Changes:** Fully wire `Appointment` entity to a calendaring frontend component.

### 3.2 OPD Queue & Doctor Consultation
- **Expected:** Patient checks in; appears on the doctor's queue; doctor writes notes (EMR), prescribes meds, and orders labs.
- **Current Gap:** OPD queue (`OPD.jsx`) is visually appealing but the transition from OPD to an active `Encounter` session isn't seamless in the backend. 
- **Req. Changes:** EMR module needs a robust WYSIWYG editor saving to `EmrNote` entity; link `LabOrder` and `Prescription` strictly to the `EncounterId`.

### 3.3 Lab/Radiology Orders & Pharmacy
- **Expected:** Doctor clicks "Order Lab". Lab Tech sees it on their worklist (`Laboratory.jsx`), enters results. Pharmacist sees prescription, dispenses reducing `Stock`.
- **Current Gap:** Inventory deduction upon dispensing is not fully automated transactionally.
- **Req. Changes:** Introduce a backend DB transaction: when `Dispense` happens, subtract from `StockTransaction`.

### 3.4 Billing, IPD Admission & Discharge
- **Expected:** Admitting from ER/OPD changes patient status to IPD; assigns `Bed`. Daily charges accrue. Final discharge generates a `Discharge Summary` and consolidated `Invoice`.
- **Current Gap:** Auto-accrual of bed charges and connection between IPD and Billing is missing.
- **Req. Changes:** Implement a nightly cron job (`@nestjs/schedule`) to post daily bed charges to the `InvoiceItem` table.

---

## 4. Frontend Architecture Audit

### Current State
- **Structure:** Excellent React/Vite division. `api.js` centralizes fetch logic well.
- **Loading:** Great use of `SkeletonTable` and centralized spinners.

### Improvements Needed
- **State Management:** Over-reliance on local component state for shared concepts (like selected patient). Implement **Zustand** globally for `ActiveEncounter` so the context survives navigating between "EMR" and "Labs".
- **Error Boundaries:** A global `ErrorBoundary` exists in `App.jsx`, but granular level boundaries (per module) are needed so a crash in the Pharmacy tab doesn't crash the whole app.
- **Form Validation:** While Zod is used in some places (e.g., `OPD.jsx`), many components use manual state. Standardize entirely on `react-hook-form` + `@hookform/resolvers/zod`.
- **Speed (Keyboard Navigation):** Standardize `tabIndex` flows in fast-paced areas like Billing and Pharmacy to allow mouse-less operation.

---

## 5. Backend Architecture Audit

### Current State
- **Structure:** Clean NestJS Controller-Service-Repository pattern.
- **Security:** Good use of `@Roles` and `JwtAuthGuard`.

### Improvements Needed
- **DTO Validation:** Ensure `ValidationPipe` with `forbidNonWhitelisted: true` is strictly applied globally to prevent NoSQL/JSON injection.
- **Error Handling:** Raw database exceptions sometimes leak. Implement a global `AllExceptionsFilter` to standardize error envelopes (`{ success: false, error: 'Message' }`).
- **Pagination & Filtering:** Current endpoints often return raw arrays. Implement cursor or offset-based pagination to prevent memory bloat as the hospital scales.
- **Background Jobs:** For tasks like SMS notifications or heavy report generations, offload to a Redis-backed queue (e.g., BullMQ) rather than processing synchronously.

---

## 6. Database and Data Model Audit

The system has a good foundation of Entities, but needs the following refinements for real-world complexity:

| Entity | Purpose & Key Fields | Gaps & Indexing Requirements |
| :--- | :--- | :--- |
| **Patient** | MRN, Demographics, Blood Group | Missing explicit `InsuranceProviderId`. **Index:** `(tenantId, mrn)` and `(tenantId, lastName, dob)`. |
| **Encounter** | Links patient visit to a provider. | Missing `dischargeDisposition`. Needs strict state machine. **Index:** `(tenantId, status, practitionerId)`. |
| **OPD Queue** | Tracks patient flow before consult. | Currently missing physical tracking table (handled mostly in encounters). Needs `checkInTime`, `triageTime`, `consultTime`. |
| **Prescription & Meds**| Doctor's order details. | Needs fields for `route` (PO, IV), `frequency` (BID, TID), and `durationDays`. |
| **Lab Order/Result**| Diagnostic tracking. | `LabOrder` exists, but needs relationship mapping to an underlying `LabTestCatalog` (prices, reference ranges). |
| **Invoice & Items** | Revenue tracking. | Needs `taxPercent`, `discountReason`. MUST be tied to `Encounter`. **Index:** `(tenantId, status, createdAt)`. |
| **Audit Log** | HIPAA compliance tracking. | Crucial: Must be append-only. Needs `entityName`, `entityId`, `oldValues`, `newValues`. |

**Tenant Isolation:** All entities correctly implement `tenantId`. Ensure `RlsContextInterceptor` (Row-Level Security) or similar logic is enforcing this on every underlying SQL query.

---

## 7. Security and Compliance Audit

| Domain | Assessment | Risk Rating | Recommendation |
| :--- | :--- | :--- | :--- |
| **Authentication (JWT)** | Good, but tokens should ideally be HTTP-Only cookies to prevent XSS. | **Medium** | Ensure `cookie-parser` is fully utilized and localStorage is eliminated for token storage. |
| **Authorization (RBAC)** | Strong. `@Roles()` decorators are present. | **Low** | Ensure every controller method has explicit roles. Default to DENY. |
| **PHI Protection** | Data encrypted at rest via TypeORM transformers. | **Low** | Ensure encryption keys are rotated and managed securely (e.g., AWS KMS). |
| **Audit Logging** | Present, but needs granular mutation tracking. | **High** | Implement TypeORM `@EventSubscriber` to automatically log all UPDATE/DELETE actions to `AuditLog`. |
| **API Rate Limiting** | Throttler is present. | **Low** | Configure custom limits (e.g., strict limit on `/auth/login` to prevent brute force). |

---

## 8. Module-by-Module Audit

1. **Dashboard:** Currently static. *Action:* Add real-time Redis Pub/Sub push for live metrics.
2. **Registration/Appointments:** Needs conflict resolution (double-booking protection). *Priority:* High.
3. **OPD/IPD:** Needs seamless transition (Convert OPD Encounter -> IPD Admission). *Priority:* Critical.
4. **EMR:** Lacks customizable templates. Doctors type the same notes. *Action:* Add `EmrTemplate` entity. *Priority:* Medium.
5. **Laboratory / Pharmacy:** Look great, but need strict transactional integration with Billing. *Priority:* Critical.
6. **Billing:** Missing automated claim generation for TPA/Insurance. *Priority:* High.

---

## 9. Advanced Features Recommendation

To make RSM HMS stand out as a modern, premium platform:
1. **Command Palette (`Cmd/Ctrl + K`):** Instant global search across patients, lab results, and invoices.
2. **Smart Clinical Auto-Complete:** When a doctor types a diagnosis, automatically suggest standard lab panels and medications (support tool, not AI replacement).
3. **Real-time WebSocket Queue:** WebSockets for the OPD screen so Reception, Nurses, and Doctors see the patient move through the pipeline instantly.
4. **Barcode/QR Integration:** Pharmacists scan medication barcodes; nurses scan patient wristbands for IPD medication administration (BCMA module).
5. **Role-Based Context:** The UI should dynamically collapse menus that are irrelevant to the user's role to minimize cognitive load.

---

## 10. Minimal and Easy Software Flow Recommendation

- **Receptionist Flow:** 1. `Ctrl+K` (Search Patient) -> 2. Quick Register Modal (if new) -> 3. Select Doctor -> 4. Check out (collect copay). *Goal: Under 60 seconds.*
- **Doctor Flow:** 1. Dashboard (Waiting list) -> 2. Click Patient -> 3. Unified Workspace Panel (left: notes, middle: vitals/history, right: orders). -> 4. Click "End Consult". *Goal: Everything on one screen.*
- **Nurse Flow:** 1. IPD Ward Grid -> 2. Click Bed -> 3. Slider opens to input Vitals and Medication Administration.
- **Pharmacist Flow:** 1. Dispense Queue -> 2. Review digital Rx -> 3. Scan barcode/Click Dispense (auto-deducts inventory & auto-bills).

---

## 11. API Endpoint Recommendation

Standardized REST structure across all modules:

**Patient & Encounters**
- `GET /api/v1/patients` (Paginated, Searchable)
- `POST /api/v1/patients`
- `GET /api/v1/patients/:mrn/history` (Aggregated EMR timeline)
- `POST /api/v1/encounters` (Start visit)
- `PATCH /api/v1/encounters/:id/status` (e.g., Admit, Discharge)

**Clinical Orders**
- `POST /api/v1/lab-orders` 
- `PATCH /api/v1/lab-orders/:id/result` (Lab tech action)
- `POST /api/v1/prescriptions`
- `PATCH /api/v1/prescriptions/:id/dispense` (Pharmacy action)

**Financial**
- `GET /api/v1/billing/invoices`
- `POST /api/v1/billing/invoices/:id/pay`
- `GET /api/v1/inventory/stock`

---

## 12. Production Readiness Checklist

- [ ] **Frontend Environment:** `import.meta.env` strictly validated; error boundaries catch all runtime crashes.
- [ ] **Database Integrity:** Foreign keys enforced; `synchronize: false` with robust TypeORM Migrations established.
- [ ] **Security:** Secrets managed via Vault/Env; HTTPS/TLS terminated at load balancer; CSRF protection active.
- [ ] **Reliability:** Redis caching configured for high-read catalog data (drugs, tests); connection pooling optimized.
- [ ] **Observability:** Winston/Pino JSON logging implemented. Sentry (or similar) integrated for exception tracking.
- [ ] **Compliance:** Immutable HIPAA audit trail verified via database triggers or TypeORM subscribers.

---

## 13. Remediation Roadmap

- **Phase 1: Database & Security Hardening (Weeks 1-2)**
  - Implement TypeORM migrations. Secure JWTs in HTTPOnly cookies. Centralize exception handling.
- **Phase 2: Core Patient Pipeline (Weeks 3-4)**
  - Wire up OPD Registration -> Consultation -> EMR Notes into database transactions.
- **Phase 3: Ancillary & Financials (Weeks 5-6)**
  - Connect Labs and Pharmacy to the backend. Wire all dispense/order actions to automatically generate `InvoiceItems`.
- **Phase 4: IPD & Advanced Flows (Weeks 7-8)**
  - Finalize Bed management, daily ward billing cron jobs, and Discharge Summaries.
- **Phase 5: UX Polish & Observability (Week 9)**
  - Implement global search, WebSocket push notifications, and configure production APM tracking.

---

## 14. Final Architect Recommendation

RSM HMS has exceptionally strong bones. The aesthetic intelligence and the modular layout of the frontend, combined with NestJS on the backend, means that **what is working well is the foundation itself**. 

However, the application currently suffers from the "MVP Illusion"—it looks finished, but lacks the deep data-binding and transactional safety nets (like inventory synchronization and automated billing hooks) required of clinical software. 

**What must be fixed before production:** You must eliminate `synchronize: true`, replace local state mock arrays with strict API pagination, and finalize the revenue cycle integration (connecting clinical orders directly to invoices).

**What can make RSM stand out:** If you execute on the **Unified Command Palette** and the **One-Screen Doctor Workspace**, this system will dramatically outperform legacy systems (which often require 15+ clicks just to order a blood test). By focusing on making the workflows practically invisible, RSM HMS will be highly embraced by high-turnover hospital staff.
