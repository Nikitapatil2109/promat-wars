import React, { useState, useEffect } from 'react';
import { ShieldCheck, Link2, AlertTriangle, CheckCircle, RefreshCw, Lock, Terminal } from 'lucide-react';
import type { AuditRecord, User } from '../types.ts';

interface AuditChainViewProps {
  user: User | null;
  token: string | null;
}

export const AuditChainView: React.FC<AuditChainViewProps> = ({ user, token }) => {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit?limit=50&offset=0', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.records || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Audit log fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/audit/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      setVerificationResult(data);
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    handleVerifyChain();
  }, [token]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
              <Lock className="w-3 h-3" /> SHA-256 Chained Ledger
            </span>
            <span className="text-xs text-slate-400">Append-Only Immutable Event Trail</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Cryptographic Audit & Assurance Ledger
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Every administrative mutation, emission submission, and auditor verification is bound by a SHA-256 hash pointer to the preceding block.
          </p>
        </div>

        <button
          onClick={handleVerifyChain}
          disabled={verifying}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition flex items-center gap-2 shadow disabled:opacity-50 shrink-0"
        >
          <ShieldCheck className="w-4 h-4" />
          {verifying ? 'Recomputing Block Hashes...' : 'Verify Full Audit Chain'}
        </button>
      </div>

      {/* Verification Certificate Card */}
      {verificationResult && (
        <div
          className={`border rounded-lg p-5 ${
            verificationResult.valid
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-900/40 pb-3 mb-3">
            <div className="flex items-center gap-2">
              {verificationResult.valid ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <div>
                <h3 className="font-bold text-sm text-white">
                  {verificationResult.valid
                    ? 'Audit Trail Cryptographically Verified & Intact'
                    : 'INTEGRITY COMPROMISE DETECTED'}
                </h3>
                <p className="text-xs opacity-80">{verificationResult.message}</p>
              </div>
            </div>

            <div className="text-right text-xs font-mono">
              <span className="opacity-75">Events Verified:</span>{' '}
              <strong className="text-white">{verificationResult.totalEvents}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
              <div className="text-[10px] opacity-75 uppercase">Genesis Root Hash:</div>
              <div className="text-slate-300 truncate mt-0.5">{verificationResult.rootHash}</div>
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
              <div className="text-[10px] opacity-75 uppercase">Current Tip Hash:</div>
              <div className="text-slate-300 truncate mt-0.5">{verificationResult.latestHash}</div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Events Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <h3 className="font-semibold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-emerald-400" />
            Append-Only Audit Events ({total} Recorded)
          </h3>
          <button
            onClick={fetchAuditLogs}
            className="p-1 text-slate-400 hover:text-slate-200 transition"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Event ID / Time</th>
                <th className="py-3 px-4">User & Identity</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Payload Details</th>
                <th className="py-3 px-4 font-mono">Prev Hash / Current Block Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No audit records available.
                  </td>
                </tr>
              ) : (
                logs.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/20 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-medium text-slate-200">{rec.id}</div>
                      <div className="text-[10px] text-slate-500">{rec.timestamp}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{rec.userEmail}</div>
                      <div className="text-[10px] text-slate-500 font-mono">UID: {rec.userId}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-emerald-300 border border-slate-700">
                        {rec.action}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5 capitalize">
                        Target: {rec.resource}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <pre className="text-[10px] text-slate-400 font-mono bg-slate-950/80 p-2 rounded border border-slate-800/80 max-w-xs overflow-x-auto">
                        {JSON.stringify(rec.details, null, 2)}
                      </pre>
                    </td>

                    <td className="py-3 px-4 font-mono text-[10px] max-w-xs whitespace-nowrap">
                      <div className="text-slate-500 flex items-center gap-1">
                        <span>Prev:</span>
                        <span className="truncate w-36 text-slate-400" title={rec.prevHash}>
                          {rec.prevHash}
                        </span>
                      </div>
                      <div className="text-emerald-400 flex items-center gap-1 mt-0.5 font-semibold">
                        <span>Hash:</span>
                        <span className="truncate w-36" title={rec.hash}>
                          {rec.hash}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
