import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { 
  FileText, Plus, X, Trash2, ShieldCheck, 
  CreditCard, TrendingUp, Search, User, Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import SkeletonTable, { SkeletonCard } from '../../components/SkeletonTable';

// Catalog is loaded from /billing/catalog API — no static fallback

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, pending: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const filteredInvoices = invoices.filter(i =>
    !invoiceSearch ||
    i.patient?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    i.id?.toLowerCase().includes(invoiceSearch.toLowerCase())
  );
  const filteredCatalog = catalog.filter(s =>
    !catalogSearch ||
    s.name?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    s.category?.toLowerCase().includes(catalogSearch.toLowerCase())
  );
  
  // Cart state
  const [cart, setCart] = useState([]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/billing/stats');
      const json = await res.json();
      const s = json?.data ?? json;
      setStats({
        revenue: s.collectedAmount || 0,
        pending: s.pendingAmount || 0,
        total: s.invoiceCount || 0
      });
    } catch (e) { console.error('Stats fetch failed', e); }
  };

  const fetchCatalog = async () => {
    try {
      const res = await api.get('/billing/catalog');
      if (!res.ok) return;
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) setCatalog(payload);
    } catch (e) { console.error('Catalog fetch failed', e); }
  };

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/billing/invoices');
      if (!res.ok) throw new Error('API down');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) setInvoices(payload);
      fetchStats();
    } catch {
      setInvoices([]);
      toast.error('Unable to connect to financial server.');
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchInvoices(); fetchCatalog(); }, []);

  const addToCart = (service) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === service.id);
      if (existing) {
        return prev.map(item => item.id === service.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...service, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const handleCharge = async () => {
    if (!patientName) return toast.error('Patient name is required');
    if (cart.length === 0) return toast.error('Add at least one service to the bill');

    const amount = finalTotal;
    try {
      const res = await api.post('/billing/pay', { 
        patient: patientName, 
        amount, 
        status: 'Paid',
        method: 'Cash' // Default for POS
      });
      if (!res.ok) throw new Error('Failed');
      
      toast.success('Payment Processed & Invoice Generated');
      setIsModalOpen(false);
      setCart([]);
      setPatientName('');
      setDiscountPercent(0);
      fetchInvoices();
    } catch {
      toast.error('Payment gateway unreachable.');
    }
  };

  const handleCollect = async (id) => {
    try {
      const res = await api.post('/billing/pay', { invoiceId: id, method: 'Cash' });
      if (!res.ok) throw new Error('Payment failed');
      toast.success('Payment collected successfully');
      fetchInvoices();
    } catch {
      toast.error('Unable to process payment');
    }
  };

  // 🏥 Real-time Bill Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const tax = afterDiscount * 0.18; // 18% GST standard
  const finalTotal = afterDiscount + tax;

  const kpis = [
    { label: 'Total Revenue', value: `$${stats.revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}`, icon: <TrendingUp size={20} />, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: 'Pending Collections', value: `$${stats.pending.toLocaleString(undefined, {minimumFractionDigits: 2})}`, icon: <CreditCard size={20} />, bg: 'bg-rose-50', color: 'text-rose-600' },
    { label: 'Total Invoices', value: stats.total, icon: <FileText size={20} />, bg: 'bg-brand-50', color: 'text-brand-600' }
  ];

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pt-2 animate-fade-in">
        <div>
          <h1 className="page-title">Revenue Cycle & Billing</h1>
          <p className="page-subtitle mt-1 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500"/>
            Secure Point-of-Sale & Financial Ledger
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary shadow-hover hover:-translate-y-0.5">
          <Plus size={16} /> New Patient Bill
        </button>
      </div>

      {/* 🏥 KPI Section */}
      <div className="grid responsive-grid mb-8">
        {loading ? <SkeletonCard count={3} /> : kpis.map((kpi, idx) => (
          <div key={idx} className="kpi-card group cursor-default">
            <div className={`h-12 w-12 rounded-2xl ${kpi.bg} ${kpi.color} mb-4 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm`}>
              {kpi.icon}
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* 🏥 Invoice Ledger */}
      <div className="clinical-card overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Receipt size={16} /></div>
            <h2 className="font-bold text-slate-800 text-base">Master Invoice Ledger</h2>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Invoice ID or Patient..." 
              value={invoiceSearch}
              onChange={e => setInvoiceSearch(e.target.value)}
              className="input pl-10 !py-2 !text-sm"
            />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="clinical-table min-w-full">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Patient Identity</th>
                <th>Date Generated</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-0 border-0"><SkeletonTable rows={5} cols={5}/></td></tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16">
                    <div className="empty-state">
                      <Receipt size={32} className="text-slate-300 mb-3" />
                      <p className="text-slate-500 font-semibold">No invoices generated yet.</p>
                      <p className="text-slate-400 text-sm mt-1">Click 'New Patient Bill' to create an invoice.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.map(i => (
                <tr key={i.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td><span className="font-mono text-sm font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded shadow-sm">{i.id}</span></td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        {i.patient?.split(' ').map(n=>n[0]).join('').slice(0,2) || 'U'}
                      </div>
                      <span className="font-bold text-slate-800">{i.patient}</span>
                    </div>
                  </td>
                  <td className="text-slate-500 font-medium text-xs font-mono">{i.date}</td>
                  <td className="font-black text-slate-900 tracking-tight">${Number(i.amount).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${i.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                      {i.status}
                    </span>
                  </td>
                  <td className="text-right">
                    {i.status !== 'Paid' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCollect(i.id); }}
                        className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 transition-all hover:shadow-sm"
                      >
                        Collect Cash
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🏥 Full-Screen Split POS Modal Phase 8F */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex flex-col animate-fade-in">
          {/* Top Bar */}
          <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between w-full flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white"><CreditCard size={16}/></div>
              <h2 className="font-black text-lg text-slate-900 tracking-tight">Point of Sale</h2>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 btn-icon bg-slate-50 text-slate-500 hover:bg-slate-200">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* ── Left Column: Service Catalog ── */}
            <div className="w-1/2 lg:w-3/5 bg-slate-50 p-6 overflow-y-auto border-r border-slate-200">
              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Service Catalog</h3>
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Search procedures, labs, consults..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} className="input pl-11 !py-3 bg-white shadow-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {catalog.length === 0 && (
                    <p className="col-span-2 text-sm text-slate-400 text-center py-4">Loading catalog…</p>
                  )}
                  {filteredCatalog.map(serv => (
                    <div 
                      key={serv.id} 
                      onClick={() => addToCart({ id: serv.id, name: serv.name, price: Number(serv.unitPrice) })}
                      className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-brand-400 hover:shadow-hover transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">{serv.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">{serv.category}{serv.code ? ` · ${serv.code}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-900">${Number(serv.unitPrice).toFixed(2)}</span>
                        <div className="h-6 w-6 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-brand-50 group-hover:text-brand-600">
                          <Plus size={14}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right Column: Invoice Summary (Dynamic Bill) ── */}
            <div className="w-1/2 lg:w-2/5 flex flex-col bg-white overflow-hidden shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)] z-10">
              {/* Patient Selection Segment */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Patient Account</label>
                 <div className="relative">
                   <User className="absolute left-4 top-3.5 h-4 w-4 text-brand-500" />
                   <input 
                     type="text" 
                     placeholder="Select or enter patient name..." 
                     value={patientName}
                     onChange={e => setPatientName(e.target.value)}
                     className="input pl-11 !py-3 !border-transparent bg-white shadow-sm focus:!border-brand-400" 
                     autoFocus
                   />
                 </div>
              </div>

              {/* Cart Items Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Charge Items</h3>
                
                {cart.length === 0 ? (
                  <div className="empty-state py-12">
                     <FileText size={32} className="text-slate-200 mb-2" />
                     <p className="text-slate-400 font-medium text-sm">Cart is empty. Select services from the left panel to add charges.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                          <p className="text-[11px] font-bold text-brand-600 mt-0.5">${item.price.toFixed(2)} / each</p>
                        </div>
                        <div className="flex items-center gap-4 border border-slate-200 rounded-lg p-1 bg-white">
                          {/* Inline Quantity Edit Phase 8F */}
                          <button onClick={() => updateQty(item.id, -1)} className="h-6 w-6 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded hover:text-slate-700 font-bold">-</button>
                          <span className="font-mono font-bold text-xs w-4 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="h-6 w-6 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded hover:text-slate-700 font-bold">+</button>
                        </div>
                        <div className="flex items-center gap-3 min-w-[70px] justify-end">
                          <span className="font-black text-slate-900 text-sm">${(item.price * item.qty).toFixed(2)}</span>
                          <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto-Calculating Financial Summary Phase 8F */}
              <div className="p-6 bg-slate-900 text-white rounded-t-3xl shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.3)]">
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between items-center text-slate-300 font-medium">
                    <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-slate-300 font-medium group relative">
                    <span className="cursor-help border-b border-dashed border-slate-500">Discount%</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" min="0" max="100" 
                        value={discountPercent} 
                        onChange={e => setDiscountPercent(Number(e.target.value))}
                        className="w-16 bg-slate-800 border-none text-right rounded py-1 px-2 text-white font-mono text-xs focus:ring-1 focus:ring-brand-500 outline-none"
                      />
                      <span className={`${discountAmount > 0 ? 'text-emerald-400' : ''}`}>-${discountAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-slate-300 font-medium">
                    <span>System Tax (18% GST)</span><span>${tax.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-t border-slate-800 pt-5 mb-6">
                  <div>
                    <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest block mb-1">Total Amount Due</span>
                    <span className="text-3xl font-black tracking-tight">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* One-click payment button Phase 8F */}
                <button 
                  onClick={handleCharge}
                  disabled={cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 transition-all active:scale-95"
                >
                  <CreditCard size={18} /> Charge & Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
