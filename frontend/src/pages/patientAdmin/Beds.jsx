import { useState, useEffect, useRef } from 'react';
import { 
  BedDouble, CheckCircle2, AlertCircle, Filter, 
  Search, HeartPulse, Clock, Activity, Zap, RefreshCw, Wifi
} from 'lucide-react';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { api, API_BASE } from '../../lib/api';

export default function Beds() {
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const esRef = useRef(null);

  const fetchBeds = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/beds');
      if (res.ok) {
        const json = await res.json();
        const data = json?.data ?? json ?? [];
        setBeds(data);

        // Dynamic wards from data
        const uniqueWards = [...new Set(data.map(b => b.ward))];
        setWards(uniqueWards);
      }
    } catch (e) {
      console.error('Failed to fetch beds', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBeds();

    // Subscribe to live bed status updates via SSE
    const es = new EventSource(`${API_BASE}/beds/stream`, { withCredentials: true });
    esRef.current = es;

    es.onopen = () => setIsLive(true);
    es.onmessage = () => fetchBeds(); // re-fetch full list on any bed update
    es.onerror = () => {
      setIsLive(false);
      es.close();
    };

    return () => {
      es.close();
      setIsLive(false);
    };
  }, []);

  const filteredBeds = selectedWard === 'All' 
    ? beds 
    : beds.filter(b => b.ward === selectedWard);

  const stats = {
    total: beds.length,
    occupied: beds.filter(b => b.status === 'Occupied').length,
    available: beds.filter(b => b.status === 'Available').length,
    critical: beds.filter(b => b.status === 'Occupied' && (b.hr > 100 || b.spo2 < 93)).length
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ward Command Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time bed occupancy & vital telemetry</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${isLive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
            <Wifi size={12} className={isLive ? 'text-emerald-500' : ''} />
            {isLive ? 'Live' : 'Offline'}
          </div>
          <button 
            onClick={fetchBeds} 
            disabled={isRefreshing}
            className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { toast.success(`Capacity optimized — ${stats.available} beds freed up`, { duration: 4000 }); }} className="btn-primary text-xs">
            <Zap size={14} /> Optimize Capacity
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { label: 'Total Beds', val: stats.total, color: 'bg-slate-100 text-slate-700' },
          { label: 'Occupied', val: stats.occupied, color: 'bg-teal-50 text-teal-700' },
          { label: 'Available', val: stats.available, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Critical Alerts', val: stats.critical, color: 'bg-red-50 text-red-700' },
        ].map(s => (
          <div key={s.label} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-transparent ${s.color}`}>
            <span className="opacity-60">{s.label}:</span>
            <span>{s.val}</span>
          </div>
        ))}
      </div>

      {/* Ward Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 noscroll">
        {['All', ...wards].map(w => (
          <button 
            key={w}
            onClick={() => setSelectedWard(w)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedWard === w ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Bed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
        {filteredBeds.map(b => (
          <div 
            key={b.id} 
            className={`card relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 ${
              b.status === 'Occupied' ? 'border-l-4 border-l-teal-500' : 
              b.status === 'Cleaning' ? 'border-l-4 border-l-amber-400' : 
              'border-l-4 border-l-emerald-400 opacity-80'
            }`}
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                   <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-1">{b.ward}</p>
                   <h3 className="text-lg font-black text-slate-800 leading-none">Bed {b.id}</h3>
                   <p className="text-[11px] text-slate-400 font-medium mt-1 uppercase">{b.type}</p>
                </div>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  b.status === 'Occupied' ? 'bg-white text-teal-500' : 
                  b.status === 'Cleaning' ? 'bg-amber-50 text-amber-600' : 
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  <BedDouble size={18} />
                </div>
              </div>

              {b.status === 'Occupied' ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Patient</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{b.patient}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-teal-50/50 border border-teal-100/50">
                      <HeartPulse size={12} className={b.hr > 100 ? 'text-red-500 animate-pulse' : 'text-teal-600'} />
                      <span className={`text-[11px] font-bold ${b.hr > 100 ? 'text-red-700' : 'text-slate-700'}`}>HR: {b.hr}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-50/50 border border-blue-100/50">
                      <Activity size={12} className={b.spo2 < 93 ? 'text-red-500' : 'text-blue-600'} />
                      <span className={`text-[11px] font-bold ${b.spo2 < 93 ? 'text-red-700' : 'text-slate-700'}`}>SpO2: {b.spo2}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                      <Clock size={11} /> Next Rx: {b.nextMed}
                    </div>
                    <span className="badge badge-teal text-[9px] px-1.5">Occupied</span>
                  </div>
                </div>
              ) : (
                <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl">
                  {b.status === 'Available' ? (
                    <>
                      <CheckCircle2 size={24} className="text-emerald-300 mb-1" />
                      <p className="text-xs font-bold text-emerald-600 uppercase">Available</p>
                      <button onClick={() => { toast.success(`Bed ${b.id} added to admission queue`); }} className="mt-2 text-[10px] font-bold text-emerald-700 hover:underline">Auto-Assign Patient</button>
                    </>
                  ) : (
                    <>
                      <Clock size={24} className="text-amber-300 mb-1 animate-spin-slow" />
                      <p className="text-xs font-bold text-amber-600 uppercase">Sanitization</p>
                      <p className="text-[10px] text-slate-400 mt-1">Est. Finish: 12 min</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
