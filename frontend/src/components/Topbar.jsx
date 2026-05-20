import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Bell, ChevronRight, LogOut, Settings, User, 
  Plus, UserPlus, FileText, FlaskConical, CalendarDays, Receipt, ChevronDown, CheckCircle2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { API_BASE, getCurrentUser, clearUserCache } from '../lib/api';
import { useNotifications } from '../lib/useNotifications';

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
}

function buildBreadcrumbs(pathname) {
  // ... existing breadcrumbs mapping logic remains unchanged, truncated to save characters
  const map = {
    '/dashboard': ['Dashboard'],
    '/emr': ['Clinical', 'EMR / EHR'],
    '/opd': ['Clinical', 'OPD Management'],
    '/ipd': ['Clinical', 'IPD Management'],
    '/ot': ['Clinical', 'Operating Theater'],
    '/emergency': ['Clinical', 'Emergency'],
    '/eprescribing': ['Clinical', 'ePrescribing'],
    '/patients': ['Patient Admin', 'Patients'],
    '/encounters': ['Patient Admin', 'Encounters'],
    '/appointments': ['Patient Admin', 'Appointments'],
    '/adt': ['Patient Admin', 'ADT Workflows'],
    '/beds': ['Patient Admin', 'Bed & Ward'],
    '/patient-portal': ['Patient Admin', 'Patient Portal'],
    '/telemedicine': ['Patient Admin', 'Telemedicine'],
    '/laboratory': ['Diagnostics', 'Laboratory'],
    '/radiology': ['Diagnostics', 'Radiology'],
    '/pharmacy': ['Diagnostics', 'Pharmacy'],
    '/billing': ['Financial', 'Billing'],
    '/rcm': ['Financial', 'Revenue Cycle'],
    '/claims': ['Financial', 'Claims'],
    '/payments': ['Financial', 'Payments'],
    '/inventory': ['Operations', 'Inventory'],
    '/assets': ['Operations', 'Assets'],
    '/scheduling': ['Operations', 'Scheduling'],
    '/physicians': ['Operations', 'Physicians'],
    '/compliance': ['Operations', 'Compliance'],
    '/documents': ['Operations', 'Documents'],
    '/analytics': ['Analytics', 'Reports'],
    '/vitals': ['Analytics', 'Vitals'],
    '/settings': ['System', 'Settings'],
  };
  return map[pathname] ?? ['Dashboard'];
}

export default function Topbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef();
  const notifRef = useRef();
  const createMenuRef = useRef();

  // SSE Realtime Hook
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (createMenuRef.current && !createMenuRef.current.contains(e.target)) setShowCreateMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.name ?? 'User';
  const role = user?.role?.replace(/_/g, ' ') ?? 'Clinician';
  const initials = getInitials(displayName);
  const crumbs = buildBreadcrumbs(pathname);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch { /* continue */ }
    clearUserCache();
    navigate('/login');
  };

  return (
    <div className="flex w-full items-center justify-between">
      {/* Breadcrumbs */}
      <nav className="hidden md:flex items-center gap-2 text-[13px] font-medium">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={14} className="text-slate-300" />}
            <span className={i === crumbs.length - 1 ? 'text-slate-800 font-bold' : 'text-slate-500'}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Global Search */}
        <div className="relative group hidden lg:block mr-2">
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-500 text-sm font-medium rounded-xl py-2 pl-10 pr-4 w-64 hover:bg-white hover:border-teal-400 hover:shadow-soft transition-all focus:outline-none"
          >
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <span className="flex-1 text-left text-slate-400 font-semibold">Search anything...</span>
            <kbd className="text-[10px] text-slate-500 bg-white border border-slate-200 rounded px-1.5 shadow-sm font-mono">⌘K</kbd>
          </button>
        </div>

        {/* Global Quick Create Menu */}
        {(user?.role === 'hospital_admin' || user?.role === 'super_admin' || user?.permissions?.includes('*:*')) && (
          <div className="relative mr-2" ref={createMenuRef}>
            <button
              onClick={() => setShowCreateMenu(m => !m)}
              className={`h-10 px-4 flex items-center gap-2 bg-slate-900 text-white rounded-xl text-[13px] font-bold hover:bg-black transition-all shadow-md shadow-slate-900/10 ${showCreateMenu ? 'bg-black' : ''}`}
            >
              <Plus size={16} /> <span>Create</span>
              <ChevronDown size={14} className={`opacity-50 transition-transform ${showCreateMenu ? 'rotate-180' : ''}`} />
            </button>
            {showCreateMenu && (
              <div className="absolute right-0 top-12 w-64 bg-white border border-slate-100 rounded-2xl shadow-card py-3 z-50 animate-scale-in origin-top-right">
                <QuickCreateLink to="/register" icon={<UserPlus size={14}/>} label="Register New Patient" color="text-brand-600" onClose={() => setShowCreateMenu(false)} />
                <QuickCreateLink to="/emr" icon={<FileText size={14}/>} label="Sign Clinical Note" color="text-purple-600" onClose={() => setShowCreateMenu(false)} />
                <QuickCreateLink to="/laboratory" icon={<FlaskConical size={14}/>} label="Order Lab Test" color="text-blue-600" onClose={() => setShowCreateMenu(false)} />
                <QuickCreateLink to="/appointments" icon={<CalendarDays size={14}/>} label="Schedule Appointment" color="text-teal-600" onClose={() => setShowCreateMenu(false)} />
                <QuickCreateLink to="/billing" icon={<Receipt size={14}/>} label="Create New Invoice" color="text-emerald-600" onClose={() => setShowCreateMenu(false)} />
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(s => !s)}
            className={`relative btn-icon h-10 w-10 ${showNotifications ? 'bg-slate-100 border-slate-300' : ''}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white animate-bounce-short">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden z-50 animate-scale-in origin-top-right">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Critical Alerts</h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{unreadCount} active pings</p>
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline">Mark all read</button>
                )}
              </div>
              
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 pb-2">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400">
                    <CheckCircle2 size={32} className="mb-2 text-slate-200" />
                    <p className="text-sm font-bold">You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="px-5 py-3 hover:bg-slate-50/50 transition-colors flex gap-4 cursor-pointer group" onClick={() => markAsRead(notif.id)}>
                      <div className="mt-1 h-2 w-2 rounded-full bg-rose-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 leading-tight">{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-2">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })} • {notif.type}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card & Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(m => !m)}
            className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-teal-100"
          >
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
            <div className="hidden sm:block text-left mr-1">
              <p className="text-[13px] font-bold text-slate-800 leading-none">{displayName}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-14 w-56 bg-white border border-slate-100 rounded-2xl shadow-card py-2 z-50 animate-scale-in origin-top-right">
              <div className="px-4 py-3 border-b border-slate-100 mb-2 bg-slate-50/50">
                <p className="text-sm font-bold text-slate-800">{displayName}</p>
                <p className="text-xs text-brand-600 font-bold uppercase tracking-wider mt-0.5">{role}</p>
              </div>
              
              <div className="px-2">
                <button onClick={() => { setShowUserMenu(false); navigate('/settings'); }} className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
                  <User size={16} className="text-slate-400" /> Profile
                </button>
                <button onClick={() => {setShowUserMenu(false); navigate('/settings');}} className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
                  <Settings size={16} className="text-slate-400" /> Settings
                </button>
              </div>
              
              <div className="w-full h-px bg-slate-100 my-2" />
              
              <div className="px-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut size={16} /> Secure Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickCreateLink({ to, icon, label, color, onClose }) {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => { navigate(to); onClose?.(); }}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-slate-600 hover:bg-brand-50 hover:text-brand-900 transition-colors border-l-2 border-transparent hover:border-brand-500"
    >
      <span className={color}>{icon}</span>
      {label}
    </button>
  );
}
