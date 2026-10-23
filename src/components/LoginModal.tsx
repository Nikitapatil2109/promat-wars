import React, { useState } from 'react';
import { Shield, Lock, AlertTriangle, KeyRound, Building, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, user: any, org: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@meridian.eco');
  const [password, setPassword] = useState('EcoMind#2026!Secured');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Store token in localStorage for cross-refresh persistence in addition to HTTP-only cookie
      localStorage.setItem('ecomind_token', data.token);
      onLoginSuccess(data.token, data.user, data.organization);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const setTestCredentials = (testEmail: string, testRole: string) => {
    setEmail(testEmail);
    setPassword('EcoMind#2026!Secured');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl text-slate-100 relative">
        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-emerald-950 border border-emerald-500/40 rounded-lg text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Enterprise Authentication</h3>
            <p className="text-xs text-slate-400">PBKDF2-SHA512 Cryptographic Handshake</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Denied</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Corporate Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              placeholder="user@enterprise.eco"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Master Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs rounded transition flex items-center justify-center gap-2 shadow"
          >
            {loading ? (
              <span className="flex items-center gap-2">Verifying credentials...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Authenticate & Establish Session
              </>
            )}
          </button>
        </form>

        {/* Provisioned Seed Credentials for Quick Role Testing */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Provisioned RBAC Testing Accounts:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setTestCredentials('admin@meridian.eco', 'Admin')}
              className="text-left p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 transition"
            >
              <div className="font-medium text-purple-300">Dr. Vance (CSO)</div>
              <div className="text-[10px] text-slate-400 font-mono">Role: Admin</div>
            </button>

            <button
              type="button"
              onClick={() => setTestCredentials('sustainability@meridian.eco', 'Manager')}
              className="text-left p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 transition"
            >
              <div className="font-medium text-emerald-300">Marcus Thorne</div>
              <div className="text-[10px] text-slate-400 font-mono">Role: ESG Manager</div>
            </button>

            <button
              type="button"
              onClick={() => setTestCredentials('auditor@meridian.eco', 'Auditor')}
              className="text-left p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 transition"
            >
              <div className="font-medium text-amber-300">Sarah Chen, CPA</div>
              <div className="text-[10px] text-slate-400 font-mono">Role: Lead Auditor</div>
            </button>

            <button
              type="button"
              onClick={() => setTestCredentials('operator@meridian.eco', 'Operator')}
              className="text-left p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 transition"
            >
              <div className="font-medium text-blue-300">Jordan Miller</div>
              <div className="text-[10px] text-slate-400 font-mono">Role: Facility Operator</div>
            </button>
          </div>

          {/* Org 2 Test */}
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => setTestCredentials('admin@apexglobal.eco', 'Apex Admin')}
              className="w-full text-left p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-xs flex items-center justify-between transition"
            >
              <div>
                <span className="font-medium text-indigo-300">Apex Manufacturing Global</span>
                <span className="text-[10px] text-slate-400 ml-2">(Tenant Isolation Test Org)</span>
              </div>
              <Building className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Password: EcoMind#2026!Secured</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Rate Limited
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xs p-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
