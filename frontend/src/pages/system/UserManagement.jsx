import { useState, useEffect } from 'react';
import { Users, Plus, Star, Shield, Search, UserPlus } from 'lucide-react';
import Layout from '../../components/Layout';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import SkeletonTable from '../../components/SkeletonTable';

export default function UserManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');

  // Form State
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'pharmacist',
    department: 'Pharmacy',
  });

  const roles = [
    { id: 'pharmacist', name: 'Pharmacist' },
    { id: 'lab_technician', name: 'Lab Technician' },
    { id: 'doctor', name: 'Doctor' },
    { id: 'nurse', name: 'Nurse' },
    { id: 'receptionist', name: 'Receptionist' },
    { id: 'billing_officer', name: 'Billing Officer' },
    { id: 'hr', name: 'HR Manager' },
    { id: 'hospital_admin', name: 'Hospital Admin' },
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/users');
      const json = await res.json();
      const payload = json?.data ?? json;
      setStaff(payload ?? []);
    } catch {
      toast.error('Failed to load staff list');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users', form);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Error creating user');
      }
      toast.success('Staff member created successfully');
      setShowModal(false);
      setForm({
        firstName: '', lastName: '', email: '', password: '', role: 'pharmacist', department: 'Pharmacy'
      });
      fetchStaff();
    } catch (err) {
      toast.error(err.message || 'Error creating user');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/users/${id}/toggle`, {});
      if (!res.ok) throw new Error('Failed to toggle status');
      toast.success('Status updated successfully');
      fetchStaff();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department || 'General',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/users/${selectedUser.id}`, form);
      if (!res.ok) throw new Error('Failed to update staff');
      toast.success('Staff details updated');
      setShowEditModal(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredStaff = staff.filter(s => 
    `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
              <Shield className="text-brand-600" size={24} />
              Staff Management
            </h1>
            <p className="text-sm text-neutral-500 mt-1">Manage hospital employees, system roles, and UI access.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md hover:bg-brand-700 transition-all"
          >
            <UserPlus size={16} />
            Add Employee
          </button>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {/* Toolbar */}
          <div className="p-4 border-b border-neutral-100 flex items-center gap-4 bg-neutral-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-shadow outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500 sticky top-0 z-10 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 font-semibold">Employee Name</th>
                  <th className="px-6 py-3 font-semibold">Email Account</th>
                  <th className="px-6 py-3 font-semibold">System Role</th>
                  <th className="px-6 py-3 font-semibold">Department</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr><td colSpan="5" className="p-0 border-0"><SkeletonTable rows={5} cols={5}/></td></tr>
                ) : filteredStaff.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-neutral-400">No staff found.</td></tr>
                ) : (
                  filteredStaff.map(s => (
                    <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-neutral-900 border-l-2 border-transparent">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="px-6 py-4 text-neutral-500">{s.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-100">
                          {s.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-600">{s.department || 'General'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEdit(s)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Edit Profile"
                          >
                            <Users size={16} />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(s.id)}
                            className={`p-1.5 rounded-lg transition-colors ${s.isActive ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}
                            title={s.isActive ? 'Lock Account' : 'Unlock Account'}
                          >
                            <Shield size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Staff Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <UserPlus className="text-brand-500" size={18} />
                  Add New Employee
                </h2>
                <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
              </div>
              
              <form onSubmit={handleCreate} className="p-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1">First Name</label>
                    <input required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" placeholder="Jane" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1">Last Name</label>
                    <input required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" placeholder="Smith" />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1">Email Address</label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" placeholder="jane.smith@hospital.com" />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1">Temporary Password</label>
                  <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" placeholder="••••••••" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1">System Role</label>
                    <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none">
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1">Department</label>
                    <input value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none" placeholder="Pharmacy" />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-neutral-100">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-brand-700 hover:shadow-md transition-all">Create Staff</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Staff Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Shield className="text-brand-500" size={18} />
                  Modify Staff Account
                </h2>
                <button onClick={() => setShowEditModal(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
              </div>
              
              <form onSubmit={handleUpdate} className="p-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1">First Name</label>
                    <input required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1">Last Name</label>
                    <input required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1">Email Address</label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1">System Role</label>
                    <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm">
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1">Department</label>
                    <input value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm" />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-neutral-100">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-neutral-600">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-brand-700 transition-all">Update Account</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
