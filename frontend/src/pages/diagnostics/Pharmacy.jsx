import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { 
  Pill, Plus, X, 
  Activity, Package, History, User, Search, ArrowRight, ClipboardCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import SkeletonTable from '../../components/SkeletonTable';

export default function Pharmacy() {
  const [dispenses, setDispenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ patient: '', drug: 'Paracetamol 500mg', qty: '10 tabs' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredDispenses = dispenses.filter(d =>
    !searchTerm ||
    d.patient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.drug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.rx?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchDispenses = async () => {
    try {
      const res = await api.get('/pharmacy/dispenses');
      if (!res.ok) throw new Error('Failed to fetch dispenses');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) setDispenses(payload);
    } catch (err) {
      console.error('Pharmacy fetch error:', err);
      toast.error('Unable to fetch dispensing log. System may be offline.');
      setDispenses([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDispenses(); }, []);

  const handleDispense = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/pharmacy/dispense', formData);
      if (!res.ok) throw new Error('Dispense failed');
      toast.success('Medication Dispensed Successfully');
      setIsModalOpen(false);
      setFormData({ patient: '', drug: 'Paracetamol 500mg', qty: '10 tabs' });
      fetchDispenses();
    } catch (err) {
      console.error('Dispense error:', err);
      toast.error('Failed to dispense medication. Please check stock levels.');
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-end mb-8 animate-fade-in">
        <div>
          <h1 className="premium-text text-3xl font-extrabold text-slate-900 tracking-tight">Pharmacy Management</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Dispensing workflow, inventory tracking & fulfillment</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search Rx Number..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/50 outline-none w-64 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="btn-premium"
          >
            <Plus size={16} /> Dispense Medication
          </button>
        </div>
      </div>

      {/* 🏥 KPI Section */}
      <div className="grid responsive-grid mb-8">
        {[
          { label: 'Today Dispensed', value: dispenses.length, icon: <ClipboardCheck size={18} />, color: 'text-teal-600' },
          { label: 'Pending RX', value: dispenses.filter(d => d.status === 'Pending').length, icon: <History size={18} />, color: 'text-amber-600' },
          { label: 'Stock Alerts', value: '0', icon: <Package size={18} />, color: 'text-rose-600' },
          { label: 'Total Fulfillments', value: dispenses.filter(d => d.status === 'Dispensed').length, icon: <Activity size={18} />, color: 'text-indigo-600' }
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

      {/* 🏥 Dispensing Log */}
      <div className="clinical-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Pill size={18} className="text-teal-600" /> 
            <span>Live Dispensing Activity Log</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page 1 of 24</span>
        </div>

        <div className="table-responsive-wrapper">
          <table className="clinical-table min-w-[1000px] sm:min-w-full">
            <thead>
              <tr>
                {['Internal ID', 'Rx Number', 'Patient Identity', 'Medication', 'Qty', 'Timestamp', 'Status', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-0 border-0"><SkeletonTable rows={5} cols={8}/></td></tr>
              ) : dispenses.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-slate-500">No records found</td></tr>
              ) : filteredDispenses.map(d => (
                <tr key={d.id} className="group transition-all">
                  <td className="font-bold text-slate-400 font-mono text-xs">{d.id}</td>
                  <td className="font-bold text-teal-700 font-mono text-xs uppercase tracking-tight">{d.rx}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                        <User size={14} />
                      </div>
                      <span className="font-bold text-slate-800">{d.patient}</span>
                    </div>
                  </td>
                  <td className="font-semibold text-slate-700">{d.drug}</td>
                  <td className="text-slate-500 font-medium">{d.qty}</td>
                  <td className="text-slate-500 text-xs font-bold">{d.time}</td>
                  <td>
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-tight ${
                      d.status === 'Dispensed' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => toast(`${d.drug} — ${d.patient} (${d.status})`, { icon: '💊' })} className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 transition-all">
                      <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🏥 Dispensing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="premium-text font-bold text-xl text-slate-900">Confirm Dispensing</h2>
              <button onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleDispense} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Patient / Rx Reference</label>
                <input 
                  required autoFocus type="text" 
                  value={formData.patient} 
                  onChange={e => setFormData({...formData, patient: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/50 outline-none transition-all font-medium" 
                  placeholder="e.g. Michael Lawson or RX-3011"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Medication</label>
                  <select 
                    value={formData.drug} 
                    onChange={e => setFormData({...formData, drug: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/50 outline-none transition-all font-medium appearance-none bg-white cursor-pointer"
                  >
                    {['Paracetamol 500mg', 'Metformin 500mg Tab', 'Amoxicillin 250mg', 'Salbutamol Inhaler'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Qty</label>
                  <input 
                    required type="text" 
                    value={formData.qty} 
                    onChange={e => setFormData({...formData, qty: e.target.value})} 
                    placeholder="10 tabs"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/50 outline-none transition-all font-medium" 
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
                <button type="submit" className="btn-premium flex-1 justify-center py-3">Finalize Dispense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
