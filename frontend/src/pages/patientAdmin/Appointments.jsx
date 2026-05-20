import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { CalendarDays, CalendarPlus, X, ChevronLeft, ChevronRight, User, Clock, Filter, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import SkeletonTable from '../../components/SkeletonTable';

// Time slots from 08:00 to 18:00 (30 min increments)
const TIME_SLOTS = [];
for (let h = 8; h <= 18; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  if (h < 18) TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [physicians, setPhysicians] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProvider, setSelectedProvider] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ patient: '', time: '09:00', type: 'Consultation' });
  const [loading, setLoading] = useState(true);

  // Fetch doctors for filter
  useEffect(() => {
    api.get('/physicians/directory')
      .then(res => res.json())
      .then(d => {
        const list = d?.data ?? d ?? [];
        if (Array.isArray(list)) setPhysicians(list);
      })
      .catch(() => setPhysicians([])); // Fallback to empty if missing
  }, []);

  const fetchApts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/appointments?date=${selectedDate}&provider=${selectedProvider}`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      const payload = json?.data ?? json;
      setAppointments(Array.isArray(payload) ? payload : []);
    } catch {
      setAppointments([]);
      toast.error('Unable to connect to appointment server.');
    } finally { 
      setLoading(false); 
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchApts(); }, [selectedDate, selectedProvider]);

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        patientName: formData.patient,
        time: formData.time,
        type: formData.type,
        date: selectedDate,
        providerName: selectedProvider === 'All' ? physicians[0]?.name || 'Dr. Sarah Jenkins' : selectedProvider
      };
      
      const res = await api.post('/appointments/schedule', submitData);
      if (!res.ok) throw new Error('Schedule failed');
      
      toast.success('Appointment Scheduled');
      setIsModalOpen(false);
      setFormData({ patient: '', time: '09:00', type: 'Consultation' });
      fetchApts();
    } catch {
      toast.error('Failed to schedule. Real API endpoint unavailable.');
    }
  };

  const getSlotStatus = (time) => {
    const timeRe = new RegExp(`^${time}`); // match "09:00" against "09:00 AM" if needed
    const apt = appointments.find(a => 
      a.time.includes(time) || timeRe.test(a.time) && 
      (selectedProvider === 'All' || a.provider === selectedProvider)
    );
    if (!apt) return { status: 'available' };
    return { status: 'booked', data: apt };
  };

  const shiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="page-title">Appointments & Scheduling</h1>
          <p className="page-subtitle mt-1">Manage outpatient, teleconsults, and procedure bookings</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <CalendarPlus size={16} /> Book Appointment
        </button>
      </div>

      {/* ── Filters & Controls ─────────────────────────────── */}
      <div className="clinical-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Date Navigator */}
        <div className="flex items-center gap-3">
          <button onClick={() => shiftDate(-1)} className="btn-icon bg-slate-50 border border-slate-200">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <div className="w-40 text-center relative group">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Date</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="font-bold text-slate-800 text-sm bg-transparent border-none p-0 outline-none text-center cursor-pointer"
            />
          </div>
          <button onClick={() => shiftDate(1)} className="btn-icon bg-slate-50 border border-slate-200">
            <ChevronRight size={18} className="text-slate-600" />
          </button>
        </div>

        {/* Doctor Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-brand-50 text-brand-600 flex-shrink-0">
            <User size={18} />
          </div>
          <div className="flex-1 md:w-64">
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5 ml-1">Consultant</label>
             <select 
               value={selectedProvider} 
               onChange={e => setSelectedProvider(e.target.value)}
               className="input !py-1.5 !px-3 font-semibold text-sm"
             >
               <option value="All">All Providers</option>
               {physicians.map(p => (
                 <option key={p.id} value={p.name}>{p.name}</option>
               ))}
               {!physicians.length && <option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins (Demo)</option>}
             </select>
          </div>
        </div>
      </div>

      {/* ── Time Slot Grid ─────────────────────────────────── */}
      <div className="clinical-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Clock size={16} className="text-brand-500" />
          <h2 className="font-bold text-slate-800">Master Schedule Grid</h2>
        </div>
        
        {loading ? (
          <div className="p-6"><SkeletonTable rows={4} cols={4} /></div>
        ) : (
          <div className="p-6 overflow-x-auto pb-8">
            <div className="min-w-[800px] grid grid-cols-6 gap-3">
               {TIME_SLOTS.map(time => {
                 const { status, data } = getSlotStatus(time);
                 
                 return (
                   <div 
                     key={time} 
                     onClick={() => status === 'available' ? (setFormData({...formData, time}), setIsModalOpen(true)) : toast('Slot already booked!')}
                     className={`rounded-xl p-3 border transition-all ${
                       status === 'booked' 
                         ? 'border-brand-200 bg-brand-50 cursor-not-allowed group' 
                         : 'border-slate-200 hover:border-brand-400 hover:shadow-soft cursor-pointer hover:bg-slate-50'
                     }`}
                   >
                     <p className={`text-xs font-bold mb-2 ${status === 'booked' ? 'text-brand-700' : 'text-slate-500'}`}>
                       {time}
                     </p>
                     
                     {status === 'booked' ? (
                       <div className="animate-scale-in">
                          <p className="font-bold text-slate-800 text-sm truncate">{data.patient}</p>
                          <p className="text-[10px] font-bold text-brand-600 mt-1 uppercase tracking-widest truncate">{data.type}</p>
                          {selectedProvider === 'All' && <p className="text-[11px] text-slate-500 truncate mt-0.5">{data.provider}</p>}
                       </div>
                     ) : (
                       <div className="flex flex-col items-center justify-center py-2 opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-xs font-bold text-brand-600">Available</p>
                       </div>
                     )}
                   </div>
                 );
               })}
            </div>
          </div>
        )}
        
        {!loading && appointments.length === 0 && (
          <div className="p-6 border-t border-slate-100 bg-amber-50/50 flex items-start gap-3">
             <AlertCircle size={18} className="text-amber-500" />
             <div>
               <p className="text-sm font-bold text-amber-800">Zero Appointments</p>
               <p className="text-xs font-medium text-amber-700/70 mt-0.5">No slots are booked for this date/provider combination.</p>
             </div>
          </div>
        )}
      </div>

      {/* ── Quick-Book Modal ───────────────────────────────── */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800">Quick Book</h2>
              <button 
               onClick={() => setIsModalOpen(false)} 
               className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X size={18}/>
              </button>
            </div>
            
            <form onSubmit={handleSchedule} className="p-6 space-y-5">
              <div className="bg-brand-50 text-brand-700 text-xs font-bold px-4 py-3 rounded-xl border border-brand-100 flex items-center justify-between mb-2">
                 <span>{selectedProvider === 'All' ? 'Assign Auto-Provider' : selectedProvider}</span>
                 <span>{new Date(selectedDate).toLocaleDateString()} at {formData.time}</span>
              </div>
              
              {/* Only 3 fields as requested */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Patient Name</label>
                <input required autoFocus type="text" value={formData.patient} onChange={e => setFormData({...formData, patient: e.target.value})} className="input" placeholder="e.g. Liam Smith" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Time</label>
                   <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="input font-mono font-bold text-sm" />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Encounter Type</label>
                   <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="input font-semibold text-sm cursor-pointer">
                     <option>Consultation</option>
                     <option>Follow-up</option>
                     <option>Procedure</option>
                     <option>Telemedicine</option>
                   </select>
                 </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center shadow-hover">Confirm Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
