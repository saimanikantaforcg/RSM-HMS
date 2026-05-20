import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Layout from '../../components/Layout';
import { 
  Clipboard, UserPlus, Clock, X, 
  Users, Activity, BarChart3, Stethoscope, ArrowRightLeft,
  ChevronRight, Search, FileText, Phone, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import SkeletonTable from '../../components/SkeletonTable';

const walkInSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  department: z.string().min(1, 'Department is required'),
  bloodGroup: z.string().optional(),
});

export default function OPD() {
  const [queue, setQueue] = useState([]);
  const [opdStats, setOpdStats] = useState({ avgWaitMin: null, seenToday: null, capacityPct: null });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(walkInSchema),
    defaultValues: { name: '', department: 'Cardiology', gender: 'male', dob: '1980-01-01', bloodGroup: 'O+' },
  });

  const openModal = () => { reset(); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);

  const fetchQueue = async () => {
    try {
      const [qRes, sRes] = await Promise.all([
        api.get('/opd/queue'),
        api.get('/opd/stats'),
      ]);
      if (!qRes.ok) throw new Error('Failed to fetch queue');
      const qJson = await qRes.json();
      const payload = qJson?.data ?? qJson;
      if (Array.isArray(payload)) setQueue(payload);
      else setQueue([]);

      if (sRes.ok) {
        const sJson = await sRes.json();
        const s = sJson?.data ?? sJson;
        setOpdStats({
          avgWaitMin: s.avgWaitMin ?? null,
          seenToday: s.seenToday ?? null,
          capacityPct: s.capacityPct ?? null,
        });
      }
    } catch (err) {
      console.error('Queue fetch error:', err);
      setQueue([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleRegister = async (data) => {
    try {
      const res = await api.post('/opd/register', data);
      if (!res.ok) throw new Error('Registration failed');
      toast.success('Patient Registered Successfully');
      closeModal();
      fetchQueue();
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('Failed to register walk-in. Please try again.');
    }
  };

  const filteredQueue = queue.filter(q => 
    q.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.token?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.dept?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="page-title">Outpatient Department</h1>
          <p className="page-subtitle mt-1">Real-time patient queue & consultation monitoring</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => toast('Schedule View coming soon!', { icon: '📅' })} 
            className="btn-secondary"
          >
            <Clock size={16} /> View Schedule
          </button>
          <button onClick={openModal} className="btn-primary">
            <UserPlus size={16} /> Register Walk-In
          </button>
        </div>
      </div>
      
      {/* 🏥 KPI Section */}
      <div className="grid responsive-grid mb-8">
        {[
          { label: 'Active Queue', value: queue.length, icon: <Users size={20} />, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Avg Wait Time', value: opdStats.avgWaitMin != null ? `${opdStats.avgWaitMin} min` : '—', icon: <Clock size={20} />, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Seen Today', value: opdStats.seenToday ?? '—', icon: <Activity size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Capacity', value: opdStats.capacityPct != null ? `${opdStats.capacityPct}%` : '—', icon: <BarChart3 size={20} />, color: 'text-rose-600', bg: 'bg-rose-50' }
        ].map((kpi, idx) => (
          <div key={idx} className="kpi-card group">
            <div className="flex items-start justify-between mb-4">
              <div className={`h-10 w-10 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {kpi.icon}
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{kpi.label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{loading ? '—' : kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-6 h-[600px]">
        {/* 🏥 Live Queue Table (Left) */}
        <div className={`clinical-card flex-1 flex flex-col transition-all duration-300 ${selectedPatient ? 'hidden lg:flex' : ''}`}>
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Clipboard size={16}/></div>
              <h2 className="font-bold text-slate-800 text-base">Live Queue</h2>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search patient or token..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-10 !py-2 !text-sm"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto rounded-b-2xl">
            <table className="clinical-table w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Department</th>
                  <th>Consultant</th>
                  <th>Wait</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-0 border-0"><SkeletonTable rows={6} cols={6}/></td></tr>
                ) : filteredQueue.map(q => (
                  <tr 
                    key={q.token} 
                    onClick={() => setSelectedPatient(q)}
                    className={`cursor-pointer transition-colors ${selectedPatient?.token === q.token ? 'bg-brand-50 hover:bg-brand-50/80 border-l-2 border-l-brand-500' : 'hover:bg-slate-50'}`}
                  >
                    <td><span className="font-mono text-sm font-bold text-brand-700 bg-white px-2 py-1 rounded border border-brand-100/50 shadow-sm">{q.token}</span></td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex flex-shrink-0 items-center justify-center text-[11px] font-bold text-slate-500">
                          {q.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-bold text-slate-800">{q.name}</span>
                      </div>
                    </td>
                    <td className="font-medium text-slate-600">{q.dept}</td>
                    <td className="text-slate-500 font-medium">{q.doctor}</td>
                    <td className="text-amber-600 font-bold text-xs">{q.wait}</td>
                    <td>
                      <span className={`badge ${q.status?.includes('Consult') ? 'badge-success' : 'badge-warning'}`}>
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && filteredQueue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="h-64">
                      <div className="empty-state">
                        <Users size={32} className="text-slate-300 mb-3" />
                        <p className="text-slate-500 font-semibold mb-1">Queue is empty</p>
                        <p className="text-slate-400 text-sm">No patients are waiting right now.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🏥 Slide-out Side Panel (Right) Phase 8D implementation */}
        {selectedPatient && (
          <div className="clinical-card w-full lg:w-[400px] flex-shrink-0 flex flex-col animate-slide-left border border-brand-100 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white relative">
              <button 
                onClick={() => setSelectedPatient(null)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-sm"
              >
                <X size={16} />
              </button>
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white text-brand-600 flex items-center justify-center text-xl font-bold uppercase shadow-sm mt-1">
                  {selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">{selectedPatient.name}</h2>
                  <div className="flex gap-2 text-brand-50 text-xs font-medium mb-3">
                    <span className="bg-white/20 px-2 py-1 rounded">MRN-{selectedPatient.token}</span>
                    <span className="bg-white/20 px-2 py-1 rounded">{selectedPatient.dept}</span>
                  </div>
                  <span className={`badge border-0 ${selectedPatient.status?.includes('Consult') ? 'bg-emerald-400/20 text-emerald-50' : 'bg-amber-400/20 text-amber-50'}`}>
                    {selectedPatient.status} • {selectedPatient.wait}
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Phone size={12}/> Contact</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPatient.phone ?? '—'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Calendar size={12}/> Last Visit</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPatient.lastVisit ?? '—'}</p>
                </div>
              </div>

              {/* Vitals Summary Container */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={14} className="text-brand-500"/> Recent Vitals</h3>
                {selectedPatient.vitals ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-slate-100 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-medium">BP</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">{selectedPatient.vitals.bp ?? '—'} <span className="text-xs text-slate-400 font-normal">mmHg</span></p>
                  </div>
                  <div className="border border-slate-100 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-medium">Heart Rate</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">{selectedPatient.vitals.hr ?? '—'} <span className="text-xs text-slate-400 font-normal">bpm</span></p>
                  </div>
                  <div className="border border-slate-100 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-medium">Temp</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">{selectedPatient.vitals.temp ?? '—'} <span className="text-xs text-slate-400 font-normal">°F</span></p>
                  </div>
                  <div className="border border-slate-100 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-medium">SpO2</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">{selectedPatient.vitals.spo2 ?? '—'} <span className="text-xs text-slate-400 font-normal">%</span></p>
                  </div>
                </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No vitals recorded yet.</p>
                )}
              </div>

              {/* Notes Context */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2"><FileText size={14} className="text-slate-400"/> Triage Note</h3>
                <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-4 text-sm text-slate-700 italic">
                  Patient presents with mild chest discomfort. Stable vitals. Assigned to {selectedPatient.dept} for routine evaluation.
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => toast.success(`Started consult for ${selectedPatient.name}`)}
                className="btn-primary flex-1 py-3 justify-center"
              >
                <Stethoscope size={18} /> Start Consult
              </button>
              <button 
                onClick={() => toast('Referral requested')}
                className="btn-secondary py-3 px-4" title="Refer/Transfer"
              >
                <ArrowRightLeft size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🏥 Registration Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800">New Registration</h2>
              <button onClick={closeModal} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleRegister)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                <input 
                  autoFocus type="text" 
                  {...register('name')}
                  className="input" placeholder="e.g. John Doe" 
                />
                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">DOB</label>
                  <input type="date" {...register('dob')} className="input" />
                  {errors.dob && <p className="mt-1 text-xs text-rose-500">{errors.dob.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Gender</label>
                  <select {...register('gender')} className="input">
                    <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Department Assigned</label>
                <select 
                  {...register('department')}
                  className="input"
                >
                  {['Cardiology', 'Endocrinology', 'Orthopedics', 'Pediatrics', 'General Medicine'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1 justify-center py-3">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center py-3 disabled:opacity-50">Register Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
