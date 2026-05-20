import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, KeyRound, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE, clearUserCache } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    clearUserCache(); // Clear any cached user state

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',  // Receive HttpOnly cookie from server
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message ?? 'Login failed. Please check your credentials.');
      }

      // Bootstrap CSRF token cookie for subsequent mutating requests
      await fetch(`${API_BASE}/auth/csrf-token`, { credentials: 'include' });

      // Cookie is set by server — no localStorage needed
      navigate('/dashboard');
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setError('Cannot connect to the HMS server. Please start the backend: cd services/clinical-service && npm run start:dev');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsLoading(true);
    clearUserCache();
    try {
      const res = await fetch(`${API_BASE}/auth/seed`, {
        credentials: 'include',  // Receive HttpOnly cookie
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? 'Seed failed');
      
      // Auto-login after seeding
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@hms.local', password: 'admin123' }),
      });
      const loginJson = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginJson?.message ?? 'Login failed');

      // Bootstrap CSRF token cookie
      await fetch(`${API_BASE}/auth/csrf-token`, { credentials: 'include' });

      // Cookie is set by server — navigate directly
      navigate('/dashboard');
    } catch (err) {
      setError(`Demo login failed: ${err.message}. Ensure the backend server is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-slate-100 flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-100/50 blur-3xl"></div>
        <div className="absolute top-[60%] right-[0%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-3xl"></div>
      </div>

      <div className="glass-panel w-full max-w-md p-8 rounded-3xl shadow-glass z-10 relative">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            <Stethoscope className="text-white h-8 w-8 -rotate-3" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-slate-800 mb-1">RSM HMS</h2>
        <p className="text-center text-slate-500 mb-6 tracking-wide font-medium text-sm">
          Next-Gen Hospital Management System
        </p>

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm font-medium">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              <input
                type="email"
                className="w-full bg-white/70 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all shadow-sm"
                placeholder="admin@hms.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <div className="relative group">
              <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              <input
                type="password"
                className="w-full bg-white/70 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all shadow-sm"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md mt-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <><Loader2 size={18} className="animate-spin" /> Authenticating...</>
            ) : (
              <>Authenticate Securely <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </form>

        {/* Dev-mode demo login */}
        <div className="mt-4 text-center">
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="text-xs text-slate-400 hover:text-brand-600 transition-colors underline underline-offset-4"
          >
            Use Demo Account (admin@hms.local)
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          🔒 Secured with HttpOnly cookie sessions — XSS-protected
        </p>
      </div>
    </div>
  );
}
