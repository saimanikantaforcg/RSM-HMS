import { useEffect, useState } from 'react';
import { getCurrentUser } from '../lib/api';
import DoctorDashboard from './dashboards/DoctorDashboard';
import NurseDashboard from './dashboards/NurseDashboard';
import ReceptionDashboard from './dashboards/ReceptionDashboard';
import BillingDashboard from './dashboards/BillingDashboard';
import Dashboard from './Dashboard'; // fallback

export default function RoleDashboardRouter() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    getCurrentUser().then(u => setRole(u?.role ?? 'hospital_admin'));
  }, []);

  if (!role) return null; // Loading — AuthGuard handles skeleton

  switch (role) {
    case 'doctor':       return <DoctorDashboard />;
    case 'nurse':        return <NurseDashboard />;
    case 'receptionist': return <ReceptionDashboard />;
    case 'billing_officer': return <BillingDashboard />;
    // Admin and all other roles → full enterprise dashboard
    default:             return <Dashboard />;
  }
}
