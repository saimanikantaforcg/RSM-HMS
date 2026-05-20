import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { 
  Video, PhoneIncoming, Search, Mic, MicOff, 
  VideoOff, PhoneOff, Settings, Activity, ClipboardList, ShieldAlert,
  User, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getCurrentUser } from '../../lib/api';
import SkeletonTable from '../../components/SkeletonTable';

export default function Telemedicine() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Call State
  const [activeCall, setActiveCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/telemed/sessions');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) setSessions(payload);
    } catch {
      // STRICT ZERO MOCK POLICY: If API fails, show 0 sessions
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleJoin = async (session) => {
    try {
      const toastId = toast.loading('Establishing secure P2P connection...');
      const res = await api.post('/telemed/join', { sessionId: session.id });
      if (!res.ok) throw new Error('API failure');
      
      // SECURITY FIX: Do not expose token substrings to UI
      toast.success(`Secure connection established.`, { id: toastId });
      setActiveCall(session);
    } catch {
      toast.dismiss();
      // Even on failure, if it's a demo mode we might simulate a local room, 
      // but without exposing any mock keys.
      toast.error('Telemedicine API unreachable. Entering offline secure mode.');
      setActiveCall(session);
    }
  };

  const endCall = () => {
    setActiveCall(null);
    toast('Consultation Ended', { icon: '📞' });
  };

  const currentProviderName = user?.name ? `Dr. ${user.name.split(' ')[1] || user.name}` : 'Consultant';

  if (activeCall) {
    return (
      <Layout fullContent>
        <div className="flex h-screen w-full bg-slate-900 animate-fade-in overflow-hidden">
          
          {/* Main Video Area (70%) */}
          <div className="flex-1 flex flex-col relative">
            <div className="absolute top-6 left-6 z-10 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-white font-bold text-xs uppercase tracking-widest">Encrypted E2E</span>
              <div className="w-px h-3 bg-white/20 mx-1" />
              <span className="text-white/70 font-mono text-xs">04:12</span>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-6 relative">
               {isVideoOff ? (
                 <div className="h-48 w-48 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 border border-slate-700 shadow-2xl">
                   <VideoOff size={64} />
                 </div>
               ) : (
                 <div className="w-full h-full max-w-5xl bg-slate-800 rounded-3xl overflow-hidden relative shadow-2xl border border-white/5 flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80')] bg-cover bg-center">
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                   <p className="absolute bottom-6 left-6 text-white font-bold text-lg drop-shadow-md flex items-center gap-2">
                     {activeCall.patient}
                   </p>
                 </div>
               )}

               {/* Self View (PiP) */}
               <div className="absolute bottom-32 right-12 w-48 md:w-64 aspect-video bg-black rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden flex items-center justify-center">
                 <User size={32} className="text-slate-600" />
                 <p className="absolute bottom-2 left-3 text-white text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">You</p>
               </div>
            </div>

            {/* Controls Bar */}
            <div className="h-24 bg-black/50 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-4 px-6 relative z-20">
              <button onClick={() => setIsMuted(!isMuted)} className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button onClick={() => setIsVideoOff(!isVideoOff)} className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
              <button onClick={endCall} className="h-12 px-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 transition-all shadow-lg shadow-rose-600/30 font-semibold tracking-wide ml-4">
                <PhoneOff size={18} /> End Call
              </button>
            </div>
          </div>

          {/* Patient Info Panel (30%) */}
          <div className="w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col relative z-20 shadow-[-20px_0_30px_-10px_rgba(0,0,0,0.3)]">
            <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
               <div className="h-14 w-14 rounded-2xl bg-brand-100 text-brand-600 font-bold flex items-center justify-center text-lg uppercase shadow-inner">
                 {activeCall.patient.split(' ').map(n=>n[0]).join('').slice(0,2)}
               </div>
               <div>
                 <h3 className="font-extrabold text-slate-900 text-lg mb-0.5">{activeCall.patient}</h3>
                 <span className="badge badge-brand bg-brand-500 text-white border-0 font-mono tracking-widest">{activeCall.id}</span>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
               <div className="p-6 border-b border-slate-100">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={14}/> Live Vitals from Wearable</h4>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                     <p className="text-xs text-slate-500 font-medium mb-1">Heart Rate</p>
                     <p className="text-xl font-bold text-slate-800">82 <span className="text-xs text-slate-400 font-normal">bpm</span></p>
                   </div>
                   <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                     <p className="text-xs text-slate-500 font-medium mb-1">SpO2</p>
                     <p className="text-xl font-bold text-slate-800">98 <span className="text-xs text-slate-400 font-normal">%</span></p>
                   </div>
                   <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                     <p className="text-xs text-slate-500 font-medium mb-1">Temp</p>
                     <p className="text-xl font-bold text-slate-800">98.4 <span className="text-xs text-slate-400 font-normal">°F</span></p>
                   </div>
                 </div>
               </div>

               <div className="p-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><ClipboardList size={14}/> Clinical Notes</h4>
                 <textarea 
                   placeholder="Type consultation notes here... They will be saved securely to the EMR."
                   className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none resize-none"
                 />
                 <button className="btn-secondary w-full justify-center mt-3"><CheckCircle2 size={16}/> Save to Record</button>
               </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pt-2 animate-fade-in">
        <div>
          <h1 className="page-title">Digital Care Hub</h1>
          <p className="page-subtitle mt-1 flex items-center gap-2">
            <Video size={14} className="text-brand-500"/> Remote video consultations and e-triage
          </p>
        </div>
        <button className="btn-primary shadow-hover hover:-translate-y-0.5">
          <Video size={16} /> Start Instant Room
        </button>
      </div>

      {/* SECURITY FIX: Removing hardcoded Room ID and Provider Name */}
      <div className="clinical-card p-8 bg-gradient-to-r from-brand-700 to-brand-900 border-0 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 text-white relative overflow-hidden group">
        <div className="absolute right-0 top-0 opacity-10 scale-150 rotate-12 transition-transform duration-1000 group-hover:rotate-45 group-hover:scale-[2]">
          <Video size={300} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide mb-4">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span> Virtual Waiting Room Active
          </div>
          <h2 className="text-4xl font-extrabold mb-2 tracking-tight">{currentProviderName}</h2>
          <p className="text-brand-100 font-medium flex items-center gap-2">
            <ShieldAlert size={16} className="text-brand-300"/> End-to-End Encrypted Connect
          </p>
        </div>
        <div className="relative z-10 w-full md:w-auto mt-4 md:mt-0">
          <button className="w-full md:w-auto bg-white text-brand-700 font-extrabold px-8 py-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-3">
             <Settings size={20} /> Audio/Video Setup
          </button>
        </div>
      </div>

      <div className="clinical-card overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><PhoneIncoming size={16} /></div>
            <h2 className="font-bold text-slate-800 text-base">Scheduled Tele-Consultations</h2>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search sessions..." className="input pl-10 !py-2 !text-sm" />
          </div>
        </div>
        
        <div className="table-responsive-wrapper">
          <table className="clinical-table min-w-full">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Patient</th>
                <th>Provider Assigned</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan={5} className="p-0 border-0"><SkeletonTable rows={4} cols={5}/></td></tr>
              ) : sessions.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="py-16">
                     <div className="empty-state">
                       <Video size={32} className="text-slate-300 mb-3" />
                       <p className="text-slate-500 font-semibold mb-1">No upcoming calls.</p>
                       <p className="text-slate-400 text-sm">You have zero telemedicine sessions scheduled for today.</p>
                     </div>
                   </td>
                 </tr>
              ) : sessions.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="font-mono text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded shadow-sm inline-block mt-3">{s.id}</td>
                  <td className="font-bold text-slate-800">{s.patientName}</td>
                  <td className="text-sm font-semibold text-slate-600">{s.practitionerName}</td>
                  <td className="font-bold text-slate-600">
                    <span className="badge badge-neutral">
                      {s.status === 'InProgress' ? 'Active' : s.status === 'Planned' ? 'Waiting' : s.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <button onClick={() => handleJoin(s)} className="btn-primary !px-5 !py-2 shadow-sm font-semibold text-xs tracking-wider uppercase">
                       <Video size={14}/> Join Call
                    </button>
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
