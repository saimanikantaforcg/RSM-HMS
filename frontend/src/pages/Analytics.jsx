import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { BarChart3, TrendingUp, PieChart, Plus, X, BrainCircuit, ActivitySquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

export default function Analytics() {
  const [reports, setReports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'Operational Efficiency', author: 'Administrator' });
  const [ai, setAi] = useState(null);

  const fetchData = async () => {
    try {
      const [reportsRes, aiRes] = await Promise.all([
        api.get('/analytics/reports'),
        api.get('/analytics/predictions')
      ]);
      
      const reportsJson = await reportsRes.json();
      const aiJson = await aiRes.json();
      
      setReports(reportsJson?.data ?? reportsJson);
      setAi(aiJson?.data ?? aiJson);
    } catch {
      toast.error('Failed to sync Analytics Engine');
      setAi({ erWaitTimeMinutes: '--', averageLosDays: '--', pharmacyAlerts: '--' });
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const toastId = toast.loading('Aggregating data lake queries...');
      const res = await api.post('/analytics/generate', formData);
      
      if (res.ok) {
        toast.success(`Dynamic Report Generated`, { id: toastId });
        setIsModalOpen(false); 
        fetchData();
        setFormData({ name: '', type: 'Operational Efficiency', author: 'Administrator' });
      } else {
        throw new Error();
      }
    } catch {
      toast.dismiss();
      toast.error('Failed to execute BI query');
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Enterprise Analytics & BI</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors"><Plus size={16}/> Build Custom Report</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg">
          <div className="relative z-10">
            <h3 className="font-bold flex items-center gap-2 mb-2 opacity-90"><BrainCircuit size={16}/> Expected ER Wait Time</h3>
            <p className="text-4xl font-extrabold">{ai ? ai.erWaitTimeMinutes : '--'} <span className="text-lg font-medium opacity-70">mins</span></p>
            <p className="text-sm font-medium text-indigo-200 mt-2">AI Forecasting Model (Next 4 hrs)</p>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10"><ActivitySquare size={150}/></div>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft relative overflow-hidden">
          <h3 className="font-bold text-slate-500 mb-2 flex items-center gap-2"><BrainCircuit size={16} className="text-brand-500"/> Predicted LoS (Days)</h3>
          <p className="text-4xl font-extrabold text-slate-800">{ai ? ai.averageLosDays : '--'}</p>
          <p className="text-sm font-semibold text-rose-500 mt-2 flex items-center gap-1"><TrendingUp size={14}/> Based on active admissions</p>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03]"><BrainCircuit size={150}/></div>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft relative overflow-hidden">
          <h3 className="font-bold text-slate-500 mb-2 flex items-center gap-2"><BrainCircuit size={16} className="text-brand-500"/> Active Inventory Alerts</h3>
          <p className="text-4xl font-extrabold text-slate-800">{ai ? ai.pharmacyAlerts : '--'}</p>
          <p className="text-sm font-semibold text-slate-400 mt-2">Actual items below safety threshold</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2"><PieChart size={18} className="text-brand-500"/> Saved Reports Library</div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
              {['Report ID', 'Report Name', 'Data Model Type', 'Author', 'Generated On'].map(h => <th key={h} className="px-6 py-4">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {!reports || reports.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-slate-500 font-bold">No Custom Reports Generated.</td></tr>
            ) : (
              reports.map(r => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{r.id}</td>
                  <td className="px-6 py-4 font-bold text-brand-600">{r.name}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{r.type}</span></td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-600">{r.author}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{r.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b flex justify-between items-center"><h2 className="font-bold flex items-center gap-2"><PieChart size={20} className="text-brand-600"/> Build Report</h2><button onClick={() => setIsModalOpen(false)}><X size={20}/></button></div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="Report Title (e.g. Q2 Growth)" className="w-full px-4 py-2 border rounded-xl" />
              <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white"><option>Financial</option><option>Clinical Outcomes</option><option>Operational Efficiency</option></select>
              <input required type="text" value={formData.author} onChange={e=>setFormData({...formData, author: e.target.value})} placeholder="Author Name" className="w-full px-4 py-2 border rounded-xl" />
              <button type="submit" className="w-full px-4 py-2.5 bg-brand-600 text-white font-bold rounded-xl mt-4 shadow-sm transition-colors hover:bg-brand-700">Query Database & Generate</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
