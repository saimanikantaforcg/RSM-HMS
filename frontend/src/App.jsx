import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';
import AuthGuard from './components/AuthGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';

// ── Shared Components ──────────────────────────────────────────
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RoleDashboardRouter = lazy(() => import('./pages/RoleDashboardRouter'));
const PatientWorkspace = lazy(() => import('./pages/workspace/PatientWorkspace'));
const QuickRegister = lazy(() => import('./pages/register/QuickRegister'));

// ── Clinical Modules ──────────────────────────────────────────
const EMR = lazy(() => import('./pages/clinical/EMR'));
const OPD = lazy(() => import('./pages/clinical/OPD'));
const IPD = lazy(() => import('./pages/clinical/IPD'));
const OperatingTheater = lazy(() => import('./pages/clinical/OperatingTheater'));
const Emergency = lazy(() => import('./pages/clinical/Emergency'));
const EPrescribing = lazy(() => import('./pages/clinical/EPrescribing'));
const BCMA = lazy(() => import('./pages/clinical/BCMA'));

// ── Patient Admin ───────────────────────────────────
const Patients = lazy(() => import('./pages/Patients'));
const PatientDetail = lazy(() => import('./pages/patientAdmin/PatientDetail'));
const Encounters = lazy(() => import('./pages/Encounters'));
const Appointments = lazy(() => import('./pages/patientAdmin/Appointments'));
const ADT = lazy(() => import('./pages/patientAdmin/ADT'));
const Beds = lazy(() => import('./pages/patientAdmin/Beds'));
const PatientPortal = lazy(() => import('./pages/patientAdmin/PatientPortal'));
const Telemedicine = lazy(() => import('./pages/patientAdmin/Telemedicine'));

// ── Diagnostics ─────────────────────────────────────
const Laboratory = lazy(() => import('./pages/diagnostics/Laboratory'));
const Radiology = lazy(() => import('./pages/diagnostics/Radiology'));
const Pharmacy = lazy(() => import('./pages/diagnostics/Pharmacy'));

// ── Financial ───────────────────────────────────────
const Billing = lazy(() => import('./pages/financial/Billing'));
const RCM = lazy(() => import('./pages/financial/RCM'));
const Claims = lazy(() => import('./pages/financial/Claims'));
const Payments = lazy(() => import('./pages/financial/Payments'));
const TPASettlement = lazy(() => import('./pages/financial/TPASettlement'));

// ── Operations ──────────────────────────────────────
const Inventory = lazy(() => import('./pages/operations/Inventory'));
const Assets = lazy(() => import('./pages/operations/Assets'));
const Scheduling = lazy(() => import('./pages/operations/Scheduling'));
const Physicians = lazy(() => import('./pages/operations/Physicians'));
const Compliance = lazy(() => import('./pages/operations/Compliance'));
const Documents = lazy(() => import('./pages/operations/Documents'));

// ── Analytics & System ──────────────────────────────
const Analytics = lazy(() => import('./pages/Analytics'));
const Vitals = lazy(() => import('./pages/Vitals'));
const Settings = lazy(() => import('./pages/Settings'));
const UserManagement = lazy(() => import('./pages/system/UserManagement'));
const Security = lazy(() => import('./pages/system/Security'));
const ABDM = lazy(() => import('./pages/system/ABDM'));

// 🏥 Elite Loading State for Suspense
function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Initializing Component...</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'font-medium text-sm !rounded-xl !shadow-lg',
            duration: 3500,
          }}
        />
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* ── Persistent Global Layout Wrapper ─────────────── */}
          <Route element={<Layout />}>
            {/* ── Role-based Dashboard ───────────────────────────── */}
            <Route path="/dashboard" element={<AuthGuard><RoleDashboardRouter /></AuthGuard>} />
          <Route path="/admin-dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />

          {/* ── Workflow-driven: Patient Journey ──────────────── */}
          <Route path="/register" element={<AuthGuard><QuickRegister /></AuthGuard>} />
          <Route path="/workspace" element={<AuthGuard><PatientWorkspace /></AuthGuard>} />
          <Route path="/workspace/:id" element={<AuthGuard><PatientWorkspace /></AuthGuard>} />

          {/* ── Clinical ──────────────────────────────────────── */}
          <Route path="/emr" element={<AuthGuard><EMR /></AuthGuard>} />
          <Route path="/opd" element={<AuthGuard><OPD /></AuthGuard>} />
          <Route path="/ipd" element={<AuthGuard><IPD /></AuthGuard>} />
          <Route path="/ot" element={<AuthGuard><OperatingTheater /></AuthGuard>} />
          <Route path="/emergency" element={<AuthGuard><Emergency /></AuthGuard>} />
          <Route path="/eprescribing" element={<AuthGuard><EPrescribing /></AuthGuard>} />
          <Route path="/bcma" element={<AuthGuard><BCMA /></AuthGuard>} />

          {/* ── Patient Admin ─────────────────────────────────── */}
          <Route path="/patients" element={<AuthGuard><Patients /></AuthGuard>} />
          <Route path="/patients/:id" element={<AuthGuard><PatientDetail /></AuthGuard>} />
          <Route path="/encounters" element={<AuthGuard><Encounters /></AuthGuard>} />
          <Route path="/appointments" element={<AuthGuard><Appointments /></AuthGuard>} />
          <Route path="/adt" element={<AuthGuard><ADT /></AuthGuard>} />
          <Route path="/beds" element={<AuthGuard><Beds /></AuthGuard>} />
          <Route path="/patient-portal" element={<AuthGuard><PatientPortal /></AuthGuard>} />
          <Route path="/telemedicine" element={<AuthGuard><Telemedicine /></AuthGuard>} />

          {/* ── Diagnostics ───────────────────────────────────── */}
          <Route path="/laboratory" element={<AuthGuard><Laboratory /></AuthGuard>} />
          <Route path="/radiology" element={<AuthGuard><Radiology /></AuthGuard>} />
          <Route path="/pharmacy" element={<AuthGuard><Pharmacy /></AuthGuard>} />

          {/* ── Financial ─────────────────────────────────────── */}
          <Route path="/billing" element={<AuthGuard><Billing /></AuthGuard>} />
          <Route path="/rcm" element={<AuthGuard><RCM /></AuthGuard>} />
          <Route path="/claims" element={<AuthGuard><Claims /></AuthGuard>} />
          <Route path="/payments" element={<AuthGuard><Payments /></AuthGuard>} />
          <Route path="/tpa-settlement" element={<AuthGuard><TPASettlement /></AuthGuard>} />

          {/* ── Operations ────────────────────────────────────── */}
          <Route path="/inventory" element={<AuthGuard><Inventory /></AuthGuard>} />
          <Route path="/assets" element={<AuthGuard><Assets /></AuthGuard>} />
          <Route path="/scheduling" element={<AuthGuard><Scheduling /></AuthGuard>} />
          <Route path="/physicians" element={<AuthGuard><Physicians /></AuthGuard>} />
          <Route path="/compliance" element={<AuthGuard><Compliance /></AuthGuard>} />
          <Route path="/documents" element={<AuthGuard><Documents /></AuthGuard>} />

          {/* ── Analytics ─────────────────────────────────────── */}
          <Route path="/analytics" element={<AuthGuard><Analytics /></AuthGuard>} />
          <Route path="/vitals" element={<AuthGuard><Vitals /></AuthGuard>} />

          {/* ── System ────────────────────────────────────────── */}
          <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
          <Route path="/settings/users" element={<AuthGuard><UserManagement /></AuthGuard>} />
          <Route path="/security" element={<AuthGuard><Security /></AuthGuard>} />
          <Route path="/abdm" element={<AuthGuard><ABDM /></AuthGuard>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
    </BrowserRouter>
  );
}
