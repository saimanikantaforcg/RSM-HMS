import {
  LayoutDashboard, Users, FileText, Activity, Settings, LogOut,
  Stethoscope, Pill, FlaskConical, Radio, Scissors, AlertCircle, Clipboard,
  CalendarDays, BedDouble, ArrowRightLeft, Globe, Video, BookOpen,
  Receipt, TrendingUp, CreditCard, BarChart3,
  Package, Wrench, Clock, ShieldCheck, FolderOpen, UserCog,
  ChevronDown, HeartPulse, Menu, X, ScanBarcode, ChevronLeft, ChevronRight
} from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, createContext, useContext } from 'react';
import Topbar from './Topbar';
import CommandPalette from './CommandPalette';
import { getCurrentUser } from '../lib/api';
import { ErrorBoundary } from './ErrorBoundary';

const LayoutContext = createContext(false);

const navGroups = [
  {
    category: 'Main',
    items: [
      { icon: <LayoutDashboard size={18} />, label: 'Dashboard', to: '/dashboard' },
      { icon: <Stethoscope size={18} />, label: 'Patient Workspace', to: '/workspace' },
      { icon: <UserCog size={18} />, label: 'Quick Register', to: '/register' },
    ]
  },
  {
    category: 'Clinical',
    permission: 'clinical',
    items: [
      { icon: <Stethoscope size={18} />, label: 'EMR / EHR', to: '/emr' },
      { icon: <Clipboard size={18} />, label: 'OPD Management', to: '/opd' },
      { icon: <BedDouble size={18} />, label: 'IPD/Ward', to: '/ipd' },
      { icon: <Scissors size={18} />, label: 'Operation Theater', to: '/ot' },
      { icon: <AlertCircle size={18} />, label: 'Emergency', to: '/emergency' },
      { icon: <Pill size={18} />, label: 'ePrescribing', to: '/eprescribing' },
      { icon: <ScanBarcode size={18} />, label: 'BCMA', to: '/bcma' },
    ]
  },
  {
    category: 'Patient Admin',
    permission: 'patient_admin',
    items: [
      { icon: <Users size={18} />, label: 'Patients', to: '/patients' },
      { icon: <BookOpen size={18} />, label: 'Encounters', to: '/encounters' },
      { icon: <CalendarDays size={18} />, label: 'Appointments', to: '/appointments' },
      { icon: <ArrowRightLeft size={18} />, label: 'ADT', to: '/adt' },
      { icon: <BedDouble size={18} />, label: 'Beds & Census', to: '/beds' },
      { icon: <Globe size={18} />, label: 'Patient Portal', to: '/patient-portal' },
      { icon: <Video size={18} />, label: 'Telemedicine', to: '/telemedicine' },
    ]
  },
  {
    category: 'Diagnostics',
    permission: 'diagnostics',
    items: [
      { icon: <FlaskConical size={18} />, label: 'Laboratory', to: '/laboratory' },
      { icon: <Radio size={18} />, label: 'Radiology', to: '/radiology' },
      { icon: <Pill size={18} />, label: 'Pharmacy', to: '/pharmacy' },
    ]
  },
  {
    category: 'Financial',
    permission: 'billing',
    items: [
      { icon: <Receipt size={18} />, label: 'Billing', to: '/billing' },
      { icon: <TrendingUp size={18} />, label: 'Revenue Cycle', to: '/rcm' },
      { icon: <FileText size={18} />, label: 'Claims', to: '/claims' },
      { icon: <CreditCard size={18} />, label: 'Payments', to: '/payments' },
    ]
  },
  {
    category: 'Operations',
    permission: 'ops',
    items: [
      { icon: <Package size={18} />, label: 'Inventory', to: '/inventory' },
      { icon: <Wrench size={18} />, label: 'Assets', to: '/assets' },
      { icon: <Clock size={18} />, label: 'Scheduling', to: '/scheduling' },
      { icon: <UserCog size={18} />, label: 'Physicians', to: '/physicians' },
      { icon: <ShieldCheck size={18} />, label: 'Compliance', to: '/compliance' },
      { icon: <FolderOpen size={18} />, label: 'Documents', to: '/documents' },
    ]
  },
  {
    category: 'System',
    permission: 'system',
    items: [
      { icon: <Settings size={18} />, label: 'Settings', to: '/settings' },
      { icon: <ShieldCheck size={18} />, label: 'Staff Management', to: '/settings/users' },
    ]
  },
];

function NavGroup({ group, collapsed }) {
  const [open, setOpen] = useState(true);
  
  // Auto-close accordions if sidebar is collapsed
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (collapsed) setOpen(false);
  }, [collapsed]);

  return (
    <div className="mb-2">
      {!collapsed && (
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
        >
          {group.category}
          <ChevronDown size={12} className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
        </button>
      )}
      {(open || collapsed) && (
        <div className="space-y-1 mt-1">
          {group.items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2.5 rounded-xl transition-all font-semibold mx-3 ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                } ${collapsed ? 'px-0 justify-center' : 'px-4'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`transition-transform ${isActive ? 'scale-110 text-brand-600' : ''}`}>{item.icon}</span>
                  {!collapsed && <span className="flex-1 text-[13px]">{item.label}</span>}
                  {isActive && !collapsed && <div className="h-1.5 w-1.5 rounded-full bg-brand-500 shadow-sm shadow-brand-500/50" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}
      {!collapsed && <div className="mx-5 border-b border-slate-100 mt-3" />}
    </div>
  );
}

export default function Layout({ children, fullContent: propFullContent }) {
  const isNested = useContext(LayoutContext);
  const location = useLocation();

  // All hooks must be called unconditionally (Rules of Hooks)
  const [collapsed, setCollapsed] = useState(localStorage.getItem('rsm_sidebar') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const sidebarScrollerRef = useRef(null);

  useEffect(() => {
    if (isNested) return;
    getCurrentUser().then(setUser);
  }, [isNested]);

  // Restore scroll position
  useEffect(() => {
    if (isNested) return;
    if (sidebarScrollerRef.current) {
      const savedScroll = sessionStorage.getItem('rsm_sidebar_scroll');
      if (savedScroll) {
        sidebarScrollerRef.current.scrollTop = parseInt(savedScroll, 10);
      }
    }
  }, [isNested]);

  // Handle scroll save
  const handleSidebarScroll = (e) => {
    sessionStorage.setItem('rsm_sidebar_scroll', e.target.scrollTop);
  };

  // Save collapse state
  useEffect(() => {
    if (isNested) return;
    localStorage.setItem('rsm_sidebar', collapsed);
  }, [collapsed, isNested]);

  // Handle swipe left to close sidebar on mobile
  useEffect(() => {
    if (isNested) return;
    let touchStartX = 0;
    const handleTouchStart = e => touchStartX = e.touches[0].clientX;
    const handleTouchEnd = e => {
      const touchEndX = e.changedTouches[0].clientX;
      if (touchStartX - touchEndX > 50 && mobileOpen) setMobileOpen(false); // Swipe left
    };
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [mobileOpen, isNested]);

  // Auto-detect full content routes if not explicitly provided
  const isFullContentRoute = ['/workspace', '/telemedicine'].some(p => location.pathname.startsWith(p));
  const fullContent = propFullContent !== undefined ? propFullContent : isFullContentRoute;

  // If we are already inside a Layout shell, just pass through the children seamlessly!
  if (isNested) {
    return <>{children || <Outlet />}</>;
  }

  // Role-based group filtering
  const permissions = user?.permissions ?? [];
  const hasAll = permissions.includes('*:*');
  const visibleGroups = navGroups.filter(g => {
    if (!g.permission) return true;
    if (hasAll) return true;
    return permissions.some(p => p.startsWith(g.permission));
  });

  return (
    <LayoutContext.Provider value={true}>
      <div className="h-screen w-full bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
        
        {/* 🏥 Sidebar Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 🏥 Panel 1: Sidebar (Desktop Collapsible, Mobile Slide-out) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200/60 flex flex-col py-6 
        transition-all duration-300 ease-in-out shadow-lg lg:shadow-none
        ${collapsed ? 'w-20' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Area */}
        <div className={`flex items-center gap-3 px-5 mb-8 ${collapsed ? 'justify-center' : ''}`}>
          <div className="h-10 w-10 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-brand">
            <HeartPulse className="text-white h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <span className="premium-text text-lg font-black tracking-tighter text-slate-900 block leading-tight">RSM</span>
              <span className="text-[10px] text-brand-600 font-black uppercase tracking-widest block leading-tight">Clinical OS</span>
            </div>
          )}
          {/* Mobile close button */}
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Global Hub Indicator */}
        {!collapsed && (
          <div className="px-5 mb-5 animate-fade-in">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
              <div className="status-pulse"><span className="status-pulse-dot" /><span className="status-pulse-inner" /></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live System Hub</span>
            </div>
          </div>
        )}

        {/* Navigation Scroller */}
        <div 
          ref={sidebarScrollerRef}
          onScroll={handleSidebarScroll}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200"
        >
          {visibleGroups.map(group => (
            <NavGroup key={group.category} group={group} collapsed={collapsed} />
          ))}
        </div>

        {/* Bottom Expand/Collapse Toggle (Desktop only) */}
        <div className="hidden lg:flex px-4 pt-4 mt-2 justify-center">
          <button 
            onClick={() => setCollapsed(c => !c)}
            className="flex items-center justify-center w-full h-10 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all font-semibold text-xs gap-2"
          >
            {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={16} /> Collapse Sidebar</>}
          </button>
        </div>
      </aside>

      {/* 🏥 Main Architecture (Panel 2 & 3 Support) */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'lg:ml-20' : 'lg:ml-64'} h-screen overflow-y-auto relative`}>
        
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-[#f8fafccf] backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center min-h-[72px]">
          <div className="flex items-center gap-4 lg:hidden mr-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 shadow-sm"
            >
              <Menu size={18} />
            </button>
          </div>
          <Topbar />
        </header>

        {/* Main Content Area */}
        <main className={`flex-1 overflow-x-hidden ${fullContent ? '' : 'p-6 lg:p-8'}`}>
          <div className={`mx-auto ${fullContent ? 'w-full max-w-none' : 'max-w-7xl'}`}>
            <ErrorBoundary>
              {children || <Outlet />}
            </ErrorBoundary>
          </div>
        </main>
      </div>
      
      <CommandPalette />
    </div>
    </LayoutContext.Provider>
  );
}
