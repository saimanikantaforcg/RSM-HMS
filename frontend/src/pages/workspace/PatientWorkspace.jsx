import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, AlertCircle, ChevronRight, FlaskConical, Pill,
  ClipboardList, HeartPulse, Save, Stethoscope, Clock, Activity,
  X, Plus, CheckCircle2, BedDouble, FileText, Printer
} from 'lucide-react';
import Layout from '../../components/Layout';
import PatientBanner from '../../components/PatientBanner';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

// Smart autocomplete data
const DRUG_DB = [
  { name: 'Atorvastatin 10mg', sig: 'Take 1 tablet OD at bedtime', class: 'Statin' },
  { name: 'Atorvastatin 20mg', sig: 'Take 1 tablet OD at bedtime', class: 'Statin' },
  { name: 'Atorvastatin 40mg', sig: 'Take 1 tablet OD at bedtime', class: 'Statin' },
  { name: 'Metformin 500mg', sig: 'Take 1 tablet TID with meals', class: 'Biguanide' },
  { name: 'Metformin 1000mg', sig: 'Take 1 tablet BD with meals', class: 'Biguanide' },
  { name: 'Paracetamol 500mg', sig: 'Take 1-2 tablets TID PRN pain', class: 'Analgesic' },
  { name: 'Amoxicillin 500mg', sig: 'Take 1 capsule TID x 7 days', class: 'Antibiotic' },
  { name: 'Lisinopril 5mg', sig: 'Take 1 tablet OD in morning', class: 'ACE Inhibitor' },
  { name: 'Lisinopril 10mg', sig: 'Take 1 tablet OD in morning', class: 'ACE Inhibitor' },
  { name: 'Amlodipine 5mg', sig: 'Take 1 tablet OD', class: 'CCB' },
  { name: 'Pantoprazole 40mg', sig: 'Take 1 tablet OD before breakfast', class: 'PPI' },
  { name: 'Insulin Glargine 10U', sig: 'Inject SC at bedtime', class: 'Insulin' },
];

const LAB_DB = [
  { code: 'cbc', name: 'Complete Blood Count (CBC)', turnaround: '2 hrs' },
  { code: 'bmp', name: 'Basic Metabolic Panel', turnaround: '3 hrs' },
  { code: 'lft', name: 'Liver Function Test', turnaround: '4 hrs' },
  { code: 'hba1c', name: 'HbA1c', turnaround: '4 hrs' },
  { code: 'tsh', name: 'Thyroid Stimulating Hormone (TSH)', turnaround: '6 hrs' },
  { code: 'lipid', name: 'Lipid Panel', turnaround: '4 hrs' },
  { code: 'echo', name: 'Echocardiogram', turnaround: '24 hrs' },
  { code: 'ecg', name: 'Electrocardiogram (ECG)', turnaround: '30 mins' },
  { code: 'urine', name: 'Urine Routine/Microscopy', turnaround: '2 hrs' },
  { code: 'culture', name: 'Blood Culture & Sensitivity', turnaround: '48 hrs' },
];

const TABS = [
  { id: 'notes', label: 'SOAP Notes', icon: <ClipboardList size={14} /> },
  { id: 'orders', label: 'Lab Orders', icon: <FlaskConical size={14} /> },
  { id: 'rx', label: 'Prescribe', icon: <Pill size={14} /> },
  { id: 'vitals', label: 'Vitals', icon: <HeartPulse size={14} /> },
];

// Demo patient data
const DEMO_PATIENT = {
  name: 'Arjun Mehta',
  mrn: 'MRN-8492',
  age: '47', gender: 'Male', dob: '1977-04-15',
  blood: 'B+', phone: '+91 98765 43210',
  allergies: [{ drug: 'Penicillin', severity: 'High', reaction: 'Anaphylaxis' }],
  activeMeds: ['Metformin 500mg OD', 'Atorvastatin 20mg OD'],
  diagnoses: ['Type 2 Diabetes Mellitus', 'Hypertension'],
  lastVisit: '2026-02-14',
  insurance: 'CGHS',
};

// Real clinical data state

export default function PatientWorkspace() {
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();

  // Patient data
  const [patient, setPatient] = useState(DEMO_PATIENT);
  const [_loading, setLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('notes');

  // Notes
  const [note, setNote] = useState({ subjective: '', objective: '', assessment: '', plan: '' });

  // Orders
  const [orderInput, setOrderInput] = useState('');
  const [orderSuggestions, setOrderSuggestions] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [orderPriority, setOrderPriority] = useState('Routine');

  // Rx
  const [rxInput, setRxInput] = useState('');
  const [rxSuggestions, setRxSuggestions] = useState([]);
  const [selectedRx, setSelectedRx] = useState([]);

  const [vitals, setVitals] = useState({ bp: '', hr: '', spo2: '', temp: '', rr: '', weight: '' });
  const [history, setHistory] = useState([]);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/emr/notes?patientId=${id}`);
      const json = await res.json();
      setHistory(json?.data ?? json ?? []);
    } catch (e) { console.error('History fetch failed', e); }
  };

  const fetchVitals = async () => {
    try {
      const res = await api.get(`/vitals/history?patientId=${id}`);
      const json = await res.json();
      setVitalsHistory(json?.data ?? json ?? []);
    } catch (e) { console.error('Vitals fetch failed', e); }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.get(`/patients/${id}`)
        .then(r => r.json())
        .then(d => { if (d?.data) setPatient({ ...DEMO_PATIENT, ...d.data, name: d.data.fullName ?? DEMO_PATIENT.name }); })
        .catch(() => {})
        .finally(() => setLoading(false));
      
      fetchHistory();
      fetchVitals();
    } else if (searchParams.get('name')) {
      setPatient(p => ({ ...p, name: decodeURIComponent(searchParams.get('name')) }));
    }
  }, [id, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Smart lab search
  const handleOrderInput = (val) => {
    setOrderInput(val);
    if (val.length < 2) { setOrderSuggestions([]); return; }
    const q = val.toLowerCase();
    setOrderSuggestions(LAB_DB.filter(l => l.code.includes(q) || l.name.toLowerCase().includes(q)).slice(0, 5));
  };

  const addOrder = (lab) => {
    if (!selectedOrders.find(o => o.code === lab.code)) setSelectedOrders(p => [...p, lab]);
    setOrderInput(''); setOrderSuggestions([]);
  };

  // Smart drug search
  const handleRxInput = (val) => {
    setRxInput(val);
    if (val.length < 2) { setRxSuggestions([]); return; }
    const q = val.toLowerCase();
    setRxSuggestions(DRUG_DB.filter(d => d.name.toLowerCase().includes(q)).slice(0, 6));
  };

  const addRx = (drug) => {
    if (!selectedRx.find(r => r.name === drug.name)) setSelectedRx(p => [...p, { ...drug, qty: 30 }]);
    setRxInput(''); setRxSuggestions([]);
  };

  const handleSave = async () => {
    if (!id && !patient.name) return toast.error('Patient context missing');
    setSaving(true);
    try {
      const payload = {
        patientId: id || patient.mrn,
        patientName: patient.name,
        soap: note,
        content: JSON.stringify(note),
        orders: selectedOrders,
        prescriptions: selectedRx,
        author: 'Dr. Sarah Jenkins', // In prod, get from context
        type: 'Encounter Note'
      };

      const res = await api.post('/emr/sign', payload);
      if (!res.ok) throw new Error('Sign failed');
      
      toast.success('Consultation signed & transmitted');
      setNote({ subjective: '', objective: '', assessment: '', plan: '' });
      setSelectedOrders([]);
      setSelectedRx([]);
      fetchHistory();
    } catch {
      toast.error('Failed to finalize consultation');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVitals = async () => {
    try {
      const res = await api.post('/vitals/record', {
        ...vitals,
        patientId: id || patient.mrn,
        author: 'Dr. Sarah Jenkins'
      });
      if (!res.ok) throw new Error('Vitals failed');
      toast.success('Vitals recorded');
      fetchVitals();
    } catch {
      toast.error('Failed to save vitals');
    }
  };

  // (initials computed inline in JSX where needed)

  return (
    <Layout fullContent>
      {/* ── 🏥 Elite Clinical Header ─────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20 flex-shrink-0">
        <button 
          onClick={() => navigate(-1)} 
          className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-all border border-transparent hover:border-slate-200"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="h-6 w-[1px] bg-slate-200" />
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-8 w-8 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 border border-teal-100 shadow-sm">
            <Stethoscope size={16} />
          </div>
          <h1 className="premium-text text-base font-bold text-slate-900 truncate">Clinical Encounter</h1>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">In-Progress</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => toast('Discharge preparation...', { icon: '📄' })} className="btn-secondary py-2 px-4 shadow-sm">
            <Printer size={14} /> <span className="hidden lg:inline">Summary</span>
          </button>
          <button disabled={saving} onClick={handleSave} className="btn-premium px-6 py-2">
            {saving ? <Activity size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            <span>{saving ? 'Saving...' : 'Finalize & Sign'}</span>
          </button>
        </div>
      </div>

      {/* ── High-Density Clinical Canvas ─────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <div className="p-6 pb-0">
          <PatientBanner patient={patient} />
        </div>

      {/* ── 3-Panel Workspace ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* 🏥 Panel 1: Longitudinal History (Left) */}
        <div className="w-80 flex-shrink-0 border-r border-slate-200/60 overflow-y-auto p-6 space-y-6">
          {/* Allergies — Safety First */}
          {patient.allergies?.length > 0 && (
            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 animate-scale-in">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-3 flex items-center gap-2">
                <AlertCircle size={12} /> Active Safety Alerts
              </p>
              {patient.allergies.map(a => (
                <div key={a.drug} className="bg-white/60 border border-rose-200/50 rounded-xl px-3 py-2 mb-2 last:mb-0 shadow-sm shadow-rose-200/10">
                  <p className="text-xs font-bold text-rose-900">{a.drug}</p>
                  <p className="text-[11px] text-rose-600 font-medium">Reaction: {a.reaction}</p>
                </div>
              ))}
            </div>
          )}

          {/* Active Problems / Diagnoses */}
          <div className="clinical-card p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Known Diagnoses</p>
            <div className="flex flex-wrap gap-2">
              {(patient.diagnoses ?? []).map(d => (
                <span key={d} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200/50">{d}</span>
              ))}
            </div>
          </div>

          {/* Visit History */}
          <div className="clinical-card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Longitudinal Timeline</p>
            </div>
            <div className="p-2 space-y-1">
              {history.length > 0 ? history.map((h, i) => (
                <div key={i} className="hover:bg-slate-50 p-3 rounded-xl transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{h.type}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{h.date}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-teal-700 transition-colors truncate">{h.content?.substring(0, 50) || 'Progress Note'}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{h.author}</p>
                </div>
              )) : (
                <p className="text-[10px] text-slate-400 text-center py-4">No history records found</p>
              )}
            </div>
          </div>
        </div>

        {/* 🏥 Panel 2: Clinical Workspace (Center) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white/50 backdrop-blur-sm border-r border-slate-200/60">
          {/* Action Tabs — Precision Switching */}
          <div className="flex items-center gap-1 px-6 py-4 bg-slate-50/50 border-b border-slate-200/40 flex-shrink-0">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  activeTab === t.id 
                    ? 'bg-white text-teal-700 border-teal-200 shadow-sm shadow-teal-500/5 transition-scale animate-scale-in' 
                    : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.icon}
                <span className="tracking-tight uppercase tracking-wider">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">

            {/* SOAP Notes — Structured Intake */}
            {activeTab === 'notes' && (
              <div className="space-y-4 animate-fade-in max-w-4xl mx-auto py-2">
                {[
                  { key: 'subjective', label: 'Subjective', sub: 'Patient Complaint & History', color: 'bg-teal-500' },
                  { key: 'objective', label: 'Objective', sub: 'Clinical Findings & Vitals', color: 'bg-indigo-500' },
                  { key: 'assessment', label: 'Assessment', sub: 'Diagnoses & Differentials', color: 'bg-amber-500' },
                  { key: 'plan', label: 'Plan', sub: 'Treatment, Rx & Orders', color: 'bg-emerald-500' },
                ].map(field => (
                  <div key={field.key} className="clinical-card group hover:border-teal-400/30 transition-all p-0 overflow-hidden shadow-md">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-1.5 w-1.5 rounded-full ${field.color} shadow-sm`} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{field.label}</p>
                          <p className="text-[11px] font-bold text-slate-700">{field.sub}</p>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-300 font-mono group-focus-within:text-teal-400 transition-colors uppercase">Structured Intake</div>
                    </div>
                    <textarea
                      value={note[field.key]}
                      onChange={e => setNote(n => ({ ...n, [field.key]: e.target.value }))}
                      placeholder={`Enter ${field.label.toLowerCase()} details...`}
                      rows={field.key === 'subjective' ? 4 : 3}
                      className="w-full px-6 py-4 text-sm text-slate-800 placeholder:text-slate-300 resize-none outline-none bg-transparent font-medium leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Lab Orders */}
            {activeTab === 'orders' && (
              <div className="animate-fade-in space-y-4">
                <div className="card p-3">
                  <p className="text-xs font-bold text-slate-600 mb-2">Quick Order — type test name or code (cbc, lft, hba1c...)</p>
                  <div className="relative">
                    <FlaskConical size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={orderInput}
                      onChange={e => handleOrderInput(e.target.value)}
                      placeholder="e.g. cbc, hba1c, echo..."
                      className="input pl-9"
                      autoFocus={activeTab === 'orders'}
                    />
                  </div>
                  {orderSuggestions.length > 0 && (
                    <div className="mt-1 border border-slate-200 rounded-lg overflow-hidden shadow-lg">
                      {orderSuggestions.map(s => (
                        <button
                          key={s.code}
                          onClick={() => addOrder(s)}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-teal-50 text-left border-b border-slate-100 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{s.name}</p>
                            <p className="text-xs text-slate-400">TAT: {s.turnaround}</p>
                          </div>
                          <Plus size={14} className="text-teal-500" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {['Routine', 'Urgent', 'STAT'].map(p => (
                      <button
                        key={p}
                        onClick={() => setOrderPriority(p)}
                        className={`text-xs px-3 py-1.5 rounded-md font-semibold border transition-colors ${orderPriority === p
                          ? p === 'STAT' ? 'bg-red-500 text-white border-red-500' : p === 'Urgent' ? 'bg-amber-500 text-white border-amber-500' : 'bg-teal-500 text-white border-teal-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedOrders.length > 0 && (
                  <div className="card overflow-hidden">
                    <div className="card-header">
                      <p className="text-sm font-bold text-slate-800">Selected Tests ({selectedOrders.length})</p>
                      <span className={orderPriority === 'STAT' ? 'badge badge-red' : orderPriority === 'Urgent' ? 'badge badge-amber' : 'badge badge-teal'}>{orderPriority}</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {selectedOrders.map(o => (
                        <div key={o.code} className="px-4 py-2.5 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{o.name}</p>
                            <p className="text-xs text-slate-400">TAT {o.turnaround}</p>
                          </div>
                          <button onClick={() => setSelectedOrders(p => p.filter(x => x.code !== o.code))} className="text-slate-400 hover:text-red-500">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t bg-slate-50">
                      <button className="btn-primary w-full justify-center" onClick={() => { toast.success(`${selectedOrders.length} lab order(s) submitted`); setSelectedOrders([]); }}>
                        <FlaskConical size={14} /> Submit {selectedOrders.length} Lab Order{selectedOrders.length > 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Prescription */}
            {activeTab === 'rx' && (
              <div className="animate-fade-in space-y-4">
                {patient.allergies?.length > 0 && (
                  <div className="alert-critical">
                    <AlertCircle size={15} className="flex-shrink-0" />
                    Allergy on file: {patient.allergies.map(a => a.drug).join(', ')} — CDSS active
                  </div>
                )}
                <div className="card p-3">
                  <p className="text-xs font-bold text-slate-600 mb-2">Search Medication</p>
                  <div className="relative">
                    <Pill size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={rxInput}
                      onChange={e => handleRxInput(e.target.value)}
                      placeholder="e.g. atorva, metformin, paracetamol..."
                      className="input pl-9"
                    />
                  </div>
                  {rxSuggestions.length > 0 && (
                    <div className="mt-1 border border-slate-200 rounded-lg overflow-hidden shadow-lg">
                      {rxSuggestions.map(s => (
                        <button
                          key={s.name}
                          onClick={() => addRx(s)}
                          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-teal-50 text-left border-b border-slate-100 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{s.name}</p>
                            <p className="text-xs text-slate-400">{s.sig}</p>
                          </div>
                          <span className="badge badge-blue flex-shrink-0">{s.class}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedRx.length > 0 && (
                  <div className="card overflow-hidden">
                    <div className="card-header">
                      <p className="text-sm font-bold text-slate-800">Prescription ({selectedRx.length} drug{selectedRx.length !== 1 ? 's' : ''})</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {selectedRx.map((rx, i) => (
                        <div key={rx.name} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-800">{rx.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{rx.sig}</p>
                              <input
                                type="text"
                                defaultValue={rx.sig}
                                className="input-sm mt-1.5 max-w-xs"
                                placeholder="Modify sig..."
                              />
                            </div>
                            <button onClick={() => setSelectedRx(p => p.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t bg-slate-50">
                      <button className="btn-primary w-full justify-center" onClick={() => { toast.success('Prescription transmitted (eRx)'); setSelectedRx([]); }}>
                        <Pill size={14} /> Transmit Prescription (eRx)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vitals */}
            {activeTab === 'vitals' && (
              <div className="animate-fade-in">
                <div className="card p-4">
                  <p className="text-sm font-bold text-slate-800 mb-4">Record Current Vitals</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'bp', label: 'Blood Pressure', unit: 'mmHg', placeholder: '120/80' },
                      { key: 'hr', label: 'Heart Rate', unit: 'bpm', placeholder: '72' },
                      { key: 'spo2', label: 'SpO₂', unit: '%', placeholder: '98' },
                      { key: 'temp', label: 'Temperature', unit: '°F', placeholder: '98.6' },
                      { key: 'rr', label: 'Resp. Rate', unit: '/min', placeholder: '16' },
                      { key: 'weight', label: 'Weight', unit: 'kg', placeholder: '72' },
                    ].map(v => (
                      <div key={v.key}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">{v.label} <span className="text-slate-300">{v.unit}</span></label>
                        <input
                          type="text"
                          value={vitals[v.key]}
                          onChange={e => setVitals(p => ({ ...p, [v.key]: e.target.value }))}
                          placeholder={v.placeholder}
                          className="input"
                        />
                      </div>
                    ))}
                  </div>
                  <button className="btn-primary mt-4" onClick={handleSaveVitals}>
                    <CheckCircle2 size={14} /> Save Vitals
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🏥 Panel 3: Clinical Decision Support (Right) */}
        <div className="w-80 xl:w-96 flex-shrink-0 bg-slate-50 border-l border-slate-200/60 overflow-y-auto p-6 space-y-6">
          {/* Decision Support Intelligence */}
          <div className="space-y-4 text-center">
             <div className="glass-panel p-5 bg-gradient-to-br from-teal-50 to-white border-teal-100">
                <div className="h-10 w-10 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600 mx-auto mb-3 shadow-sm border border-teal-200/50">
                  <Activity size={20} className="animate-pulse" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-teal-800 mb-1">RSM CDSS Active</h3>
                <p className="text-[11px] text-teal-600 font-bold mb-4">Real-time Clinical Insight Engine</p>
                
                <div className="space-y-2 text-left">
                  <div className="p-3 bg-white/80 border border-red-100 rounded-xl shadow-sm animate-fade-in">
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertCircle size={12} className="text-red-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Critical Alert</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-800">LDL 190 mg/dL — intensifcation recommended</p>
                  </div>
                  <div className="p-3 bg-white/80 border border-amber-100 rounded-xl shadow-sm animate-fade-in animation-delay-300">
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertCircle size={12} className="text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Observation</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-800">HbA1c 8.2% — Review adherence</p>
                  </div>
                </div>
             </div>
          </div>

          {/* Quick Diagnostics (Recent Results) */}
          <div className="clinical-card p-0">
             <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Investigations</p>
             </div>
             <div className="p-2 space-y-1">
                {vitalsHistory.length > 0 ? vitalsHistory.slice(0, 5).map((v, i) => (
                  <div key={i} className="hover:bg-slate-50 p-3 rounded-xl transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[11px] font-extrabold text-slate-800">Vital Record</span>
                       <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-teal-100 text-teal-700">Stable</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-400">BP: {v.bp} • HR: {v.hr}</span>
                       <span className="text-[9px] font-bold text-slate-300">{v.date}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400 text-center py-4 italic">No vitals on file</p>
                )}
             </div>
          </div>

          {/* Clinical Shortcuts */}
          <div className="space-y-2 pt-2">
            {[
              { label: 'Refer to Specialist', icon: <ChevronRight size={14} />, type: 'ghost' },
              { label: 'Schedule Follow-up', icon: <Clock size={14} />, type: 'ghost' },
              { label: 'View Longitudinal Data', icon: <FileText size={14} />, type: 'premium' },
            ].map(a => (
              <button 
                key={a.label} 
                className={a.type === 'premium' ? 'btn-premium w-full justify-between px-5 font-bold' : 'w-full flex items-center justify-between px-5 py-3.5 rounded-2xl hover:bg-white text-xs font-bold text-slate-600 border border-slate-200/50 hover:border-teal-200/50 transition-all hover:shadow-sm'}
              >
                {a.label} {a.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
     </div>
    </Layout>
  );
}
