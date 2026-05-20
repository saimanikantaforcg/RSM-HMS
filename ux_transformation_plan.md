# RSM HMS — Full UX Transformation Blueprint
## HIMSS Stage 7 Workflow-Driven Redesign

---

## Problem Analysis (Current State)

| Gap | Current State | Impact |
|---|---|---|
| **Module Isolation** | OPD, Lab, Pharmacy are separate pages | Doctors switch between 5+ tabs per patient |
| **No Patient Workspace** | PatientDetail has demographics + encounter history only | Cannot prescribe, order labs, or see results in one place |
| **Role-Blind Navigation** | All roles see all 30+ sidebar items | Cognitive overload for nurses, receptionists |
| **High Click Count** | 7+ clicks to prescribe: Nav→Module→Search Patient→Open Modal→Fill Form→Submit | Too slow for 30-patient OPD clinic |
| **No Smart Input** | Free-text fields, no autocomplete | Error-prone, slow |
| **No Command Palette** | Must use sidebar to navigate | Impossible for keyboard-power users |
| **Glassmorphism** | Blurred backgrounds, low contrast | Unreadable in bright clinical settings |

---

## Transformation Architecture

### Core Principle: **Patient as the North Star**

Every screen flows from a patient. No standalone module pages for doctors/nurses. Only Admin/Billing users need module-level views.

```
Journey: Registration → Queue → Workspace → Orders → Results → Discharge → Invoice
```

---

## Phase 1: OPD Full Redesign

### 1A. Flow Comparison (Before vs After)

**BEFORE — Doctor sees a patient (7 clicks, 3 page loads)**
```
1. Click "OPD" in sidebar
2. See queue table
3. Click patient row (no action — row isn't clickable)
4. Navigate to "Patients" sidebar
5. Search for patient by name
6. Click patient → PatientDetail opens
7. No way to prescribe from here → navigate to ePrescribing
8. Re-type patient name in ePrescribe modal
9. Submit
TOTAL: 9+ actions, 3 page switches, no context
```

**AFTER — Doctor sees a patient (2 clicks)**
```
1. Land on Role Dashboard → Patient Queue waiting
2. Click patient card in queue
3. Patient Workspace opens → demographics, vitals, history visible instantly
4. Type in Notes → "Chest pain, SOB" → structured note saved auto
5. Type "atorva" → Medication autocomplete appears → select 20mg → Prescribe ✓
6. Type "cbc" → Lab Order added inline → Submit
TOTAL: 2 clicks, 0 page switches
```

---

### 1B. Patient Workspace Layout

**Route:** `/workspace/:patientId?encounter=:id`

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [🔍 Search patient or action... Ctrl+K]           ⚡ Dr. Admin Smith    │ ← TOPBAR
├─────────────────┬──────────────────────────────────┬────────────────────┤
│   LEFT PANEL    │        CENTER PANEL              │   RIGHT PANEL      │
│   (280px)       │        (flex-1)                  │   (320px)          │
│                 │                                  │                    │
│  ● Patient Card │  [Notes] [Orders] [Rx] [Vitals]  │  🔴 ALERTS (1)     │
│    Arjun Mehta  │                                  │  ⚠ Penicillin allergy│
│    MRN-8492     │  ┌─────────────────────────────┐ │                    │
│    M / 47y      │  │ S.O.A.P Note Editor         │ │  📋 PENDING LABS  │
│    B+           │  │ > Chest pain x 2 days...    │ │  CBC ● Processing  │
│                 │  └─────────────────────────────┘ │  LFT ✅ Resulted   │
│  🚨 ALLERGIES  │                                  │                    │
│  Penicillin ⚠  │  [+ Add Order] [+ Prescribe]     │  📊 HISTORY        │
│                 │                                  │  3 visits (90d)    │
│  💊 ACTIVE Rx   │  Active Orders                   │  Last: Hypertension│
│  Metformin      │  CBC – Pending                   │                    │
│  500mg OD       │  Echo – Scheduled                │  🤖 AI SUGGESTION  │
│                 │                                  │  Consider adding   │
│  📅 VISIT HIST │                                  │  statin (LDL 190)  │
│  3 visits       │                                  │                    │
│                 │                                  │  [Admit to IPD]    │
│  [View Full →]  │  [Save & Complete]               │  [Discharge]       │
└─────────────────┴──────────────────────────────────┴────────────────────┘
```

---

### 1C. Reception Flow (30-Second Registration)

**Route:** `/register` or triggered via `Ctrl+K → "New Patient"`

**Screen Design:**
```
┌─────────────────────────────────────────────────────┐
│  Quick Registration                    ← ESC to cancel│
│                                                     │
│  Full Name*         [_________________________]     │
│  Mobile*            [_________________________]     │
│                     (OTP optional for ABHA link)    │
│  Gender             [M] [F] [Other]                 │
│  Age / DOB          [__] yrs  OR  [date picker]    │
│  Department         [Cardiology ▾]                  │
│  Doctor             [Dr. Smith ▾]  (auto-assigns)   │
│                                                     │
│  ── Optional ──────────────────────────────────     │
│  Blood Group  [A+ ▾]   Insurance  [_________]       │
│                                                     │
│  [Cancel]                    [Register + Add to Queue]│
└─────────────────────────────────────────────────────┘
```

**Fields:** 4 mandatory. Registration + Queue Token in 1 click.
**Click count:** 2 (Open form → Submit)

---

### 1D. Smart Input System (Command Palette & Autocomplete)

**Ctrl+K Command Palette:**
```
┌────────────────────────────────────────────────────┐
│ > _                                                │
│                                                    │
│  Recent:                                           │
│  👤 Arjun Mehta      (MRN-8492)  → Open Workspace  │
│  👤 Priya Sharma     (MRN-7710)  → Open Workspace  │
│                                                    │
│  Actions:                                          │
│  ➕ Register New Patient                           │
│  💊 New Prescription                               │
│  🧪 New Lab Order                                  │
│  📅 New Appointment                                │
│  🏥 Admit Patient to IPD                           │
└────────────────────────────────────────────────────┘
```

**Smart Prescription Input:**
- User types `"atorva"` → Shows: Atorvastatin 10mg / 20mg / 40mg / 80mg
- Selects dose → Auto-populates Sig template: `"Take 1 tablet OD at bedtime"`
- ⚠ If patient has allergy to drug class → Red banner appears in-place instantly
- 1 click to confirm Rx

**Smart Lab Order:**
- User types `"cbc"` → `Complete Blood Count` added as order chip
- Types `"lft"` → `Liver Function Test` chip added  
- Priority toggle: `Routine` | `Urgent` | `STAT`
- 1 click to submit all selected tests

---

## Phase 2: Role-Based Dashboards

### 2A. Doctor Dashboard (`/dashboard` — role: doctor)

```
┌──────────────────────────────────────────────────────────────┐
│  Good Morning, Dr. Smith  —  Thursday  —  OPD               │
│                                                              │
│  [🔍 Search patient...  Ctrl+K]                             │
├────────────────────────────┬─────────────────────────────────┤
│  TODAY'S QUEUE (12)        │  CRITICAL ALERTS                │
│  ──────────────────────    │  ⛔ Rx Allergy – Arjun (ward 3)│
│  OPD-001 Arjun Mehta 47M  │  🔴 Critical Lab – Priya CBC    │
│  "Chest pain, HTN"        │  ⚠ Drug interaction – Reshma    │
│  Wait: 22 min [START →]   │                                 │
│                            │  PENDING RESULTS (5)            │
│  OPD-002 Priya Sharma 38F │  CBC Arjun ● Processing         │
│  "Diabetes follow-up"     │  Echo Priya ✅ Ready             │
│  Wait: 40 min [START →]   │  LFT Mahesh ✅ Ready             │
│                            │                                 │
│  OPD-003 Mahesh Kumar 61M │  IPD PATIENTS (2)               │
│  "Joint pain, follow-up"  │  Bed 12A – Reshma (day 3)       │
│  Wait: 55 min [START →]   │  Bed 6B – Venkat (post-op)      │
└────────────────────────────┴─────────────────────────────────┘
```

**Key UX:**
- Each queue card is clickable → opens `Patient Workspace` in 1 click
- Alerts are real-time and actionable

---

### 2B. Nurse Dashboard (`/dashboard` — role: nurse)

```
┌────────────────────────────────────────────────────────────────┐
│  Ward 3 — East Wing  |  Nurse: Kavita R.                      │
├──────────────────────┬─────────────────────────────────────────┤
│  MEDICATION TASKS    │  VITALS DUE                             │
│  ──────────────────  │  ─────────────────────────────          │
│  ⏰ 09:00 Due        │  Bed 3A – Arjun   [Record Vitals]      │
│  Arjun – Metformin   │  Bed 3B – Priya   [Record Vitals]      │
│  Bed 3A  [Scan →]    │                                         │
│                      │  PENDING REQUESTS                       │
│  ⏰ 09:30 Due        │  Dr. Smith: IV Drip – Arjun (Bed 3A)   │
│  Priya – Insulin     │  Dr. Rao: Catheter – Priya (Bed 3B)    │
│  Bed 3B  [Scan →]    │                                         │
│                      │  QUICK ACTIONS                          │
│  ✅ Done:            │  [Report Deterioration] [Call Doctor]   │
│  Reshma – Amox 500mg │                                         │
└──────────────────────┴─────────────────────────────────────────┘
```

---

### 2C. Receptionist Dashboard (`/dashboard` — role: receptionist)

```
┌───────────────────────────────────────────────────────────────┐
│  Front Desk — OPD Tokens                                      │
│  [🔍 Search patient to check-in...]   [+ Register New Patient]│
├──────────────────────────────────────────────────────────────┤
│  WAITING  (8)           │  IN CONSULTATION  (3)               │
│  OPD-001 Arjun 47M     │  OPD-002 Priya – Dr. Smith          │
│  Cardiology  22 min    │  OPD-006 Kumar – Dr. Rao             │
│  [Check In] [Reassign] │  OPD-009 Sheela – Dr. Arora          │
│                         │                                      │
│  OPD-003 Priya 38F     │  DONE TODAY (24)                     │
│  Endocrinology 40 min  │  [View All Completions]              │
│  [Check In] [Reassign] │                                      │
└──────────────────────────────────────────────────────────────┘
```

---

### 2D. Billing Dashboard (`/dashboard` — role: billing_officer)

```
┌──────────────────────────────────────────────────────────────┐
│  Revenue Cycle — Today                                       │
│  Pending: ₹4,21,800 | Collected: ₹1,89,600 | Claims: 12     │
├──────────────────────────────────────────────────────────────┤
│  AWAITING INVOICE (6)       │  TPA CLAIMS PENDING (12)       │
│  Arjun Mehta – OPD visit   │  Claim #4421 – CGHS            │
│  ₹1,200 [Create Invoice]   │  ₹8,400  [Reconcile]           │
│                             │                                 │
│  Mahesh Kumar – Discharge  │  OVERDUE PAYMENTS (3)           │
│  ₹38,400  [Final Bill]     │  Invoice #INV-2291 – 8 days +  │
└──────────────────────────────────────────────────────────────┘
```

---

## Phase 3: Design System Change

### Remove Glassmorphism → Clinical White System

| Token | Old | New |
|---|---|---|
| Background | Blurred gradients | `bg-white`, `bg-gray-50` |
| Cards | `glass-panel`, `backdrop-blur` | `bg-white border border-gray-200 shadow-sm` |
| Text | Low-contrast light | `text-gray-900` (headings), `text-gray-600` (body) |
| Alerts | Styled overlays | High-contrast red/amber/green banners, no blur |
| Font | Browser default | `Inter` (Google Fonts) |

---

## Phase 4: React Component Architecture

### New Files to Create

```
frontend/src/
├── pages/
│   ├── workspace/
│   │   └── PatientWorkspace.jsx     ← THE CENTREPIECE
│   ├── dashboards/
│   │   ├── DoctorDashboard.jsx
│   │   ├── NurseDashboard.jsx
│   │   ├── ReceptionDashboard.jsx
│   │   └── BillingDashboard.jsx
│   └── register/
│       └── QuickRegister.jsx         ← 30-sec registration
├── components/
│   ├── CommandPalette.jsx            ← Ctrl+K global search
│   ├── workspace/
│   │   ├── PatientPanel.jsx          ← Left: demographics, allergies, Rx
│   │   ├── ClinicalWorkspace.jsx     ← Center: Notes, Orders, Vitals tabs
│   │   ├── ResultsPanel.jsx          ← Right: labs, AI, history
│   │   └── SmartOrderInput.jsx       ← Autocomplete med/lab entry
│   └── RoleDashboardRouter.jsx       ← Routes /dashboard to correct role view
```

### Modified Files

```
frontend/src/
├── components/Layout.jsx             ← Role-filtered nav, collapse to icon-only
├── App.jsx                           ← New routes for workspace, dashboards
└── index.css                         ← Remove glassmorphism, apply Inter font
```

---

## Phase 5: Click Count Verification

| Task | Before | After |
|---|---|---|
| Doctor starts OPD consultation | 9 actions | 2 clicks |
| Register a new walk-in patient | 6 clicks | 2 clicks |
| Prescribe a medication | 8 actions, 2 page loads | 3 keystrokes + 1 click |
| Order a lab test | 7 actions | 2 keystrokes + 1 click |
| Nurse records vitals | 4 clicks (navigate to module) | 1 click from dashboard |
| Billing creates an invoice | 5 clicks | 2 clicks from billing queue |
| ER triage — open from Ctrl+K | N/A | 2 keystrokes |

---

## Execution Order

- [x] Phase 0: Codebase Audit ✅
- [ ] Phase 1: Design System (`index.css`) — Remove glassmorphism, apply Inter
- [ ] Phase 2: `CommandPalette.jsx` — Global Ctrl+K overlay
- [ ] Phase 3: `PatientWorkspace.jsx` — The unified 3-panel layout
- [ ] Phase 4: `RoleDashboardRouter.jsx` + 4 role dashboards
- [ ] Phase 5: `QuickRegister.jsx` — 30-second registration
- [ ] Phase 6: Update [Layout.jsx](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/components/Layout.jsx) — Role-filtered, collapsible sidebar
- [ ] Phase 7: Wire all new routes in [App.jsx](file:///c:/Users/SARAGI/.gemini/antigravity/scratch/next-gen-hms/frontend/src/App.jsx)
- [ ] Phase 8: E2E verification across all 4 role personas
