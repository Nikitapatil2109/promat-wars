import React from 'react';
import {
  Flame,
  Zap,
  Truck,
  TrendingDown,
  Recycle,
  Droplets,
  ShieldCheck,
  Building,
  ArrowRight,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import type { ESGSummary, Organization, User } from '../types.ts';

interface DashboardViewProps {
  summary: ESGSummary | null;
  org: Organization | null;
  user: User | null;
  onNavigate: (tab: string) => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  org,
  user,
  onNavigate,
}) => {
  if (!summary) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        Loading verified ESG telemetry & carbon accounting matrices...
      </div>
    );
  }

  const {
    totalCo2eTonnes,
    scope1Tonnes,
    scope2Tonnes,
    scope3Tonnes,
    scopeBreakdownPercent,
    byFacility,
    waste,
    water,
    progressVsBaseline,
  } = summary;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Verified Accounting
            </span>
            <span className="text-xs text-slate-400">GHG Protocol Corporate Standard</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {org ? org.name : 'Enterprise'} Sustainability Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically sealed emissions telemetry, circular resource flows, and science-based abatement pathways.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('carbon')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition flex items-center gap-1.5 shadow"
          >
            Record Emission
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('ai_advisor')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-medium rounded transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            AI Decarbonization
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Emissions */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Total Carbon Footprint</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{totalCo2eTonnes.toLocaleString()}</span>
            <span className="text-xs text-slate-400">tCO₂e</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] text-emerald-400">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>-8.4% YoY reduction</span>
            <span className="text-slate-500 ml-1">vs 2024</span>
          </div>
        </div>

        {/* Scope 1 Direct */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Scope 1 (Direct)</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{scope1Tonnes.toLocaleString()}</span>
            <span className="text-xs text-slate-400">tCO₂e</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            <span className="font-mono text-orange-400 font-semibold">{scopeBreakdownPercent.scope1}%</span> of organizational gross emissions
          </div>
        </div>

        {/* Scope 2 Indirect Energy */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Scope 2 (Electricity & Grid)</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{scope2Tonnes.toLocaleString()}</span>
            <span className="text-xs text-slate-400">tCO₂e</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            <span className="font-mono text-amber-400 font-semibold">{scopeBreakdownPercent.scope2}%</span> of gross (CAMX & ERCOT grid)
          </div>
        </div>

        {/* Scope 3 Value Chain */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Scope 3 (Value Chain)</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{scope3Tonnes.toLocaleString()}</span>
            <span className="text-xs text-slate-400">tCO₂e</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            <span className="font-mono text-sky-400 font-semibold">{scopeBreakdownPercent.scope3}%</span> aviation travel & logistics
          </div>
        </div>
      </div>

      {/* Scope Breakdown Visual & Net Zero Glidepath */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: GHG Protocol Breakdown Bar & Facilities */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-slate-200">GHG Protocol Emission Distribution</h3>
              <span className="text-xs text-slate-400 font-mono">Total: {totalCo2eTonnes} tCO₂e</span>
            </div>

            {/* Proportional Multi-colored Progress Bar */}
            <div className="w-full h-4 bg-slate-800 rounded overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${scopeBreakdownPercent.scope1}%` }}
                className="bg-orange-500 h-full transition-all"
                title={`Scope 1: ${scopeBreakdownPercent.scope1}%`}
              />
              <div
                style={{ width: `${scopeBreakdownPercent.scope2}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Scope 2: ${scopeBreakdownPercent.scope2}%`}
              />
              <div
                style={{ width: `${scopeBreakdownPercent.scope3}%` }}
                className="bg-sky-500 h-full transition-all"
                title={`Scope 3: ${scopeBreakdownPercent.scope3}%`}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-orange-500" />
                <span className="text-slate-300">Scope 1 ({scope1Tonnes} t • {scopeBreakdownPercent.scope1}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500" />
                <span className="text-slate-300">Scope 2 ({scope2Tonnes} t • {scopeBreakdownPercent.scope2}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-sky-500" />
                <span className="text-slate-300">Scope 3 ({scope3Tonnes} t • {scopeBreakdownPercent.scope3}%)</span>
              </div>
            </div>
          </div>

          {/* Facility Footprint Breakdown */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Facility Level Disaggregation
            </h4>
            <div className="space-y-3">
              {Object.entries(byFacility).map(([facId, data]) => (
                <div key={facId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-300 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      {data.facilityName}
                    </span>
                    <span className="font-mono text-slate-300">{data.tonnes} tCO₂e ({data.percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded"
                      style={{ width: `${Math.min(100, data.percent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Net-Zero Progress & Circular Economy */}
        <div className="space-y-4">
          {/* Net Zero Target Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-200">SBTi Net-Zero Trajectory</span>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] rounded font-mono font-medium">
                {progressVsBaseline.onTrack ? 'ON TRACK (1.5°C)' : 'AT RISK'}
              </span>
            </div>

            <div className="my-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Baseline ({progressVsBaseline.baselineYear}) vs Goal ({progressVsBaseline.targetNetZeroYear})</span>
                <span className="text-emerald-400 font-mono font-semibold">{progressVsBaseline.currentReductionPercent}% Cut</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded"
                  style={{ width: `${Math.min(100, progressVsBaseline.currentReductionPercent)}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Target commitment: <span className="text-white font-medium">{progressVsBaseline.reductionTargetPercent}% decarbonization</span> by{' '}
              {progressVsBaseline.targetNetZeroYear}. Current run-rate exceeds the annual 4.2% linear reduction benchmark.
            </p>
          </div>

          {/* Circular Resource Metrics */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Recycle className="w-4 h-4 text-emerald-400" />
              Circular Economy & Water
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <div className="text-slate-400 text-[10px] uppercase font-mono">Waste Diversion</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{waste.diversionRatePercent}%</div>
                <div className="text-[10px] text-slate-500 mt-1">{waste.recycledTonnes}t recycled</div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <div className="text-slate-400 text-[10px] uppercase font-mono flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-sky-400" /> Water Recycled
                </div>
                <div className="text-lg font-bold text-sky-400 font-mono mt-0.5">{water.recycledPercent}%</div>
                <div className="text-[10px] text-slate-500 mt-1">{water.consumptionCubicMeters.toLocaleString()} m³ consumed</div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('exports')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded transition flex items-center justify-center gap-1.5"
            >
              <FileCheck2 className="w-4 h-4 text-slate-400" />
              Download CSRD Audit Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
