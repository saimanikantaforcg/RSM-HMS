import { useState } from 'react';
import { 
  ScanBarcode, Pill, ShieldCheck, AlertOctagon, 
  RefreshCw, User, CheckCircle2, ShieldAlert, X, Fingerprint
} from 'lucide-react';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const HIGH_ALERT_DRUGS = ['Insulin', 'Heparin', 'Warfarin', 'Morphine'];
const PATIENT_ALLERGIES = ['Penicillin', 'Sulfa'];

export default function BCMA() {
  const [step, setStep] = useState('patient'); // 'patient' -> 'medication' -> 'verify'
  const [barcode, setBarcode] = useState('');
  const [scannedPatient, setScannedPatient] = useState(null);
  const [scannedMed, setScannedMed] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showDualSign, setShowDualSign] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcode) return toast.error('Scan a barcode first');
    setIsScanning(true);
    
    await new Promise(r => setTimeout(r, 600)); // Sim latency

    if (step === 'patient') {
      if (barcode.startsWith('PAT-')) {
        setScannedPatient({ name: 'Arjun Mehta', id: 'MRN-8492', bed: '3A', allergies: ['Penicillin'] });
        setStep('medication');
        toast.success('Patient Identity Verified');
      } else {
        toast.error('Invalid Patient Wristband');
      }
    } else if (step === 'medication') {
      const drugName = barcode.includes('ins') ? 'Insulin Glargine 20U' : barcode.includes('tyl') ? 'Tylenol 500mg' : 'Unknown Drug';
      const isHighAlert = HIGH_ALERT_DRUGS.some(d => drugName.includes(d));
      
      setScannedMed({ 
        name: drugName, 
        isHighAlert,
        dosage: '20 Units',
        route: 'Subcutaneous',
        verified: drugName !== 'Unknown Drug'
      });
      setStep('verify');
    }
    
    setBarcode('');
    setIsScanning(false);
  };

  const finalizeAdministration = () => {
    if (scannedMed?.isHighAlert && !showDualSign) {
      setShowDualSign(true);
      return;
    }
    toast.success('Administration Recorded in MAR');
    reset();
  };

  const reset = () => {
    setStep('patient');
    setScannedPatient(null);
    setScannedMed(null);
    setShowDualSign(false);
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">BCMA: Point-of-Care Handheld</h1>
          <p className="text-sm text-slate-500 mt-0.5">Closed-Loop 5-Rights Verification</p>
        </div>
        <button onClick={reset} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
          <RefreshCw size={12} /> Reset Flow
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Progress Stepper */}
        <div className="flex items-center gap-4 mb-8">
           {[
             { id: 'patient', label: '1. Scan Patient', active: step === 'patient', done: !!scannedPatient },
             { id: 'medication', label: '2. Scan Med', active: step === 'medication', done: !!scannedMed },
             { id: 'verify', label: '3. Finalize', active: step === 'verify', done: false }
           ].map(s => (
             <div key={s.id} className="flex-1 flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${s.active ? 'bg-teal-600 text-white shadow-sm' : s.done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                   {s.done ? <CheckCircle2 size={12} /> : s.id === 'patient' ? 1 : s.id === 'medication' ? 2 : 3}
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${s.active ? 'text-teal-700' : 'text-slate-400'}`}>{s.label}</span>
                {s.id !== 'verify' && <div className="flex-1 h-px bg-slate-100 mx-2" />}
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SCANNER WINDOW */}
          <div className="bg-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col items-center">
             <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-transparent pointer-events-none" />
             
             <div className="w-full aspect-video bg-black rounded-2xl border-4 border-slate-700 flex flex-col items-center justify-center relative overflow-hidden mb-6 shadow-inner">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_90%)] z-10" />
                <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-[ping_3s_infinite] top-1/2 z-20" />
                <ScanBarcode size={48} className="text-slate-600 relative z-0 opacity-40" />
                <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-4 relative z-0">
                  {step === 'patient' ? 'SEARCHING FOR WRISTBAND...' : 'SEARCHING FOR MEDICATION BARCODE...'}
                </p>
             </div>

             <form onSubmit={handleScan} className="w-full">
                <div className="relative">
                   <input 
                    autoFocus
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    placeholder={step === 'patient' ? "Scan Patient ID (Try 'PAT-123')..." : "Scan Medication (Try 'ins')..."}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl py-3.5 pl-4 pr-12 text-white font-mono font-bold tracking-widest outline-none focus:border-teal-500 transition-all placeholder-slate-600"
                   />
                   <button type="submit" className="absolute right-3 top-3.5 text-teal-500 hover:text-teal-400">
                     {isScanning ? <RefreshCw className="animate-spin" size={20} /> : <ScanBarcode size={24} />}
                   </button>
                </div>
             </form>
          </div>

          {/* VERIFICATION CARD */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft min-h-[340px] flex flex-col">
             {!scannedPatient ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                    <User size={32} />
                  </div>
                  <h3 className="font-bold text-slate-400">Wristband Not Scanned</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Initial patient identification is required before meds can be scanned.</p>
               </div>
             ) : (
               <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6 p-3 bg-teal-50 rounded-2xl border border-teal-100">
                     <div className="h-10 w-10 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                       {scannedPatient.name[0]}
                     </div>
                     <div>
                        <p className="text-sm font-bold text-teal-900 leading-none">{scannedPatient.name}</p>
                        <p className="text-[10px] text-teal-600 font-bold mt-1 uppercase tracking-tight">Bed {scannedPatient.bed} · {scannedPatient.id}</p>
                     </div>
                  </div>

                  {!scannedMed ? (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl">
                       <Pill size={24} className="text-slate-300 mb-2" />
                       <p className="text-xs font-bold text-slate-400">Patient Active MAR: 4 Due</p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                       <div className={`p-4 rounded-2xl border-2 ${scannedMed.verified ? 'border-emerald-100 bg-emerald-50/30' : 'border-red-100 bg-red-50/30'}`}>
                          <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-2">
                               {scannedMed.verified ? <ShieldCheck className="text-emerald-500" size={18} /> : <AlertOctagon className="text-red-500" size={18} />}
                               <p className="text-sm font-bold text-slate-800">{scannedMed.name}</p>
                             </div>
                             {scannedMed.isHighAlert && <span className="badge badge-red text-[9px] px-1.5">High Alert</span>}
                          </div>
                          <div className="flex gap-4 text-[11px] font-bold text-slate-500">
                             <span>Dose: {scannedMed.dosage}</span>
                             <span>Route: {scannedMed.route}</span>
                          </div>
                       </div>

                       {scannedMed.verified ? (
                         <button 
                            onClick={finalizeAdministration}
                            className="w-full btn-primary py-4 justify-center shadow-lg shadow-teal-500/10"
                         >
                            Confirm Administration
                         </button>
                       ) : (
                         <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex gap-2 items-start border border-red-100">
                            <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
                            Drug mismatch! Scanned med is not currently ordered for this patient.
                         </div>
                       )}
                    </div>
                  )}
               </div>
             )}
          </div>
        </div>
      </div>

      {/* DUAL SIGNATURE MODAL */}
      {showDualSign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
             <div className="p-6 text-center border-b border-slate-100">
                <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center mb-4">
                   <Fingerprint size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-800">Dual Signature Required</h2>
                <p className="text-sm text-slate-500 mt-2">
                  High-alert medication detected: <span className="font-bold text-slate-700">{scannedMed?.name}</span>. 
                  A second licensed nurse must verify.
                </p>
             </div>
             <div className="p-6 bg-slate-50">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Witness Nurse Credentials</label>
                <div className="flex gap-3">
                   <input 
                    type="password" 
                    placeholder="Witness PIN..."
                    className="flex-1 input bg-white" 
                   />
                   <button 
                    onClick={() => {toast.success('Double-Verified'); finalizeAdministration();}}
                    className="btn-primary"
                   >
                     Verify
                   </button>
                </div>
             </div>
             <div className="p-3 text-center border-t border-slate-100">
                <button onClick={() => setShowDualSign(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cancel & Re-scan</button>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
