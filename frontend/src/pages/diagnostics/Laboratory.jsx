import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { 
  FlaskConical, Plus, X, 
  Microscope, Timer, CheckCircle2, AlertCircle, User, ClipboardCheck, Search, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import SkeletonTable from '../../components/SkeletonTable';

export default function Laboratory() {
  const [orders, setOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resultModal, setResultModal] = useState(null); // { id, patient, test }
  const [resultForm, setResultForm] = useState({ resultValue: '', resultUnit: '', resultInterpretation: 'Normal', resultedBy: '' });
  const [formData, setFormData] = useState({ patient: '', mrn: '', test: 'Complete Blood Count (CBC)', priority: 'Routine' });
  const [loading, setLoading] = useState(true);

  const statusStyle = { 
    Resulted: 'bg-emerald-50 text-emerald-700 border-emerald-100', 
    'In Process': 'bg-amber-50 text-amber-700 border-amber-100', 
    Collected: 'bg-blue-50 text-blue-700 border-blue-100', 
    Pending: 'bg-slate-50 text-slate-500 border-slate-100' 
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/lab-orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) setOrders(payload);
    } catch (err) {
      console.error('Laboratory fetch error:', err);
      toast.error('Unable to fetch diagnostic worklist. System may be offline.');
      setOrders([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/lab-orders', formData);
      if (!res.ok) throw new Error('Order submission failed');
      toast.success('Lab Test Ordered Successfully');
      setIsModalOpen(false);
      setFormData({ patient: '', mrn: '', test: 'Complete Blood Count (CBC)', priority: 'Routine' });
      fetchOrders();
    } catch (err) {
      console.error('Order error:', err);
      toast.error('Failed to submit clinical order. Please try again.');
    }
  };

  const handleResult = async (e) => {
    e.preventDefault();
    if (!resultModal) return;
    try {
      const res = await api.patch(`/lab-orders/${resultModal.id}/result`, resultForm);
      if (!res.ok) throw new Error('Result entry failed');
      toast.success('Lab result recorded');
      setResultModal(null);
      setResultForm({ resultValue: '', resultUnit: '', resultInterpretation: 'Normal', resultedBy: '' });
      fetchOrders();
    } catch (err) {
      console.error('Result error:', err);
      toast.error('Failed to save result. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-end mb-8 animate-fade-in">
        <div>
          <h1 className="premium-text text-3xl font-extrabold text-slate-900 tracking-tight">Laboratory Information System</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Diagnostic order tracking, specimen processing & results</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Filter by MRN or Order ID..." 
              className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/50 outline-none w-64 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="btn-premium px-6 bg-purple-600 hover:bg-purple-700 shadow-purple-600/10"
          >
            <Plus size={16} /> Order Lab Test
          </button>
        </div>
      </div>

      {/* 🏥 KPI Section */}
      <div className="grid responsive-grid mb-8">
        {[
          { label: 'Active Orders', value: orders.length, icon: <Microscope size={18} />, color: 'text-purple-600' },
          { label: 'Pending Results', value: orders.filter(o => o.status === 'Pending' || o.status === 'In Process').length, icon: <Timer size={18} />, color: 'text-amber-600' },
          { label: 'Completed (Total)', value: orders.filter(o => o.status === 'Resulted').length, icon: <CheckCircle2 size={18} />, color: 'text-emerald-600' },
          { label: 'Critical Values', value: '0', icon: <AlertCircle size={18} />, color: 'text-rose-600' }
        ].map((kpi, idx) => (
          <div key={idx} className="clinical-card p-6 flex items-start justify-between group">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">{kpi.label}</p>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{loading ? '...' : kpi.value}</p>
            </div>
            <div className={`p-3 rounded-2xl bg-slate-50 ${kpi.color} group-hover:bg-slate-100 transition-colors`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 🏥 Lab Orders Table */}
      <div className="clinical-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <FlaskConical size={18} className="text-purple-600" /> 
            <span>Diagnostic Worklist</span>
          </div>
          <div className="flex gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter: All Departments</span>
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="clinical-table min-w-[1000px] sm:min-w-full">
            <thead>
              <tr>
                {['Order ID', 'Patient Identity', 'MRN', 'Diagnostic Test', 'Ordered By', 'Timestamp', 'Priority', 'Status', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-0 border-0"><SkeletonTable rows={5} cols={9}/></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center text-slate-500">No orders found</td></tr>
              ) : orders.map(t => (
                <tr key={t.id} className="group transition-all">
                  <td className="font-bold text-purple-700 font-mono text-xs italic">{t.id}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                        <User size={14} />
                      </div>
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        {t.patient}
                        <ShieldCheck size={12} className="text-emerald-500 fill-emerald-500/10" />
                      </span>
                    </div>
                  </td>
                  <td className="font-bold text-slate-400 font-mono text-xs">{t.mrn}</td>
                  <td className="font-semibold text-slate-700 underline decoration-purple-100 underline-offset-4 decoration-2">{t.test}</td>
                  <td className="text-slate-600 font-medium">{t.ordered}</td>
                  <td className="text-slate-500 text-xs font-bold">{t.time}</td>
                  <td>
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-tight ${
                      t.priority === 'STAT' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-100 shadow-sm animate-pulse' 
                        : 'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-tight border ${statusStyle[t.status] || 'bg-slate-50'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    {(t.status === 'Pending' || t.status === 'In Process' || t.status === 'Collected') ? (
                      <button
                        onClick={() => { setResultModal({ id: t.id, patient: t.patient, test: t.test }); setResultForm({ resultValue: '', resultUnit: '', resultInterpretation: 'Normal', resultedBy: '' }); }}
                        title="Enter Result"
                        className="h-8 w-8 rounded-lg text-purple-500 hover:text-purple-700 hover:bg-purple-50 transition-all flex items-center justify-center"
                      >
                        <ClipboardCheck size={14} />
                      </button>
                    ) : (
                      <div className="h-8 w-8 rounded-lg text-slate-200 flex items-center justify-center">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🏥 Lab Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-lg overflow-hidden animate-scale-in border-purple-100/30">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-purple-50/10">
              <h2 className="premium-text font-bold text-xl text-slate-900 flex items-center gap-2">
                <FlaskConical size={20} className="text-purple-600" />
                New Diagnostic Order
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleOrder} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Patient Name</label>
                  <input 
                    required autoFocus type="text" 
                    value={formData.patient} 
                    onChange={e => setFormData({...formData, patient: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 outline-none transition-all font-medium" 
                    placeholder="e.g. Michael Lawson"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Medical Record # (MRN)</label>
                  <input 
                    type="text" 
                    value={formData.mrn} 
                    onChange={e => setFormData({...formData, mrn: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 outline-none transition-all font-medium font-mono text-sm" 
                    placeholder="MRN-XXXX"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Select Laboratory Test</label>
                <select 
                  value={formData.test} 
                  onChange={e => setFormData({...formData, test: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 outline-none transition-all font-medium appearance-none cursor-pointer bg-white"
                >
                  {['Complete Blood Count (CBC)', 'Basic Metabolic Panel (BMP)', 'Lipid Panel', 'Liver Function Test (LFT)', 'Hemoglobin A1c'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Order Priority</label>
                <div className="flex gap-4">
                  {['Routine', 'Urgent', 'STAT'].map(p => (
                    <label key={p} className={`flex-1 flex items-center justify-center py-3 rounded-2xl border cursor-pointer transition-all ${
                      formData.priority === p 
                        ? 'bg-purple-50 border-purple-300 text-purple-700 font-bold scale-[1.02]' 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}>
                      <input 
                        type="radio" className="hidden" 
                        name="priority" value={p} 
                        checked={formData.priority === p}
                        onChange={e => setFormData({...formData, priority: e.target.value})}
                      />
                      <span className="text-xs uppercase tracking-wider">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
                <button type="submit" className="btn-premium flex-1 justify-center py-3 bg-purple-600 hover:bg-purple-700">Submit Clinical Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Result Entry Modal ── */}
      {resultModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50/20">
              <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                <ClipboardCheck size={20} className="text-emerald-600" />
                Enter Lab Result
              </h2>
              <button onClick={() => setResultModal(null)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-xs text-slate-500"><span className="font-semibold text-slate-700">{resultModal.patient}</span> · {resultModal.test}</p>
            </div>
            <form onSubmit={handleResult} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Result Value</label>
                  <input
                    required autoFocus type="text"
                    value={resultForm.resultValue}
                    onChange={e => setResultForm({ ...resultForm, resultValue: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 outline-none font-mono font-bold text-sm"
                    placeholder="e.g. 5.4"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Unit</label>
                  <input
                    type="text"
                    value={resultForm.resultUnit}
                    onChange={e => setResultForm({ ...resultForm, resultUnit: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 outline-none font-medium text-sm"
                    placeholder="e.g. mmol/L"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Interpretation</label>
                <div className="flex gap-2">
                  {['Normal', 'High', 'Low', 'Critical'].map(v => (
                    <label key={v} className={`flex-1 flex items-center justify-center py-2 rounded-xl border cursor-pointer text-xs font-bold transition-all ${
                      resultForm.resultInterpretation === v
                        ? v === 'Critical' ? 'bg-rose-50 border-rose-400 text-rose-700'
                          : v === 'High' ? 'bg-amber-50 border-amber-400 text-amber-700'
                          : v === 'Low' ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}>
                      <input type="radio" className="hidden" name="interp" value={v} checked={resultForm.resultInterpretation === v} onChange={() => setResultForm({ ...resultForm, resultInterpretation: v })} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Resulted By</label>
                <input
                  type="text"
                  value={resultForm.resultedBy}
                  onChange={e => setResultForm({ ...resultForm, resultedBy: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 outline-none font-medium text-sm"
                  placeholder="Lab technician name"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setResultModal(null)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 size={15} /> Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
