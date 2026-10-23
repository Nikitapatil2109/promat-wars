import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { CarbonAccountingView } from './components/CarbonAccountingView.tsx';
import { WasteWaterView } from './components/WasteWaterView.tsx';
import { AIAdvisorView } from './components/AIAdvisorView.tsx';
import { ForecastView } from './components/ForecastView.tsx';
import { TasksView } from './components/TasksView.tsx';
import { AuditChainView } from './components/AuditChainView.tsx';
import { ExportsView } from './components/ExportsView.tsx';
import { SecurityConsoleView } from './components/SecurityConsoleView.tsx';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import type { User, Organization, ESGSummary, EmissionRecord, WasteRecord, WaterRecord, ESGTask, Facility } from './types.ts';

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ecomind_token'));
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'critical' | 'checking'>('checking');

  // Tenant Collections
  const [summary, setSummary] = useState<ESGSummary | null>(null);
  const [emissions, setEmissions] = useState<EmissionRecord[]>([]);
  const [waste, setWaste] = useState<WasteRecord[]>([]);
  const [water, setWater] = useState<WaterRecord[]>([]);
  const [tasks, setTasks] = useState<ESGTask[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);

  // Check Server Health
  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const d = await res.json();
        setHealthStatus(d.status || 'healthy');
      } else {
        setHealthStatus('critical');
      }
    } catch {
      setHealthStatus('critical');
    }
  };

  // Check Current Session (/api/auth/me)
  const checkSession = useCallback(async (tokenToUse?: string | null) => {
    const curToken = tokenToUse !== undefined ? tokenToUse : token;
    if (!curToken) {
      setUser(null);
      setOrg(null);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${curToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setOrg(data.organization);
      } else {
        // Token expired or invalid -> clear
        localStorage.removeItem('ecomind_token');
        setToken(null);
        setUser(null);
        setOrg(null);
      }
    } catch {
      // Network failure
    }
  }, [token]);

  // Load Tenant ESG Data
  const loadTenantData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [sumRes, emRes, wstRes, wtrRes, tskRes, facRes] = await Promise.all([
        fetch('/api/esg/summary', { headers }),
        fetch('/api/emissions', { headers }),
        fetch('/api/waste', { headers }),
        fetch('/api/water', { headers }),
        fetch('/api/tasks', { headers }),
        fetch('/api/facilities', { headers }),
      ]);

      if (sumRes.ok) setSummary(await sumRes.json());
      if (emRes.ok) setEmissions(await emRes.json());
      if (wstRes.ok) setWaste(await wstRes.json());
      if (wtrRes.ok) setWater(await wtrRes.json());
      if (tskRes.ok) setTasks(await tskRes.json());
      if (facRes.ok) setFacilities(await facRes.json());
    } catch (err) {
      console.error('Failed to load tenant data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (user && token) {
      loadTenantData();
    }
  }, [user, token, loadTenantData]);

  const handleLoginSuccess = (newToken: string, newUser: User, newOrg: Organization) => {
    setToken(newToken);
    setUser(newUser);
    setOrg(newOrg);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // ignore
    }
    localStorage.removeItem('ecomind_token');
    setToken(null);
    setUser(null);
    setOrg(null);
    setSummary(null);
    setEmissions([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Enterprise Header */}
      <Header
        user={user}
        org={org}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        healthStatus={healthStatus}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!user ? (
          /* Unauthenticated Landing / Security Gateway */
          <div className="max-w-2xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 bg-emerald-950/80 border border-emerald-500/40 rounded-xl flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                EcoMind AI Enterprise ESG Platform
              </h1>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Zero-bypass, multi-tenant environmental intelligence platform. Access requires authenticated credentials with verified role-based access control (RBAC).
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setLoginModalOpen(true)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition shadow-md"
              >
                Sign In with Enterprise Credentials
              </button>
            </div>

            <div className="pt-6 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-center gap-4">
              <span>PBKDF2-SHA512 Hashing</span>
              <span>•</span>
              <span>Cryptographic SHA-256 Audit Chain</span>
              <span>•</span>
              <span>GHG Protocol Verified</span>
            </div>
          </div>
        ) : (
          /* Authenticated Tab Views */
          <div>
            {activeTab === 'dashboard' && (
              <DashboardView
                summary={summary}
                org={org}
                user={user}
                onNavigate={(t) => setActiveTab(t)}
                onRefresh={loadTenantData}
              />
            )}

            {activeTab === 'carbon' && (
              <CarbonAccountingView
                emissions={emissions}
                facilities={facilities}
                user={user}
                onRefresh={loadTenantData}
                token={token}
              />
            )}

            {activeTab === 'waste_water' && (
              <WasteWaterView
                waste={waste}
                water={water}
                facilities={facilities}
                user={user}
                onRefresh={loadTenantData}
                token={token}
              />
            )}

            {activeTab === 'ai_advisor' && (
              <AIAdvisorView user={user} onRefresh={loadTenantData} token={token} />
            )}

            {activeTab === 'forecast' && <ForecastView org={org} token={token} />}

            {activeTab === 'tasks' && (
              <TasksView tasks={tasks} user={user} onRefresh={loadTenantData} token={token} />
            )}

            {activeTab === 'audit' && <AuditChainView user={user} token={token} />}

            {activeTab === 'exports' && <ExportsView org={org} user={user} token={token} />}

            {activeTab === 'security' && <SecurityConsoleView user={user} token={token} />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>EcoMind AI Secure Enterprise ESG Governance Platform</span>
          </div>
          <div className="text-[11px] font-mono text-slate-600">
            GHG Protocol Standard • ISO 14064-3 • CSRD ESRS E1 Ready
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
