import React, { useState } from 'react';
import { Recycle, Droplets, Plus, Building, AlertCircle } from 'lucide-react';
import type { WasteRecord, WaterRecord, Facility, User } from '../types.ts';

interface WasteWaterViewProps {
  waste: WasteRecord[];
  water: WaterRecord[];
  facilities: Facility[];
  user: User | null;
  onRefresh: () => void;
  token: string | null;
}

export const WasteWaterView: React.FC<WasteWaterViewProps> = ({
  waste,
  water,
  facilities,
  user,
  onRefresh,
  token,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'waste' | 'water'>('waste');
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);

  // Waste Form State
  const [wFacilityId, setWFacilityId] = useState(facilities[0]?.id || '');
  const [wasteType, setWasteType] = useState('non_hazardous');
  const [disposalMethod, setDisposalMethod] = useState('recycled');
  const [wasteWeight, setWasteWeight] = useState('5.0');
  const [wastePeriod, setWastePeriod] = useState('2026-02');
  const [wasteDate, setWasteDate] = useState('2026-02-28');

  // Water Form State
  const [wtFacilityId, setWtFacilityId] = useState(facilities[0]?.id || '');
  const [withdrawal, setWithdrawal] = useState('15000');
  const [discharge, setDischarge] = useState('9000');
  const [recycledPct, setRecycledPct] = useState('35');
  const [waterPeriod, setWaterPeriod] = useState('2026-02');
  const [waterDate, setWaterDate] = useState('2026-02-28');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRecord = user && ['admin', 'sustainability_manager', 'facility_operator'].includes(user.role);

  const handleAddWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/waste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          facilityId: wFacilityId,
          wasteType,
          disposalMethod,
          weightTonnes: Number(wasteWeight),
          reportingPeriod: wastePeriod,
          date: wasteDate,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to record waste');
      }
      setIsWasteModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWater = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/water', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          facilityId: wtFacilityId,
          withdrawalCubicMeters: Number(withdrawal),
          dischargeCubicMeters: Number(discharge),
          recycledPercent: Number(recycledPct),
          reportingPeriod: waterPeriod,
          date: waterDate,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to record water');
      }
      setIsWaterModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('waste')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition flex items-center gap-1.5 ${
              activeSubTab === 'waste'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Recycle className="w-3.5 h-3.5" />
            Circular Waste Management
          </button>
          <button
            onClick={() => setActiveSubTab('water')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition flex items-center gap-1.5 ${
              activeSubTab === 'water'
                ? 'bg-sky-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            Water Stewardship
          </button>
        </div>

        {canRecord && (
          <div>
            {activeSubTab === 'waste' ? (
              <button
                onClick={() => setIsWasteModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                Record Waste Batch
              </button>
            ) : (
              <button
                onClick={() => setIsWaterModalOpen(true)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                Record Water Flow
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub-view: Waste */}
      {activeSubTab === 'waste' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 bg-slate-950/50">
            <h3 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">
              Waste Generation & Landfill Diversion Stream
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Period / Date</th>
                  <th className="py-3 px-4">Facility</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Disposal Treatment</th>
                  <th className="py-3 px-4 text-right">Net Weight</th>
                  <th className="py-3 px-4 text-right">Diversion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {waste.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No waste records logged for current tenant.
                    </td>
                  </tr>
                ) : (
                  waste.map((w, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono text-slate-200">{w.reportingPeriod}</td>
                      <td className="py-3 px-4 flex items-center gap-1 text-slate-300">
                        <Building className="w-3 h-3 text-slate-500" />
                        {w.facilityName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {w.wasteType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-300">{w.disposalMethod}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {w.weightTonnes.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">t</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {w.diversionRate}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Sub-view: Water */
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 bg-slate-950/50">
            <h3 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">
              Water Withdrawal, Consumption & Closed-Loop Recycling
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Period / Date</th>
                  <th className="py-3 px-4">Facility</th>
                  <th className="py-3 px-4 text-right">Withdrawal (m³)</th>
                  <th className="py-3 px-4 text-right">Discharge (m³)</th>
                  <th className="py-3 px-4 text-right">Consumption (m³)</th>
                  <th className="py-3 px-4 text-right">Recycled Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {water.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No water flow data logged for current tenant.
                    </td>
                  </tr>
                ) : (
                  water.map((wt, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono text-slate-200">{wt.reportingPeriod}</td>
                      <td className="py-3 px-4 flex items-center gap-1 text-slate-300">
                        <Building className="w-3 h-3 text-slate-500" />
                        {wt.facilityName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-200">
                        {wt.withdrawalCubicMeters.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {wt.dischargeCubicMeters.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sky-400">
                        {wt.consumptionCubicMeters.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {wt.recycledPercent}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Waste Modal */}
      {isWasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Recycle className="w-4 h-4 text-emerald-400" />
                Record Waste Batch
              </h3>
              <button onClick={() => setIsWasteModalOpen(false)} className="text-slate-400 text-xs">
                ✕
              </button>
            </div>

            {error && <div className="mb-3 p-2 bg-red-950 text-red-300 text-xs rounded">{error}</div>}

            <form onSubmit={handleAddWaste} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Facility</label>
                <select
                  value={wFacilityId}
                  onChange={(e) => setWFacilityId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Waste Type</label>
                  <select
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="non_hazardous">Non-Hazardous</option>
                    <option value="hazardous">Hazardous</option>
                    <option value="e_waste">E-Waste</option>
                    <option value="compost">Compost / Organic</option>
                    <option value="recycled">Recycled Packaging</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Treatment Method</label>
                  <select
                    value={disposalMethod}
                    onChange={(e) => setDisposalMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="recycled">Recycled</option>
                    <option value="diverted">Diverted from Landfill</option>
                    <option value="composted">Composted</option>
                    <option value="incineration">Incineration</option>
                    <option value="landfill">Landfill</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Weight (Metric Tonnes)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={wasteWeight}
                  onChange={(e) => setWasteWeight(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsWasteModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-500 font-medium"
                >
                  {loading ? 'Saving...' : 'Record Waste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Water Modal */}
      {isWaterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-400" />
                Record Water Flow
              </h3>
              <button onClick={() => setIsWaterModalOpen(false)} className="text-slate-400 text-xs">
                ✕
              </button>
            </div>

            {error && <div className="mb-3 p-2 bg-red-950 text-red-300 text-xs rounded">{error}</div>}

            <form onSubmit={handleAddWater} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Facility</label>
                <select
                  value={wtFacilityId}
                  onChange={(e) => setWtFacilityId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Withdrawal (m³)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={withdrawal}
                    onChange={(e) => setWithdrawal(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Discharge (m³)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={discharge}
                    onChange={(e) => setDischarge(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Closed-Loop Recycled %</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={recycledPct}
                  onChange={(e) => setRecycledPct(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsWaterModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-sky-600 text-white text-xs rounded hover:bg-sky-500 font-medium"
                >
                  {loading ? 'Saving...' : 'Record Water'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
