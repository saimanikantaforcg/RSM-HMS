import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Droplets, Calendar, MapPin, Shield } from 'lucide-react';
import Layout from '../../components/Layout';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import SkeletonTable from '../../components/SkeletonTable';

const statusBadge = {
    InProgress: 'bg-warning-light text-warning-dark border-warning/20',
    Planned: 'bg-clinical-light text-clinical-dark border-clinical/20',
    Discharged: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    Arrived: 'bg-success-light text-success-dark border-success/20',
    Cancelled: 'bg-neutral-100 text-neutral-400 border-neutral-200',
};

export default function PatientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [encounters, setEncounters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [encLoading, setEncLoading] = useState(true);

    useEffect(() => {
        api.get(`/patients/${id}`)
            .then(r => r.json())
            .then(d => setPatient(d?.data ?? d))
            .catch(() => toast.error('Failed to load patient'))
            .finally(() => setLoading(false));

        api.get(`/encounters/patient/${id}`)
            .then(r => r.json())
            .then(d => setEncounters(d?.data ?? []))
            .catch(() => { })
            .finally(() => setEncLoading(false));
    }, [id]);

    if (loading) {
        return (
            <Layout>
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-neutral-100 rounded-xl w-1/4" />
                    <div className="h-48 bg-neutral-100 rounded-2xl" />
                </div>
            </Layout>
        );
    }

    if (!patient) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <p className="text-neutral-500 font-medium">Patient not found.</p>
                    <button onClick={() => navigate('/patients')} className="mt-4 text-brand-600 font-bold text-sm hover:underline">
                        ← Back to Patients
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Back Button */}
            <button
                onClick={() => navigate('/patients')}
                className="flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-brand-600 mb-6 transition-colors animate-fade-in"
            >
                <ArrowLeft size={16} /> Back to Patients
            </button>

            {/* Patient Header Card */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6 mb-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-black shadow-md flex-shrink-0">
                        {patient.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) ?? 'P'}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-extrabold text-neutral-900">{patient.fullName}</h1>
                        <p className="text-sm font-mono font-bold text-neutral-400 mt-0.5">{patient.mrn}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${patient.isActive ? 'bg-success-light text-success-dark border-success/20' : 'bg-neutral-100 text-neutral-400 border-neutral-200'}`}>
                                {patient.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {patient.bloodGroup && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-danger-light text-danger-dark border-danger/20">
                                    {patient.bloodGroup}
                                </span>
                            )}
                            {patient.gender && (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-neutral-100 text-neutral-600 border-neutral-200 capitalize">
                                    {patient.gender}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-neutral-100">
                    <InfoCell icon={<Calendar size={14} />} label="Date of Birth" value={patient.dob ? new Date(patient.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
                    <InfoCell icon={<Phone size={14} />} label="Contact" value={patient.contactNumber ?? '—'} />
                    <InfoCell icon={<Mail size={14} />} label="Email" value={patient.email ?? '—'} />
                    <InfoCell icon={<MapPin size={14} />} label="Address" value={patient.address ?? '—'} />
                    <InfoCell icon={<Shield size={14} />} label="Insurance" value={patient.insuranceProvider ?? '—'} />
                    <InfoCell icon={<User size={14} />} label="Nationality" value={patient.nationality ?? '—'} />
                </div>
            </div>

            {/* Encounter History */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-card p-6 animate-fade-in">
                <h2 className="text-base font-bold text-neutral-800 mb-5">Encounter History</h2>
                {encLoading ? (
                    <SkeletonTable rows={4} cols={5} />
                ) : encounters.length === 0 ? (
                    <div className="text-center py-10 text-neutral-400 text-sm">
                        No encounters recorded for this patient.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100">
                                    {['Type', 'Diagnosis', 'Practitioner', 'Admitted', 'Discharged', 'Status'].map(h => (
                                        <th key={h} className="pb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-neutral-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {encounters.map(enc => (
                                    <tr key={enc.id} className="border-b border-neutral-50 hover:bg-neutral-50/60 transition-colors">
                                        <td className="px-3 py-3.5">
                                            <span className="text-xs font-bold bg-clinical-light text-clinical-dark px-2 py-1 rounded-lg">{enc.type}</span>
                                        </td>
                                        <td className="px-3 py-3.5 font-medium text-neutral-700">{enc.diagnosis ?? '—'}</td>
                                        <td className="px-3 py-3.5 text-neutral-500">{enc.practitionerName ?? enc.practitioner ?? '—'}</td>
                                        <td className="px-3 py-3.5 text-neutral-400 text-xs">{enc.admissionDate ?? '—'}</td>
                                        <td className="px-3 py-3.5 text-neutral-400 text-xs">{enc.dischargeDate ?? '—'}</td>
                                        <td className="px-3 py-3.5">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadge[enc.status] ?? 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                                                {enc.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}

function InfoCell({ icon, label, value }) {
    return (
        <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5 mb-0.5">
                <span className="text-neutral-300">{icon}</span>{label}
            </p>
            <p className="text-sm font-semibold text-neutral-700 truncate">{value}</p>
        </div>
    );
}
