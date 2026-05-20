import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Calendar, Users, X, Plus, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import SkeletonTable from '../../components/SkeletonTable';

export default function Scheduling() {
  const [shifts, setShifts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ userId: '', shiftType: 'Morning', date: new Date().toISOString().split('T')[0], department: 'ER', notes: '' });

  const fetchData = async () => {
    try {
      const [rosterRes, staffRes] = await Promise.all([
        api.get('/users/roster'),
        api.get('/users/physicians')
      ]);
      const rosterJson = await rosterRes.json();
      const staffJson = await staffRes.json();
      
      const rList = rosterJson?.data ?? rosterJson;
      const sList = staffJson?.data ?? staffJson;
      setShifts(Array.isArray(rList) ? rList : []);
      setStaffList(Array.isArray(sList) ? sList : []);
    } catch {
      toast.error('Sync Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!formData.userId) return toast.error('Please select a staff member');
    try {
      const res = await api.post('/users/roster', formData);
      if (!res.ok) throw new Error();
      toast.success(`Published Shift to Directory`);
      setIsModalOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to assign shift');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Duty Roster</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Weekly shift assignments and department rotations</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-brand-100"
        >
          <Plus size={16}/> Assign Duty Roster
        </button>
      </div>

      <div className="clinical-card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 font-black text-slate-800 flex items-center gap-2 bg-slate-50/30">
          <Calendar size={18} className="text-brand-500"/> Upcoming Clinical Roster
        </div>
        
        <div className="table-responsive-wrapper">
          <table className="clinical-table min-w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Staff Member</th>
                <th>Dept / Unit</th>
                <th>Shift Type</th>
                <th>On-Call Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-0"><SkeletonTable rows={5} cols={5}/></td></tr>
              ) : shifts.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold">No active shifts in the directory.</td></tr>
              ) : shifts.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="font-bold text-slate-700">{new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center font-bold text-xs">
                        {s.user?.firstName?.[0]}{s.user?.lastName?.[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{s.user?.firstName} {s.user?.lastName}</span>
                        <span className="text-[10px] font-medium text-slate-400 capitalize">{s.user?.role}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <MapPin size={12} className="text-slate-400"/>
                      {s.department}
                    </div>
                  </td>
                  <td>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                      s.shiftType === 'Night' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                      s.shiftType === 'Morning' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      <Clock size={10} className="inline mr-1 -mt-0.5" /> {s.shiftType}
                    </span>
                  </td>
                  <td>
                    {s.isOnCall ? (
                      <span className="text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"/> On-Call
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium text-[10px]">Standard Duty</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="font-black flex items-center gap-2 text-slate-900 tracking-tight text-lg">
                <Calendar size={20} className="text-brand-600"/> 
                Assign New Duty
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleAssign} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">Select Provider</label>
                <select 
                  required 
                  value={formData.userId} 
                  onChange={e=>setFormData({...formData, userId: e.target.value})} 
                  className="input appearance-none bg-white font-bold"
                >
                  <option value="">- Select Doctor/Nurse -</option>
                  {staffList.map(st => (
                    <option key={st.id} value={st.id}>Dr. {st.firstName} {st.lastName} ({st.department})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">Service Date</label>
                  <input required type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="input" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">Shift Block</label>
                  <select value={formData.shiftType} onChange={e=>setFormData({...formData, shiftType: e.target.value})} className="input appearance-none bg-white">
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Night</option>
                    <option>Emergency</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">Target Department</label>
                <input required value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} placeholder="e.g. ICU, ER" className="input" />
              </div>
              <button type="submit" className="btn-primary w-full py-4 mt-4 shadow-xl">Publish to Directory</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
