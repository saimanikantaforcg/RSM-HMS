import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Files, UploadCloud, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ patient: '', type: 'Insurance Card', url: 'https://cdn.example.com/scan.pdf' });

  const fetchDocs = async () => {
    try {
      const res = await api.get('/documents/records');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) setDocs(payload);
    } catch {
      setDocs([{ id: 'DOC-501', patient: 'Michael Lawson', type: 'Insurance Card', url: 's3://bucket/card.pdf', date: '2026-03-26' }]);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      await api.post('/documents/upload', formData);
      toast.success(`Document uploaded to S3 Bucket`);
      setIsModalOpen(false); fetchDocs();
    } catch {
      toast.error('Offline Mode');
      setDocs([{ id: `DOC-${500 + docs.length + 1}`, patient: formData.patient, type: formData.type, url: formData.url, date: 'Today' }, ...docs]);
      setIsModalOpen(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Document Management (PACS/S3)</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors"><UploadCloud size={16}/> Upload File</button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2"><Files size={18} className="text-brand-500"/> Cloud Storage Bucket</div>
        <table className="w-full text-left">
          <thead><tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
            {['Doc ID', 'Patient Context', 'Type', 'Upload Date', 'Direct Link'].map(h => <th key={h} className="px-6 py-4">{h}</th>)}
          </tr></thead>
          <tbody>{docs.map(d => (
            <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{d.id}</td>
              <td className="px-6 py-4 font-bold text-slate-800">{d.patient}</td>
              <td className="px-6 py-4 font-semibold text-brand-600">{d.type}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{d.date}</td>
              <td className="px-6 py-4 font-mono text-xs text-blue-500 hover:underline cursor-pointer"><div className="bg-blue-50 px-2 py-1 rounded w-max border border-blue-100">{d.url}</div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b flex justify-between items-center"><h2 className="font-bold flex items-center gap-2 text-slate-800"><UploadCloud size={20} className="text-brand-600"/> Upload to S3</h2><button onClick={() => setIsModalOpen(false)}><X size={20}/></button></div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <input required type="text" value={formData.patient} onChange={e=>setFormData({...formData, patient: e.target.value})} placeholder="Patient Name" className="w-full px-4 py-2 border rounded-xl" />
              <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white"><option>Insurance Card</option><option>ID / Passport</option><option>Outside Medical Record</option></select>
              <input required type="url" value={formData.url} onChange={e=>setFormData({...formData, url: e.target.value})} placeholder="S3 / CDN Link" className="w-full px-4 py-2 border rounded-xl" />
              <button type="submit" className="w-full px-4 py-2.5 bg-brand-600 text-white font-bold rounded-xl mt-4">Encrypt & Upload File</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
