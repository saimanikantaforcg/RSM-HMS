# System-Wide Gap Analysis & Technical Debt Report
**Date:** March 20, 2026
**Focus:** Full-Stack Codebase Audit (Sprints 1-6)

You are absolutely right. While the previous sprint secured the authentication, audit logs, and restricted the UI based on roles, a deep dive into the architecture reveals that the application is essentially a "beautiful facade" right now. Roughly 80% of the system is just scaffolding.

Here is the exhaustive list of the critical gaps that must be resolved before this can function as a real hospital system.

---

### 🚨 1. The "Vaporware" Database (Missing Schema)
Currently, your PostgreSQL database only actually contains **6 tables**:
[Hospital](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/auth/auth.service.spec.ts#23-28), [User](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/entities/user.entity.ts#10-69), [Patient](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/ipd/ipd.controller.ts#9-12), `Encounter`, [Invoice](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/pages/financial/Billing.jsx#13-22), and [AuditLog](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/audit-log/audit-log.entity.ts#14-69).

The system is completely missing the data structures for:
- **Appointments**: No table to store scheduling slots, provider links, or statuses.
- **Laboratory (LIS)**: No tables for `LabOrder`, `TestCatalog`, or `LabResult`.
- **Pharmacy**: No tables for `DrugCatalog`, `Inventory`, or `DispenseLog`.
- **EMR / Clinical**: No tables for `Prescription`, `Vitals`, `ProgressNote`, or `Allergy`.
- **ADT (Admissions)**: No tables for `Bed`, `Ward`, or `AdmissionRecord`.

**Risk:** Without these tables, any data entered on the frontend disappears when the page refreshes.

### 🚨 2. Disconnected Frontend Modules
The React frontend looks incredible, with complex grids, modals, and navigation. However, practically all modules (except Patient Registry and User Management) are rendering **Mock Data Array**s. 

- [Laboratory.jsx](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/pages/diagnostics/Laboratory.jsx), [Pharmacy.jsx](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/pages/diagnostics/Pharmacy.jsx), [Billing.jsx](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/pages/financial/Billing.jsx), [OPD.jsx](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/pages/clinical/OPD.jsx), [Appointments.jsx](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/pages/patientAdmin/Appointments.jsx) are currently running on fake frontend data. If you click "Dispense Drug" or "Admit Patient", it updates the local React state but never actually saves to the NestJS backend.

### 🚨 3. Unguarded & Empty API Controllers
During Sprint 1, we aggressively generated 34 NestJS modules (`nest g resource...`). 
Currently, about 28 of those controllers (like [EmrController](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/emr/emr.controller.ts#4-18), [IpdController](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/ipd/ipd.controller.ts#4-18), `OtController`) are just blank boilerplate files. 
- They lack the `@Roles()` permission guards we just built.
- They lack Swagger Documentation (`@ApiTags`).
- Most importantly, they have no business logic to insert or retrieve data.

---

## 🗺️ Recommended Remediation Plan (Next Sprints)

To fix this and make the HMS truly functional end-to-end, we need to bridge the gap between the pristine UI and the database. I recommend attacking this in chronological workflow order:

### Sprint 7: Patient Lifecycle (Admissions & Appointments)
1. Automatically create [Appointment](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/pages/patientAdmin/Appointments.jsx#7-108), `Bed`, and `Admission` entities.
2. Link the frontend [Appointments.jsx](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/pages/patientAdmin/Appointments.jsx) calendar and [OPD.jsx](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/pages/clinical/OPD.jsx) queue to the live API.

### Sprint 8: Clinical EMR & Diagnostics
1. Build the database queries for `Prescription`, [Note](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/emr/emr.controller.ts#9-12), and `VitalSign`.
2. Connect `EMR.jsx` so Doctors can write real notes that are permanently saved.
3. Connect [Laboratory.jsx](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/pages/diagnostics/Laboratory.jsx) so Lab Techs can post real results against real Patient IDs.

### Sprint 9: Revenue & Pharmacy Supply
1. Link the Doctor's `Prescription` directly to the [Pharmacy.jsx](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/pages/diagnostics/Pharmacy.jsx) dispense queue.
2. Automatically generate [Invoice](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/pages/financial/Billing.jsx#13-22) lines when a drug is dispensed or a lab test is run.

### Conclusion
The foundation (auth, multi-tenancy, UI aesthetic, routing) is rock solid. But right now, the walls and roof are missing. We must begin implementing the TypeORM entities and connecting the frontend API calls module by module.
