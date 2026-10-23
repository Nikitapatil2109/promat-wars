import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Play,
  Database as DbIcon,
  Cpu,
  Lock,
  Download,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileCheck,
} from 'lucide-react';
import type { User } from '../types.ts';

interface SecurityConsoleViewProps {
  user: User | null;
  token: string | null;
}

export const SecurityConsoleView: React.FC<SecurityConsoleViewProps> = ({ user, token }) => {
  const [diagnostics, setDiagnostics] = useState<any | null>(null);
  const [suiteResults, setSuiteResults] = useState<any | null>(null);
  const [runningSuite, setRunningSuite] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isAuditor = user?.role === 'auditor';
  const canAccessDiagnostics = isAdmin || isAuditor;

  const fetchDiagnostics = async () => {
    if (!canAccessDiagnostics) return;
    try {
      const res = await fetch('/api/diagnostics', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnostics(data);
      }
    } catch (err) {
      console.error('Failed to load diagnostics:', err);
    }
  };

  const fetchBackups = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/admin/backups', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (err) {
      console.error('Failed to load backups:', err);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    fetchBackups();
    const interval = setInterval(fetchDiagnostics, 15000);
    return () => clearInterval(interval);
  }, [token, user]);

  const handleRunSecuritySuite = async () => {
    setRunningSuite(true);
    try {
      const res = await fetch('/api/admin/run-security-suite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      setSuiteResults(data);
      fetchDiagnostics();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRunningSuite(false);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    setBackupMessage(null);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      setBackupMessage(`Snapshot created: ${data.backup.backupFile} (Checksum: ${data.backup.checksum.slice(0, 16)}...)`);
      fetchBackups();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (filename: string) => {
    if (!confirm(`Confirm system restoration from snapshot ${filename}? An emergency pre-restore snapshot will be automatically created.`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Restore failed');
      alert(data.message);
      fetchDiagnostics();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!canAccessDiagnostics) {
    return (
      <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-lg">
        <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="font-bold text-white text-base">Restricted Operator Console</h3>
        <p className="text-xs text-slate-500 mt-1">
          Detailed system telemetry and automated security execution require Administrator or Lead Auditor clearance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
              <Activity className="w-3 h-3" /> Live Telemetry
            </span>
            <span className="text-xs text-slate-400">DevSecOps & Real Health Monitoring</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Security Governance & Automation Console
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Execute real-time security regressions, audit memory quotas, inspect database latency, and manage encrypted system recovery snapshots.
          </p>
        </div>

        <button
          onClick={handleRunSecuritySuite}
          disabled={runningSuite}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition flex items-center gap-2 shadow disabled:opacity-50 shrink-0"
        >
          <Play className="w-4 h-4 fill-white" />
          {runningSuite ? 'Running Security Suite...' : 'Run Live Security Suite'}
        </button>
      </div>

      {/* Real Diagnostics Measurements Grid */}
      {diagnostics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>DB Latency (Read / Write)</span>
              <DbIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {diagnostics.database.readLatencyMs}ms / {diagnostics.database.writeLatencyMs}ms
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Total DB Records: <span className="font-mono text-slate-300">{diagnostics.database.totalRecords}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Process Heap / RSS</span>
              <Cpu className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {diagnostics.process.memoryHeapMb} MB / {diagnostics.process.memoryRssMb} MB
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Node: <span className="font-mono text-slate-300">{diagnostics.process.nodeVersion}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Active Sessions</span>
              <Lock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {diagnostics.security.activeSessions}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Rate Limiter Tracked Keys: <span className="font-mono text-slate-300">{diagnostics.security.rateLimiterActiveKeys}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Audit Chain Integrity</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              {diagnostics.database.auditChainValid ? 'VERIFIED INTACT' : 'COMPROMISED'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Events: <span className="font-mono text-slate-300">{diagnostics.security.tamperProofAuditEvents} blocks</span>
            </div>
          </div>
        </div>
      )}

      {/* Suite Results Report (Phase 7 Real Automation Verification) */}
      {suiteResults && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">
                Live Automated Security & Reliability Report
              </h3>
            </div>
            <div className="text-xs font-mono">
              Status:{' '}
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  suiteResults.summary.status === 'PASSED'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-red-950 text-red-400 border border-red-800'
                }`}
              >
                {suiteResults.summary.status} ({suiteResults.summary.passed}/{suiteResults.summary.total} Checks Passed)
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {suiteResults.tests.map((test: any, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-slate-950 border border-slate-800/80 rounded flex items-start justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {test.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-200">{test.name}</span>
                    <span className="px-1.5 py-0.5 bg-slate-800 text-[10px] font-mono rounded text-slate-400">
                      {test.category}
                    </span>
                  </div>
                  <p className="text-slate-400 pl-6">{test.message}</p>
                </div>

                <div className="text-right shrink-0 font-mono text-[11px] text-slate-500">
                  {test.durationMs}ms
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snapshot Backup & Recovery (Admins Only) */}
      {isAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <DbIcon className="w-4 h-4 text-emerald-400" />
                Disaster Recovery & Encrypted Snapshot Backups
              </h3>
              <p className="text-xs text-slate-400">
                Full-database snapshots sealed with SHA-256 integrity checksums.
              </p>
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={loading}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition flex items-center gap-1.5 shadow disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Create Snapshot Backup
            </button>
          </div>

          {backupMessage && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs rounded font-mono">
              {backupMessage}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Snapshot File</th>
                  <th className="py-2.5 px-3">Created Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Size</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No snapshots stored in catalog.
                    </td>
                  </tr>
                ) : (
                  backups.map((b, i) => (
                    <tr key={i} className="hover:bg-slate-800/20 transition">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-200">{b.filename}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{b.createdAt}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {(b.sizeBytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleRestore(b.filename)}
                          className="px-2 py-1 bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white rounded text-[11px] transition flex items-center gap-1 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
