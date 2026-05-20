import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, RefreshCcw, Users, Filter, X } from 'lucide-react';
import Layout from '../components/Layout';
import SortableTable from '../components/SortableTable';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const genderBadge = {
  male: 'badge-info',
  female: 'badge-brand',
  other: 'badge-neutral',
};

const columns = [
  {
    key: 'mrn',
    label: 'MRN',
    render: (v) => <span className="font-mono text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded shadow-sm">{v}</span>,
  },
  {
    key: 'fullName',
    label: 'Patient Name',
    render: (v) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm">
          {v.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <span className="font-bold text-slate-800">{v}</span>
      </div>
    ),
    sortable: true,
  },
  {
    key: 'gender',
    label: 'Gender',
    render: (v) => v ? (
      <span className={`badge ${genderBadge[v.toLowerCase()] ?? 'badge-neutral'}`}>{v}</span>
    ) : '—',
    sortable: true,
  },
  {
    key: 'dob',
    label: 'Date of Birth',
    render: (v) => v ? new Date(v).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
  },
  {
    key: 'bloodGroup',
    label: 'Blood Type',
    render: (v) => v ? <span className="font-black text-rose-500 text-sm tracking-wide">{v}</span> : '—',
    sortable: false,
  },
  {
    key: 'contactNumber',
    label: 'Contact',
    render: (v) => <span className="font-medium text-slate-600 font-mono text-xs">{v ?? '—'}</span>,
  },
  {
    key: 'isActive',
    label: 'Status',
    sortable: false,
    render: (v) => (
      <span className={`badge ${v ? 'badge-success' : 'badge-neutral'}`}>
        {v ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

export default function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const LIMIT = 15;

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.set('search', search);
      const res = await api.get(`/patients?${params}`);
      if (!res.ok) throw new Error('API Error');
      const json = await res.json();
      const payload = json?.data ?? json;
      setPatients(payload?.data ?? []);
      setMeta({ total: payload?.meta?.total ?? 0, totalPages: payload?.meta?.totalPages ?? 1 });
    } catch (e) {
      console.error(e);
      // Strict Mode: No fallback mock data injected. Show empty list on error.
      toast.error('Failed to load real patient data. API may be unavailable.');
      setPatients([]);
      setMeta({ total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const seedDemoPatients = async () => {
    setSeeding(true);
    try {
      const res = await api.post('/patients/seed-demo');
      const json = await res.json();
      if (json?.data?.seeded) {
        toast.success(`Seeded ${json.data.count} demo patients!`);
        fetchPatients();
      } else {
        toast('Demo patients already exist.', { icon: 'ℹ️' });
        fetchPatients();
      }
    } catch {
      toast.error('Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Layout>
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-in">
        <div>
          <h1 className="page-title">Master Patient Index</h1>
          <p className="page-subtitle mt-1 flex items-center gap-2">
            <Users size={14} className="text-brand-500"/>
            {loading ? '...' : meta.total.toLocaleString()} total registered patients globally
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={seedDemoPatients}
            disabled={seeding || loading}
            className="btn-ghost"
          >
            <RefreshCcw size={16} className={`${seeding ? 'animate-spin' : ''} text-brand-600`} />
            <span className="hidden sm:inline">Seed Mock DB</span>
          </button>
          <button onClick={() => navigate('/register')} className="btn-primary">
            <UserPlus size={16} />
            <span className="hidden sm:inline">New Patient</span>
          </button>
        </div>
      </div>

      {/* ── Search Bar & Filters ──────────────────────────────── */}
      <div className="clinical-card p-4 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name, MRN, phone, or email..."
              className="input pl-11 !border-transparent bg-slate-50 hover:bg-slate-100 focus:bg-white focus:!border-brand-400 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-semibold"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary py-2.5 px-6">
              Search
            </button>
            <button 
              type="button" 
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary !px-3 ${showFilters ? 'bg-slate-100 border-slate-300' : ''}`}
            >
              <Filter size={18} className="text-slate-500" />
            </button>
          </div>
        </form>

        {/* Expandable Advanced Filters (Visual only for now) */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</label>
              <select className="input !py-2 !text-sm"><option>All Statuses</option><option>Active</option><option>Discharged</option></select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gender</label>
              <select className="input !py-2 !text-sm"><option>Any Gender</option><option>Male</option><option>Female</option></select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Age Range</label>
              <select className="input !py-2 !text-sm"><option>All Ages</option><option>Pediatric (0-18)</option><option>Adult (19-64)</option><option>Geriatric (65+)</option></select>
            </div>
            <div className="flex items-end flex-col justify-end">
              <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1); setShowFilters(false); }} className="text-sm font-bold text-rose-500 hover:text-rose-700 underline underline-offset-4 mb-2">Clear All Filters</button>
            </div>
          </div>
        )}
        
        {search && !showFilters && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Active Search:</span>
            <span className="badge badge-brand flex items-center gap-1">
              "{search}" <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}><X size={12} className="hover:text-brand-900" /></button>
            </span>
          </div>
        )}
      </div>

      {/* ── Main Data Table ────────────────────────────────────── */}
      <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <SortableTable
          columns={columns}
          rows={patients}
          loading={loading}
          keyField="id"
          page={page}
          total={meta.total}
          totalPages={meta.totalPages}
          limit={LIMIT}
          onPageChange={setPage}
          onRowClick={(row) => navigate(`/workspace/${row.id}`)}
          emptyTitle="No Patients Found"
          emptyMessage={search ? `No records match the query "${search}". Try adjusting your filters.` : "The global registry is empty or unreachable. Click 'Seed Mock DB' to initialize demo data."}
        />
      </div>
    </Layout>
  );
}
