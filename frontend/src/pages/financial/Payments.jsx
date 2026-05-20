import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { CreditCard, Wallet, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import SkeletonTable from '../../components/SkeletonTable';
import ErrorState from '../../components/ErrorState';

export default function Payments() {
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ ref: '', type: 'Credit Card', amount: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/payments/transactions');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) {
        setTransactions(payload);
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments/post', formData);
      toast.success(`Payment Posted via ${formData.type}`);
      setIsModalOpen(false);
      setFormData({ ref: '', type: 'Credit Card', amount: '' });
      fetchTransactions();
    } catch {
      toast.error('Failed to post payment (API offline)', { id: 'pmt-err' });
      setIsModalOpen(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Payments Gateway</h1>
          <p className="text-slate-500 text-sm mt-1">Multi-channel payment processing via Credit Card, M-Pesa, MTN</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Post Payment
        </button>
      </div>

      <div className="clinical-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2">
          Payment Ledger
        </div>
        
        {loading ? (
          <SkeletonTable columns={6} />
        ) : error ? (
          <ErrorState onRetry={fetchTransactions} />
        ) : transactions.length === 0 ? (
          <EmptyState title="No Transactions" message="No payment records found." />
        ) : (
          <div className="table-responsive-wrapper">
            <table className="w-full text-left">
          <thead><tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
            {['Txn ID', 'Ref Invoice', 'Payment Method', 'Amount', 'Date', 'Status'].map(h => <th key={h} className="px-6 py-3">{h}</th>)}
          </tr></thead>
          <tbody>{transactions.map(t => (
            <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{t.id}</td>
              <td className="px-6 py-4 font-mono text-xs text-brand-600">{t.ref}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  {t.type.includes('Card') ? <CreditCard size={15} className="text-blue-500" /> : <Wallet size={15} className="text-green-500"/>}
                  {t.type}
                </div>
              </td>
              <td className="px-6 py-4 text-slate-800 font-bold">{t.amount}</td>
              <td className="px-6 py-4 text-slate-500 text-sm">{t.date}</td>
              <td className="px-6 py-4"><span className={`px-2.5 py-1 text-xs font-bold rounded-full ${t.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span></td>
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
              <h2 className="font-bold text-lg text-slate-800">Post New Payment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handlePost} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Invoice Reference</label>
                <input required autoFocus type="text" value={formData.ref} onChange={e => setFormData({...formData, ref: e.target.value})} placeholder="e.g. INV-40290" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Method</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 outline-none transition-all bg-white">
                    {['Credit Card', 'Cash', 'M-Pesa', 'MTN Mobile Money', 'Wire Transfer'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount Paid ($)</label>
                  <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 outline-none transition-all" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Process Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
