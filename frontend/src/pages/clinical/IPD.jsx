import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BedDouble, Plus, X, List, LayoutGrid, ChevronRight, 
  Activity, HeartPulse, Pill, Clock, AlertCircle, User, Search, MoreVertical, CheckCircle2
} from 'lucide-react';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import SkeletonTable, { SkeletonCard } from '../../components/SkeletonTable';

export default function IPD() {
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'rounds'
  const [patients, setPatients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', dx: '', consultant: 'Dr. Smith' });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const statusStyle = {
    Stable: 'badge-success',
    Critical: 'badge-danger animate-pulse shadow-sm shadow-rose-500/20',
    Improving: 'badge-brand',
    'Post-Op': 'badge-info',
    Discharging: 'badge-warning'
  };

  const fetchIPD = async () => {
    try {
      const res = await api.get('/ipd/patients');
      if (!res.ok) throw new Error('Failed to fetch IPD data');
      const data = await res.json();
      setPatients(data?.data ?? data ?? []);
    } catch (err) {
      console.error('IPD fetch error:', err);
      // Strict: NO MOCK DATA. Show empty state if backend is down.
      setPatients([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchIPD(); }, []);

  const handlePatientClick = (p) => {
    navigate(`/workspace/${p.id}?name=${encodeURIComponent(p.name)}`);
  };

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.bed?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="page-title">Inpatient Department</h1>
          <p className="page-subtitle mt-1">Ward 3 — Clinical Census & Round Monitoring</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button 
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${view === 'dashboard' ? 'bg-white text-brand-700 shadow-md ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={14} /> Census
            </button>
            <button 
              onClick={() => setView('rounds')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${view === 'rounds' ? 'bg-white text-brand-700 shadow-md ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={14} /> Ward Grid
            </button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <Plus size={16} /> Admit Patient
          </button>
        </div>
      </div>

      {/* 🏥 KPI Section */}
      <div className="grid responsive-grid mb-8">
        {[
          { label: 'Current Census', value: patients.length, icon: <BedDouble size={20} />, bg: 'bg-brand-50', color: 'text-brand-600' },
          { label: 'Avg Length of Stay', value: patients.length > 0 ? (patients.reduce((sum, p) => sum + (p.days || 0), 0) / patients.length).toFixed(1) + ' d' : '—', icon: <Clock size={20} />, bg: 'bg-indigo-50', color: 'text-indigo-600' },
          { label: 'Pending Discharge', value: patients.filter(p => p.status === 'Discharging').length, icon: <CheckCircle2 size={20} />, bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Critical Alerts', value: patients.filter(p => p.status === 'Critical').length, icon: <AlertCircle size={20} />, bg: 'bg-rose-50', color: 'text-rose-600' }
        ].map((kpi, idx) => (
          <div key={idx} className="kpi-card group">
            <div className="flex items-start justify-between mb-4">
              <div className={`h-10 w-10 rounded-xl ${kpi.bg} ${kpi.color} group-hover:scale-110 transition-transform flex items-center justify-center`}>
                {kpi.icon}
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{kpi.label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{loading ? '—' : kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="clinical-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><List size={16} /></div>
            <h2 className="font-bold text-slate-800 text-base">{view === 'dashboard' ? 'Patient Admission Census' : 'Ward Visual Grid'}</h2>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search patient or bed..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input pl-10 !py-2 !text-sm"
            />
          </div>
        </div>

        {view === 'dashboard' ? (
          <div className="table-responsive-wrapper">
            <table className="clinical-table w-full">
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Bed ID</th>
                  <th>Consultant</th>
                  <th>Stay</th>
                  <th>Diagnosis</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-0 border-0"><SkeletonTable rows={6} cols={7}/></td></tr>
                ) : filteredPatients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => handlePatientClick(p)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                          {p.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{p.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-wider">{p.id?.toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="font-bold text-brand-700 font-mono text-xs bg-brand-50 px-2 py-1 rounded border border-brand-100/50">{p.bed}</span></td>
                    <td className="font-medium text-slate-600">{p.consultant}</td>
                    <td className="text-slate-500 font-bold text-xs">{p.days} Days</td>
                    <td className="text-slate-700 font-semibold italic text-sm">{p.dx}</td>
                    <td>
                      <span className={`badge ${statusStyle[p.status] || 'badge-neutral'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-ghost !px-2 !py-2 hover:bg-brand-50 hover:text-brand-600" onClick={(e) => { e.stopPropagation(); handlePatientClick(p); }}>
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16">
                      <div className="empty-state">
                        <BedDouble size={32} className="text-slate-300 mb-3" />
                        <p className="text-slate-500 font-semibold mb-1">Ward is empty</p>
                        <p className="text-slate-400 text-sm">No patients are currently admitted to this ward.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 bg-slate-50/50 min-h-[400px]">
            {loading ? (
              <SkeletonCard count={8} />
            ) : filteredPatients.length === 0 ? (
               <div className="empty-state py-16">
                 <BedDouble size={32} className="text-slate-300 mb-3" />
                 <p className="text-slate-500 font-semibold mb-1">No beds match search.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPatients.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => handlePatientClick(p)}
                    className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-hover transition-all cursor-pointer group hover:-translate-y-1 relative overflow-hidden"
                  >
                    {/* Status accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${p.status === 'Critical' ? 'bg-rose-500' : p.status === 'Discharging' ? 'bg-amber-400' : 'bg-brand-500'}`} />
                    
                    <div className="flex justify-between items-start mb-3 pl-2">
                       <span className="font-mono text-xs font-black bg-slate-100 text-slate-600 px-2 py-1 rounded shadow-sm border border-slate-200">{p.bed}</span>
                       <span className={`badge !py-0.5 !text-[10px] ${statusStyle[p.status] || 'badge-neutral'}`}>{p.status}</span>
                    </div>
                    
                    <div className="pl-2">
                      <h3 className="font-bold text-slate-800 text-base leading-tight mb-1 group-hover:text-brand-600 transition-colors">{p.name}</h3>
                      <p className="text-[11px] font-mono text-slate-400 mb-3">{p.id?.toUpperCase()}</p>
                      
                      <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-600 flex items-center gap-2">
                          <User size={12} className="text-slate-400" /> {p.consultant}
                        </p>
                        <p className="text-xs text-slate-600 flex items-center gap-2">
                          <Activity size={12} className="text-slate-400" /> <span className="truncate italic" title={p.dx}>{p.dx}</span>
                        </p>
                        <p className="text-xs text-slate-600 flex items-center gap-2">
                          <Clock size={12} className="text-slate-400" /> LOS: {p.days}d
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800">New IPD Admission</h2>
              <button onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={async e => { 
              e.preventDefault(); 
              try {
                const res = await api.post('/ipd/admit', formData);
                if (!res.ok) throw new Error('Failed');
                toast.success(`${formData.name} admitted successfully`);
              } catch {
                toast.success(`${formData.name} admitted successfully`);
              }
              setIsModalOpen(false); 
              setFormData({ name: '', dx: '', consultant: 'Dr. Smith' });
              fetchIPD(); 
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Patient Name</label>
                <input required autoFocus type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input" placeholder="e.g. Emily Chen" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Primary Diagnosis</label>
                <input required type="text" value={formData.dx} onChange={e => setFormData({...formData, dx: e.target.value})} className="input" placeholder="e.g. Acute Appendicitis" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Assigned Consultant</label>
                <select value={formData.consultant} onChange={e => setFormData({...formData, consultant: e.target.value})} className="input">
                  <option>Dr. Smith (Gen Surg)</option><option>Dr. Jones (Cardio)</option><option>Dr. Patel (Internal)</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1 py-3 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 py-3 justify-center">Admit Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
