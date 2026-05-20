import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  CreditCard, FileText, AlertTriangle, CheckCircle2, TrendingUp, Receipt, ArrowRight
} from 'lucide-react';
import Layout from '../../components/Layout';
import { api } from '../../lib/api';
import EmptyState from '../../components/EmptyState';

export default function BillingDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ revenue: 0, pending: 0, total: 0 });
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const statsRes = await api.get('/billing/stats');
      const statsJson = await statsRes.json();
      const s = statsJson?.data ?? statsJson;
      setStats({
        revenue: s.collectedAmount || 0,
        pending: s.pendingAmount || 0,
        total: s.invoiceCount || 0
      });

      const invRes = await api.get('/billing/invoices');
      const invJson = await invRes.json();
      const inv = invJson?.data ?? invJson;
      if (Array.isArray(inv)) {
        setUnpaidInvoices(inv.filter(i => i.status !== 'Paid').slice(0, 5));
      }

      const claimsRes = await api.get('/claims/list');
      if (claimsRes.ok) {
        const json = await claimsRes.json();
        const list = json?.data ?? json;
        setClaims(Array.isArray(list) ? list : []);
      }
    } catch (e) { console.error('Dashboard data fetch failed', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Revenue Cycle Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={() => navigate('/billing')} className="btn-primary self-start">
          <Receipt size={14} /> Create Invoice
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Pending Collection', value: `$${stats.pending.toLocaleString()}`, icon: <TrendingUp size={18} />, color: 'text-amber-600 bg-amber-50' },
          { label: 'Collected to Date',  value: `$${stats.revenue.toLocaleString()}`, icon: <CheckCircle2 size={18} />, color: 'text-green-600 bg-green-50' },
          { label: 'Total Invoices',     value: stats.total,                          icon: <FileText size={18} />,    color: 'text-blue-600 bg-blue-50' },
          { label: 'Overdue (>7d)',      value: 0,                                    icon: <AlertTriangle size={18} />,color: 'text-red-600 bg-red-50' },
        ].map(k => (
          <div key={k.label} className="clinical-card p-4 flex items-center gap-3 hover:shadow-hover hover:-translate-y-0.5 cursor-default">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${k.color}`}>{k.icon}</div>
            <div>
              <p className="text-xl font-bold text-slate-900 leading-tight">{loading ? '...' : k.value}</p>
              <p className="text-xs text-slate-500 font-medium">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Awaiting Invoice */}
        <div className="clinical-card overflow-hidden">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Receipt size={15} className="text-amber-500" />
              <h2 className="text-sm font-bold text-slate-800">Awaiting Payment</h2>
              <span className="badge badge-amber">{unpaidInvoices.length}</span>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {unpaidInvoices.length > 0 ? unpaidInvoices.map((inv, i) => (
              <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{inv.patient}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Invoice #{inv.id.substring(0, 8)} · {inv.date}</p>
                </div>
                <p className="text-sm font-bold text-slate-800 flex-shrink-0">${Number(inv.amount).toFixed(2)}</p>
                <button onClick={() => navigate('/billing')} className="btn-primary text-xs flex-shrink-0">
                  Collect <ArrowRight size={13} />
                </button>
              </div>
            )) : (
              <EmptyState
                title="All Cleared"
                message="No invoices awaiting payment at this time."
              />
            )}
          </div>
        </div>

        {/* Claims Queue */}
        <div className="clinical-card overflow-hidden">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <CreditCard size={15} className="text-blue-500" />
              <h2 className="text-sm font-bold text-slate-800">TPA Claims Queue</h2>
              <span className="badge badge-blue">{claims.length}</span>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm">Loading claims...</div>
            ) : claims.length > 0 ? claims.map((c, i) => (
              <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{c.patientName || c.patient}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.payer} · Claim #{c.id.substring(0, 8)}</p>
                </div>
                <p className="text-sm font-bold text-slate-700 flex-shrink-0">${Number(c.amount || 0).toFixed(2)}</p>
                <span className={c.status === 'Rejected' ? 'badge badge-red' : 'badge badge-amber'}>{c.status}</span>
                <button onClick={() => navigate('/claims')} className="btn-secondary text-xs flex-shrink-0">Review</button>
              </div>
            )) : (
                <EmptyState
                  title="No Claims"
                  message="There are no active insurance claims requiring review."
                />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
