import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  contactNumber: z.string().regex(/^\+?[0-9\-\s()]{7,15}$/, 'Invalid phone number'),
  gender: z.enum(['male', 'female', 'other'], { message: 'Gender is required' }),
  age: z.coerce.number({ invalid_type_error: 'Age required' }).int().min(0).max(130),
  department: z.string().min(1),
  bloodGroup: z.string().optional(),
  insuranceProvider: z.string().optional(),
});

const DEPTS = ['General Medicine', 'Cardiology', 'Endocrinology', 'Orthopedics', 'Neurology', 'Pediatrics', 'Gynecology', 'Ophthalmology', 'ENT', 'Dermatology', 'Psychiatry'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

export default function QuickRegister() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', contactNumber: '', gender: undefined, age: '', department: 'General Medicine', bloodGroup: '', insuranceProvider: '' },
  });

  const gender = watch('gender');

  const onSubmit = async (form) => {
    setSubmitting(true);
    try {
      const dob = new Date(new Date().setFullYear(new Date().getFullYear() - form.age)).toISOString().split('T')[0];
      const [firstName, ...lastName] = form.fullName.trim().split(' ');
      const selectedBloodGroup = !form.bloodGroup || form.bloodGroup === 'Unknown' ? undefined : form.bloodGroup;

      const payload = {
        firstName,
        lastName: lastName.join(' ') || '.',
        contactNumber: form.contactNumber,
        gender: form.gender,
        dob,
        bloodGroup: selectedBloodGroup,
        insuranceProvider: form.insuranceProvider || undefined,
        department: form.department,
        encounterType: 'OPD',
      };

      const res = await api.post('/patients', payload);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }

      const json = await res.json();
      const patient = json?.data ?? json;
      toast.success('Patient Registered & Enqueued Successfully!');
      setSuccess({ name: form.fullName, mrn: patient?.mrn ?? 'MRN-NEW', id: patient?.id });
    } catch (err) {
      console.error('Registration error:', err);
      toast.error(err.message || 'Failed to register patient.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-10 w-full max-w-md text-center">
          <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Patient Registered!</h2>
          <p className="text-slate-600 text-base mb-1">{success.name}</p>
          <p className="font-mono text-sm text-teal-600 font-bold mb-8">{success.mrn}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => success.id ? navigate(`/workspace/${success.id}`) : navigate('/workspace')}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-all text-sm"
            >
              Open Patient Workspace →
            </button>
            <button onClick={() => navigate('/opd')} className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all text-sm">
              Add to OPD Queue
            </button>
            <button onClick={() => { setSuccess(null); reset(); }} className="w-full text-slate-500 hover:text-slate-700 font-semibold py-2 text-sm transition-all">
              Register Another Patient
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center p-6 pt-16">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-8 py-5 bg-teal-600">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <UserPlus size={20} /> Quick Registration
            </h1>
            <p className="text-xs text-teal-100 mt-0.5 font-medium">~30 seconds · 4 required fields</p>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              autoFocus
              {...register('fullName')}
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
              placeholder="e.g. Arjun Mehta"
            />
            {errors.fullName && <p className="mt-1 text-xs text-rose-500">{errors.fullName.message}</p>}
          </div>

          {/* Mobile + Age */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Mobile <span className="text-rose-500">*</span>
              </label>
              <input
                {...register('contactNumber')}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
                placeholder="+91 98765..."
                type="tel"
              />
              {errors.contactNumber && <p className="mt-1 text-xs text-rose-500">{errors.contactNumber.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Age (years) <span className="text-rose-500">*</span>
              </label>
              <input
                {...register('age')}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
                placeholder="e.g. 45"
                type="number" min="0" max="130"
              />
              {errors.age && <p className="mt-1 text-xs text-rose-500">{errors.age.message}</p>}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Gender <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['male', 'female', 'other'].map(g => (
                <button
                  type="button" key={g}
                  onClick={() => setValue('gender', g, { shouldValidate: true })}
                  className={`h-12 rounded-xl text-sm font-bold border-2 capitalize transition-all ${gender === g
                    ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:bg-teal-50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {errors.gender && <p className="mt-1 text-xs text-rose-500">{errors.gender.message}</p>}
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Department <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('department')}
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-medium text-slate-800 outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
            >
              {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Optional Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Optional</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Blood Group + Insurance */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Blood Group</label>
              <select
                {...register('bloodGroup')}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-medium text-slate-800 outline-none focus:ring-2 focus:ring-teal-400 transition-all"
              >
                <option value="">— Select —</option>
                {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Insurance / TPA</label>
              <input
                {...register('insuranceProvider')}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-400 transition-all"
                placeholder="CGHS, ESI, Star..."
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-12 bg-white border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <X size={16} /> Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-12 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus size={16} />
              {submitting ? 'Registering...' : 'Register & Add to Queue'}
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 font-medium">Patient will be added to the OPD queue automatically</p>
        </form>
      </div>
    </div>
  );
}
