import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Mail, MessageSquare, Plus, X, Search, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import useAuthStore from '../../store/authStore';
import SkeletonTable from '../../components/SkeletonTable';

export default function PatientPortal() {
  const [messages, setMessages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/portal/messages');
      if (!res.ok) throw new Error('API Offline');
      const json = await res.json();
      const payload = json?.data ?? json;
      if (Array.isArray(payload)) setMessages(payload);
    } catch {
      // ZERO MOCK POLICY
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData, patientName: user?.name || 'Current User' };
      const res = await api.post('/portal/message', submitData);
      if (!res.ok) throw new Error('Send failed');
      toast.success('Message Sent to Care Team');
      setIsModalOpen(false);
      setFormData({ subject: '', message: '' });
      fetchMessages();
    } catch {
      toast.error('Unable to send message (Service Offline).');
    }
  };

  const filteredMessages = messages.filter(m => 
    m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.from?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pt-2 animate-fade-in">
        <div>
          <h1 className="page-title">Patient Portal Messages</h1>
          <p className="page-subtitle mt-1 flex items-center gap-2">
            <Mail size={14} className="text-brand-500"/> Secure inbound/outbound communications
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary shadow-hover hover:-translate-y-0.5">
          <MessageSquare size={16} /> Compose Message
        </button>
      </div>

      <div className="clinical-card overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Mail size={16} /></div>
            <h2 className="font-bold text-slate-800 text-base">Secure Inbox</h2>
          </div>
          <div className="relative w-full sm:w-64">
             <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search messages..." 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="input pl-10 !py-2 !text-sm"
             />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="clinical-table min-w-full">
            <thead>
              <tr>
                <th>From</th>
                <th>Subject</th>
                <th>Date Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-0 border-0"><SkeletonTable rows={4} cols={4}/></td></tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                   <td colSpan={4} className="py-16">
                     <div className="empty-state">
                       <Mail size={32} className="text-slate-300 mb-3" />
                       <p className="text-slate-500 font-semibold mb-1">Inbox Empty</p>
                       <p className="text-slate-400 text-sm mt-1">
                         {searchQuery ? 'No messages match search.' : 'You have no secure messages at this time.'}
                       </p>
                     </div>
                   </td>
                </tr>
              ) : filteredMessages.map(m => (
                <tr key={m.id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${m.status === 'Unread' ? 'bg-brand-50/30' : ''}`}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold ${m.from === 'You' ? 'bg-slate-100 text-slate-500' : 'bg-brand-100 text-brand-600'}`}>
                        {m.from.split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </div>
                      <span className={`font-bold text-slate-800 ${m.status==='Unread' ? 'text-black' : ''}`}>{m.from}</span>
                    </div>
                  </td>
                  <td className={`font-semibold text-slate-700 ${m.status==='Unread' ? 'text-brand-700 font-extrabold' : ''}`}>{m.subject}</td>
                  <td className="text-slate-500 text-sm font-mono">{m.date}</td>
                  <td>
                    <span className={`badge ${m.status === 'Unread' ? 'badge-info' : m.status === 'Sent' ? 'badge-success' : 'badge-neutral'}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800">Secure Message</h2>
              <button onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                <X size={18}/>
              </button>
            </div>
            
            <form onSubmit={handleSend} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between mb-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sender File</span>
                 <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><User size={12}/> {user?.name || 'Current User'} (Self)</span>
              </div>
            
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Subject</label>
                <input required autoFocus type="text" value={formData.subject} onChange={e=>setFormData({...formData, subject: e.target.value})} placeholder="e.g. Question about recent labs" className="input" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Secure Note</label>
                <textarea required rows="5" value={formData.message} onChange={e=>setFormData({...formData, message: e.target.value})} placeholder="Type your message here. This is transmitted securely..." className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none resize-none" />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center shadow-hover">Encrypt & Send</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
