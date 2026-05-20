import React from 'react';
import { User, Activity, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

/**
 * PatientBanner — Elite Clinical Context
 * 
 * A high-density banner providing persistent identity and vital context.
 * Designed to minimize cognitive load for clinicians.
 */
const PatientBanner = ({ patient }) => {
  if (!patient) return null;

  return (
    <div className="glass-panel px-6 py-3.5 mb-6 flex items-center justify-between animate-fade-in group hover:border-teal-400/30 transition-all">
      {/* 1. Identity Context */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-white shadow-inner overflow-hidden group-hover:scale-105 transition-transform">
          <User className="text-slate-400 h-6 w-6" />
        </div>
        <div>
          <h2 className="premium-text text-lg font-bold text-slate-900 flex items-center gap-2">
            {patient.name}
            <span className="status-pulse">
              <span className="status-pulse-dot"></span>
              <span className="status-pulse-inner"></span>
            </span>
          </h2>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 uppercase tracking-tight">
            <span>PID: {patient.pid || 'P-10293'}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
            <span>{patient.gender} • {patient.age}Y</span>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
            <span className="text-teal-600">Blood Group: B+</span>
          </div>
        </div>
      </div>

      {/* 2. Vital Context (High-Density) */}
      <div className="hidden md:flex items-center gap-8 border-l border-slate-200/60 pl-8">
        <div className="text-center">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Vitals (BP)</p>
          <p className="premium-text text-base font-bold text-slate-800">120/80 <span className="text-[10px] text-slate-400">mmHg</span></p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Heart Rate</p>
          <p className="premium-text text-base font-bold text-teal-600 flex items-center justify-center gap-1">
            <Activity size={14} className="animate-pulse" />
            72 <span className="text-[10px] text-slate-400">bpm</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">SPO2</p>
          <p className="premium-text text-base font-bold text-slate-800">98%</p>
        </div>
      </div>

      {/* 3. Operational Context / Guards */}
      <div className="flex items-center gap-3">
        <div className="flex -space-x-1.5 overflow-hidden">
          <div className="inline-block h-6 w-6 rounded-full bg-red-100 border border-white flex items-center justify-center text-red-600 shadow-sm" title="Allergies Active">
            <AlertCircle size={14} />
          </div>
          <div className="inline-block h-6 w-6 rounded-full bg-teal-100 border border-white flex items-center justify-center text-teal-600 shadow-sm" title="ABDM Verified">
            <ShieldCheck size={14} />
          </div>
        </div>
        <button className="btn-premium py-1.5 px-4 rounded-lg text-xs">
          <Clock size={14} />
          Fast-Track Enc.
        </button>
      </div>
    </div>
  );
};

export default PatientBanner;
