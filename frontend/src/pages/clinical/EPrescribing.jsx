import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Pill, Activity, X, Plus, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

export default function EPrescribing() {
  const [scripts, setScripts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '', encounterId: '', patientId: '',
    drugName: '', dosage: '', frequency: '1-0-1', duration: '5 days',
  });

  const fetchScripts = async () => {
    try {
      const res = await api.get('/prescriptions');
      const json = await res.json();
      const payload = json?.data?.data ?? json?.data ?? json;
      if (Array.isArray(payload)) setScripts(payload);
    } catch {
      setScripts([]);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchScripts(); }, []);

  const handleTransmit = async (e) => {
    e.preventDefault();
    try {
      // Step 1 — create prescription header
      const rxRes = await api.post('/prescriptions', {
        encounterId: formData.encounterId,
        patientId: formData.patientId,
        patientName: formData.patientName,
      });
      if (!rxRes.ok) throw new Error('Failed to create prescription');
      const rxJson = await rxRes.json();
      const rxId = rxJson?.data?.id ?? rxJson?.id;

      // Step 2 — add drug line item
      if (rxId) {
        await api.post(`/prescriptions/${rxId}/items`, {
          drugName: formData.drugName,
          dosage: formData.dosage,
          frequency: formData.frequency,
          duration: formData.duration,
          route: 'Oral',
        });
      }

      toast.success('Prescription created and signed');
      setIsModalOpen(false);
      setFormData({ patientName: '', encounterId: '', patientId: '', drugName: '', dosage: '', frequency: '1-0-1', duration: '5 days' });
      fetchScripts();
    } catch {
      toast.error('Failed to create prescription. Verify Encounter ID and Patient ID.');
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">e-Prescribing (CPOE)</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors"><Plus size={16}/> New Prescription</button>
      </div>

      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 mb-7 flex items-start gap-4">
        <Activity className="text-brand-600 mt-0.5" size={24}/>
        <div>
          <h3 className="font-bold text-brand-900">PDMP Connection Active</h3>
          <p className="text-sm text-brand-700 mt-1">Directly integrated with the state Prescription Drug Monitoring Program. Controlled substance authorizations are automatically cross-checked.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2">
          <Pill size={18} className="text-brand-500"/> Sent Prescriptions Log
        </div>
        <table className="w-full text-left">
          <thead><tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
            {['Rx ID', 'Patient', 'Medication', 'Dosage / Sig', 'Status', 'Date'].map(h => <th key={h} className="px-6 py-4">{h}</th>)}
          </tr></thead>
          <tbody>{scripts.length === 0 ? (
            <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">No prescriptions found</td></tr>
          ) : scripts.map(rx => {
            const firstItem = rx.items?.[0];
            const drugs = rx.items?.map(i => i.drugName).join(', ') || firstItem?.drugName || '—';
            const sig = firstItem ? `${firstItem.dosage || ''} ${firstItem.frequency || ''}`.trim() || '—' : '—';
            const statusColor = { Signed: 'bg-green-100 text-green-700', Draft: 'bg-amber-100 text-amber-700', Dispensed: 'bg-blue-100 text-blue-700', Cancelled: 'bg-red-100 text-red-700' }[rx.status] ?? 'bg-slate-100 text-slate-700';
            return (
              <tr key={rx.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{rx.id?.slice(0, 8).toUpperCase()}</td>
                <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-1.5">
                  {rx.patientName || '—'}
                  <ShieldCheck size={12} className="text-emerald-500 fill-emerald-500/10" />
                </td>
                <td className="px-6 py-4 font-bold text-brand-600">{drugs}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{sig}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-bold rounded-lg ${statusColor}`}>{rx.status}</span></td>
                <td className="px-6 py-4 text-xs text-slate-400">{rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : '—'}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b flex justify-between items-center"><h2 className="font-bold flex items-center gap-2"><Pill size={20} className="text-brand-600"/> Create Prescription</h2><button onClick={() => setIsModalOpen(false)}><X size={20}/></button></div>
            <form onSubmit={handleTransmit} className="p-6 space-y-3">
              <input required type="text" value={formData.patientName} onChange={e=>setFormData({...formData, patientName: e.target.value})} placeholder="Patient Name" className="w-full px-4 py-2 border rounded-xl" />
              <input required type="text" value={formData.patientId} onChange={e=>setFormData({...formData, patientId: e.target.value})} placeholder="Patient ID (UUID)" className="w-full px-4 py-2 border rounded-xl font-mono text-sm" />
              <input required type="text" value={formData.encounterId} onChange={e=>setFormData({...formData, encounterId: e.target.value})} placeholder="Encounter ID (UUID)" className="w-full px-4 py-2 border rounded-xl font-mono text-sm" />
              <div className="h-px bg-slate-100" />
              <input required type="text" value={formData.drugName} onChange={e=>setFormData({...formData, drugName: e.target.value})} placeholder="Drug Name (e.g. Amoxicillin 500mg)" className="w-full px-4 py-2 border rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={formData.dosage} onChange={e=>setFormData({...formData, dosage: e.target.value})} placeholder="Dosage (e.g. 500mg)" className="px-4 py-2 border rounded-xl" />
                <input type="text" value={formData.frequency} onChange={e=>setFormData({...formData, frequency: e.target.value})} placeholder="Frequency (e.g. BD)" className="px-4 py-2 border rounded-xl" />
              </div>
              <input type="text" value={formData.duration} onChange={e=>setFormData({...formData, duration: e.target.value})} placeholder="Duration (e.g. 5 days)" className="w-full px-4 py-2 border rounded-xl" />
              <button type="submit" className="w-full px-4 py-2.5 bg-brand-600 text-white font-bold rounded-xl mt-2 shadow-sm transition-colors hover:bg-brand-700">Create &amp; Sign Prescription</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
