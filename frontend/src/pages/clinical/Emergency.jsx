import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  AlertTriangle, FastForward, Clock, Plus, X, 
  Activity, ShieldAlert, ChevronRight, User, Timer
} from 'lucide-react';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

const triageSchema = z.object({
  patient: z.string().min(2, 'Patient name / identifier is required'),
  level: z.enum(['1 - Resuscitation', '2 - Emergent', '3 - Urgent', '4 - Less Urgent', '5 - Non-Urgent']),
  condition: z.string().min(2, 'Primary complaint is required'),
  notes: z.string().optional(),
});

export default function Emergency() {
  const [cases, setCases] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [_loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(triageSchema),
    defaultValues: { patient: '', level: '1 - Resuscitation', condition: '', notes: '' },
  });

  const openModal = () => { reset(); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const es = new EventSource(`${API_BASE}/er/stream`, { withCredentials: true });

    // Load initial snapshot via REST (SSE pushes deltas after triage)
    api.get('/er/cases').then(async (res) => {
      if (res.ok) {
        const json = await res.json();
        setCases(json?.data ?? json ?? []);
      }
    }).catch(console.error).finally(() => setLoading(false));

    // SSE: receive each new triage case as it's created
    es.onmessage = (e) => {
      try {
        const newCase = JSON.parse(e.data);
        setCases((prev) => [newCase, ...prev.filter(c => c.id !== newCase.id)]);
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      // Connection closed or server unavailable — fall back to polling disabled
      es.close();
    };

    return () => es.close();
  }, []);

  const handleTriageSubmit = async (data) => {
    try {
      const res = await api.post('/er/triage', data);
      if (res.ok) {
        toast.success('Trauma Team Alerted');
        closeModal();
        // SSE stream will deliver the new case automatically
      }
    } catch {
      toast.error('Failed to triage case');
    }
  };

  const getAcuityStyle = (level) => {
    const l = level.charAt(0);
    if (l === '1') return 'bg-red-600 text-white animate-pulse shadow-sm shadow-red-500/50';
    if (l === '2') return 'bg-orange-500 text-white';
    if (l === '3') return 'bg-amber-400 text-slate-900';
    if (l === '4') return 'bg-blue-400 text-white';
    return 'bg-emerald-500 text-white';
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Emergency & Triage Command</h1>
          <p className="text-sm text-slate-500 mt-0.5">ESI-Based High-Acuity Tracking</p>
        </div>
        <button 
          onClick={openModal} 
          className="btn-primary bg-red-600 hover:bg-red-700 text-white border-red-600"
        >
          <Plus size={16} /> Triage New Case
        </button>
      </div>

      {/* ER Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Code Red (Level 1)', val: cases.filter(c=>c.level.startsWith('1')).length, icon: <ShieldAlert className="text-red-500" />, bg: 'bg-red-50' },
          { label: 'Awaiting Doc', val: '14 min', icon: <FastForward className="text-orange-500" />, bg: 'bg-orange-50' },
          { label: 'ER Occupancy', val: '82%', icon: <Activity className="text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'Triage Queue', val: 5, icon: <Clock className="text-slate-500" />, bg: 'bg-slate-50' },
        ].map(s => (
          <div key={s.label} className={`card p-4 border-none ${s.bg} flex items-center gap-3`}>
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">{s.icon}</div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none mb-1">{s.val}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trauma Queue */}
      <div className="card overflow-hidden">
        <div className="card-header bg-slate-900 border-none">
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest">Active Trauma Queue</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Acuity', 'Patient / Case', 'Location', 'Elapsed', 'Arrival', ''].map(h => (
                  <th key={h} className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.sort((a,b) => a.level.charAt(0) - b.level.charAt(0)).map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${getAcuityStyle(c.level)}`}>
                      ESI {c.level}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                         <User size={18} />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-slate-800">{c.patient}</p>
                         <p className="text-[11px] text-slate-500 font-medium">{c.condition}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-bold text-xs text-slate-600">{c.status}</td>
                  <td className="px-6 py-5">
                    <div className={`flex items-center gap-1.5 font-mono text-xs font-bold ${c.level.startsWith('1') ? 'text-red-600' : 'text-slate-600'}`}>
                      <Timer size={14} className={c.level.startsWith('1') ? 'animate-pulse' : ''} />
                      {c.elapsed}m
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-400 font-medium">{c.arrival}</td>
                  <td className="px-6 py-5 text-right">
                    <button className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm flex items-center justify-center text-slate-400 hover:text-red-600 transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in border border-slate-200">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center text-red-600 bg-red-50/30">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} />
                <h2 className="font-bold text-lg text-slate-800 tracking-tight">Rapid Triage Entry</h2>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form className="p-8 space-y-5" onSubmit={handleSubmit(handleTriageSubmit)}>
               <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Patient Name / Identifier*</label>
                    <input 
                      autoFocus 
                      placeholder="e.g. Unknown Male approx 40s" 
                      className="input bg-white" 
                      {...register('patient')}
                    />
                    {errors.patient && <p className="mt-1 text-xs text-rose-500">{errors.patient.message}</p>}
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Acuity Level (ESI)*</label>
                    <select 
                      className="input bg-white font-bold text-red-600"
                      {...register('level')}
                    >
                       <option value="1 - Resuscitation">Level 1 - Resuscitation</option>
                       <option value="2 - Emergent">Level 2 - Emergent</option>
                       <option value="3 - Urgent">Level 3 - Urgent</option>
                       <option value="4 - Less Urgent">Level 4 - Less Urgent</option>
                       <option value="5 - Non-Urgent">Level 5 - Non-Urgent</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Primary Complaint*</label>
                    <input 
                      placeholder="e.g. Chest pain, GS injury" 
                      className="input bg-white" 
                      {...register('condition')}
                    />
                    {errors.condition && <p className="mt-1 text-xs text-rose-500">{errors.condition.message}</p>}
                 </div>
               </div>
               
               <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Quick Assessment Notes</label>
                  <textarea 
                    rows="3" 
                    placeholder="Vitals: BP 90/60, HR 120..." 
                    className="input bg-white resize-none"
                    {...register('notes')}
                  ></textarea>
               </div>

               <div className="pt-2 flex gap-3">
                 <button type="button" onClick={closeModal} className="btn-secondary flex-1 justify-center py-3">Cancel</button>
                 <button type="submit" disabled={isSubmitting} className="btn-primary bg-red-600 hover:bg-red-700 text-white border-red-600 flex-1 justify-center py-3 group disabled:opacity-50">
                   <ShieldAlert size={16} className="group-hover:animate-pulse" />
                   Submit & Alert Team
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
