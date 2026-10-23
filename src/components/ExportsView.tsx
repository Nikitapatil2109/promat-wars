import React, { useState } from 'react';
import { Download, FileText, ShieldCheck, CheckCircle2, Lock, Terminal } from 'lucide-react';
import type { Organization, User } from '../types.ts';

interface ExportsViewProps {
  org: Organization | null;
  user: User | null;
  token: string | null;
}

export const ExportsView: React.FC<ExportsViewProps> = ({ org, user, token }) => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<any | null>(null);

  const handleDownload = async (framework: string) => {
    setDownloading(framework);
    try {
      const res = await fetch(`/api/esg/export?framework=${framework}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Export download failed');

      const data = await res.json();
      setPreviewContent(data);

      // Trigger browser download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${org?.slug || 'ecomind'}-${framework}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDownloading(null);
    }
  };

  const reports = [
    {
      id: 'CSRD',
      title: 'EU Corporate Sustainability Due Diligence (CSRD - ESRS E1)',
      description:
        'Standardized European Sustainability Reporting Standard disclosure package covering gross Scope 1-3, targets, double materiality, and pre-assurance audit verification stamp.',
      badge: 'EU Mandatory Format',
    },
    {
      id: 'GHG_Protocol',
      title: 'GHG Protocol Corporate Accounting Standard',
      description:
        'Complete activity-level carbon inventory disaggregated by facility, emission source, and EPA/DEFRA emission factors with verified auditor signatures.',
      badge: 'Global Benchmark',
    },
    {
      id: 'SEC_Climate',
      title: 'SEC Climate-Related Disclosure (Regulation S-K)',
      description:
        'Filing-ready quantitative Scope 1 & Scope 2 disclosures with governance transition plans and physical/transition climate risk metrics.',
      badge: 'US SEC Filing',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Cryptographically Sealed
            </span>
            <span className="text-xs text-slate-400">Pre-Assurance Regulatory Reports</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Compliance & Assurance Export Center
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Exports include embedded SHA-256 digital document hashes, auditor timestamps, and reference pointer to the underlying immutable audit chain.
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm space-y-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 text-[10px] font-mono rounded border border-emerald-800/70">
                  {rep.badge}
                </span>
                <Lock className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <h3 className="font-bold text-sm text-white mb-2 leading-snug">{rep.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{rep.description}</p>
            </div>

            <button
              onClick={() => handleDownload(rep.id)}
              disabled={downloading === rep.id}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition flex items-center justify-center gap-2 shadow disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading === rep.id ? 'Generating & Signing...' : 'Download Signed Package'}
            </button>
          </div>
        ))}
      </div>

      {/* Cryptographic Seal Inspector */}
      {previewContent && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Last Generated Cryptographic Integrity Seal
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              Algorithm: {previewContent.cryptographicIntegritySeal?.algorithm}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase">Document Hash (SHA-256):</div>
              <div className="text-emerald-400 font-semibold break-all">
                {previewContent.cryptographicIntegritySeal?.documentHash}
              </div>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase">Audit Chain Anchor (Tip Hash):</div>
              <div className="text-slate-300 break-all">
                {previewContent.cryptographicIntegritySeal?.tipAuditHash}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
