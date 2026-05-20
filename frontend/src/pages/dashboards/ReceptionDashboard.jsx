import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Clock, CheckCircle2, RefreshCcw, ChevronRight, Search, ArrowRight } from 'lucide-react';
import Layout from '../../components/Layout';
import { getCurrentUser } from '../../lib/api';

import PredictiveInsights from '../../components/clinical/PredictiveInsights';
import { api } from '../../lib/api';

export default function ReceptionDashboard() {
  const [_user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser().then(u => setUser(u));
    fetchEncounters();
  }, []);

  const fetchEncounters = async () => {
    try {
      const res = await api.get('/encounters?limit=50');
      if (res.ok) {
        const json = await res.json();
        setEncounters(json?.data?.data || json?.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch encounters', e);
    } finally {
      setLoading(false);
    }
  };

  const waitingList = encounters
    .filter(e => e.status === 'Planned')
    .map(e => ({ token: e.id.split('-')[0].toUpperCase(), name: e.patientName, time: new Date(e.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), dept: e.diagnosis, wait: 'Just now', status: e.status }));
  
  const inConsultList = encounters
    .filter(e => e.status === 'InProgress')
    .map(e => ({ token: e.id.split('-')[0].toUpperCase(), name: e.patientName, doctor: e.practitionerName || 'Assigned Dr.', dept: e.diagnosis, status: e.status }));

  const filtered = waitingList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.token.includes(search)
  );

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Front Desk — OPD Reception</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={() => navigate('/register')} className="btn-primary self-start">
          <UserPlus size={14} /> Register New Patient
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Currently Waiting', value: waitingList.length, icon: <Clock size={18} />, color: 'text-amber-600 bg-amber-50' },
          { label: 'In Consultation', value: inConsultList.length, icon: <Users size={18} />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Done Today', value: encounters.filter(e => e.status === 'Discharged').length, icon: <CheckCircle2 size={18} />, color: 'text-green-600 bg-green-50' },
          { label: 'Avg Wait Time', value: '14 min', icon: <RefreshCcw size={18} />, color: 'text-teal-600 bg-teal-50' },
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Waiting List */}
        <div className="xl:col-span-2 card">
          <div className="card-header flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-amber-500" />
              <h2 className="text-sm font-bold text-slate-800">Waiting Queue</h2>
              <span className="badge badge-amber">{filtered.length}</span>
            </div>
            <div className="relative flex-1 max-w-xs ml-auto">
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search patient or token..."
                className="input-sm pl-8"
              />
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
               <div className="py-12 text-center text-slate-400 text-sm">Loading today's queue...</div>
            ) : filtered.length === 0 ? (
               <div className="py-12 text-center text-slate-400 text-sm">No patients waiting</div>
            ) : filtered.map(p => (
              <div key={p.token} className="px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className="w-20 text-center flex-shrink-0">
                  <p className="text-xs font-bold font-mono text-teal-600">{p.token}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.time}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.dept} · Waiting {p.wait}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="btn-secondary text-xs">Reassign</button>
                  <button className="btn-primary text-xs">
                    Check In <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {/* AI Insights */}
          <div className="space-y-4">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">AI Dynamic Insights</h2>
            <PredictiveInsights type="wait-time" />
          </div>

          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-blue-500" />
                <h2 className="text-sm font-bold text-slate-800">In Consultation</h2>
                <span className="badge badge-blue">{inConsultList.length}</span>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {inConsultList.length === 0 ? (
                 <div className="py-6 text-center text-slate-400 text-xs">No active consultations</div>
              ) : inConsultList.map(p => (
                <div key={p.token} className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.doctor} · {p.dept}</p>
                  <p className="text-[11px] font-mono text-teal-600 mt-1">{p.token}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="space-y-2">
              {[
                { label: 'New Appointment', route: '/appointments' },
                { label: 'View All Patients', route: '/patients' },
                { label: 'Discharge Summary', route: '/ipd' },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.route)} className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors border border-slate-200">
                  {a.label} <ArrowRight size={13} className="text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
