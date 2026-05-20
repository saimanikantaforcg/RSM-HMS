import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import Layout from '../components/Layout';
import SortableTable from '../components/SortableTable';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const typeBadge = {
  OPD: 'bg-clinical-light text-clinical-dark border-clinical/20',
  IPD: 'bg-brand-50 text-brand-700 border-brand-200',
  ER: 'bg-danger-light text-danger-dark border-danger/20',
  Telemedicine: 'bg-purple-50 text-purple-700 border-purple-200',
  Surgery: 'bg-warning-light text-warning-dark border-warning/20',
};
const statusBadge = {
  InProgress: 'bg-warning-light text-warning-dark border-warning/20',
  Planned: 'bg-clinical-light text-clinical-dark border-clinical/20',
  Discharged: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  Arrived: 'bg-success-light text-success-dark border-success/20',
  Cancelled: 'bg-neutral-100 text-neutral-400 border-neutral-200',
};

const columns = [
  {
    key: 'patientName',
    label: 'Patient',
    render: (v) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {(v ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <span className="font-semibold text-neutral-800">{v ?? '—'}</span>
      </div>
    ),
    sortable: true,
  },
  {
    key: 'type',
    label: 'Type',
    render: (v) => (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${typeBadge[v] ?? 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>{v ?? '—'}</span>
    ),
    sortable: true,
  },
  {
    key: 'practitionerName',
    label: 'Practitioner',
    render: (v) => <span className="text-neutral-600 font-medium">{v ?? '—'}</span>,
    sortable: true,
  },
  {
    key: 'diagnosis',
    label: 'Diagnosis',
    render: (v) => <span className="text-neutral-500 text-xs font-medium">{v ?? 'Pending'}</span>,
  },
  {
    key: 'admissionDate',
    label: 'Admitted',
    render: (v) => <span className="text-neutral-400 text-xs font-medium">{v ?? '—'}</span>,
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    align: 'right',
    sortable: true,
    render: (v) => (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadge[v] ?? 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>{v ?? '—'}</span>
    ),
  },
];

export default function Encounters() {
  const navigate = useNavigate();
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const LIMIT = 15;

  const fetchEncounters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/encounters?page=${page}&limit=${LIMIT}`);
      const json = await res.json();
      const payload = json?.data ?? json;
      setEncounters(payload?.data ?? []);
      setMeta({ total: payload?.meta?.total ?? 0, totalPages: payload?.meta?.totalPages ?? 1 });
    } catch {
      toast.error('Failed to load encounters');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchEncounters(); }, [fetchEncounters]);

  const seedEncounters = async () => {
    try {
      const res = await api.post('/encounters/seed-demo');
      const json = await res.json();
      if (json?.data?.seeded) {
        toast.success(`Seeded ${json.data.count} demo encounters!`);
        fetchEncounters();
      } else {
        toast('Demo encounters already exist.', { icon: 'ℹ️' });
      }
    } catch { toast.error('Seed failed'); }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">Clinical Encounters</h1>
          <p className="text-sm text-neutral-400 font-medium mt-0.5">{meta.total} total records</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={seedEncounters} className="px-4 py-2.5 text-sm font-semibold text-neutral-600 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 shadow-sm transition-all">
            Seed Demo
          </button>
          <button onClick={() => navigate('/patients')} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl hover:shadow-hover transition-all">
            <PlusCircle size={16} /> New Encounter
          </button>
        </div>
      </div>

      <SortableTable
        columns={columns}
        rows={encounters}
        loading={loading}
        keyField="id"
        page={page}
        total={meta.total}
        totalPages={meta.totalPages}
        limit={LIMIT}
        onPageChange={setPage}
        emptyTitle="No Encounters Found"
        emptyMessage="No clinical encounters recorded yet. Click 'Seed Demo' to add sample data."
      />
    </Layout>
  );
}
