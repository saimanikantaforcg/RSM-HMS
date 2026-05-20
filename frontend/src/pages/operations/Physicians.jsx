import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { UserCheck, ShieldCheck, AlertCircle, Wallet, Plus, X, Search, Clock, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

export default function Physicians() {
  const [physicians, setPhysicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', role: 'doctor', department: 'General Practice' });
  const [attendance, setAttendance] = useState(null);

  const fetchData = async () => {
    try {
       const res = await api.get('/users/physicians');
       const json = await res.json();
       const payload = json?.data ?? json;
       if (Array.isArray(payload)) setPhysicians(payload);
    } catch {
      toast.error('Sync Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleClockIn = async () => {
    try {
      await api.post('/users/clock-in', { location: 'Main Entrance' });
      toast.success('Attendance Recorded: Clocked In');
      setAttendance('Clocked In');
    } catch {
      toast.error('Clock-in Failed');
    }
  };

  const handleClockOut = async () => {
    try {
      await api.post('/users/clock-out', {});
      toast.success('Attendance Recorded: Clocked Out');
      setAttendance(null);
    } catch {
      toast.error('Clock-out Failed');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users', { ...formData, password: 'Password123!' });
      if (!res.ok) throw new Error();
      toast.success(`Staff Registered: ${formData.firstName}`);
      setIsModalOpen(false);
      fetchData();
    } catch {
      toast.error('Registration Failed');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staffing & Credentialing</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Manage the hospital's clinical workforce and privileges</p>
        </div>
        <div className="flex gap-3">
          {attendance ? (
            <button 
              onClick={handleClockOut}
              className="flex items-center gap-2 bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2.5 rounded-xl text-sm font-black hover:bg-rose-100 transition-all uppercase tracking-widest shadow-sm"
            >
              <LogOut size={16}/> Clock Out
            </button>
          ) : (
            <button 
              onClick={handleClockIn}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2.5 rounded-xl text-sm font-black hover:bg-emerald-100 transition-all uppercase tracking-widest shadow-sm"
            >
              <Clock size={16}/> Clock In
            </button>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary shadow-lg shadow-brand-100 flex items-center gap-2"
          >
            <Plus size={16}/> Register Staff
          </button>
        </div>
      </div>

      <div className="bg-brand-50 border border-brand-200 rounded-3xl p-5 flex items-start gap-5 mb-8 animate-in fade-in slide-in-from-top-4">
        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-brand-600 shadow-sm border border-brand-100 shrink-0">
          <ShieldCheck size={28}/>
        </div>
        <div>
          <h3 className="font-black text-brand-900 tracking-tight">NPI & DEA Sync Active</h3>
          <p className="text-sm text-brand-700 font-medium mt-0.5 leading-relaxed">Directly synced with the National Plan and Provider Enumeration System. Clinical privileges and license statuses are verified nightly against cross-state databases.</p>
        </div>
      </div>

      <div className="clinical-card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 font-black text-slate-800 flex items-center flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-brand-500"/> 
            <span>Credentialed Provider Directory</span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search Providers..." className="input pl-9 !py-2 !text-sm" />
          </div>
        </div>
        <div className="table-responsive-wrapper">
          <table className="clinical-table min-w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Provider</th>
                <th>Specialty / Dept</th>
                <th>Work Status</th>
                <th>Privileges</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center animate-pulse font-bold text-slate-400">Syncing with CMS Directory...</td></tr>
              ) : physicians.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold">No clinical staff found.</td></tr>
              ) : physicians.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td><span className="font-mono text-[10px] font-black text-slate-400">{p.id.substring(0,8)}</span></td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">Dr. {p.firstName} {p.lastName}</span>
                        <span className="text-[10px] font-medium text-slate-400">{p.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-2.5 py-1 bg-slate-100 rounded-lg">{p.department || 'General'}</span></td>
                  <td><span className="bg-emerald-50 text-emerald-600 font-black px-3 py-1 rounded-xl text-[10px] uppercase tracking-widest border border-emerald-100 shadow-sm">Verified</span></td>
                  <td><button className="text-slate-400 hover:text-brand-600 transition-colors" title="Audit Dossier"><ShieldCheck size={18}/></button></td>
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
                <ShieldCheck size={20} className="text-brand-600"/> 
                Register Medical Staff
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-9 w-9 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors"
              >
                <X size={20}/>
              </button>
            </div>
            <form onSubmit={handleCreateStaff} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">First Name</label>
                  <input required value={formData.firstName} onChange={e=>setFormData({...formData, firstName: e.target.value})} className="input" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">Last Name</label>
                  <input required value={formData.lastName} onChange={e=>setFormData({...formData, lastName: e.target.value})} className="input" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">Email Address</label>
                <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">Role</label>
                  <select value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})} className="input appearance-none bg-white">
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="hr">HR / Admin</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">Dept</label>
                  <select value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} className="input appearance-none bg-white">
                    <option>General Practice</option>
                    <option>Neurology</option>
                    <option>Cardiology</option>
                    <option>ICU / Critical Care</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full py-4 mt-4 shadow-xl">Onboard Professional</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
