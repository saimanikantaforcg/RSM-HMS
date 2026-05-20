import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Scan, Eye, FileText, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { api } from '../../lib/api';

export default function Radiology() {
  const [reports, setReports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ patient: '', modality: 'MRI Brain', radiologist: 'Dr. Kim' });

  const fetchReports = async () => {
    try {
      const res = await api.get('/radiology/reports');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) setReports(payload);
    } catch {
      setReports([{ id: 'RAD-3001', patient: 'Sarah Jenkins', modality: 'MRI Brain', date: '2026-03-26', status: 'Final', radiologist: 'Dr. Kim' }]);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/radiology/upload', formData);
      if (res.ok) {
        toast.success(`Imaging Report uploaded for ${formData.patient}`);
        setIsModalOpen(false); fetchReports();
      } else throw new Error();
    } catch {
      toast.error('Offline Mode');
      setReports([{ id: `RAD-${3000 + reports.length + 1}`, patient: formData.patient, modality: formData.modality, date: 'Today', status: 'Draft', radiologist: formData.radiologist }, ...reports]);
      setIsModalOpen(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Radiology Information System (RIS)</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors"><Plus size={16}/> Upload New Study</button>
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden mb-7 flex items-center justify-between shadow-lg">
        <div className="absolute opacity-10 -right-4 -bottom-10"><Scan size={250}/></div>
        <div className="relative z-10 w-2/3">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide mb-4 border border-green-500/30">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> PACS Bridge Online
          </div>
          <h2 className="text-2xl font-extrabold mb-2">DICOM Image Viewer Gateway</h2>
          <p className="text-slate-400 text-sm leading-relaxed">External viewing software synchronization is active. All new ultrasound, X-ray, and MRI scans are automatically imported into the central patient bucket.</p>
        </div>
        <button onClick={() => toast('Launching Zero-Footprint DICOM viewer...')} className="relative z-10 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-xl">Launch Viewer</button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-brand-500"/> RIS Study Worklist</div>
        <table className="w-full text-left">
          <thead><tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
            {['Accession', 'Patient', 'Modality / Study', 'Date', 'Radiologist', 'Status', 'Actions'].map(h => <th key={h} className="px-6 py-4">{h}</th>)}
          </tr></thead>
          <tbody>{reports.map(r => (
            <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{r.id}</td>
              <td className="px-6 py-4 font-bold text-slate-800">{r.patient}</td>
              <td className="px-6 py-4 font-semibold text-brand-600">{r.modality}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{r.date}</td>
              <td className="px-6 py-4 text-sm font-medium text-slate-700">{r.radiologist}</td>
              <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-bold rounded-lg border ${r.status === 'Final' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{r.status}</span></td>
              <td className="px-6 py-4"><button className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"><Eye size={16}/></button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b flex justify-between items-center"><h2 className="font-bold flex items-center gap-2"><Scan size={20} className="text-brand-600"/> Upload RIS Study</h2><button onClick={() => setIsModalOpen(false)}><X size={20}/></button></div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <input required type="text" value={formData.patient} onChange={e=>setFormData({...formData, patient: e.target.value})} placeholder="Patient Name" className="w-full px-4 py-2 border rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.modality} onChange={e=>setFormData({...formData, modality: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white"><option>MRI Brain</option><option>CT Abdomen</option><option>X-Ray Chest</option><option>Ultrasound</option></select>
                <input required type="text" value={formData.radiologist} onChange={e=>setFormData({...formData, radiologist: e.target.value})} placeholder="Radiologist" className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <button type="submit" className="w-full px-4 py-2.5 bg-brand-600 text-white font-bold rounded-xl mt-4 shadow-sm transition-colors hover:bg-brand-700">Attach to Worklist</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
