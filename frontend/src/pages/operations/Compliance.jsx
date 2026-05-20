import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { ShieldAlert, Search, Plus, X, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getCurrentUser } from '../../lib/api';
import SkeletonTable from '../../components/SkeletonTable';

export default function Compliance() {
  const [logs, setLogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ action: 'Exported PHI Report', resource: 'Global DB' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/compliance/audit');
      if (!res.ok) throw new Error('API Offline');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) setLogs(payload);
    } catch {
      // STRICT ZERO MOCK POLICY
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleLog = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData, user: user?.name || 'System Admin' };
      const res = await api.post('/compliance/log', submitData);
      if (!res.ok) throw new Error('Log failed');
      toast.success('Audit Entry Written to Immutable Ledger');
      setIsModalOpen(false); 
      fetchLogs();
    } catch {
      toast.error('Audit Service Offline: Entry not recorded.');
    }
  };

  const filteredLogs = logs.filter(l => 
    l.user?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.action?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pt-2 animate-fade-in">
        <div>
          <h1 className="page-title">Compliance & Audit Trails</h1>
          <p className="page-subtitle mt-1 flex items-center gap-2">
            <Lock size={14} className="text-rose-500" /> Immutable HIPAA / GDPR Logging
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary !bg-slate-900 !text-white hover:!bg-black hover:shadow-lg hover:shadow-slate-900/20 shadow-sm border border-slate-700">
          <ShieldAlert size={16}/> Force Manual Entry
        </button>
      </div>

      <div className="clinical-card overflow-hidden animate-slide-up bg-slate-900 border-0 shadow-2xl" style={{ animationDelay: '0.1s' }}>
        <div className="px-6 py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center border border-rose-500/30"><ShieldAlert size={16} /></div>
            <h2 className="font-bold text-white text-base">Immutable Audit Ledger</h2>
          </div>
          <div className="relative w-full sm:w-64">
             <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
             <input 
               type="text" 
               placeholder="Search logs..." 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="w-full bg-slate-800 text-white placeholder:text-slate-500 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 outline-none transition-all"
             />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="clinical-table min-w-full !border-0">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700">
                <th className="text-slate-400">Audit ID</th>
                <th className="text-slate-400">User / Actor</th>
                <th className="text-slate-400">Action</th>
                <th className="text-slate-400">Resource</th>
                <th className="text-slate-400">Timestamp</th>
                <th className="text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-0 border-0 bg-slate-900"><div className="opacity-50 brightness-0 invert"><SkeletonTable rows={5} cols={6}/></div></td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                   <td colSpan={6} className="py-16 bg-slate-900">
                     <div className="empty-state">
                       <ShieldAlert size={32} className="text-slate-700 mb-3" />
                       <p className="text-slate-400 font-semibold mb-1">No immutable records found</p>
                       <p className="text-slate-600 text-sm mt-1">Audit ledger is empty or unreachable.</p>
                     </div>
                   </td>
                </tr>
              ) : filteredLogs.map(l => (
                <tr key={l.id} className="hover:bg-slate-800/80 transition-colors border-b border-slate-800/50">
                  <td><span className="font-mono text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{l.id}</span></td>
                  <td className="font-bold text-brand-400">{l.user}</td>
                  <td className="text-slate-300 font-semibold text-sm">{l.action}</td>
                  <td><span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">{l.resource}</span></td>
                  <td className="text-slate-400 text-xs font-mono">{l.timestamp}</td>
                  <td>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {l.compliance || 'HIPAA Compliant'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop bg-slate-900/80">
          <div className="modal-box bg-slate-900 border border-slate-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="font-bold text-lg text-white flex items-center gap-2">
                <ShieldAlert size={18} className="text-rose-500"/> Force Audit Entry
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20}/>
              </button>
            </div>
            <form onSubmit={handleLog} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1">Actor</label>
                <div className="w-full bg-slate-800/50 text-slate-400 border border-slate-700 rounded-xl px-4 py-2 text-sm font-semibold cursor-not-allowed">
                  {user?.name || 'System Admin'} (Auto-detected)
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1">Action Description</label>
                <input required type="text" value={formData.action} onChange={e=>setFormData({...formData, action: e.target.value})} className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none placeholder:text-slate-500" placeholder="e.g. Generated emergency override key" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1">Target Resource</label>
                <input required type="text" value={formData.resource} onChange={e=>setFormData({...formData, resource: e.target.value})} className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none placeholder:text-slate-500" placeholder="e.g. PAT-94812" />
              </div>
              <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors rounded-xl border border-slate-700 hover:bg-slate-800">Cancel</button>
                 <button type="submit" className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95">Commit to Ledger</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
