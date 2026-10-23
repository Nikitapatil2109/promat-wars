import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Clock, AlertTriangle, UserCheck, CheckCircle2 } from 'lucide-react';
import type { ESGTask, User, UserRole } from '../types.ts';

interface TasksViewProps {
  tasks: ESGTask[];
  user: User | null;
  onRefresh: () => void;
  token: string | null;
}

export const TasksView: React.FC<TasksViewProps> = ({ tasks, user, onRefresh, token }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [scopeCategory, setScopeCategory] = useState('stationary_combustion');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [targetReductionTonnes, setTargetReductionTonnes] = useState('25');
  const [dueDate, setDueDate] = useState('2026-11-30');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch real authorized tenant users for assignee dropdown
    const fetchOrgUsers = async () => {
      try {
        const res = await fetch('/api/admin/users', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const list = await res.json();
          setOrgUsers(list);
          if (list.length > 0 && !assignedToUserId) {
            setAssignedToUserId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load org users:', err);
      }
    };
    if (user && ['admin', 'sustainability_manager', 'auditor'].includes(user.role)) {
      fetchOrgUsers();
    }
  }, [user, token]);

  const canCreate = user && ['admin', 'sustainability_manager'].includes(user.role);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title,
          description,
          assignedToUserId,
          scopeCategory,
          priority,
          targetReductionTonnes: Number(targetReductionTonnes) || 0,
          dueDate,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to create task');
      }

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Update failed');
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            Decarbonization Tasks & Governance Action Plans
          </h2>
          <p className="text-xs text-slate-400">
            Assigned to authenticated organizational personnel with target reduction tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="under_review">Under Review</option>
            <option value="completed">Completed</option>
          </select>

          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              New Action Item
            </button>
          )}
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-lg">
            No active decarbonization tasks found for the current criteria.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded ${
                      t.priority === 'critical'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : t.priority === 'high'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {t.priority} Priority
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    -{t.targetReductionTonnes} tCO₂e
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white leading-snug mb-2">{t.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-3">
                  {t.description}
                </p>

                <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Assignee:</span>
                    <span className="font-medium text-slate-200 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      {t.assignedToName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Due Date:</span>
                    <span className="font-mono text-slate-300">{t.dueDate}</span>
                  </div>
                </div>
              </div>

              {/* Status Selector & Quick Update */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-500 font-mono capitalize">
                  Status: <strong className="text-slate-300">{t.status.replace('_', ' ')}</strong>
                </span>

                <select
                  value={t.status}
                  onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-200 px-2 py-1 rounded focus:outline-none"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="under_review">Under Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                Assign Governed ESG Task
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-xs">
                ✕
              </button>
            </div>

            {error && <div className="mb-3 p-2 bg-red-950 text-red-300 text-xs rounded">{error}</div>}

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Action Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Server Hall 1 Airflow Optimization"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description & Scope</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the technical specifications, vendor quotes, and verification metrics..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              {/* Assignee Selection (Strictly verified tenant users) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assigned Team Member (Tenant Verified)
                </label>
                <select
                  value={assignedToUserId}
                  onChange={(e) => setAssignedToUserId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  {orgUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Reduction (tCO₂e)</label>
                  <input
                    type="number"
                    step="any"
                    value={targetReductionTonnes}
                    onChange={(e) => setTargetReductionTonnes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-500 font-medium"
                >
                  {submitting ? 'Creating...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
