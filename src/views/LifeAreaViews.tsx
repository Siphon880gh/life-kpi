import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  LayoutGrid,
  List,
  ChevronLeft,
} from 'lucide-react';
import { useLifeKpi } from '../context/DataContext';
import { Goal, LifeArea } from '../types/kpi';
import { AREA_COLOR_MAP, renderAreaIcon } from '../utils/visualThemes';
import { formatShortDate } from '../utils/periodMath';

// ---------------------------------------------------------------------------
// 1. All Life Areas Management View
// ---------------------------------------------------------------------------

interface LifeAreasListViewProps {
  onSelectArea: (areaId: string) => void;
  onOpenNewArea: () => void;
  onEditArea: (area: LifeArea) => void;
}

export const LifeAreasListView: React.FC<LifeAreasListViewProps> = ({
  onSelectArea,
  onOpenNewArea,
  onEditArea,
}) => {
  const { store, areaEvaluations, updateLifeArea, reorderLifeAreas, deleteLifeArea } =
    useLifeKpi();
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeAreas = [...store.lifeAreas]
    .filter((a) => !a.archived)
    .sort((a, b) => a.order - b.order);

  const archivedAreas = store.lifeAreas.filter((a) => a.archived);

  const moveArea = (index: number, direction: -1 | 1) => {
    const next = [...activeAreas];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    reorderLifeAreas(next.map((a) => a.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Life Areas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage, weight, and reorder the foundational domains of your life.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {archivedAreas.length > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
            >
              {showArchived ? 'Hide Archived' : `Archived (${archivedAreas.length})`}
            </button>
          )}
          <button
            type="button"
            onClick={onOpenNewArea}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 rounded-lg whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Life Area
          </button>
        </div>
      </div>

      {activeAreas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            No active Life Areas found.
          </p>
          <button
            type="button"
            onClick={onOpenNewArea}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" /> Create Life Area
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeAreas.map((area, idx) => {
            const evalData = areaEvaluations.find((ae) => ae.area.id === area.id);
            const colorTokens = AREA_COLOR_MAP[area.color] || AREA_COLOR_MAP.slate;

            return (
              <div
                key={area.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    onClick={() => onSelectArea(area.id)}
                    className="flex items-start gap-3 cursor-pointer group min-w-0"
                  >
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorTokens.bgSoft} ${colorTokens.text}`}
                    >
                      {renderAreaIcon(area.icon, 'w-5 h-5')}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:underline truncate">
                        {area.name}
                      </h2>
                      <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                        <span>{evalData?.activeGoalsCount ?? 0} Active Goals</span>
                        <span aria-hidden="true">·</span>
                        <span>{evalData?.activeKpisCount ?? 0} Active KPIs</span>
                        <span aria-hidden="true">·</span>
                        <span>Weight: {area.weight}x</span>
                      </div>
                    </div>
                  </div>

                  {/* Reorder / Edit / Archive / Delete Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveArea(idx, -1)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 rounded"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === activeAreas.length - 1}
                      onClick={() => moveArea(idx, 1)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 rounded"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditArea(area)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                      title="Edit Life Area"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLifeArea(area.id, { archived: true })}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded"
                      title="Archive Area"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    {confirmDeleteId === area.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          deleteLifeArea(area.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-white bg-rose-600 rounded"
                      >
                        Confirm
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(area.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete Area"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {area.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">{area.description}</p>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Overall Area Performance
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {evalData?.normalizedScore !== null && evalData?.normalizedScore !== undefined
                        ? `${evalData.normalizedScore}%`
                        : 'Insufficient Data'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        evalData?.normalizedScore !== null
                          ? colorTokens.barFill
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{ width: `${evalData?.normalizedScore ?? 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      <span>{evalData?.onTrackKpisCount ?? 0} on track</span>
                      <span aria-hidden="true" className="mx-1.5">
                        ·
                      </span>
                      <span>{evalData?.attentionKpisCount ?? 0} attention</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectArea(area.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-900 dark:text-slate-100 hover:underline"
                    >
                      Open Area Details <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showArchived && archivedAreas.length > 0 && (
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Archived Life Areas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {archivedAreas.map((area) => (
              <div
                key={area.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {area.name}
                  </p>
                  <p className="text-xs text-slate-500">{area.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateLifeArea(area.id, { archived: false })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. Life Area Detail Page (Section 7)
// ---------------------------------------------------------------------------

interface LifeAreaDetailViewProps {
  areaId: string;
  onBack: () => void;
  onSelectGoal: (goalId: string) => void;
  onOpenNewGoal: (areaId: string) => void;
  onEditArea: (area: LifeArea) => void;
  onEditGoal: (goal: Goal) => void;
}

export const LifeAreaDetailView: React.FC<LifeAreaDetailViewProps> = ({
  areaId,
  onBack,
  onSelectGoal,
  onOpenNewGoal,
  onEditArea,
  onEditGoal,
}) => {
  const { store, areaEvaluations, goalEvaluationsById } = useLifeKpi();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const area = store.lifeAreas.find((a) => a.id === areaId);
  const areaEval = areaEvaluations.find((ae) => ae.area.id === areaId);

  if (!area) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">Life Area not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg"
        >
          Back to Life Areas
        </button>
      </div>
    );
  }

  const colorTokens = AREA_COLOR_MAP[area.color] || AREA_COLOR_MAP.slate;
  const areaGoals = store.goals
    .filter((g) => g.lifeAreaId === area.id && g.status !== 'archived')
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" /> All Life Areas
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEditArea(area)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Area
          </button>
          <button
            type="button"
            onClick={() => onOpenNewGoal(area.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 rounded-lg whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Goal
          </button>
        </div>
      </div>

      {/* Area Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <span
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorTokens.bgSoft} ${colorTokens.text}`}
            >
              {renderAreaIcon(area.icon, 'w-6 h-6')}
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {area.name}
              </h1>
              {area.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                  {area.description}
                </p>
              )}
              <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-2.5">
                <span>{areaEval?.activeGoalsCount ?? 0} Active Goals</span>
                <span aria-hidden="true">·</span>
                <span>{areaEval?.activeKpisCount ?? 0} Active KPIs</span>
                <span aria-hidden="true">·</span>
                <span>Importance Weight: {area.weight}x</span>
              </div>
            </div>
          </div>

          {/* Area KPI Summary */}
          <div className="md:w-64 shrink-0 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Overall KPI Summary</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {areaEval?.normalizedScore !== null && areaEval?.normalizedScore !== undefined
                  ? `${areaEval.normalizedScore}%`
                  : 'Insufficient Data'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${colorTokens.barFill}`}
                style={{ width: `${areaEval?.normalizedScore ?? 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
              <span>{areaEval?.onTrackKpisCount ?? 0} on track</span>
              <span>{areaEval?.attentionKpisCount ?? 0} need attention</span>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Cards Toolbar (Grid / List toggle) */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Goals in {area.name} ({areaGoals.length})
        </h2>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Goal Cards */}
      {areaGoals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            No goals defined in {area.name} yet.
          </p>
          <button
            type="button"
            onClick={() => onOpenNewGoal(area.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Goal
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
              : 'flex flex-col gap-3'
          }
        >
          {areaGoals.map((goal) => {
            const gEval = goalEvaluationsById[goal.id];
            const groupCount = gEval?.groupEvaluations.length ?? 0;
            const kpiCount = gEval?.totalActiveKpis ?? 0;
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
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:underline">
                        {goal.title}
                      </h3>
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
                        {goal.targetDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              Target: {formatShortDate(goal.targetDate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditGoal(goal);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg shrink-0"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2">
                      {goal.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      <span>
                        {groupCount} {groupCount === 1 ? 'Group' : 'Groups'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {kpiCount} {kpiCount === 1 ? 'KPI' : 'KPIs'}
                      </span>
                    </div>

                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {score !== null ? `${score}% achievement` : 'Awaiting KPI logs'}
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
