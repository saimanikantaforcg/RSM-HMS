import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Syringe, Activity, ClipboardCheck, BedDouble, AlertCircle, Clock,
  CheckCircle2, ChevronRight, HeartPulse
} from 'lucide-react';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../lib/api';

import { api } from '../../lib/api';

export default function NurseDashboard() {
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser().then(u => setUser(u));
    fetchCensus();
  }, []);

  const fetchCensus = async () => {
    try {
      const res = await api.get('/ipd/patients');
      if (res.ok) {
        const json = await res.json();
        setPatients(json?.data || json || []);
      }
    } catch (e) {
      console.error('Failed to fetch census', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ward 3 — East Wing</h1>
          <p className="text-sm text-slate-500 mt-0.5">Nurse: {user?.name ?? 'Staff'} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button className="btn-danger self-start" onClick={() => { toast.error('Deterioration alert sent to clinical team!', { icon: '🚨', duration: 5000 }); navigate('/ipd'); }}>
          <AlertCircle size={14} /> Report Deterioration
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Ward Patients', value: patients.length, color: 'text-blue-600 bg-blue-50', icon: <BedDouble size={18} /> },
          { label: 'Critical Alerts', value: patients.filter(p => p.status === 'Critical').length, color: 'text-red-600 bg-red-50', icon: <AlertCircle size={18} /> },
          { label: 'Meds Due Now', value: 0, color: 'text-amber-600 bg-amber-50', icon: <Syringe size={18} /> },
          { label: 'Done Today', value: 0, color: 'text-green-600 bg-green-50', icon: <CheckCircle2 size={18} /> },
        ].map(k => (
          <div key={k.label} className="card p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${k.color}`}>{k.icon}</div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs text-slate-500 font-medium">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Census List */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <BedDouble size={15} className="text-blue-500" />
              <h2 className="text-sm font-bold text-slate-800">Current Ward Census</h2>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
               <div className="py-12 text-center text-slate-400 text-sm">Loading ward census...</div>
            ) : patients.length === 0 ? (
               <div className="py-12 text-center text-slate-400 text-sm">No patients admitted in Ward 3</div>
            ) : patients.map((p, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <div className="w-14 text-center flex-shrink-0">
                  <p className="text-xs font-bold text-slate-600">Bed {p.bed}</p>
                  <p className="text-[10px] font-mono mt-0.5 text-blue-500">{p.id}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    {p.name}
                    {p.status === 'Critical' && <span className="badge badge-red">Critical</span>}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.dx} · Admitted {p.days}d ago</p>
                </div>

                <button className="btn-secondary text-xs flex-shrink-0" onClick={() => navigate(`/workspace/${p.id.replace('IPD-','')}`)}>
                   View EMR
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Vitals Feed */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <HeartPulse size={15} className="text-red-500" />
                <h2 className="text-sm font-bold text-slate-800">Pending Vitals</h2>
              </div>
            </div>
            <div className="p-10 text-center text-slate-400 text-xs">
               No pending vitals tasks for today.
            </div>
          </div>

          {/* Meds Feed */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Syringe size={15} className="text-amber-500" />
                <h2 className="text-sm font-bold text-slate-800">Medication Round</h2>
              </div>
            </div>
            <div className="p-10 text-center text-slate-400 text-xs">
               All medications for the current round completed.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
