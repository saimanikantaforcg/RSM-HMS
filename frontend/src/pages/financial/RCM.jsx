import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Target, Activity, CheckCircle, RefreshCcw, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import SkeletonTable from '../../components/SkeletonTable';
import ErrorState from '../../components/ErrorState';

export default function RCM() {
  const [pipeline, setPipeline] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ stage: 'Coding & Billing', patient: '', value: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPipeline = async () => {
    try {
      const res = await api.get('/rcm/pipeline');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) {
        setPipeline(payload);
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPipeline(); }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rcm/update', formData);
      toast.success('RCM Pipeline Updated');
      setIsModalOpen(false);
      setFormData({ stage: 'Coding & Billing', patient: '', value: '' });
      fetchPipeline();
    } catch {
      toast.error('Failed to update pipeline (API offline)');
      setIsModalOpen(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Revenue Cycle Management</h1>
          <p className="text-slate-500 text-sm mt-1">End-to-end tracking from pre-registration to final collection</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Update Pipeline Entry
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Pre-Reg Cleared', val: '92%', icon: <CheckCircle className="text-green-500" size={20}/> },
          { label: 'Uncoded Encounters', val: pipeline.filter(p=>p.stage==='Coding & Billing').length, icon: <Activity className="text-brand-500" size={20}/> },
          { label: 'Claim Denial Rate', val: '4.2%', icon: <Target className="text-red-500" size={20}/> },
          { label: 'Days in A/R', val: '31', icon: <RefreshCcw className="text-purple-500" size={20}/> }
        ].map((item, i) => (
          <div key={i} className="clinical-card p-5 items-center flex gap-4">
            <div className={`p-3 rounded-xl bg-slate-50`}>{item.icon}</div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{item.label}</p>
              <p className="text-2xl font-extrabold text-slate-800">{loading && item.label === 'Uncoded Encounters' ? '-' : item.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="clinical-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2">
          Pipeline Active Entries
        </div>
        
        {loading ? (
          <SkeletonTable columns={6} />
        ) : error ? (
          <ErrorState onRetry={fetchPipeline} />
        ) : pipeline.length === 0 ? (
          <EmptyState title="No Pipeline Entries" message="The revenue cycle pipeline is currently clear." />
        ) : (
          <div className="table-responsive-wrapper">
            <table className="w-full text-left">
          <thead><tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
            {['ID','Lifecycle Stage','Patient','Value','Status','Last Updated'].map(h=><th key={h} className="px-6 py-3">{h}</th>)}
          </tr></thead>
          <tbody>{pipeline.map(p => (
            <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{p.id}</td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-800">{p.stage}</td>
              <td className="px-6 py-4 text-slate-600 font-medium">{p.patient}</td>
              <td className="px-6 py-4 text-brand-600 font-bold">{p.value}</td>
              <td className="px-6 py-4"><span className={`px-2.5 py-1 text-xs font-bold rounded-full ${p.status === 'Cleared' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{p.status}</span></td>
              <td className="px-6 py-4 text-slate-500 text-sm">{p.date}</td>
            </tr>
          ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-lg text-slate-800">Update RCM Pipeline</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patient Account</label>
                <input required autoFocus type="text" value={formData.patient} onChange={e => setFormData({...formData, patient: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lifecycle Stage</label>
                  <select value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 outline-none transition-all bg-white">
                    {['Pre-Registration', 'Coding & Billing', 'Claim Submission', 'Payment Posting'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Value ($)</label>
                  <input required type="number" step="0.01" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 outline-none transition-all" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
