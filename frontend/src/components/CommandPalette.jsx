import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, UserPlus, FlaskConical, Pill, CalendarPlus, BedDouble,
  LayoutDashboard, Users, FileText, ArrowRight, Clock, X,
} from 'lucide-react';

const ACTIONS = [
  { id: 'new-patient', label: 'Register New Patient', icon: <UserPlus size={15} />, route: '/register', group: 'Actions', kbd: 'A P' },
  { id: 'new-appt', label: 'New Appointment', icon: <CalendarPlus size={15} />, route: '/appointments', group: 'Actions', kbd: 'A A' },
  { id: 'new-lab', label: 'Order Lab Test', icon: <FlaskConical size={15} />, route: '/laboratory', group: 'Actions' },
  { id: 'new-rx', label: 'New Prescription', icon: <Pill size={15} />, route: '/eprescribing', group: 'Actions' },
  { id: 'admit', label: 'Admit Patient to IPD', icon: <BedDouble size={15} />, route: '/adt', group: 'Actions' },
  { id: 'dashboard', label: 'Go to Dashboard', icon: <LayoutDashboard size={15} />, route: '/dashboard', group: 'Navigate' },
  { id: 'patients', label: 'Patient Registry', icon: <Users size={15} />, route: '/patients', group: 'Navigate' },
  { id: 'encounters', label: 'Clinical Encounters', icon: <FileText size={15} />, route: '/encounters', group: 'Navigate' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // ── Keyboard shortcut Ctrl+K / Cmd+K ───────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
        setQuery('');
        setSelected(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const filteredActions = query.trim()
    ? ACTIONS.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))
    : ACTIONS;

  // Group items
  const groups = filteredActions.reduce((acc, item) => {
    acc[item.group] = acc[item.group] ?? [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const allItems = filteredActions;

  const handleSelectItem = useCallback((item) => {
    navigate(item.route);
    setOpen(false);
    setQuery('');
  }, [navigate]);

  // Arrow key navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allItems.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && allItems[selected]) handleSelectItem(allItems[selected]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, selected, allItems, handleSelectItem]);

  if (!open) return null;

  let globalIdx = 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[12vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Search patients, actions, or navigate..."
            className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
              <X size={14} />
            </button>
          )}
          <kbd className="text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 font-mono flex-shrink-0">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[380px] overflow-y-auto py-2">
          {Object.entries(groups).map(([groupName, items]) => (
            <div key={groupName}>
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{groupName}</p>
              {items.map((item) => {
                const idx = globalIdx++;
                return (
                  <button
                    key={item.id}
                    onMouseEnter={() => setSelected(idx)}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      selected === idx ? 'bg-teal-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${selected === idx ? 'text-teal-600' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    <span className={`flex-1 text-sm font-medium ${selected === idx ? 'text-teal-700' : 'text-slate-700'}`}>
                      {item.label}
                    </span>
                    {item.kbd && (
                      <kbd className="text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 font-mono">{item.kbd}</kbd>
                    )}
                    {selected === idx && <ArrowRight size={14} className="text-teal-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}

          {filteredActions.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">
              <Search size={20} className="mx-auto mb-2 opacity-40" />
              No results for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><kbd className="border border-slate-200 rounded px-1 font-mono">↑↓</kbd> Navigate</span>
          <span className="flex items-center gap-1"><kbd className="border border-slate-200 rounded px-1 font-mono">↵</kbd> Open</span>
          <span className="flex items-center gap-1"><kbd className="border border-slate-200 rounded px-1 font-mono">Esc</kbd> Close</span>
          <span className="ml-auto flex items-center gap-1"><Clock size={11} /> Ctrl+K to open</span>
        </div>
      </div>
    </div>
  );
}
