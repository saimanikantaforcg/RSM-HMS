import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, FlaskConical, CalendarCheck, TrendingUp, AlertCircle, Package, 
  FileWarning, Clock, UsersRound, BedDouble, Plus, Activity,
  UserPlus, FileText
} from 'lucide-react';
import Layout from '../components/Layout';
import { api, getCurrentUser } from '../lib/api';
import SkeletonTable, { SkeletonCard } from '../components/SkeletonTable';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [encounters, setEncounters] = useState([]);
  const [loadingEnc, setLoadingEnc] = useState(true);
  
  const [appointments, setAppointments] = useState([]);
  const [loadingApts, setLoadingApts] = useState(true);
  
  const [stats, setStats] = useState({ 
    patients: null, 
    appointments: null, 
    revenue: null,
    labs: null 
  });
  const [loadingStats, setLoadingStats] = useState(true);
  
  const [user, setUser] = useState(null);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    // Dynamic Time
    const updateTime = () => {
      setTimeStr(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);

    // Fetch User
    getCurrentUser().then(setUser);

    // Fetch Real Encounters
    api.get('/encounters?page=1&limit=6')
      .then(res => res.json())
      .then(d => setEncounters(d?.data?.data ?? d?.data ?? []))
      .catch(() => setEncounters([]))
      .finally(() => setLoadingEnc(false));

    // Fetch Real Appointments (Today)
    api.get('/appointments') // In a real app, query by date=today
      .then(res => res.json())
      .then(d => {
        const list = d?.data?.data ?? d?.data ?? d ?? [];
        setAppointments(Array.isArray(list) ? list.slice(0, 4) : []);
        setStats(s => ({ ...s, appointments: Array.isArray(list) ? list.length : 0 }));
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoadingApts(false));

    // Fetch KPI Data (parallel fetches from real endpoints)
    Promise.all([
      api.get('/patients?limit=1').then(r => r.json()).catch(() => ({})),
      api.get('/billing/stats').then(r => r.json()).catch(() => ({})),
      api.get('/lab-orders').then(r => r.json()).catch(() => ({}))
    ]).then(([patRes, billingRes, labRes]) => {
      const billingData = billingRes?.data ?? billingRes ?? {};
      const labData = labRes?.data?.data ?? labRes?.data ?? labRes ?? [];
      const pendingLabCount = Array.isArray(labData)
        ? labData.filter(o => o.status === 'Pending' || o.status === 'In Process').length
        : 0;
      setStats(s => ({
        ...s,
        patients: patRes?.data?.meta?.total ?? patRes?.meta?.total ?? 0,
        revenue: billingData.collectedAmount != null
          ? `$${Number(billingData.collectedAmount).toLocaleString()}`
          : '—',
        labs: pendingLabCount,
      }));
      setLoadingStats(false);
    }).catch(() => setLoadingStats(false));

    return () => clearInterval(interval);
  }, []);

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFirstName = () => {
    if (!user?.name) return 'Clinician';
    return user.name.split(' ')[0];
  };

  const statusBadge = {
    InProgress: 'badge-warning',
    Planned: 'badge-brand',
    Discharged: 'badge-neutral',
    Arrived: 'badge-success',
    Cancelled: 'badge-danger',
  };

  return (
    <Layout>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="page-header animate-fade-in">
        <div>
          <h1 className="page-title">
            {greeting()}, <span className="text-brand-600">{getFirstName()}</span>
          </h1>
          <p className="page-subtitle flex items-center gap-2">
            <span className="status-pulse"><span className="status-pulse-dot" /><span className="status-pulse-inner" /></span>
            Hospital Command Center • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • {timeStr}
          </p>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────── */}
      {loadingStats ? (
        <div className="mb-8"><SkeletonCard count={4} /></div>
      ) : (
        <div className="responsive-grid lg:grid-cols-4 mb-8">
          <div onClick={() => navigate('/patients')} className="kpi-card group">
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform"><UsersRound size={20} /></div>
              <span className="badge badge-success">+4.2%</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Patients</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.patients ?? '—'}</p>
          </div>

          <div onClick={() => navigate('/appointments')} className="kpi-card group">
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><CalendarCheck size={20} /></div>
              <span className="badge badge-success">+12%</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Today's Visits</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.appointments ?? '—'}</p>
          </div>

          <div onClick={() => navigate('/billing')} className="kpi-card group">
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform"><TrendingUp size={20} /></div>
              <span className="badge badge-success">+8.1%</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Est. Revenue</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.revenue ?? '—'}</p>
          </div>

          <div onClick={() => navigate('/laboratory')} className="kpi-card group">
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform"><FlaskConical size={20} /></div>
              <span className="badge badge-warning">-2%</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Labs</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{stats.labs ?? '—'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        
        {/* ── Left Column (2/3) ─────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Quick Actions Bar */}
          <div className="clinical-card p-2 flex flex-wrap gap-2 shadow-soft border-brand-100/50 hover:border-brand-200 transition-colors">
            <button onClick={() => navigate('/register')} className="flex-1 btn-ghost py-4 group">
              <UserPlus size={20} className="text-brand-600 group-hover:scale-110 transition-transform"/> 
              <div className="text-left ml-3">
                <p className="text-[13px] font-bold text-slate-800 leading-none">Register</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">New Patient</p>
              </div>
            </button>
            <div className="w-[1px] bg-slate-100 my-3" />
            <button onClick={() => navigate('/emr')} className="flex-1 btn-ghost py-4 group">
              <FileText size={20} className="text-purple-600 group-hover:scale-110 transition-transform"/> 
              <div className="text-left ml-3">
                <p className="text-[13px] font-bold text-slate-800 leading-none">Sign Note</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">EMR / EHR</p>
              </div>
            </button>
            <div className="w-[1px] bg-slate-100 my-3" />
            <button onClick={() => navigate('/laboratory')} className="flex-1 btn-ghost py-4 group">
              <FlaskConical size={20} className="text-blue-600 group-hover:scale-110 transition-transform"/> 
              <div className="text-left ml-3">
                <p className="text-[13px] font-bold text-slate-800 leading-none">Order Test</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Diagnostics</p>
              </div>
            </button>
            <div className="w-[1px] bg-slate-100 my-3" />
            <button onClick={() => navigate('/billing')} className="flex-1 btn-ghost py-4 group">
              <TrendingUp size={20} className="text-emerald-600 group-hover:scale-110 transition-transform"/> 
              <div className="text-left ml-3">
                <p className="text-[13px] font-bold text-slate-800 leading-none">Create Bill</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Financial</p>
              </div>
            </button>
          </div>

          {/* Today's Appointments Timeline */}
          <div className="clinical-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title !mb-0 text-base">Today's Schedule</h2>
              <button onClick={() => navigate('/appointments')} className="text-brand-600 text-xs font-bold hover:underline">View Calendar</button>
            </div>
            
            {loadingApts ? (
              <SkeletonTable rows={3} cols={3} />
            ) : appointments.length === 0 ? (
              <div className="empty-state py-8">
                <CalendarCheck size={32} className="text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-500">No appointments scheduled today.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer" onClick={() => navigate('/appointments')}>
                    <div className="w-20 text-right shrink-0">
                      <p className="font-bold text-slate-800">{apt.time?.split(' ')[0] || '10:00'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{apt.time?.split(' ')[1] || 'AM'}</p>
                    </div>
                    <div className="w-1 h-10 bg-brand-200 rounded-full shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">{apt.patient}</p>
                      <p className="text-xs text-slate-500 font-medium">{apt.type} • {apt.provider}</p>
                    </div>
                    <div className="ml-auto">
                      <span className={`badge ${apt.status?.includes('Wait') ? 'badge-warning' : 'badge-neutral'}`}>{apt.status || 'Scheduled'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column (1/3) ────────────────────────────────── */}
        <div className="space-y-6">
          {/* Alerts Panel */}
          <div className="clinical-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <AlertCircle size={18} className="text-rose-500" />
              <h2 className="font-bold text-slate-800">Critical Alerts</h2>
            </div>
            <div className="space-y-3">
              <AlertItem icon={<Package size={14} />} color="warning" title="Supply Warning" desc="5 inventory items below threshold" />
              <AlertItem icon={<FileWarning size={14} />} color="danger" title="Claim Rejections" desc="12 claims require immediate action" />
              <AlertItem icon={<Clock size={14} />} color="info" title="OT Schedule" desc="Operation Theater 2 booked for 14:00" />
              <AlertItem icon={<FlaskConical size={14} />} color="brand" title="Stat Labs" desc="3 STAT results ready for review" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Recent Activity ─────────────────────── */}
      <div className="clinical-card p-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Recent Network Encounters</h2>
          <button onClick={() => navigate('/encounters')} className="btn-ghost !py-1.5 !px-3 text-xs">View All</button>
        </div>
        
        <div className="table-responsive-wrapper">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Encounter Type</th>
                <th>Provider</th>
                <th>Arrival Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingEnc ? (
                <tr><td colSpan={5} className="p-0 border-0"><SkeletonTable rows={5} cols={5}/></td></tr>
              ) : encounters.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state py-12">
                      <div className="empty-state-icon"><Activity size={24} className="text-slate-400" /></div>
                      <p className="text-sm font-semibold text-slate-600">No recent encounters found.</p>
                      <p className="text-xs text-slate-400 mt-1">Encounters will appear here as patients are registered.</p>
                    </div>
                  </td>
                </tr>
              ) : encounters.map(enc => (
                <tr key={enc.id} className="cursor-pointer group" onClick={() => navigate('/encounters')}>
                  <td className="font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">{enc.patientName ?? enc.patient_name ?? '—'}</td>
                  <td><span className="badge badge-brand">{enc.type ?? '—'}</span></td>
                  <td className="text-slate-500 font-medium">{enc.practitionerName ?? enc.practitioner ?? '—'}</td>
                  <td className="text-slate-400 font-medium text-[12px]">{enc.admissionDate ? new Date(enc.admissionDate).toLocaleString() : '—'}</td>
                  <td>
                    <span className={`badge ${statusBadge[enc.status] ?? 'badge-neutral'}`}>
                      {enc.status ?? '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

function AlertItem({ icon, color, title, desc }) {
  const colorMap = {
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
    info: 'bg-sky-50 text-sky-600',
    brand: 'bg-teal-50 text-teal-600',
  };
  const c = colorMap[color] ?? colorMap.brand;
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
      <div className={`h-8 w-8 rounded-lg ${c} flex items-center justify-center flex-shrink-0 shadow-sm`}>{icon}</div>
      <div>
        <p className="text-[13px] font-bold text-slate-800">{title}</p>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
