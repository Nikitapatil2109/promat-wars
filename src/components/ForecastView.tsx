import React, { useState, useEffect } from 'react';
import { TrendingDown, LineChart, ShieldAlert, CheckCircle, Info, Calculator } from 'lucide-react';
import type { ESGForecastResult, Organization } from '../types.ts';

interface ForecastViewProps {
  org: Organization | null;
  token: string | null;
}

export const ForecastView: React.FC<ForecastViewProps> = ({ org, token }) => {
  const [forecastData, setForecastData] = useState<ESGForecastResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/esg/forecast', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (res.ok) setForecastData(data);
      } catch (err) {
        console.error('Forecast fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, [token]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Computing Ordinary Least Squares regression & confidence intervals...</div>;
  }

  if (!forecastData) {
    return <div className="p-8 text-center text-slate-400">Unable to load statistical projection.</div>;
  }

  const {
    methodology,
    assumptions,
    historicalPointsCount,
    rSquared,
    slopeMonthlyChangeTonnes,
    forecast,
    analysis,
  } = forecastData;

  const maxVal = Math.max(...forecast.map((f) => f.upperConfidenceBound95), 500);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
              <Calculator className="w-3 h-3" /> Statistical Regression Model
            </span>
            <span className="text-xs text-slate-400">Science Based Targets (SBTi) 1.5°C Benchmark</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            12-Month Carbon Trajectory & Net-Zero Glidepath
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Parametric forecast computed exclusively on authorized tenant historical data using Ordinary Least Squares with 95% confidence bounds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded text-right">
            <div className="text-[10px] uppercase font-mono text-slate-500">Regression Fit (R²)</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{rSquared}</div>
            <div className="text-[9px] text-slate-500">n = {historicalPointsCount} monthly series</div>
          </div>
        </div>
      </div>

      {/* Model Diagnostic KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-[10px] uppercase font-mono text-slate-500">Monthly Run-Rate Slope</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {slopeMonthlyChangeTonnes} <span className="text-xs font-normal text-slate-400">tCO₂e/mo</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            Annualized delta: {(slopeMonthlyChangeTonnes * 12).toFixed(1)} tonnes/year
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-[10px] uppercase font-mono text-slate-500">Annualized Reduction Rate</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {analysis.annualizedReductionRatePercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            SBTi 1.5°C requirement: <span className="text-white font-medium">4.2%/yr</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="text-[10px] uppercase font-mono text-slate-500">Net-Zero Alignment Status</div>
          <div className="text-xl font-bold font-mono mt-1 capitalize flex items-center gap-2">
            {analysis.trajectoryStatus === 'on_track' ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> On Track
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <ShieldAlert className="w-5 h-5 text-amber-400" /> At Risk
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Gap to target glidepath: <span className="font-mono text-white">{analysis.gapToNetZeroTargetTonnes} t</span>
          </div>
        </div>
      </div>

      {/* Visual Forecast Bars & Comparison */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <LineChart className="w-4 h-4 text-emerald-400" />
            12-Month Forward Projection Matrix
          </h3>
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span className="text-slate-300">Projected Run-rate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-950 border border-emerald-500/50" />
              <span className="text-slate-300">95% Confidence Interval</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-sky-400" />
              <span className="text-slate-300">SBTi Target Path</span>
            </div>
          </div>
        </div>

        {/* Forecast Table with Visual Bounds */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
              <tr>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Projection Bar (Lower — Projected — Upper)</th>
                <th className="py-2.5 px-3 text-right">Projected (t)</th>
                <th className="py-2.5 px-3 text-right">95% CI Range</th>
                <th className="py-2.5 px-3 text-right">SBTi Target (t)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {forecast.map((pt, idx) => {
                const projPct = (pt.projectedCo2eTonnes / maxVal) * 100;
                const lowerPct = (pt.lowerConfidenceBound95 / maxVal) * 100;
                const upperPct = (pt.upperConfidenceBound95 / maxVal) * 100;
                const targetPct = (pt.targetNetZeroPathTonnes / maxVal) * 100;

                return (
                  <tr key={idx} className="hover:bg-slate-800/20 transition">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-200">{pt.period}</td>
                    <td className="py-2.5 px-3 w-1/3">
                      <div className="w-full bg-slate-950 h-3 rounded relative overflow-hidden">
                        {/* CI Range Band */}
                        <div
                          className="absolute bg-emerald-950/80 border-l border-r border-emerald-500/30 h-full"
                          style={{
                            left: `${Math.max(0, lowerPct)}%`,
                            width: `${Math.max(2, upperPct - lowerPct)}%`,
                          }}
                          title={`95% CI: ${pt.lowerConfidenceBound95} - ${pt.upperConfidenceBound95} t`}
                        />
                        {/* Projected Point */}
                        <div
                          className="absolute bg-emerald-400 w-1.5 h-full rounded"
                          style={{ left: `${Math.max(0, projPct)}%` }}
                        />
                        {/* SBTi Target Marker */}
                        <div
                          className="absolute bg-sky-400 w-1 h-full"
                          style={{ left: `${Math.max(0, targetPct)}%` }}
                          title={`SBTi Target: ${pt.targetNetZeroPathTonnes} t`}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {pt.projectedCo2eTonnes}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-[11px]">
                      [{pt.lowerConfidenceBound95} – {pt.upperConfidenceBound95}]
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sky-400">
                      {pt.targetNetZeroPathTonnes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology & Statistical Assumptions */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Info className="w-4 h-4 text-emerald-400" />
          Mathematical Methodology & Governing Assumptions
        </h4>
        <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
          <p>
            <span className="text-slate-300 font-medium">Model:</span> {methodology}
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            {assumptions.map((asm, i) => (
              <li key={i}>{asm}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
