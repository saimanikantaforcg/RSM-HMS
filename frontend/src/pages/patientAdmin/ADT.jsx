import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { ArrowLeftRight, Activity, Plus, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import SkeletonTable from '../../components/SkeletonTable';

export default function ADT() {
  const [logs, setLogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ patient: '', action: 'Transfer', fromLoc: '', toLoc: '' });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/adt/logs');
      if (!res.ok) throw new Error('API down');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) setLogs(payload);
    } catch {
      // STRICT ZERO MOCK POLICY:
      setLogs([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/adt/transfer', formData);
      if (!res.ok) throw new Error('Transfer failed');
      toast.success(`Patient ${formData.action} Logged`);
      setIsModalOpen(false);
      fetchLogs();
    } catch {
      toast.error('Unable to execute transfer. Service offline.');
    }
  };

  const filteredLogs = logs.filter(l => 
    l.patient?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pt-2 animate-fade-in">
        <div>
          <h1 className="page-title">Admission, Discharge, Transfer</h1>
          <p className="page-subtitle mt-1 flex items-center gap-2">
            <Activity size={14} className="text-brand-500" /> Bed tracking & patient flow monitoring
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary shadow-hover hover:-translate-y-0.5">
          <ArrowLeftRight size={16} /> Log Bed Move
        </button>
      </div>

      <div className="clinical-card overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Activity size={16} /></div>
            <h2 className="font-bold text-slate-800 text-base">Comprehensive ADT Log</h2>
          </div>
          <div className="relative w-full sm:w-64">
             <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search logs by patient or ID..." 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="input pl-10 !py-2 !text-sm"
             />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="clinical-table min-w-[800px] sm:min-w-full">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Patient</th>
                <th>Action</th>
                <th>From Location</th>
                <th>To Location</th>
                <th>Timestamp</th>
                <th>Operator User</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-0 border-0"><SkeletonTable rows={5} cols={7}/></td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                   <td colSpan={7} className="py-16">
                     <div className="empty-state">
                       <ArrowLeftRight size={32} className="text-slate-300 mb-3" />
                       <p className="text-slate-500 font-semibold mb-1">No ADT records found</p>
                       <p className="text-slate-400 text-sm mt-1">
                         {searchQuery ? 'Adjust your search filters.' : 'System has zero tracked patient movements.'}
                       </p>
                     </div>
                   </td>
                </tr>
              ) : filteredLogs.map(l => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                  <td><span className="font-mono text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded shadow-sm">{l.id}</span></td>
                  <td className="font-bold text-slate-800">{l.patient}</td>
                  <td>
                    <span className={`badge ${
                      l.action === 'Admission' ? 'badge-success' : 
                      l.action === 'Transfer' ? 'badge-info' : 
                      'badge-warning'
                    }`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="text-slate-600 font-medium text-xs">{l.from}</td>
                  <td className="text-slate-600 font-bold text-xs">{l.to}</td>
                  <td className="text-slate-500 font-mono text-xs">{l.time}</td>
                  <td className="text-slate-500 font-medium text-xs flex items-center gap-1.5 mt-2">
                     <div className="h-4 w-4 rounded bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">{l.user.substring(0,1)}</div>
                     {l.user}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800">Log Patient Movement</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
              ><X size={18}/></button>
            </div>
            
            <form onSubmit={handleTransfer} className="p-6 space-y-4">
              <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Action Type</label>
                 <select value={formData.action} onChange={e=>setFormData({...formData, action: e.target.value})} className="input font-semibold text-sm">
                   <option>Admission</option>
                   <option>Transfer</option>
                   <option>Discharge</option>
                 </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Patient Name/ID</label>
                <input required type="text" value={formData.patient} onChange={e=>setFormData({...formData, patient: e.target.value})} placeholder="e.g., Liam Smith" className="input" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">From Unit</label>
                   <input required type="text" value={formData.fromLoc} onChange={e=>setFormData({...formData, fromLoc: e.target.value})} placeholder="e.g., ER Level 1" className="input" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">To Unit</label>
                  <input required type="text" value={formData.toLoc} onChange={e=>setFormData({...formData, toLoc: e.target.value})} placeholder="e.g., Ward A Bed 4" className="input" />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                 <button type="submit" className="btn-primary flex-1 justify-center shadow-hover">Commit Move</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
