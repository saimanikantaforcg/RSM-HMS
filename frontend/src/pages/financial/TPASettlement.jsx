import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Landmark, ArrowRightLeft, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

export default function TPASettlement() {
  const [claims, setClaims] = useState([]);
  const [selectedClaims, setSelectedClaims] = useState(new Set());
  const [bankRef, setBankRef] = useState('TXN-HDFC-9921');

  const fetchClaims = async () => {
    try {
      const res = await api.get('/claims/list');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) setClaims(payload.filter(c => c.status !== 'Approved')); // Only show pending
    } catch {
      setClaims([
        { id: 'C991-E22A', payer: 'Star Health', patient: 'Ramesh Patel', amount: '$450.00', status: 'Submitted' },
        { id: 'C992-E22B', payer: 'Star Health', patient: 'Sanjay Kumar', amount: '$1200.00', status: 'Submitted' }
      ]);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchClaims(); }, []);

  const toggleClaim = (id) => {
    const next = new Set(selectedClaims);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedClaims(next);
  };

  const totalSelected = Array.from(selectedClaims).reduce((sum, id) => {
    const claim = claims.find(c => c.id === id);
    if (!claim) return sum;
    return sum + parseFloat(claim.amount.replace(/[^0-9.]/g, ''));
  }, 0);

  const handleSettle = async () => {
    if (selectedClaims.size === 0) return toast.error('Select claims first');
    try {
      await api.post('/claims/settle-batch', { claimIds: Array.from(selectedClaims), transactionRef: bankRef });
      toast.success(`Batch successfully mapped to ${bankRef}`);
      setSelectedClaims(new Set());
      fetchClaims();
    } catch {
      toast.error('Offline Mode');
      setClaims(claims.filter(c => !selectedClaims.has(c.id)));
      setSelectedClaims(new Set());
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">TPA Bulk Settlement MATCH</h1>
          <p className="text-slate-500 text-sm mt-1">Reconcile NEFT/RTGS bank deposits with pending insurance claims</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bank Statement Pane */}
        <div className="col-span-1 bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
          <div className="flex items-center gap-2 font-bold text-emerald-600 mb-6 border-b pb-4"><Landmark size={20}/> Bank Statement Feed</div>
          
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-20"><Landmark size={48}/></div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">Incoming Deposit</p>
            <p className="text-3xl font-extrabold text-slate-900">₹ {(totalSelected * 83).toLocaleString() || '---'}</p>
            <p className="text-sm font-medium text-emerald-800 mt-1">Remitter: STAR HEALTH & ALLIED</p>
            <div className="mt-4 pt-4 border-t border-emerald-200/50">
              <label className="text-xs font-bold text-emerald-700 block mb-1">Bank UTR / Ref Number</label>
              <input type="text" value={bankRef} onChange={e=>setBankRef(e.target.value)} className="w-full bg-white/60 border border-emerald-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-emerald-900 font-mono text-sm" />
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-slate-500 mb-2">Total Mapped Value</p>
            <p className="text-2xl font-black text-brand-600">${totalSelected.toFixed(2)}</p>
          </div>

          <button onClick={handleSettle} className="w-full mt-4 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition flex items-center justify-center gap-2 shadow-sm">
            <CheckCircle2 size={18}/> Reconcile {selectedClaims.size} Claims
          </button>
        </div>

        {/* Claims Ledger Pane */}
        <div className="col-span-2 bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
             <div className="font-bold text-slate-800 flex items-center gap-2"><FileSpreadsheet size={18} className="text-blue-500"/> Pending Claim Pipeline</div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{claims.length} Unmatched Claims</p>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 sticky top-0 z-10">
                  <th className="px-5 py-4 w-12 text-center">Set</th>
                  {['Claim ID', 'Payer/TPA', 'Patient', 'Amount'].map(h => <th key={h} className="px-5 py-4">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {claims.length === 0 && <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-medium font-sm">No pending claims available.</td></tr>}
                {claims.map(c => {
                  const isSelected = selectedClaims.has(c.id);
                  return (
                    <tr key={c.id} onClick={() => toggleClaim(c.id)} className={`border-b hover:bg-blue-50/50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/80 border-blue-100' : 'border-slate-50'}`}>
                      <td className="px-5 py-4 w-12 text-center">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-slate-300 bg-white'}`}>
                          {isSelected && <CheckCircle2 size={14} className="text-white"/>}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs font-bold text-slate-500">{c.id}</td>
                      <td className="px-5 py-4 font-bold text-slate-800">{c.payer}</td>
                      <td className="px-5 py-4 font-medium text-slate-600 text-sm">{c.patient}</td>
                      <td className="px-5 py-4 font-black text-slate-800">{c.amount}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
