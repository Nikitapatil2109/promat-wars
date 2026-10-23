import React, { useState } from 'react';
import {
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Building,
  Flame,
  Zap,
  Truck,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import type { EmissionRecord, Facility, User } from '../types.ts';

interface CarbonAccountingViewProps {
  emissions: EmissionRecord[];
  facilities: Facility[];
  user: User | null;
  onRefresh: () => void;
  token: string | null;
}

const FACTOR_PRESETS = [
  {
    name: 'EPA Natural Gas Boiler (MMBtu)',
    scope: 'scope_1',
    category: 'stationary_combustion',
    factor: 0.0531,
    unit: 'MMBtu',
    factorUnit: 'tCO2e/MMBtu',
    source: 'EPA GHG Emission Factors 2024',
  },
  {
    name: 'EPA Diesel Backup Generator (Gallons)',
    scope: 'scope_1',
    category: 'stationary_combustion',
    factor: 0.01021,
    unit: 'Gallons',
    factorUnit: 'tCO2e/Gallon',
    source: 'EPA Mandatory GHG Reporting',
  },
  {
    name: 'EPA eGRID CAMX California Grid Power (MWh)',
    scope: 'scope_2',
    category: 'purchased_electricity_location',
    factor: 0.218,
    unit: 'MWh',
    factorUnit: 'tCO2e/MWh',
    source: 'EPA eGRID 2024 Subregion CAMX',
  },
  {
    name: 'EPA eGRID ERCOT Texas Grid Power (MWh)',
    scope: 'scope_2',
    category: 'purchased_electricity_location',
    factor: 0.385,
    unit: 'MWh',
    factorUnit: 'tCO2e/MWh',
    source: 'EPA eGRID 2024 Subregion ERCT',
  },
  {
    name: 'EEA European Grid Power (MWh)',
    scope: 'scope_2',
    category: 'purchased_electricity_location',
    factor: 0.235,
    unit: 'MWh',
    factorUnit: 'tCO2e/MWh',
    source: 'European Environment Agency (EEA)',
  },
  {
    name: 'DEFRA Commercial Flight Travel (passenger-km)',
    scope: 'scope_3',
    category: 'business_travel',
    factor: 0.000158,
    unit: 'passenger-km',
    factorUnit: 'tCO2e/p-km',
    source: 'UK DEFRA / BEIS Aviation Factors',
  },
];

export const CarbonAccountingView: React.FC<CarbonAccountingViewProps> = ({
  emissions,
  facilities,
  user,
  onRefresh,
  token,
}) => {
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [facilityId, setFacilityId] = useState(facilities[0]?.id || '');
  const [sourceName, setSourceName] = useState('');
  const [presetIndex, setPresetIndex] = useState<number>(0);
  const [scope, setScope] = useState<'scope_1' | 'scope_2' | 'scope_3'>('scope_1');
  const [category, setCategory] = useState('stationary_combustion');
  const [activityAmount, setActivityAmount] = useState<string>('100');
  const [activityUnit, setActivityUnit] = useState('MWh');
  const [emissionFactor, setEmissionFactor] = useState<string>('0.218');
  const [factorUnit, setFactorUnit] = useState('tCO2e/MWh');
  const [factorSource, setFactorSource] = useState('EPA eGRID 2024');
  const [reportingPeriod, setReportingPeriod] = useState('2026-02');
  const [date, setDate] = useState('2026-02-28');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canRecord = user && ['admin', 'sustainability_manager', 'facility_operator'].includes(user.role);
  const canVerify = user && ['admin', 'auditor'].includes(user.role);
  const canDelete = user && ['admin', 'sustainability_manager'].includes(user.role);

  // Apply Preset
  const handlePresetChange = (idx: number) => {
    setPresetIndex(idx);
    const p = FACTOR_PRESETS[idx];
    if (p) {
      setScope(p.scope as any);
      setCategory(p.category);
      setActivityUnit(p.unit);
      setEmissionFactor(String(p.factor));
      setFactorUnit(p.factorUnit);
      setFactorSource(p.source);
    }
  };

  const handleCreateEmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const amountNum = Number(activityAmount);
    const factorNum = Number(emissionFactor);

    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Activity amount must be a positive number.');
      setSubmitting(false);
      return;
    }

    if (isNaN(factorNum) || factorNum <= 0) {
      setFormError('Emission factor must be a positive number.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/emissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          facilityId,
          scope,
          category,
          sourceName,
          activityAmount: amountNum,
          activityUnit,
          emissionFactor: factorNum,
          factorUnit,
          factorSource,
          reportingPeriod,
          date,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to record emission');

      setIsModalOpen(false);
      setSourceName('');
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Error recording emission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      const res = await fetch(`/api/emissions/${id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Verification failed');
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this verified emission record? This action will be audited.')) return;
    try {
      const res = await fetch(`/api/emissions/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Delete failed');
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredEmissions = emissions.filter((e) => {
    if (selectedScope !== 'all' && e.scope !== selectedScope) return false;
    if (selectedFacility !== 'all' && e.facilityId !== selectedFacility) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            Carbon Accounting Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Activity data normalized with EPA and DEFRA standard emission factors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="bg-transparent focus:outline-none text-xs"
            >
              <option value="all">All Scopes</option>
              <option value="scope_1">Scope 1 (Direct)</option>
              <option value="scope_2">Scope 2 (Electricity)</option>
              <option value="scope_3">Scope 3 (Value Chain)</option>
            </select>
          </div>

          {/* Facility Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-xs text-slate-300">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="bg-transparent focus:outline-none text-xs"
            >
              <option value="all">All Facilities</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Record Button */}
          {canRecord && (
            <button
              onClick={() => {
                handlePresetChange(0);
                setIsModalOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              Record Emission
            </button>
          )}
        </div>
      </div>

      {/* Emissions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Period / Date</th>
                <th className="py-3 px-4">Facility & Source</th>
                <th className="py-3 px-4">Scope & Category</th>
                <th className="py-3 px-4">Activity & Factor</th>
                <th className="py-3 px-4 text-right">CO₂e Tonnes</th>
                <th className="py-3 px-4 text-center">Assurance Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredEmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No emission records matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredEmissions.map((rec) => {
                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/30 transition">
                      {/* Period / Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-200">{rec.reportingPeriod}</div>
                        <div className="text-[10px] text-slate-500">{rec.date}</div>
                      </td>

                      {/* Facility & Source */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{rec.sourceName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-500" />
                          {rec.facilityName}
                        </div>
                      </td>

                      {/* Scope & Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {rec.scope === 'scope_1' && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                          {rec.scope === 'scope_2' && <Zap className="w-3.5 h-3.5 text-amber-400" />}
                          {rec.scope === 'scope_3' && <Truck className="w-3.5 h-3.5 text-sky-400" />}
                          <span className="font-semibold uppercase text-[11px] text-slate-200">
                            {rec.scope.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {rec.category.replace(/_/g, ' ')}
                        </div>
                      </td>

                      {/* Activity & Factor */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-300">
                          {rec.activityAmount.toLocaleString()} {rec.activityUnit}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono" title={rec.factorSource}>
                          {rec.emissionFactor} {rec.factorUnit}
                        </div>
                      </td>

                      {/* CO2e Tonnes */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-sm font-mono text-white">
                          {rec.co2eTonnes.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">t</span>
                      </td>

                      {/* Assurance Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {rec.verified ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-400 text-[10px] font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[10px]">
                            <Clock className="w-3 h-3 text-slate-500" />
                            Pending Audit
                          </div>
                        )}
                        {rec.verifiedBy && (
                          <div className="text-[9px] text-slate-500 mt-0.5 truncate max-w-[120px]">
                            {rec.verifiedBy}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {canVerify && !rec.verified && (
                            <button
                              onClick={() => handleVerify(rec.id)}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] rounded transition flex items-center gap-1"
                              title="Perform Lead Auditor Certification"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              Certify
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDelete(rec.id)}
                              className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Emission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Record Verified Emission Activity</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateEmission} className="space-y-4">
              {/* Preset Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>Emission Factor Standard Preset</span>
                  <span className="text-[10px] text-emerald-400">GHG Protocol Pre-calibrated</span>
                </label>
                <select
                  value={presetIndex}
                  onChange={(e) => handlePresetChange(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {FACTOR_PRESETS.map((p, idx) => (
                    <option key={idx} value={idx}>
                      {p.name} — {p.factor} {p.factorUnit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Facility & Source Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Facility</label>
                  <select
                    value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Source / Asset Name</label>
                  <input
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    required
                    placeholder="e.g. Server Hall 1 Power Feed"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Activity Amount & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Activity Amount</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={activityAmount}
                    onChange={(e) => setActivityAmount(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Activity Unit</label>
                  <input
                    type="text"
                    value={activityUnit}
                    onChange={(e) => setActivityUnit(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Emission Factor & Source */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Emission Factor</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={emissionFactor}
                    onChange={(e) => setEmissionFactor(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Factor Unit</label>
                  <input
                    type="text"
                    value={factorUnit}
                    onChange={(e) => setFactorUnit(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Reporting Period (YYYY-MM)</label>
                  <input
                    type="text"
                    value={reportingPeriod}
                    onChange={(e) => setReportingPeriod(e.target.value)}
                    required
                    placeholder="2026-02"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Calculated Total Preview */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                <span className="text-xs text-slate-400">Calculated CO₂e Equivalent:</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {((Number(activityAmount) || 0) * (Number(emissionFactor) || 0)).toFixed(3)} tCO₂e
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition disabled:opacity-50 shadow"
                >
                  {submitting ? 'Recording & Cryptographically Chaining...' : 'Record & Sign Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
