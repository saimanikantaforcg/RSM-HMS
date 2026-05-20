import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/api';
import { Loader2 } from 'lucide-react';

/**
 * AuthGuard (Sprint 5 — Cookie-based)
 * -------------------------------------
 * Validates the session by calling GET /api/v1/auth/me.
 * The server reads the HttpOnly accessToken cookie and returns
 * the user profile if valid, or 401 if expired/missing.
 *
 * This replaces the direct localStorage token inspection.
 * Benefits:
 *  - Token is never accessible to JavaScript (XSS-safe)
 *  - Always reflects server-side truth (revoked tokens are rejected)
 */
export default function AuthGuard({ children }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'auth' | 'unauth'

  useEffect(() => {
    getCurrentUser()
      .then((user) => setStatus(user ? 'auth' : 'unauth'))
      .catch(() => setStatus('unauth'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauth') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
