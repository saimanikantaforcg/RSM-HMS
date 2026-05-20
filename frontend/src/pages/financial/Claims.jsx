import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { ShieldAlert, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import SkeletonTable from '../../components/SkeletonTable';
import ErrorState from '../../components/ErrorState';

export default function Claims() {
  const [claims, setClaims] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ payer: 'BlueCross Shield', patient: '', amount: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const statusColor = { Approved: 'bg-green-100 text-green-700', Denied: 'bg-red-100 text-red-700', Submitted: 'bg-blue-100 text-blue-700', 'Pending Info': 'bg-yellow-100 text-yellow-800' };

  const fetchClaims = async () => {
    try {
      const res = await api.get('/claims/list');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) {
        setClaims(payload);
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/claims/submit', formData);
      toast.success('Claim Submitted Successfully');
      setIsModalOpen(false);
      setFormData({ payer: 'BlueCross Shield', patient: '', amount: '' });
      fetchClaims();
    } catch {
      toast.error('Failed to submit claim (API offline)', { id: 'claim-err' });
      setIsModalOpen(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Insurance Claims</h1>
          <p className="text-slate-500 text-sm mt-1">Manage claim submissions, adjudications and denials</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Process Claim
        </button>
      </div>

      <div className="clinical-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert size={18} className="text-brand-500" /> Active Claims Batch
        </div>
        
        {loading ? (
          <SkeletonTable columns={6} />
        ) : error ? (
          <ErrorState onRetry={fetchClaims} />
        ) : claims.length === 0 ? (
          <EmptyState title="No Active Claims" message="There are no claims queued for processing." />
        ) : (
          <div className="table-responsive-wrapper">
            <table className="w-full text-left">
          <thead><tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
            {['Claim ID', 'Payer', 'Patient', 'Amount', 'Submitted', 'Status'].map(h => <th key={h} className="px-6 py-3">{h}</th>)}
          </tr></thead>
          <tbody>{claims.map(c => (
            <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{c.id}</td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-800">{c.payer}</td>
              <td className="px-6 py-4 text-slate-600 font-medium">{c.patient}</td>
              <td className="px-6 py-4 text-brand-600 font-bold">{c.amount}</td>
              <td className="px-6 py-4 text-slate-500 text-sm">{c.submitted}</td>
              <td className="px-6 py-4"><span className={`px-2.5 py-1 text-xs font-bold rounded-full ${statusColor[c.status] || 'bg-slate-100'}`}>{c.status}</span></td>
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
              <h2 className="font-bold text-lg text-slate-800">Submit New Claim</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payer / Insurance</label>
                  <select value={formData.payer} onChange={e => setFormData({...formData, payer: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 outline-none transition-all bg-white">
                    {['BlueCross Shield', 'Aetna', 'UnitedHealth', 'Medicare', 'Medicaid'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Claim Amount ($)</label>
                  <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patient Name</label>
                <input required type="text" value={formData.patient} onChange={e => setFormData({...formData, patient: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 outline-none transition-all" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Process Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
