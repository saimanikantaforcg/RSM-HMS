import { 
  TrendingUp, TrendingDown, Info, BrainCircuit, 
  Hourglass, AlertTriangle, CheckCircle2 
} from 'lucide-react';

export default function PredictiveInsights({ type = 'los', data = {} }) {
  if (type === 'los') {
    const isHigh = data.predicted > 5;
    return (
      <div className="card border-l-4 border-l-brand-500 overflow-hidden">
        <div className="p-4 bg-brand-50/50 border-b border-brand-100 flex justify-between items-center">
           <div className="flex items-center gap-2">
             <BrainCircuit size={16} className="text-brand-600" />
             <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider">AI LoS Prediction</h3>
           </div>
           <span className="badge badge-brand text-[9px]">Confidence: 92%</span>
        </div>
        <div className="p-5">
           <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-black text-slate-900">{data.predicted ?? '4.2'}</span>
              <span className="text-sm font-bold text-slate-500 mb-1">Days</span>
              <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full mb-1 ${isHigh ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
                 {isHigh ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                 {isHigh ? '+1.2 vs Avg' : '-0.5 vs Avg'}
              </div>
           </div>

           <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Primary Drivers</p>
              <div className="flex flex-wrap gap-2">
                 {['Age (65+)', 'Diabetes History', 'WBC Count'].map(f => (
                   <span key={f} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-medium border border-slate-200">{f}</span>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (type === 'wait-time') {
    return (
      <div className="card border-l-4 border-l-blue-500">
        <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center">
           <div className="flex items-center gap-2">
             <Hourglass size={16} className="text-blue-600" />
             <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Wait Time Forecast</h3>
           </div>
        </div>
        <div className="p-5 space-y-4">
           <div className="flex justify-between items-end">
              <div>
                 <p className="text-2xl font-black text-slate-900">18<span className="text-sm font-bold text-slate-400 ml-1">min</span></p>
                 <p className="text-[10px] font-bold text-slate-500 uppercase">Est. Triage-to-MD</p>
              </div>
              <div className="text-right">
                 <p className="text-sm font-bold text-emerald-600">Improving</p>
                 <p className="text-[10px] text-slate-400 font-medium">Next hour trend</p>
              </div>
           </div>
           
           <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
              <div className="h-full bg-emerald-400 w-1/3" />
              <div className="h-full bg-blue-400 w-1/4" />
              <div className="h-full bg-slate-200 flex-1" />
           </div>
           <p className="text-[10px] text-slate-400 italic">Prediction based on current bed turnover and pending orders.</p>
        </div>
      </div>
    );
  }

  if (type === 'readmission') {
    const risk = data.risk ?? 15;
    const isHighRisk = risk > 20;

    return (
      <div className={`card border-l-4 ${isHighRisk ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
        <div className="p-4 flex justify-between items-center border-b border-slate-50">
           <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">30-Day Readmission Risk</h3>
           {isHighRisk ? <AlertTriangle size={16} className="text-red-500 animate-pulse" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
        </div>
        <div className="p-5">
           <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 flex items-center justify-center">
                 <svg className="absolute inset-0 h-full w-full rotate-[-90deg]">
                    <circle cx="28" cy="28" r="24" className="fill-none stroke-slate-100" strokeWidth="6" />
                    <circle 
                      cx="28" cy="28" r="24" 
                      className={`fill-none ${isHighRisk ? 'stroke-red-500' : 'stroke-emerald-500'}`} 
                      strokeWidth="6" 
                      strokeDasharray={`${(risk / 100) * 150} 150`}
                    />
                 </svg>
                 <span className="text-sm font-black text-slate-800">{risk}%</span>
              </div>
              <div className="flex-1">
                 <p className={`text-xs font-bold ${isHighRisk ? 'text-red-700' : 'text-emerald-700'}`}>
                    {isHighRisk ? 'High Risk detected' : 'Low risk profile'}
                 </p>
                 <p className="text-[10px] text-slate-500 leading-tight mt-1">
                    {isHighRisk ? 'Recommend enhanced post-discharge follow-up within 48h.' : 'Standard discharge protocol recommended.'}
                 </p>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return null;
}
