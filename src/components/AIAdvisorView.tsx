import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  FileCheck2,
  AlertTriangle,
  Send,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import type { User } from '../types.ts';

interface AIAdvisorViewProps {
  user: User | null;
  onRefresh: () => void;
  token: string | null;
}

interface AIRecommendation {
  id: string;
  title: string;
  scopeCategory: string;
  targetReductionTonnes: number;
  implementationCostEst: string;
  paybackPeriodMonths: number;
  description: string;
  actionPlan: string[];
  groundedCitations: Array<{
    recordId: string;
    metric: string;
    facility: string;
  }>;
  suggestedAssigneeRole: string;
}

interface AIComplianceReview {
  framework: string;
  evaluatedAt: string;
  complianceScorePercent: number;
  readinessLevel: string;
  materialFindings: Array<{
    area: string;
    status: string;
    details: string;
    remediation: string;
  }>;
  disclaimer: string;
  requiresHumanSignoff: boolean;
}

export const AIAdvisorView: React.FC<AIAdvisorViewProps> = ({ user, onRefresh, token }) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [modelUsed, setModelUsed] = useState<string>('');
  const [isFallback, setIsFallback] = useState(false);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  // Compliance Review State
  const [framework, setFramework] = useState<'CSRD' | 'GHG_Protocol' | 'SEC_Climate'>('CSRD');
  const [complianceReview, setComplianceReview] = useState<AIComplianceReview | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);

  // Task creation message
  const [taskMsg, setTaskMsg] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoadingRoadmap(true);
    setTaskMsg(null);
    try {
      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch recommendations');
      setRecommendations(data.recommendations || []);
      setModelUsed(data.modelUsed || 'gemini-3.8-flash');
      setIsFallback(Boolean(data.isFallback));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const fetchComplianceReview = async () => {
    setLoadingReview(true);
    try {
      const res = await fetch('/api/ai/compliance-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ framework }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to analyze compliance');
      setComplianceReview(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingReview(false);
    }
  };

  const convertToTask = async (rec: AIRecommendation) => {
    if (!user) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: rec.title,
          description: `${rec.description}\n\nCost: ${rec.implementationCostEst}\nPayback: ${rec.paybackPeriodMonths} mos.\nPlan:\n- ${rec.actionPlan.join('\n- ')}`,
          assignedToUserId: user.id, // assign to authenticated user
          scopeCategory: rec.scopeCategory,
          priority: rec.targetReductionTonnes > 100 ? 'critical' : 'high',
          targetReductionTonnes: rec.targetReductionTonnes,
          dueDate: '2026-11-30',
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to create task');
      }
      setTaskMsg(`Task "${rec.title}" successfully converted and assigned to ${user.fullName}`);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Gemini 3.8 Flash Engine
            </span>
            <span className="text-xs text-slate-400">Strictly Grounded in Verified DB Records</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            AI Decarbonization & ESG Assurance Advisor
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Generates high-impact carbon abatement roadmaps with exact citation provenance, ROI payback schedules, and automated CSRD / SEC climate disclosure readiness reviews.
          </p>
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={loadingRoadmap}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition flex items-center gap-2 shadow disabled:opacity-50 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          {loadingRoadmap ? 'Analyzing emissions & calculating ROI...' : 'Generate AI Abatement Roadmap'}
        </button>
      </div>

      {taskMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{taskMsg}</span>
          </div>
          <button onClick={() => setTaskMsg(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Model & Grounding Notice */}
      {modelUsed && (
        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900 border border-slate-800 px-4 py-2 rounded">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">Model:</span>
            <span className="font-mono text-emerald-400">{modelUsed}</span>
            {isFallback && (
              <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded">
                Deterministic Certified Engine
              </span>
            )}
          </div>
          <span className="text-slate-500 text-[11px]">
            Server-side execution • Zero client-side key leakage
          </span>
        </div>
      )}

      {/* Recommendations Grid */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            Prioritized Carbon Abatement Initiatives
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded uppercase">
                      {rec.scopeCategory.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      -{rec.targetReductionTonnes} tCO₂e
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white mb-2 leading-snug">{rec.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">{rec.description}</p>

                  {/* Financials & ROI */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded border border-slate-800/80 mb-3">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Est. Investment</div>
                      <div className="font-medium text-slate-300 font-mono text-[11px]">{rec.implementationCostEst}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Payback Period</div>
                      <div className="font-medium text-emerald-400 font-mono text-[11px]">{rec.paybackPeriodMonths} Months</div>
                    </div>
                  </div>

                  {/* Action Plan */}
                  <div className="space-y-1.5 mb-3">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Execution Milestones:
                    </div>
                    {rec.actionPlan.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                        <span className="text-emerald-500 font-mono text-[10px] mt-0.5">•</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  {/* Grounded Citations */}
                  {rec.groundedCitations && rec.groundedCitations.length > 0 && (
                    <div className="p-2 bg-slate-950/70 border border-slate-800 rounded text-[11px] text-slate-400 space-y-1">
                      <div className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Grounded Citation Provenance:
                      </div>
                      {rec.groundedCitations.map((cit, cIdx) => (
                        <div key={cIdx} className="font-mono text-[10px] text-slate-300">
                          Ref: <span className="text-emerald-400 font-semibold">{cit.recordId}</span> ({cit.facility}: {cit.metric})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => convertToTask(rec)}
                  className="w-full py-2 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500 text-xs font-medium rounded transition flex items-center justify-center gap-1.5 shadow"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Convert to Governed ESG Task
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Gap Review Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-400" />
              Statutory ESG Compliance & Pre-Assurance Review
            </h3>
            <p className="text-xs text-slate-400">
              Evaluates double materiality, Scope 2 market/location disclosures, and assurance readiness.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="CSRD">EU CSRD (ESRS E1 Climate)</option>
              <option value="GHG_Protocol">GHG Protocol Corporate Standard</option>
              <option value="SEC_Climate">SEC Climate-Related Disclosures</option>
            </select>

            <button
              onClick={fetchComplianceReview}
              disabled={loadingReview}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded transition flex items-center gap-1.5 shadow"
            >
              <Send className="w-3 h-3 text-emerald-400" />
              {loadingReview ? 'Analyzing Standard...' : 'Run Audit Screening'}
            </button>
          </div>
        </div>

        {complianceReview && (
          <div className="space-y-5">
            {/* Score & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Assurance Score</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {complianceReview.complianceScorePercent}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Limited Assurance Benchmark: 80%</div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Readiness Level</div>
                <div className="text-lg font-bold text-white mt-1">{complianceReview.readinessLevel}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Framework: {complianceReview.framework}</div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Governance Requirement</div>
                <div className="text-xs font-semibold text-amber-300 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Human Sign-off Required
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Prior to Statutory Submission</div>
              </div>
            </div>

            {/* Material Findings List */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Material Disclosure Findings & Remediation:
              </h4>

              {complianceReview.materialFindings.map((f, i) => (
                <div key={i} className="p-3.5 bg-slate-950 border border-slate-800 rounded space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{f.area}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                        f.status === 'Compliant'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : f.status === 'Partial'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>
                  <p className="text-slate-400">{f.details}</p>
                  <div className="text-[11px] text-emerald-400 font-medium">
                    Remediation: <span className="text-slate-300 font-normal">{f.remediation}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded text-[11px] text-slate-500 leading-relaxed italic">
              Disclaimer: {complianceReview.disclaimer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
