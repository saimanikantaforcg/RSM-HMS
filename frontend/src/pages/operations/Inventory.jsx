import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Package, Plus, Search, AlertCircle, X, ChevronRight, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import SkeletonTable from '../../components/SkeletonTable';

export default function Inventory() {
  const [stocks, setStocks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ itemName: '', category: 'Drug', quantity: '', unit: 'Tabs', reorderLevel: 20, location: 'Central Pharmacy' });

  const fetchData = async () => {
    try {
      const [stockRes, alertRes] = await Promise.all([
        api.get('/inventory/stocks'),
        api.get('/inventory/alerts')
      ]);
      
      const stockJson = await stockRes.json();
      const alertJson = await alertRes.json();
      
      setStocks(stockJson?.data ?? stockJson);
      setAlerts(alertJson?.data ?? alertJson);
    } catch {
      toast.error('Inventory Sync Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRestock = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/inventory/add', { ...formData, author: 'Admin' });
      if (!res.ok) throw new Error();
      toast.success(`Inventory updated: ${formData.itemName}`);
      setIsModalOpen(false);
      setFormData({ itemName: '', category: 'Drug', quantity: '', unit: 'Tabs', reorderLevel: 20, location: 'Central Pharmacy' });
      fetchData();
    } catch {
      toast.error('Failed to update stock');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory & Logistics</h1>
          <p className="text-sm text-slate-500 font-medium">Real-time supply chain and medication stock levels</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary shadow-lg shadow-brand-200/50 flex items-center gap-2 hover:-translate-y-0.5 transition-all"
        >
          <Plus size={16}/> Log Restock Shipment
        </button>
      </div>

      {/* ⚠️ Dynamic alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 gap-3 mb-8">
          {alerts.map((alert, idx) => (
            <div key={idx} className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between group animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-sm">
                  <AlertCircle size={20}/>
                </div>
                <div>
                  <h3 className="font-bold text-rose-900 leading-tight">Critical Stockout Risk: {alert.itemName}</h3>
                  <p className="text-xs text-rose-700 font-medium mt-0.5">Current: {alert.quantity} {alert.unit} · Threshold: {alert.reorderLevel}</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsModalOpen(true); setFormData({...formData, itemName: alert.itemName}); }}
                className="btn-secondary !text-rose-600 !bg-white !border-rose-200 hover:!bg-rose-100"
              >
                Restock Now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 📦 Master List */}
      <div className="clinical-card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <Package size={16} />
            </div>
            <h2 className="font-bold text-slate-800 text-base">Real-time Stock Ledger</h2>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search Master Inventory..." className="input pl-9 !py-2 !text-sm" />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="clinical-table min-w-full">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Threshold</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-0 border-0"><SkeletonTable rows={5} cols={6}/></td></tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Package size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500 font-bold text-lg">Inventory is Empty</p>
                    <p className="text-slate-400 text-sm">Add stock items to begin tracking.</p>
                  </td>
                </tr>
              ) : stocks.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{s.itemName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{s.id.substring(0,8)}</span>
                    </div>
                  </td>
                  <td><span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md capitalize">{s.category}</span></td>
                  <td>
                    <span className={`font-black text-base tracking-tight ${Number(s.quantity) <= Number(s.reorderLevel) ? 'text-rose-600' : 'text-slate-900'}`}>
                      {Number(s.quantity).toLocaleString()} <span className="text-[10px] text-slate-400 font-bold ml-0.5">{s.unit}</span>
                    </span>
                  </td>
                  <td className="text-slate-500 font-mono text-xs">{s.reorderLevel}</td>
                  <td className="text-slate-500 font-medium text-sm">{s.location || 'Central Pharmacy'}</td>
                  <td>
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                      Number(s.quantity) <= 0 ? 'bg-rose-50 text-rose-600 border-rose-200' :
                      Number(s.quantity) <= Number(s.reorderLevel) ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}>
                      {Number(s.quantity) <= 0 ? 'Out of Stock' : Number(s.quantity) <= Number(s.reorderLevel) ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🚀 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-200">
                  <Package size={20}/>
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-lg tracking-tight leading-tight">Sync New Supplies</h2>
                  <p className="text-xs text-slate-500 font-medium">Add incoming stock to the master ledger</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-10 w-10 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleRestock} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 focus-within:text-brand-600 transition-colors">
                    <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">Product Name</label>
                    <input 
                      required 
                      value={formData.itemName} 
                      onChange={e=>setFormData({...formData, itemName: e.target.value})} 
                      placeholder="e.g. Paracetamol 500mg" 
                      className="input !bg-slate-50 !border-slate-200 focus:!bg-white" 
                    />
                  </div>
                  <div className="space-y-1.5 focus-within:text-brand-600 transition-colors">
                    <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">Category</label>
                    <select 
                      value={formData.category} 
                      onChange={e=>setFormData({...formData, category: e.target.value})} 
                      className="input !bg-slate-50 !border-slate-200 focus:!bg-white appearance-none"
                    >
                      <option>Drug</option>
                      <option>Surgical Supply</option>
                      <option>Laboratory Reagent</option>
                      <option>Stationary</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5 focus-within:text-brand-600 transition-colors">
                    <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">Log Units</label>
                    <input 
                      required 
                      type="number" 
                      value={formData.quantity} 
                      onChange={e=>setFormData({...formData, quantity: e.target.value})} 
                      placeholder="+100" 
                      className="input !bg-slate-50 !border-slate-200 focus:!bg-white" 
                    />
                  </div>
                  <div className="space-y-1.5 focus-within:text-brand-600 transition-colors">
                    <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">Base Unit</label>
                    <input 
                      required 
                      value={formData.unit} 
                      onChange={e=>setFormData({...formData, unit: e.target.value})} 
                      placeholder="Vials" 
                      className="input !bg-slate-50 !border-slate-200 focus:!bg-white" 
                    />
                  </div>
                  <div className="space-y-1.5 focus-within:text-brand-600 transition-colors">
                    <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">Par Level</label>
                    <input 
                      required 
                      type="number" 
                      value={formData.reorderLevel} 
                      onChange={e=>setFormData({...formData, reorderLevel: e.target.value})} 
                      className="input !bg-slate-50 !border-slate-200 focus:!bg-white" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5 focus-within:text-brand-600 transition-colors">
                  <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">Warehouse Location</label>
                  <input 
                    required 
                    value={formData.location} 
                    onChange={e=>setFormData({...formData, location: e.target.value})} 
                    placeholder="e.g. Pharmacy Store A" 
                    className="input !bg-slate-50 !border-slate-200 focus:!bg-white" 
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn-secondary flex-1 py-4 !rounded-2xl"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1 py-4 !rounded-2xl shadow-xl shadow-brand-100"
                >
                  Release to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
