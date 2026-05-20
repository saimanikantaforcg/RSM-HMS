# RSM HMS: Universal Operating Manual
**Version 1.0 | HIMSS Stage 7 Certified**

This manual provides a definitive, step-by-step guide to operating the RSM HMS. It is designed for clinical, administrative, and financial staff to ensure maximum efficiency and patient safety.

---

## 📘 1. System Overview & Access

### 1.1 Accessing the Application
- **URL**: `http://localhost:5173`
- **Recommended Browser**: Google Chrome or Microsoft Edge (Chromium).
- **Credentials**: 
    - Use the **"Use Demo Account"** button for instant access as a System Administrator.
    - Standard Format: `email@hms.local` / `hms_demo_123`.

### 1.2 The Interface Layout
- **Sidebar**: Global navigation grouped by clinical intensity (Primary, Diagnostic, Financial, Operations).
- **Topbar**: Search, Command Palette trigger, System Health, and User Profile (Secure Logout).
- **Main View**: High-contrast, role-based dashboards or the 3-panel Patient Workspace.

---

## ⌨️ 2. Universal Controls (The Power User Toolkit)

### 2.1 The Command Palette (Ctrl + K)
The fastest way to navigate. Press `Ctrl + K` to open the overlay.
- **Search Patients**: Type any part of a name (e.g., "Sarah") and hit `Enter` to open their chart.
- **Trigger Workflows**: Type "Register" to start a new patient, or "Billing" to open the ledger.
- **Quick Jump**: Type module names (e.g., "Pharmacy") for instant navigation.

### 2.2 Global Search
Located in the Topbar. Use it for deep-searching active patient visits, MRNs, or specific diagnostic reports.

---

## 🏥 3. Clinical Workflows (Step-by-Step)

### 3.1 Patient Registration (The 30-Second Flow)
1. Navigate to **Quick Register** in the sidebar.
2. Enter **Full Name**, **Gender**, **Date of Birth**, and **Mobile Number**.
3. Select **Department** (Optional).
4. Click **Complete Registration**.
5. *Result*: A new MRN is generated, and the patient is automatically added to the queue for the selected department.

### 3.2 The Patient Workspace (Consultation & Charting)
Once a patient is selected, you enter the **Unified Workspace**:
- **Step 1 (Notes)**: In the Center Panel, select the **Notes** tab. Document symptoms and physical examination.
- **Step 2 (Vitals)**: Switch to the **Vitals** tab to record BP, Pulse, SpO2. Values are color-coded (Red = Critical).
- **Step 3 (Orders)**: Use the search in the **Orders** section. Type "CBC" or "X-Ray". Press `Enter` to beam the order to Laboratory or Radiology.
- **Step 4 (Prescribe)**: Type medication names. Select dose and frequency. The system checks for **Allergies** (Left Panel) in real-time.

### 3.3 Diagnostic Resulting (LIS/RIS)
- **Laboratory**: Open the Lab module to see the "Queue." Once tests are run, enter values. Signed results appear instantly in the Patient Workspace.
- **Radiology**: Upload images (DICOM) and type findings. Reports are accessible to doctors immediately.

---

## 💉 4. Nursing & Inpatient Operations

### 4.1 Ward Management (ADT)
1. Go to **Bed Management**. 
2. View the **Ward Command Center** (2D Map).
3. **Occupied Beds** (Blue) show live patient vitals.
4. **Available Beds** (Green) are ready for admission.
5. Click a bed to perform a **Transfer** or **Discharge**.

### 4.2 BCMA (Medication Administration)
Nurses use the **BCMA** dashboard to:
1. See the scheduled medication list for their assigned ward.
2. Select a patient → The "5 Rights" checklist appears.
3. Validate: Right Patient, Right Drug, Right Dose, Right Route, Right Time.
4. Record administration with a timestamp and digital signature.

---

## 💰 5. Revenue Cycle & Financials

### 5.1 Invoicing (Billing)
1. Go to **Billing & Invoices**.
2. Search for the patient name.
3. All clinical actions (Labs, Drugs, Room Rent) are automatically pulled into the draft invoice.
4. Add discounts or GST adjustments if authorized.
5. Click **Finalize & Print**.

### 5.2 RCM & Claims
1. The **RCM Dashboard** shows the status of every claim (Draft, Submitted, Denied, Paid).
2. For TPA/Insurance: Navigate to **Claims**, select the insurer, and submit the batch electronically.

---

## 🧠 6. Advanced Features (HIMSS Stage 7)

### 6.1 IoT Asset Tracking (RTLS)
- Open **Asset Management**.
- Pinpoint the location of critical equipment (Ventilators, Defibrillators) on the live floor plan.
- **Theft/Misplacement Prevention**: The system alerts security if tagged assets leave their designated zones.

### 6.2 AI Clinical Decision Support
- In the Patient Workspace, view **Readmission Risks** and **LoS Forecasts**.
- Use these insights during discharge planning to optimize hospital throughput.

### 6.3 ABDM (Indian Health Stack)
- Link patients to their **ABHA ID** to ensure seamless health record portability across the Indian health ecosystem.

---

## 🛠️ 7. System Administration
- **User Management**: Add/Edit staff roles (Doctor, Nurse, Admin) in Settings.
- **Audit Logs**: Every clinical action is timestamped and logged for regulatory compliance.
- **Health Check**: Monitor backend service connectivity in real-time from the dashboard footer.

---
*RSM HMS: Redefining the Patient Journey with Clinical Intelligence.*
