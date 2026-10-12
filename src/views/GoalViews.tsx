import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  ArrowRight,
  FolderPlus,
} from 'lucide-react';
import { useLifeKpi } from '../context/DataContext';
import { Goal, GoalStatus, Kpi, KpiGroup } from '../types/kpi';
import { AREA_COLOR_MAP, renderAreaIcon } from '../utils/visualThemes';
import { formatShortDate } from '../utils/periodMath';
import { KpiCard } from '../components/KpiCard';

// ---------------------------------------------------------------------------
// 1. All Goals List View
// ---------------------------------------------------------------------------

interface GoalsListViewProps {
  onSelectArea: (areaId: string) => void;
  onSelectGoal: (goalId: string) => void;
  onOpenNewGoal: () => void;
  onEditGoal: (goal: Goal) => void;
}

export const GoalsListView: React.FC<GoalsListViewProps> = ({
  onSelectArea,
  onSelectGoal,
  onOpenNewGoal,
  onEditGoal,
}) => {
  const { store, goalEvaluationsById, deleteGoal } = useLifeKpi();

  const [statusFilter, setStatusFilter] = useState<'all' | GoalStatus>('active');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredGoals = store.goals.filter((g) => {
    if (statusFilter !== 'all' && g.status !== statusFilter) return false;
    if (areaFilter !== 'all' && g.lifeAreaId !== areaFilter) return false;
    if (
      searchQuery.trim() &&
      !g.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !g.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Goals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Long-term outcomes supported by KPI groups and independent tracking intervals.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewGoal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 rounded-lg self-start whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add Goal
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
          {(['all', 'active', 'paused', 'completed', 'archived'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Life Areas</option>
            {store.lifeAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <input
            type="search"
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 w-48"
          />
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            No goals match the current filter.
          </p>
          <button
            type="button"
            onClick={onOpenNewGoal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" /> Create Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const area = store.lifeAreas.find((a) => a.id === goal.lifeAreaId);
            const gEval = goalEvaluationsById[goal.id];
            const colorTokens = area ? AREA_COLOR_MAP[area.color] : AREA_COLOR_MAP.slate;
            const score = gEval?.normalizedScore ?? null;

            return (
              <div
                key={goal.id}
                onClick={() => onSelectGoal(goal.id)}
                className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {area && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectArea(area.id);
                          }}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium mb-1 hover:underline ${colorTokens.text}`}
                        >
                          {renderAreaIcon(area.icon, 'w-3.5 h-3.5')}
                          <span>{area.name}</span>
                        </button>
                      )}
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:underline">
                        {goal.title}
                      </h2>
                      <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                          {goal.status}
                        </span>
                        {goal.priority && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{goal.priority} priority</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Started {formatShortDate(goal.startDate)}
                        </span>
                        {goal.targetDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              Target {formatShortDate(goal.targetDate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onEditGoal(goal)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {confirmDeleteId === goal.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            deleteGoal(goal.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-white bg-rose-600 rounded"
                        >
                          Confirm
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(goal.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2">
                      {goal.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-slate-500 dark:text-slate-400">
                      {gEval?.groupEvaluations.length ?? 0} Groups · {gEval?.totalActiveKpis ?? 0}{' '}
                      KPIs
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {score !== null ? `${score}%` : 'Insufficient Data'}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        score !== null ? colorTokens.barFill : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{ width: `${score ?? 0}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {gEval?.onTrackCount ?? 0} on track · {gEval?.attentionCount ?? 0} attention
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-slate-900 dark:text-slate-100 group-hover:translate-x-0.5 transition-transform">
                      Open Goal <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. Goal Detail Page (Section 8 — One of the most important screens)
// ---------------------------------------------------------------------------

interface GoalDetailViewProps {
  goalId: string;
  onSelectArea: (areaId: string) => void;
  onBackToGoals: () => void;
  onEditGoal: (goal: Goal) => void;
  onOpenNewKpi: (goalId: string, groupId: string) => void;
  onEditKpi: (kpi: Kpi) => void;
  onQuickLog: (kpiId: string) => void;
  onViewKpiHistory: (kpiId: string) => void;
}

export const GoalDetailView: React.FC<GoalDetailViewProps> = ({
  goalId,
  onSelectArea,
  onBackToGoals,
  onEditGoal,
  onOpenNewKpi,
  onEditKpi,
  onQuickLog,
  onViewKpiHistory,
}) => {
  const {
    store,
    goalEvaluationsById,
    updateSettings,
    addKpiGroup,
    updateKpiGroup,
    reorderKpiGroups,
    deleteKpiGroup,
    reorderKpis,
  } = useLifeKpi();

  const [newGroupName, setNewGroupName] = useState('');
  const [showAddGroupInput, setShowAddGroupInput] = useState(false);

  // Inline group editing state
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupWeight, setEditGroupWeight] = useState('1.0');
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);

  const goal = store.goals.find((g) => g.id === goalId);
  const goalEval = goalEvaluationsById[goalId];

  if (!goal || !goalEval) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">Goal not found.</p>
        <button
          type="button"
          onClick={onBackToGoals}
          className="mt-3 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg"
        >
          Back to Goals
        </button>
      </div>
    );
  }

  const area = store.lifeAreas.find((a) => a.id === goal.lifeAreaId);
  const colorTokens = area ? AREA_COLOR_MAP[area.color] : AREA_COLOR_MAP.slate;
  const allGoalGroups: KpiGroup[] = goalEval.groupEvaluations.map((ge) => ge.group);

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    addKpiGroup(goal.id, newGroupName.trim(), 1.0);
    setNewGroupName('');
    setShowAddGroupInput(false);
  };

  const moveGroup = (index: number, direction: -1 | 1) => {
    const next = [...allGoalGroups];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    reorderKpiGroups(
      goal.id,
      next.map((g) => g.id)
    );
  };

  const moveKpiInGroup = (groupId: string, kpiIds: string[], index: number, direction: -1 | 1) => {
    const next = [...kpiIds];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    reorderKpis(groupId, next);
  };

  const startEditingGroup = (grp: KpiGroup) => {
    setEditingGroupId(grp.id);
    setEditGroupName(grp.name);
    setEditGroupWeight(String(grp.weight ?? 1.0));
  };

  const saveGroupEdits = (groupId: string) => {
    if (!editGroupName.trim()) return;
    updateKpiGroup(groupId, {
      name: editGroupName.trim(),
      weight: Math.max(0.1, parseFloat(editGroupWeight) || 1.0),
    });
    setEditingGroupId(null);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation: Life Area / Goal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={onBackToGoals}
            className="hover:text-slate-900 dark:hover:text-white"
          >
            Goals
          </button>
          <span aria-hidden="true">/</span>
          {area && (
            <>
              <button
                type="button"
                onClick={() => onSelectArea(area.id)}
                className={`inline-flex items-center gap-1 font-medium hover:underline ${colorTokens.text}`}
              >
                {renderAreaIcon(area.icon, 'w-3.5 h-3.5')}
                <span>{area.name}</span>
              </button>
              <span aria-hidden="true">/</span>
            </>
          )}
          <span className="text-slate-900 dark:text-slate-100 font-medium truncate max-w-[240px]">
            {goal.title}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              updateSettings({ compactKpiCards: !store.settings.compactKpiCards })
            }
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
          >
            {store.settings.compactKpiCards ? 'Standard Cards' : 'Compact Cards'}
          </button>
          <button
            type="button"
            onClick={() => onEditGoal(goal)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Goal
          </button>
        </div>
      </div>

      {/* Goal Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {goal.title}
            </h1>
            {goal.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400">{goal.description}</p>
            )}
            {goal.successCriteria && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Success Criteria:{' '}
                </span>
                {goal.successCriteria}
              </p>
            )}

            {/* Clean unboxed metadata */}
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums pt-1">
              <span className="capitalize font-sans font-medium text-slate-800 dark:text-slate-200">
                Status: {goal.status}
              </span>
              <span aria-hidden="true">·</span>
              <span>Start: {formatShortDate(goal.startDate)}</span>
              {goal.targetDate && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Target Deadline: {formatShortDate(goal.targetDate)}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>Weight: {goal.weight}x</span>
            </div>
          </div>

          {/* Goal Performance Summary Box */}
          <div className="lg:w-72 shrink-0 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Outcome Achievement
              </span>
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {goalEval.normalizedScore !== null
                  ? `${goalEval.normalizedScore}%`
                  : 'Insufficient Data'}
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${colorTokens.barFill}`}
                style={{ width: `${goalEval.normalizedScore ?? 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <span>{goalEval.onTrackCount} on track</span>
              <span>·</span>
              <span>{goalEval.attentionCount} attention</span>
              <span>·</span>
              <span>{Math.round(goalEval.coverageRatio * 100)}% logged</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Groups Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            KPI Groups ({goalEval.groupEvaluations.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organize related Leading and Lagging indicators into weighted containers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddGroupInput(!showAddGroupInput)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
        >
          <FolderPlus className="w-3.5 h-3.5" /> Add KPI Group
        </button>
      </div>

      {showAddGroupInput && (
        <form
          onSubmit={handleCreateGroup}
          className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5"
        >
          <input
            type="text"
            autoFocus
            required
            placeholder="Group name (e.g., Exercise, Body Composition, Recovery)..."
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
          >
            Create Group
          </button>
          <button
            type="button"
            onClick={() => setShowAddGroupInput(false)}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
          >
            Cancel
          </button>
        </form>
      )}

      {/* KPI Group Sections (Collapsible) */}
      <div className="space-y-5">
        {goalEval.groupEvaluations.map((grpEval, grpIdx) => {
          const { group, kpiEvaluations, normalizedScore } = grpEval;
          const isCollapsed = Boolean(group.collapsed);
          const kpiIds = kpiEvaluations.map((ke) => ke.kpi.id);

          return (
            <section
              key={group.id}
              className="bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
            >
              {/* Group Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
                {editingGroupId === group.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                      className="px-2.5 py-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                    <label className="text-xs text-slate-500 flex items-center gap-1">
                      Weight:
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        value={editGroupWeight}
                        onChange={(e) => setEditGroupWeight(e.target.value)}
                        className="w-16 px-2 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => saveGroupEdits(group.id)}
                      className="p-1 text-emerald-600 hover:text-emerald-700"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingGroupId(null)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateKpiGroup(group.id, { collapsed: !isCollapsed })}
                    className="flex items-center gap-2 text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {group.name}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      — {kpiEvaluations.length} {kpiEvaluations.length === 1 ? 'KPI' : 'KPIs'}
                      {group.weight !== 1 ? ` · ${group.weight}x wt` : ''}
                      {normalizedScore !== null ? ` · ${normalizedScore}%` : ''}
                    </span>
                  </button>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={grpIdx === 0}
                    onClick={() => moveGroup(grpIdx, -1)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                    title="Move Group Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={grpIdx === goalEval.groupEvaluations.length - 1}
                    onClick={() => moveGroup(grpIdx, 1)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                    title="Move Group Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditingGroup(group)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Rename / Weight Group"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {goalEval.groupEvaluations.length > 1 && (
                    <>
                      {confirmDeleteGroupId === group.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            deleteKpiGroup(group.id);
                            setConfirmDeleteGroupId(null);
                          }}
                          className="px-2 py-0.5 text-[11px] font-semibold text-white bg-rose-600 rounded"
                        >
                          Confirm
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteGroupId(group.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Delete Group"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenNewKpi(goal.id, group.id)}
                    className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add KPI
                  </button>
                </div>
              </div>

              {/* Group Body: KPI Cards */}
              {!isCollapsed && (
                <div className="p-4">
                  {kpiEvaluations.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        No KPIs in {group.name} yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenNewKpi(goal.id, group.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add KPI to {group.name}
                      </button>
                    </div>
                  ) : (
                    <div
                      className={
                        store.settings.compactKpiCards
                          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
                          : 'grid grid-cols-1 md:grid-cols-2 gap-4'
                      }
                    >
                      {kpiEvaluations.map((kEval, kIdx) => (
                        <KpiCard
                          key={kEval.kpi.id}
                          evaluation={kEval}
                          compact={store.settings.compactKpiCards}
                          availableGroups={allGoalGroups}
                          onQuickLog={onQuickLog}
                          onViewHistory={onViewKpiHistory}
                          onEditKpi={onEditKpi}
                          onMoveUp={
                            kIdx > 0
                              ? () => moveKpiInGroup(group.id, kpiIds, kIdx, -1)
                              : undefined
                          }
                          onMoveDown={
                            kIdx < kpiEvaluations.length - 1
                              ? () => moveKpiInGroup(group.id, kpiIds, kIdx, 1)
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
