# RSM HMS — Vulnerability & Gap Analysis (Post-Sprint 4)

While Sprints 1 through 4 successfully established a secure foundation and an enterprise-grade UI, the RSM HMS is still in an early MVP phase. Several critical security loop holes, compliance gaps, and functional deficiencies remain before the system can be considered production-ready for a live hospital environment.

---

## 🛑 1. Security & Compliance Loopholes

### 1.1 Insecure Token Storage (XSS Vulnerability)
- **The Loophole:** The frontend application currently stores the JWT `accessToken` and `refreshToken` in browser `localStorage`.
- **The Risk:** Any malicious third-party script (XSS attack) executing on the page can trivially extract these tokens and impersonate doctors or hospital administrators.
- **The Fix Required:** Migrate authentication to use **HTTP-Only, Secure, SameSite cookies**.

### 1.2 Lack of Comprehensive Audit Trails (HIPAA Violation)
- **The Loophole:** The database tracks `createdAt` and `updatedAt`, but fails to track **WHO** made the changes. Furthermore, when records are soft-deleted (`isActive: false`), the system does not log the deletion event.
- **The Risk:** Healthcare regulations (HIPAA/GDPR) require strict, immutable audit logs detailing exactly which practitioner viewed, modified, or deleted a patient's medical record.
- **The Fix Required:** Implement an `AuditLogTracker` interceptor/subscriber in TypeORM to record every mutation against the `userId`.

### 1.3 Rudimentary Role-Based Access Control (RBAC)
- **The Loophole:** The [User](file:///C:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/services/clinical-service/src/entities/user.entity.ts#10-69) entity has a `role` and `permissions` array, but the backend clinical and patient endpoints strictly rely on a global `@CurrentUser()` check. There are no granular `@Roles('doctor', 'admin')` guards protecting sensitive endpoints (like deleting a patient).
- **The Risk:** A receptionist could theoretically send a raw API request to deactivate an entire clinical department or alter a patient's diagnosis.
- **The Fix Required:** Deploy NestJS Role Guards and map precise permission policies to every controller method.

---

## 🚧 2. Functional Gaps (What is Lacking)

The current application only covers **Identity (Auth)**, **Registry (Patients)**, and **Visits (Encounters)**. To operate as a true Hospital Management System, the following core clinical modules are entirely absent:

### 2.1 Diagnostics & Labs
- **Missing:** Ability to order blood tests, imaging (X-Ray/MRI), and record diagnostic results against an Encounter.
- **Impact:** Doctors cannot practice evidence-based medicine within the EMR.

### 2.2 Pharmacy & Prescriptions (CPOE)
- **Missing:** Computerized Provider Order Entry (CPOE) for e-prescribing medications. No tracking of active medications, dosages, or contraindications (e.g., stopping a doctor from prescribing Penicillin to an allergic patient).
- **Impact:** Critical for patient safety and clinical workflows.

### 2.3 Revenue Cycle Management (Billing)
- **Missing:** Financial tracking, insurance claim generation, ICD-10 coding, and patient invoicing.
- **Impact:** The hospital cannot generate revenue.

### 2.4 Document Management (PACS/Attachments)
- **Missing:** Infrastructure to upload PDF lab reports, patient consent forms, or DICOM imaging files (e.g., S3 or Azure Blob integration).

---

## ⚙️ 3. Technical & Reliability Debt

### 3.1 Unhandled Frontend Edge Cases (React Error Boundaries)
- **The Loophole:** Expected API errors are handled gracefully, but unexpected JavaScript runtime errors will cause the entire React application to unmount (resulting in a blank white screen).
- **The Fix Required:** Implement a global React `ErrorBoundary` component to catch render failures, log them securely, and display a professional crash recovery UI.

### 3.2 Automated Testing Deficiency 
- **The Loophole:** The application currently relies 100% on manual testing. There are zero unit tests (Jest) for critical backend logic and zero end-to-end tests (Cypress/Playwright) for the frontend.
- **The Risk:** Future updates (e.g., adding a Billing module) have a high probability of silently breaking existing Patient or Encounter logic. 

### 3.3 Lack of Real-Time Infrastructure (WebSockets)
- **The Loophole:** The dashboard and encounter lists rely on hard refreshes (`onMount`). 
- **The Risk:** In a fast-paced ER environment, doctors need to see patient admissions instantaneously.
- **The Fix Required:** Implement NestJS WebSockets (`Socket.io`) or Server-Sent Events (SSE) to push live updates to connected browsers.

---

## Strategic Summary

The RSM HMS has a **beautiful, optimized UI** and a **stable database foundation**, but it is currently a "read/write" shell. 

**Immediate Priority for Sprint 5:**
1. Secure the JWTs into HTTP-Only cookies.
2. Implement rigid Role Guards on the NestJS controllers.
3. Begin scaffolding the **Diagnostics** or **Pharmacy** modules to bridge the clinical gap.
