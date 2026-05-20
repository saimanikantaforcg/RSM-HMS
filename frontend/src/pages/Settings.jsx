import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, Save, Server, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

export default function Settings() {
  const [config, setConfig] = useState({ hospitalName: 'General Hospital', theme: 'Light Mode', autoLogout: 15, notifications: true });

  useEffect(() => {
    api.get('/settings/config')
      .then(res => res.json())
      .then(data => { if (data) setConfig(data); })
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/settings/update', config);
      if (res.ok) toast.success('Global Configuration Saved');
      else throw new Error();
    } catch {
      toast.error('Failed to save configuration');
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900">System Settings</h1>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden p-8">
            <h2 className="font-bold flex items-center gap-2 mb-6 text-slate-800"><SettingsIcon size={20} className="text-brand-600"/> General Organization Preferences</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hospital Network Name</label>
                <input type="text" value={config.hospitalName} onChange={e=>setConfig({...config, hospitalName: e.target.value})} className="w-full px-4 py-3 border rounded-xl" />
              </div>

              <div className="border-t pt-5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Security & Auto-Logout</label>
                <div className="flex items-center gap-4">
                  <input type="number" value={config.autoLogout} onChange={e=>setConfig({...config, autoLogout: Number(e.target.value)})} className="w-24 px-4 py-3 border rounded-xl" /> <span className="text-slate-600 font-medium">Minutes of inactivity before auto-terminating session</span>
                </div>
              </div>

              <div className="border-t pt-5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">System Theme Default</label>
                <select value={config.theme} onChange={e=>setConfig({...config, theme: e.target.value})} className="w-full px-4 py-3 border rounded-xl bg-white">
                  <option>Light Mode</option><option>Dark Mode</option><option>Follow OS System Preference</option>
                </select>
              </div>

              <div className="border-t pt-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={config.notifications} onChange={e=>setConfig({...config, notifications: e.target.checked})} className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 focus:ring-2 focus:ring-offset-2 border-slate-300" />
                  <span className="font-bold text-slate-800">Enable Push Alerts (CDS, Labs, Emergency)</span>
                </label>
              </div>
            </div>

            <button type="submit" className="mt-8 px-6 py-3 bg-slate-900 border text-white font-bold rounded-xl shadow-sm hover:bg-black transition-colors flex items-center gap-2"><Save size={18}/> Save Global Configuration</button>
          </form>
        </div>

        <div className="space-y-5">
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl">
            <h2 className="font-bold flex items-center gap-2 mb-4 text-brand-300"><Server size={20}/> Server Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Environment</span><span className="font-bold">Production (AWS)</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Node JS</span><span className="font-bold">v32.0.1</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Database</span><span className="font-bold">PostgreSQL Aurora</span></div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700">
              <span className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 font-bold px-3 py-1.5 rounded-full text-xs border border-green-500/30">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
