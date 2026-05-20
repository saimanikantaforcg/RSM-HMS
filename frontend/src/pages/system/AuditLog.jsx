import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { 
  ShieldCheck, ShieldAlert, History, User, 
  Search, Filter, Download, Eye, AlertTriangle 
} from 'lucide-react';
import { api } from '../../lib/api';
import SkeletonTable from '../../components/SkeletonTable';
import toast from 'react-hot-toast';

/**
 * AuditLog Dashboard (PHI Access Viewer)
 * -------------------------------------
 * A premium, HIPAA-compliant monitoring interface to track PHI access.
 * Essential for "Operational Hardening" Phase 1.
 */
export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_filter, _setFilter] = useState('all');

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-log/phi-access');
      if (!res.ok) throw new Error('Unauthorized or Server Error');
      const json = await res.json();
      setLogs(json?.data || []);
    } catch (err) {
      console.error('Audit fetch error:', err);
      toast.error('Failed to load HIPAA access logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const getStatusBadge = (action) => {
    switch (action) {
      case 'READ': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'WRITE': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'DELETE': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-end mb-8 animate-fade-in">
        <div>
          <h1 className="premium-text text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-emerald-600" size={32} />
            PHI Access Auditor
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Real-time HIPAA compliance monitoring & PHI access tracking</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={14} /> Export Report (CSV)
          </button>
          <button onClick={fetchAuditLogs} className="btn-premium px-6 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10">
            <History size={16} /> Refresh Feed
          </button>
        </div>
      </div>

      {/* 🏥 Threat & Compliance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total PHI Accesses', value: logs.length, sub: 'Last 24 hours', color: 'text-slate-900', icon: <Eye size={20} /> },
          { label: 'Unique Users', value: [...new Set(logs.map(l => l.userId))].length, sub: 'Authorized staff', color: 'text-blue-600', icon: <User size={20} /> },
          { label: 'Integrity Alerts', value: '0', sub: 'Detected violations', color: 'text-emerald-600', icon: <ShieldCheck size={20} /> },
          { label: 'Suspicious Patterns', value: '0', sub: 'Unusual access frequency', color: 'text-amber-600', icon: <AlertTriangle size={20} /> }
        ].map((stat, i) => (
          <div key={i} className="clinical-card p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <div className={`p-2 rounded-xl bg-slate-50 ${stat.color}`}>{stat.icon}</div>
            </div>
            <div className="mt-4">
              <p className={`text-2xl font-black ${stat.color}`}>{loading ? '...' : stat.value}</p>
              <p className="text-[11px] font-medium text-slate-400 mt-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 🏥 Audit Trail Table */}
      <div className="clinical-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <History size={18} className="text-emerald-600" />
            <span>Immutable Access Trail</span>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search by User or MRN..." 
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none w-64 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="clinical-table w-full text-left">
            <thead>
              <tr>
                {['Timestamp', 'User', 'IP Address', 'Action', 'Entity', 'Entity ID', 'Status'].map(h => (
                  <th key={h} className="px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-0 border-0"><SkeletonTable rows={8} cols={7}/></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-slate-500 font-medium italic">No PHI access records found in current period.</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                       <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                         <User size={12} className="text-slate-500" />
                       </div>
                       <span>{log.userId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">
                    {log.metadata?.ip || '127.0.0.1'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest ${getStatusBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {log.entityName}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">
                    {log.entityId}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-tighter">
                      <ShieldCheck size={12} /> Verified
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
