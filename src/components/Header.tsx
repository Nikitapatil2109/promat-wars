import React from 'react';
import { ShieldCheck, Leaf, LogOut, User as UserIcon, Building2, Activity, Lock } from 'lucide-react';
import type { User, Organization } from '../types.ts';

interface HeaderProps {
  user: User | null;
  org: Organization | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  healthStatus: 'healthy' | 'degraded' | 'critical' | 'checking';
}

export const Header: React.FC<HeaderProps> = ({
  user,
  org,
  activeTab,
  setActiveTab,
  onOpenLogin,
  onLogout,
  healthStatus,
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800 rounded">Chief / Admin</span>;
      case 'sustainability_manager':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded">ESG Manager</span>;
      case 'auditor':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800 rounded">Lead Auditor</span>;
      case 'facility_operator':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800 rounded">Facility Operator</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded">{role}</span>;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Executive Dashboard' },
    { id: 'carbon', label: 'Carbon Accounting' },
    { id: 'waste_water', label: 'Waste & Water' },
    { id: 'ai_advisor', label: 'AI ESG Advisor' },
    { id: 'forecast', label: 'Statistical Forecast' },
    { id: 'tasks', label: 'Tasks & Governance' },
    { id: 'audit', label: 'Cryptographic Audit' },
    { id: 'exports', label: 'Compliance Reports' },
    { id: 'security', label: 'Security & Health' },
  ];

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 text-slate-100 shadow-md">
      {/* Top Bar: Brand, Tenant & User Auth */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">EcoMind AI</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">Enterprise v2.4</span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
              GHG Protocol & CSRD Assured Platform
            </p>
          </div>
        </div>

        {/* Center: Tenant Banner */}
        {org && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md">
            <Building2 className="w-4 h-4 text-slate-400" />
            <div className="text-xs">
              <span className="font-medium text-slate-200">{org.name}</span>
              <span className="text-slate-500 mx-1.5">•</span>
              <span className="text-emerald-400 font-mono">Net-Zero {org.targetNetZeroYear} Target</span>
            </div>
          </div>
        )}

        {/* Right: Health Indicator & User Profile */}
        <div className="flex items-center gap-3">
          {/* Health Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border ${
              healthStatus === 'healthy'
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80'
                : healthStatus === 'degraded'
                ? 'bg-amber-950/60 text-amber-400 border-amber-800/80'
                : 'bg-red-950/60 text-red-400 border-red-800/80'
            }`}
            title="Real-time Server Health & Audit Chain Validity"
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span className="capitalize">{healthStatus}</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-200">{user.fullName}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                  {getRoleBadge(user.role)}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                title="Secure Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 py-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition rounded ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
