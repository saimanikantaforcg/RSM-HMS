import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FlaskConical, AlertCircle, Clock, ChevronRight,
  Stethoscope, Calendar, UserPlus, Activity
} from 'lucide-react';
import Layout from '../../components/Layout';
import { api, getCurrentUser } from '../../lib/api';
import PredictiveInsights from '../../components/clinical/PredictiveInsights';
import SkeletonTable from '../../components/SkeletonTable';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, appointments: 0, queue: 0 });
  const [queue, setQueue] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then(u => setUser(u));

    // 🏥 Parallel Data Fetching for Clinical Intelligence
    const fetchData = async () => {
      try {
        // 1. Patient Count
        const pRes = await api.get('/patients?page=1&limit=1');
        const pData = await pRes.json();
        const total = pData?.data?.meta?.total ?? pData?.meta?.total ?? 0;
        
        // 2. Encounters (Queue)
        const eRes = await api.get('/encounters?limit=50');
        const eData = await eRes.json();
        const eList = eData?.data?.data || eData?.data || [];
        const activeQueue = eList.filter(e => e.status === 'Planned' || e.status === 'InProgress');
        
        // 3. Lab Results (LIS)
        const lRes = await api.get('/lab-orders');
        const lData = await lRes.json();
        const lList = (lData?.data ?? lData ?? []).slice(0, 4);

        // 4. Appointments
        const today = new Date().toISOString().split('T')[0];
        const aRes = await api.get(`/appointments?date=${today}`);
        const aData = await aRes.json();
        const aList = aData?.data ?? aData ?? [];

        setStats({
          total,
          queue: activeQueue.length,
          appointments: Array.isArray(aList) ? aList.length : 0
        });
        setQueue(activeQueue);
        setResults(lList);
      } catch (err) {
        console.error('Dashboard data fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name?.split(' ').slice(0, 2).join(' ') ?? 'Doctor';

  return (
    <Layout>
      {/* 🏥 Header & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-2 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {greeting}, <span className="text-brand-600">{firstName}</span> 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> 
            Clinical Dashboard • {stats.queue} patients waiting
          </p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => navigate('/appointments')} className="btn-secondary transition-all hover:shadow-md">
            <Calendar size={16} /> Schedule
          </button>
          <button onClick={() => navigate('/patients')} className="btn-primary shadow-brand transition-all hover:-translate-y-0.5">
            <Users size={16} /> My Patients
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 🏥 Primary content column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 📊 High-Level Metrics */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'OPD Queue', val: stats.queue, icon: <Clock size={20}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Confirmed Appts', val: stats.appointments, icon: <Calendar size={20}/>, color: 'text-brand-600', bg: 'bg-brand-50' },
              { label: 'Unread Results', val: results.length, icon: <FlaskConical size={20}/>, color: 'text-purple-600', bg: 'bg-purple-50' }
            ].map(s => (
              <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                <div className={`${s.bg} ${s.color} h-11 w-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {s.icon}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{loading ? '—' : s.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 🏥 Live Patient Queue Table */}
          <div className="clinical-card overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Activity size={16} /></div>
                <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Live Patient Queue</h2>
              </div>
              <button 
                onClick={() => navigate('/opd')} 
                className="text-[10px] font-bold text-brand-600 hover:underline uppercase tracking-widest"
              >
                View Full Queue
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-4"><SkeletonTable rows={3} cols={4} /></div>
              ) : queue.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users size={20} className="text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">Your queue is currently empty.</p>
                </div>
              ) : queue.map((p, idx) => (
                <div 
                  key={idx} 
                  className="p-5 hover:bg-slate-50/80 transition-all flex items-center justify-between group cursor-pointer"
                  onClick={() => navigate(`/workspace/${p.patientId}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-sm font-black shadow-sm group-hover:scale-105 transition-transform">
                      {p.patientName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 tracking-tight">{p.patientName}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] font-bold text-slate-400 font-mono flex items-center gap-1">
                          <Clock size={10} /> {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[11px] font-bold text-brand-500 uppercase flex items-center gap-1">
                          <Stethoscope size={10} /> {p.type || 'Consult'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                      p.priority === 'Emergency' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {p.priority || 'Routine'}
                    </span>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:text-brand-600 group-hover:shadow-sm transition-all">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 🏥 Sidebar & Insights column */}
        <div className="space-y-6">
          {/* 🧬 AI Insights Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Activity size={14} className="text-brand-500" />
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical AI Insights</h2>
            </div>
            <PredictiveInsights type="los" data={{ predicted: 4.8, trend: 'up' }} />
            <PredictiveInsights type="readmission" data={{ risk: 24 }} />
          </div>

          {/* 🧪 Lab Results Feed */}
          <div className="clinical-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2 bg-purple-50/20">
              <FlaskConical size={14} className="text-purple-500" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Lab Telemetry</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {results.length === 0 && !loading ? (
                <div className="p-8 text-center text-slate-400 text-[10px] italic">No pending results found.</div>
              ) : results.map((r, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{r.patient}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{r.test}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${
                    r.status === 'Critical' ? 'bg-red-50 text-red-600 animate-pulse' : 
                    r.status === 'Verified' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-50/50 text-center border-t border-slate-100">
               <button onClick={() => navigate('/laboratory')} className="text-[10px] font-bold text-slate-400 hover:text-brand-600 uppercase tracking-widest transition-colors">
                Open Lab Monitor
               </button>
            </div>
          </div>

          {/* 🏥 Quick Actions */}
          <div className="clinical-card p-5 bg-gradient-to-br from-brand-600 to-brand-800 text-white border-none shadow-xl">
            <h3 className="text-sm font-bold mb-1">Clinic Assistant</h3>
            <p className="text-brand-100 text-[10px] font-medium leading-relaxed mb-4">
              Use voice dictation or the command bar to quickly record vitals or order new labs.
            </p>
            <button onClick={() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true })); }} className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold transition-all backdrop-blur-sm">
              Launch Assistant
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
