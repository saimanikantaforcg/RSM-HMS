import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { FileSignature, AlertCircle, CheckCircle, Search, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import SkeletonTable from '../../components/SkeletonTable';
import ErrorState from '../../components/ErrorState';
import useAuthStore from '../../store/authStore';

export default function EMR() {
  const [notes, setNotes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(false);
  const user = useAuthStore(s => s.user);
  const authorName = user?.name || 'Authorized Provider';
  const [formData, setFormData] = useState({ patient: '', type: 'Progress Note', author: authorName, content: '' });
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/emr/notes');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) {
        setNotes(payload);
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotes(); }, []);

  const handleSign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/emr/sign', formData);
      toast.success(`Clinical Note Signed by ${formData.author}`);
      setIsModalOpen(false);
      setFormData({ patient: '', type: 'Progress Note', author: authorName, content: '' });
      fetchNotes();
    } catch {
      toast.error('API Error: Failed to save Note');
      setIsModalOpen(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Electronic Medical Records (EMR)</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search chart..." className="pl-9 pr-4 py-2 border rounded-xl focus:ring-2 outline-none" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/> Sign New Note</button>
        </div>
      </div>

      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 flex items-start gap-4 mb-7 animate-in fade-in">
        <AlertCircle className="text-brand-600 mt-1 shrink-0" size={24} />
        <div>
          <h3 className="font-bold text-brand-900">Clinical Decision Support Alert</h3>
          <p className="text-sm text-brand-700 mt-1">Patient <b>Michael Lawson</b> has a known allergy to <b>Penicillin</b>. Please review alternative antibiotics before proceeding with charting prescriptions.</p>
        </div>
      </div>

      <div className="clinical-card overflow-hidden">
        {loading ? (
          <SkeletonTable columns={6} />
        ) : error ? (
          <ErrorState onRetry={fetchNotes} />
        ) : notes.length === 0 ? (
          <EmptyState title="No Records" message="No clinical records found." />
        ) : (
          <div className="table-responsive-wrapper">
            <table className="w-full text-left">
          <thead><tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
            {['Note ID', 'Patient', 'Author', 'Document Type', 'Date', 'Status'].map(h => <th key={h} className="px-6 py-4">{h}</th>)}
          </tr></thead>
          <tbody>{notes.map(n => (
            <tr key={n.id} className="border-b border-slate-50 hover:bg-slate-50">
              <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{n.id}</td>
              <td className="px-6 py-4 font-bold text-slate-800">{n.patient}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{n.author}</td>
              <td className="px-6 py-4 font-medium text-brand-600">{n.type}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{n.date}</td>
              <td className="px-6 py-4"><div className="flex items-center gap-2 text-sm font-bold">{n.status === 'Signed' ? <><CheckCircle className="text-green-500" size={16}/> <span className="text-green-700">Signed</span></> : <span className="text-yellow-600 border border-yellow-200 bg-yellow-50 px-2 py-1 rounded-md">{n.status}</span>}</div></td>
            </tr>
          ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-in fade-in">
            <div className="px-6 py-4 border-b flex justify-between items-center"><h2 className="font-bold flex items-center gap-2"><FileSignature size={20} className="text-brand-600"/> Sign Chart Note</h2><button onClick={() => setIsModalOpen(false)}><X size={20}/></button></div>
            <form onSubmit={handleSign} className="p-6 space-y-4">
              <input required type="text" value={formData.patient} onChange={e=>setFormData({...formData, patient: e.target.value})} placeholder="Patient Name" className="w-full px-4 py-2 border rounded-xl mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 border rounded-xl bg-white"><option>Progress Note</option><option>Discharge Summary</option><option>History & Physical</option></select>
                <input required type="text" value={formData.author} onChange={e=>setFormData({...formData, author: e.target.value})} placeholder="Author" className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <textarea required value={formData.content} onChange={e=>setFormData({...formData, content: e.target.value})} placeholder="Clinical notes here..." rows="4" className="w-full px-4 py-2 border rounded-xl"></textarea>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Digitally Sign & Lock Note</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
