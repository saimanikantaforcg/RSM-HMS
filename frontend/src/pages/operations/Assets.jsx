import { useState, useEffect } from 'react';
import { 
  Monitor, Drill, Shield, MapPin, Plus, X, 
  Activity, Battery, BatteryLow, Wifi, 
  Search, Filter, ChevronRight, Zap
} from 'lucide-react';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);
  const [_isModalOpen, setIsModalOpen] = useState(false);
  const [_loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    try {
      const res = await api.get('/assets/list');
      if (res.ok) {
        const json = await res.json();
        setAssets(json?.data ?? json ?? []);
      }
    } catch (e) {
      console.error('Failed to fetch assets', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  const stats = {
    total: assets.length,
    critical: assets.filter(a => a.type === 'Critical Care').length,
    lowBattery: assets.filter(a => a.battery < 20).length,
    active: assets.filter(a => a.status === 'In Use').length
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-slate-900">RTLS & Asset Telemetry</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time IoT Location Tracking (HIMSS Stage 7)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toast('Scanning for new BLE tags...')} className="btn-secondary text-xs">
            <Wifi size={14} /> Scan for Tags
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary text-xs">
            <Plus size={14} /> Register Asset
          </button>
        </div>
      </div>

      {/* IoT KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Tags', val: stats.total, color: 'bg-slate-50 text-slate-600' },
          { label: 'Active In-Use', val: stats.active, color: 'bg-blue-50 text-blue-700' },
          { label: 'Low Battery', val: stats.lowBattery, color: stats.lowBattery > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-700' },
          { label: 'Network Health', val: '99.8%', color: 'bg-teal-50 text-teal-700' },
        ].map(s => (
          <div key={s.label} className={`px-4 py-3 rounded-2xl border border-transparent font-bold flex flex-col ${s.color}`}>
            <span className="text-2xl">{s.val}</span>
            <span className="text-[10px] uppercase font-bold opacity-60 tracking-wider mt-1">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* RTLS MAP VIEW */}
        <div className="xl:col-span-5 flex flex-col gap-4">
           <div className="card bg-slate-900 border-none overflow-hidden aspect-square relative shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)]" />
              
              {/* Specialized Floor Plan Grid */}
              <div className="absolute inset-8 border border-slate-800 rounded-3xl grid grid-cols-4 grid-rows-4 opacity-40">
                 {Array.from({length: 16}).map((_, i) => <div key={i} className="border-[0.5px] border-slate-700/30" />)}
              </div>

              {/* Ward Labels */}
              <div className="absolute top-12 left-12 text-[10px] font-black text-slate-600 uppercase tracking-widest">Zone A: ICU</div>
              <div className="absolute top-12 right-12 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Zone B: Ward 3</div>
              <div className="absolute bottom-12 left-12 text-[10px] font-black text-slate-600 uppercase tracking-widest">Zone C: Reception</div>
              <div className="absolute bottom-12 right-12 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Zone D: ER / Trauma</div>

              {/* Asset Pings */}
              {assets.map(asset => (
                <div 
                  key={asset.id}
                  onMouseEnter={() => setHighlightedId(asset.id)}
                  onMouseLeave={() => setHighlightedId(null)}
                  className={`absolute h-4 w-4 rounded-full transition-all duration-1000 ease-in-out cursor-pointer z-20 ${
                    highlightedId === asset.id ? 'scale-150 z-30' : ''
                  } ${
                    asset.battery < 20 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 
                    asset.status === 'In Use' ? 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.6)]' :
                    'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                  }`}
                  style={{ left: `${asset.x}%`, top: `${asset.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                   <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-40" />
                   {/* Mini Label */}
                   <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white rounded-lg shadow-xl text-[9px] font-black text-slate-800 whitespace-nowrap transition-opacity duration-200 ${highlightedId === asset.id ? 'opacity-100' : 'opacity-0'}`}>
                      {asset.id}: {asset.name}
                   </div>
                </div>
              ))}

              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-[9px] font-bold text-slate-500 tracking-wider">
                 <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" /> In Use</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Available</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /> Low Battery</span>
                 </div>
                 <span className="flex items-center gap-1"><Activity size={10} className="text-emerald-500" /> Live Feed</span>
              </div>
           </div>

           <div className="card bg-amber-50 border-amber-100 p-4">
              <div className="flex gap-3 items-start">
                 <Zap size={18} className="text-amber-600 mt-1" />
                 <div>
                    <h4 className="text-sm font-bold text-amber-900">Automation Trigger Active</h4>
                    <p className="text-xs text-amber-700 leading-relaxed mt-1">If "Defibrillator X" leaves Zone D (ER), a "Theft/Misplacement" alert will be sent to Security dispatch.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* ASSET LIST */}
        <div className="xl:col-span-7 card flex flex-col">
           <div className="card-header border-none bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                 <div className="flex items-center gap-2">
                    <Monitor size={16} className="text-slate-400" />
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Fleet Inventory</h2>
                 </div>
                 <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                    <input placeholder="Search asset tag or type..." className="input-sm pl-8 py-1.5 w-64" />
                 </div>
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/30 border-b border-slate-100">
                       {['Tag', 'Asset info', 'Last Known Location', 'Status', 'Battery'].map(h => (
                         <th key={h} className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                       ))}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {assets.map(a => (
                      <tr 
                        key={a.id} 
                        onMouseEnter={() => setHighlightedId(a.id)}
                        onMouseLeave={() => setHighlightedId(null)}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer group ${highlightedId === a.id ? 'bg-slate-50/80 shadow-inner' : ''}`}
                      >
                         <td className="px-6 py-4">
                            <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded leading-none">{a.id}</span>
                         </td>
                         <td className="px-6 py-4">
                            <div>
                               <p className="text-sm font-bold text-slate-800 leading-none mb-1">{a.name}</p>
                               <p className="text-[11px] text-slate-400 font-medium uppercase tracking-tight">{a.type}</p>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                               <MapPin size={12} className="text-teal-500" />
                               <span className="text-xs font-bold text-slate-700">{a.ward}</span>
                               <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">({a.lastMoved})</span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`badge text-[9px] px-1.5 ${a.status === 'In Use' ? 'badge-blue' : a.status === 'Cleaning' ? 'badge-amber' : 'badge-green'}`}>
                               {a.status}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               <div className="flex-1 max-w-[40px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${a.battery < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${a.battery}%` }}
                                  />
                               </div>
                               <span className={`text-[10px] font-bold font-mono ${a.battery < 20 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                                 {a.battery}%
                               </span>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </Layout>
  );
}
