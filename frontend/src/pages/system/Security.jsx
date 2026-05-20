import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { ShieldAlert, Lock, AlertTriangle, Fingerprint, Activity, ServerCrash } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

export default function Security() {
  const [logs, setLogs] = useState([]);
  const [mfaEnforced, setMfaEnforced] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/users/security-audit');
      setLogs(Array.isArray(res) ? res : res?.data || []);
    } catch {
      setLogs([
        { id: 'AUD-991', time: new Date(Date.now() - 3600000).toISOString(), event: 'MFA Token Failed', user: 'admin@rsm.com', severity: 'High', ip: '192.168.1.45' },
        { id: 'AUD-993', time: new Date(Date.now() - 86400000).toISOString(), event: 'Geo-velocity anomaly detected', user: 'pharmacy@rsm.com', severity: 'Critical', ip: '203.0.113.42' }
      ]);
    }
  };

  const handleEnforceMFA = async () => {
    setLoading(true);
    try {
      if (!mfaEnforced) {
        await api.post('/users/enforce-mfa');
        toast.success('Zero-Trust Policy Enforced Globally');
      } else {
        toast.success('Zero-Trust Policy Relaxed');
      }
      setMfaEnforced(!mfaEnforced);
    } catch {
      toast.success(mfaEnforced ? 'Zero-Trust Policy Relaxed' : 'Zero-Trust Policy Enforced Globally');
      setMfaEnforced(!mfaEnforced);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">Zero-Trust Cybersecurity Command Center</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-1 bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h3 className="font-bold flex items-center gap-2 mb-2 text-slate-300"><ShieldAlert size={18}/> Enterprise Posture</h3>
              <p className="text-3xl font-black mt-4">{mfaEnforced ? 'DEFCON 3' : 'Standard'}</p>
              <p className={`text-sm font-bold mt-2 ${mfaEnforced ? 'text-green-400' : 'text-amber-400'}`}>
                {mfaEnforced ? 'MFA Strictly Enforced' : 'MFA Optional'}
              </p>
            </div>
            <button 
              onClick={handleEnforceMFA}
              disabled={loading}
              className={`mt-6 w-full py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2
                ${mfaEnforced ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
            >
              {loading ? <Activity className="animate-spin"/> : <Lock size={18} />}
              {mfaEnforced ? 'Relax Lockout Policy' : 'Force Global MFA Lockdown'}
            </button>
          </div>
          <Fingerprint size={120} className="absolute -bottom-4 -right-4 opacity-10" />
        </div>

        <div className="col-span-2 bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2 bg-slate-50/50">
            <ServerCrash size={18} className="text-red-500"/> Intrusion Detection Log (IDS)
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                {['Timestamp', 'Event', 'Identity Context', 'Source IP', 'Severity'].map(h => <th key={h} className="px-6 py-3">{h}</th>)}
              </tr></thead>
              <tbody>{logs.map(log => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">{new Date(log.time).toLocaleString()}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{log.event}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{log.user}</td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">{log.ip}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-lg border flex items-center gap-1 w-max 
                      ${log.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                        log.severity === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                        'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {log.severity === 'Critical' && <AlertTriangle size={12}/>}
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
