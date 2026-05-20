import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Activity, HeartPulse, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import SkeletonTable from '../components/SkeletonTable';

export default function Vitals() {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '', patientId: '', bp: '120/80', hr: '72', temp: '98.6', o2: '99',
  });

  const fetchVitals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vitals/history');
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      const payload = json?.data ?? json;
      setVitals(Array.isArray(payload) ? payload : []);
    } catch {
      toast.error('Unable to load vitals. Please try again.');
      setVitals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVitals(); }, []);

  const handleRecord = async (e) => {
    e.preventDefault();
    if (!formData.patientName.trim()) {
      toast.error('Patient name is required');
      return;
    }
    try {
      const payload = {
        patientId: formData.patientId.trim() || `standalone-${Date.now()}`,
        patientName: formData.patientName,
        bp: formData.bp,
        hr: Number(formData.hr),
        temp: Number(formData.temp),
        spo2: Number(formData.o2),
        author: 'Nurse',
      };
      const res = await api.post('/vitals/record', payload);
      if (!res.ok) throw new Error(`Record failed ${res.status}`);
      toast.success(`Vitals recorded for ${formData.patientName}`);
      setIsModalOpen(false);
      setFormData({ patientName: '', patientId: '', bp: '120/80', hr: '72', temp: '98.6', o2: '99' });
      fetchVitals();
    } catch {
      toast.error('Failed to record vitals. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Patient Vitals Flowsheet</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors"><Plus size={16}/> Record Reading</button>
      </div>

      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 mb-7 flex items-start gap-4 animate-in fade-in">
        <Activity className="text-brand-600 mt-0.5 shrink-0" size={24}/>
        <div>
          <h3 className="font-bold text-brand-900">HL7 Device Integration Active</h3>
          <p className="text-sm text-brand-700 mt-1">Bedside monitors in ICU and ER are streaming real-time vitals directly to the API via HL7 v2 messages.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2"><HeartPulse size={18} className="text-brand-500"/> Observation History</div>
        <table className="w-full text-left">
          <thead><tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
            {['Flow ID', 'Patient', 'BP (mmHg)', 'HR (bpm)', 'Temp (°F)', 'SpO2 (%)', 'Timestamp'].map(h => <th key={h} className="px-6 py-4">{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-0 border-0"><SkeletonTable rows={5} cols={7} /></td></tr>
            ) : vitals.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center text-slate-400 font-medium">No vitals recorded yet.</td></tr>
            ) : vitals.map(v => (
              <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{v.id?.slice(0, 8).toUpperCase()}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{v.patientId}</td>
                <td className="px-6 py-4 font-bold text-blue-600">{v.bp}</td>
                <td className="px-6 py-4 font-bold text-red-500">{v.hr}</td>
                <td className="px-6 py-4 font-bold text-orange-500">{v.temp}</td>
                <td className="px-6 py-4 font-bold text-green-500">{v.o2}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{v.date} {v.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b flex justify-between items-center"><h2 className="font-bold flex items-center gap-2"><HeartPulse size={20} className="text-brand-600"/> Log Vitals</h2><button onClick={() => setIsModalOpen(false)}><X size={20}/></button></div>
            <form onSubmit={handleRecord} className="p-6 space-y-4">
              <input required type="text" value={formData.patientName} onChange={e=>setFormData({...formData, patientName: e.target.value})} placeholder="Patient Name *" className="w-full px-4 py-2 border rounded-xl" />
              <input type="text" value={formData.patientId} onChange={e=>setFormData({...formData, patientId: e.target.value})} placeholder="Patient ID (optional)" className="w-full px-4 py-2 border rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <input required type="text" value={formData.bp} onChange={e=>setFormData({...formData, bp: e.target.value})} placeholder="BP (120/80)" className="w-full px-4 py-2 border rounded-xl" />
                <input required type="number" value={formData.hr} onChange={e=>setFormData({...formData, hr: e.target.value})} placeholder="HR (bpm)" className="w-full px-4 py-2 border rounded-xl" />
                <input required type="number" step="0.1" value={formData.temp} onChange={e=>setFormData({...formData, temp: e.target.value})} placeholder="Temp (°F)" className="w-full px-4 py-2 border rounded-xl" />
                <input required type="number" min="0" max="100" value={formData.o2} onChange={e=>setFormData({...formData, o2: e.target.value})} placeholder="SpO2 (%)" className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <button type="submit" className="w-full px-4 py-2.5 bg-brand-600 text-white font-bold rounded-xl mt-4">Save Parameters</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
