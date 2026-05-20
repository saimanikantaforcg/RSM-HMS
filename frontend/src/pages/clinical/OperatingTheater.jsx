import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Stethoscope, Clock, ShieldCheck, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import SkeletonTable from '../../components/SkeletonTable';
import ErrorState from '../../components/ErrorState';
import useAuthStore from '../../store/authStore';

export default function OperatingTheater() {
  const [surgeries, setSurgeries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = useAuthStore(s => s.user);
  const surgeonName = user?.name || 'Assigned Staff';
  const [formData, setFormData] = useState({ patient: '', procedure: '', time: '10:00 AM', room: 'OR-02', surgeon: surgeonName });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchSurgeries = async () => {
    try {
      const res = await api.get('/ot/surgeries');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) {
        setSurgeries(payload);
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSurgeries(); }, []);

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ot/schedule', formData);
      toast.success('Surgery Block Scheduled');
      setIsModalOpen(false);
      setFormData({ patient: '', procedure: '', time: '10:00 AM', room: 'OR-02', surgeon: surgeonName });
      fetchSurgeries();
    } catch {
      toast.error('Failed to schedule block (API Offline)');
      setIsModalOpen(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Operating Theater (OT)</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/> Schedule Surgery block</button>
      </div>

      <div className="responsive-grid mb-7">
        <div className="clinical-card p-5"><p className="text-[10px] font-bold text-slate-500 uppercase">Available ORs</p><p className="text-3xl font-extrabold text-slate-800">4 / 6</p></div>
        <div className="clinical-card p-5"><p className="text-[10px] font-bold text-slate-500 uppercase">Surgeries Today</p><p className="text-3xl font-extrabold text-brand-600">{loading ? '-' : surgeries.length}</p></div>
        <div className="clinical-card p-5"><p className="text-[10px] font-bold text-slate-500 uppercase">Cancellations</p><p className="text-3xl font-extrabold text-red-500">0</p></div>
        <div className="clinical-card p-5"><p className="text-[10px] font-bold text-slate-500 uppercase">Avg Turnaround</p><p className="text-3xl font-extrabold text-purple-600">22m</p></div>
      </div>

      <div className="clinical-card overflow-hidden">
        {loading ? (
          <SkeletonTable columns={6} />
        ) : error ? (
          <ErrorState onRetry={fetchSurgeries} />
        ) : surgeries.length === 0 ? (
          <EmptyState title="No Surgeries Scheduled" message="The OR tracker is currently completely clear." />
        ) : (
          <div className="table-responsive-wrapper">
            <table className="w-full text-left">
          <thead><tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
            {['Block ID', 'Time / Room', 'Patient & Procedure', 'Surgeon', 'Status', 'Clearance'].map(h => <th key={h} className="px-6 py-4">{h}</th>)}
          </tr></thead>
          <tbody>{surgeries.map(s => (
            <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
              <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{s.id}</td>
              <td className="px-6 py-4"><div className="flex items-center gap-2 font-bold text-slate-800"><Clock size={14} className="text-brand-500"/> {s.time} <span className="text-slate-400 px-2">•</span> {s.room}</div></td>
              <td className="px-6 py-4">
                <p className="font-bold text-slate-800">{s.patient}</p>
                <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate">{s.procedure}</p>
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-600">{s.surgeon}</td>
              <td className="px-6 py-4"><span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-lg text-xs border border-blue-200">{s.status}</span></td>
              <td className="px-6 py-4"><div className="flex items-center gap-1 text-green-600 font-bold text-xs"><ShieldCheck size={14}/> PRE-OP Cleared</div></td>
            </tr>
          ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-in fade-in">
            <div className="px-6 py-4 border-b flex justify-between items-center"><h2 className="font-bold flex items-center gap-2"><Stethoscope size={20} className="text-brand-600"/> Schedule Surgery</h2><button onClick={() => setIsModalOpen(false)}><X size={20}/></button></div>
            <form onSubmit={handleSchedule} className="p-6 space-y-4">
              <input required type="text" value={formData.patient} onChange={e=>setFormData({...formData, patient: e.target.value})} placeholder="Patient Name" className="w-full px-4 py-2 border rounded-xl" />
              <input required type="text" value={formData.procedure} onChange={e=>setFormData({...formData, procedure: e.target.value})} placeholder="Procedure Name (e.g. Appendectomy)" className="w-full px-4 py-2 border rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <input required type="time" value={formData.time} onChange={e=>setFormData({...formData, time: e.target.value})} className="w-full px-4 py-2 border rounded-xl" />
                <select value={formData.room} onChange={e=>setFormData({...formData, room: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white"><option>OR-01</option><option>OR-02</option><option>OR-03 (Trauma)</option></select>
              </div>
              <input required type="text" value={formData.surgeon} onChange={e=>setFormData({...formData, surgeon: e.target.value})} placeholder="Lead Surgeon" className="w-full px-4 py-2 border rounded-xl" />
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Confirm OR Block</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
