import React, { useMemo, useState } from 'react';
import {
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Layers,
  Target,
  Activity,
  FileText,
} from 'lucide-react';
import { useLifeKpi } from '../context/DataContext';
import { AREA_COLOR_MAP, getHealthVisuals, renderAreaIcon } from '../utils/visualThemes';
import { OnboardingBanner } from '../components/OnboardingBanner';
import { formatShortDate } from '../utils/periodMath';

interface DashboardViewProps {
  onSelectArea: (areaId: string) => void;
  onSelectGoal: (goalId: string) => void;
  onSelectKpi: (kpiId: string) => void;
  onQuickLog: (kpiId?: string) => void;
  onOpenNewArea: () => void;
  onOpenNewGoal: () => void;
  onOpenNewKpi: () => void;
  onNavigateReviews: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectArea,
  onSelectGoal,
  onSelectKpi,
  onQuickLog,
  onOpenNewArea,
  onOpenNewGoal,
  onOpenNewKpi,
  onNavigateReviews,
}) => {
  const { store, areaEvaluations, overallDashboardStats, kpiEvaluationsById } = useLifeKpi();

  // Needs Attention filter state
  const [filterAreaId, setFilterAreaId] = useState<string>('all');
  const [filterGoalId, setFilterGoalId] = useState<string>('all');
  const [filterGroupId, setFilterGroupId] = useState<string>('all');
  const [attentionTab, setAttentionTab] = useState<'behind' | 'awaiting'>('behind');

  const showOnboarding =
    !store.settings.hasCompletedOnboarding && store.lifeAreas.length === 0;

  // Build enriched list of all active KPI evaluations with their parent hierarchy
  const enrichedKpiEvals = useMemo(() => {
    return store.kpis
      .filter((k) => k.status === 'active')
      .map((kpi) => {
        const evaluation = kpiEvaluationsById[kpi.id];
        const group = store.kpiGroups.find((g) => g.id === kpi.kpiGroupId);
        const goal = store.goals.find((g) => g.id === group?.goalId);
        const area = store.lifeAreas.find((a) => a.id === goal?.lifeAreaId);
        return {
          kpi,
          evaluation,
          group,
          goal,
          area,
        };
      })
      .filter(
        (item) =>
          item.evaluation &&
          item.goal &&
          item.goal.status === 'active' &&
          item.area &&
          !item.area.archived
      );
  }, [store.kpis, store.kpiGroups, store.goals, store.lifeAreas, kpiEvaluationsById]);

  // Filter by Area, Goal, Group
  const filteredKpiItems = useMemo(() => {
    return enrichedKpiEvals.filter((item) => {
      if (filterAreaId !== 'all' && item.area?.id !== filterAreaId) return false;
      if (filterGoalId !== 'all' && item.goal?.id !== filterGoalId) return false;
      if (filterGroupId !== 'all' && item.group?.id !== filterGroupId) return false;
      return true;
    });
  }, [enrichedKpiEvals, filterAreaId, filterGoalId, filterGroupId]);

  const behindScheduleItems = useMemo(
    () =>
      filteredKpiItems.filter(
        (i) =>
          i.evaluation.health === 'at_risk' ||
          i.evaluation.health === 'behind_pace' ||
          i.evaluation.health === 'overdue_log'
      ),
    [filteredKpiItems]
  );

  const awaitingDataItems = useMemo(
    () => filteredKpiItems.filter((i) => i.evaluation.health === 'insufficient_data'),
    [filteredKpiItems]
  );

  const availableGoalsForFilter = useMemo(() => {
    return store.goals.filter(
      (g) => g.status === 'active' && (filterAreaId === 'all' || g.lifeAreaId === filterAreaId)
    );
  }, [store.goals, filterAreaId]);

  const availableGroupsForFilter = useMemo(() => {
    const validGoalIds = new Set(availableGoalsForFilter.map((g) => g.id));
    return store.kpiGroups.filter(
      (grp) =>
        validGoalIds.has(grp.goalId) && (filterGoalId === 'all' || grp.goalId === filterGoalId)
    );
  }, [store.kpiGroups, availableGoalsForFilter, filterGoalId]);

  return (
    <div className="space-y-8">
      {/* First-Run Onboarding Experience when workspace is empty */}
      {showOnboarding && (
        <OnboardingBanner
          onOpenNewArea={onOpenNewArea}
          onOpenNewGoal={onOpenNewGoal}
          onOpenNewKpi={onOpenNewKpi}
        />
      )}

      {/* Section E & Header: Dashboard Overview + Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Life Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track long-term goals and independent KPI measurement cycles across your life areas.
          </p>
        </div>

        {/* Section E: Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenNewArea}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Layers className="w-3.5 h-3.5" /> Add Life Area
          </button>
          <button
            type="button"
            onClick={onOpenNewGoal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Target className="w-3.5 h-3.5" /> Add Goal
          </button>
          <button
            type="button"
            onClick={onOpenNewKpi}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add KPI
          </button>
          <button
            type="button"
            onClick={onNavigateReviews}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <ClipboardCheck className="w-3.5 h-3.5" /> Open Review
          </button>
          <button
            type="button"
            onClick={() => onQuickLog()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Quick Log
          </button>
        </div>
      </div>

      {/* Section A: Life Overview Summary Metrics */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
          <div className="p-4 sm:p-5">
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Active Life Areas
            </span>
            <span className="mt-1.5 block text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {overallDashboardStats.activeAreasCount}
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <span className="block text-xs text-slate-500 dark:text-slate-400">Active Goals</span>
            <span className="mt-1.5 block text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {overallDashboardStats.activeGoalsCount}
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <span className="block text-xs text-slate-500 dark:text-slate-400">Active KPIs</span>
            <span className="mt-1.5 block text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {overallDashboardStats.activeKpisCount}
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <span className="block text-xs text-slate-500 dark:text-slate-400">KPIs On Track</span>
            <span className="mt-1.5 block text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
              {overallDashboardStats.onTrackKpisCount}
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Needing Attention
            </span>
            <span className="mt-1.5 block text-2xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
              {overallDashboardStats.attentionKpisCount}
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Weighted Alignment
            </span>
            {overallDashboardStats.hasSufficientData ? (
              <div className="mt-1.5">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {overallDashboardStats.overallScore}%
                </span>
                <span className="block text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                  {Math.round(overallDashboardStats.coverageRatio * 100)}% data coverage
                </span>
              </div>
            ) : (
              <div className="mt-1.5">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 block">
                  Insufficient Data
                </span>
                <span className="block text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Log entries to compute score
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section B: Life Area Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Life Areas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any domain to inspect its goals, KPI groups, and measurement schedules.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNewArea}
            className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New Area
          </button>
        </div>

        {areaEvaluations.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              No active Life Areas configured yet.
            </p>
            <button
              type="button"
              onClick={onOpenNewArea}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Create First Life Area
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areaEvaluations.map((ae) => {
              const {
                area,
                activeGoalsCount,
                activeKpisCount,
                onTrackKpisCount,
                attentionKpisCount,
                insufficientKpisCount,
                normalizedScore,
                coverageRatio,
              } = ae;
              const colorTokens = AREA_COLOR_MAP[area.color] || AREA_COLOR_MAP.slate;

              return (
                <div
                  key={area.id}
                  onClick={() => onSelectArea(area.id)}
                  className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorTokens.bgSoft} ${colorTokens.text}`}
                        >
                          {renderAreaIcon(area.icon, 'w-5 h-5')}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:underline">
                            {area.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                            <span>
                              {activeGoalsCount} {activeGoalsCount === 1 ? 'Goal' : 'Goals'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {activeKpisCount} {activeKpisCount === 1 ? 'KPI' : 'KPIs'}
                            </span>
                            {area.weight !== 1 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{area.weight}x wt</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {normalizedScore !== null ? (
                        <span className="text-sm font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          {normalizedScore}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          No logs
                        </span>
                      )}
                    </div>

                    {area.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-3">
                        {area.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-transform duration-150 origin-left ${
                          normalizedScore !== null
                            ? colorTokens.barFill
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        style={{ width: `${normalizedScore ?? 0}%` }}
                      />
                    </div>

                    {/* Unboxed status breakdown */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {onTrackKpisCount} on track
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            attentionKpisCount > 0
                              ? 'text-amber-700 dark:text-amber-400 font-medium'
                              : ''
                          }
                        >
                          {attentionKpisCount} attention
                        </span>
                        {insufficientKpisCount > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{insufficientKpisCount} unlogged</span>
                          </>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium group-hover:translate-x-0.5 transition-transform">
                        Open <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom 2-Column Split: Section C (Needs Attention) & Section D (Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Section C: Needs Attention (2 columns wide on desktop) */}
        <section className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Actionable Focus & Attention Queue
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Separates genuinely behind-schedule or overdue KPIs from metrics awaiting initial
                period entries.
              </p>
            </div>

            {/* Segmented Tab Control: Behind Schedule vs Awaiting Data */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start">
              <button
                type="button"
                onClick={() => setAttentionTab('behind')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  attentionTab === 'behind'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Needs Attention ({behindScheduleItems.length})
              </button>
              <button
                type="button"
                onClick={() => setAttentionTab('awaiting')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  attentionTab === 'awaiting'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Awaiting First Log ({awaitingDataItems.length})
              </button>
            </div>
          </div>

          {/* Filter Bar: Life Area, Goal, KPI Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <select
              value={filterAreaId}
              onChange={(e) => {
                setFilterAreaId(e.target.value);
                setFilterGoalId('all');
                setFilterGroupId('all');
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
              aria-label="Filter by Life Area"
            >
              <option value="all">All Life Areas</option>
              {store.lifeAreas
                .filter((a) => !a.archived)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>

            <select
              value={filterGoalId}
              onChange={(e) => {
                setFilterGoalId(e.target.value);
                setFilterGroupId('all');
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
              aria-label="Filter by Goal"
            >
              <option value="all">All Active Goals</option>
              {availableGoalsForFilter.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>

            <select
              value={filterGroupId}
              onChange={(e) => setFilterGroupId(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
              aria-label="Filter by KPI Group"
            >
              <option value="all">All KPI Groups</option>
              {availableGroupsForFilter.map((grp) => (
                <option key={grp.id} value={grp.id}>
                  {grp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Items List */}
          {attentionTab === 'behind' ? (
            behindScheduleItems.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  No KPIs are currently behind schedule or overdue
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {awaitingDataItems.length > 0
                    ? `You have ${awaitingDataItems.length} KPIs awaiting their first measurement in the current period.`
                    : 'All active tracked KPIs are on pace.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {behindScheduleItems.map(({ kpi, evaluation, group, goal, area }) => {
                  const visuals = getHealthVisuals(evaluation.health);
                  return (
                    <div
                      key={kpi.id}
                      className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-4 h-4 shrink-0 ${visuals.textClass}`} />
                          <button
                            type="button"
                            onClick={() => onSelectKpi(kpi.id)}
                            className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:underline truncate"
                          >
                            {kpi.name}
                          </button>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                            —
                          </span>
                          <span className={`text-xs font-medium ${visuals.textClass}`}>
                            {evaluation.statusReason}
                          </span>
                        </div>

                        <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 pl-6">
                          {area && (
                            <button
                              type="button"
                              onClick={() => onSelectArea(area.id)}
                              className="hover:underline"
                            >
                              {area.name}
                            </button>
                          )}
                          <span aria-hidden="true">·</span>
                          {goal && (
                            <button
                              type="button"
                              onClick={() => onSelectGoal(goal.id)}
                              className="hover:underline truncate max-w-[200px]"
                            >
                              {goal.title}
                            </button>
                          )}
                          <span aria-hidden="true">·</span>
                          <span>{group?.name}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{evaluation.periodLabel}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-6 sm:pl-0 shrink-0">
                        <button
                          type="button"
                          onClick={() => onSelectKpi(kpi.id)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => onQuickLog(kpi.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" /> Log Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : awaitingDataItems.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Every active KPI has at least one measurement recorded in its current period.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {awaitingDataItems.map(({ kpi, evaluation, group, goal, area }) => (
                <div
                  key={kpi.id}
                  className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <button
                        type="button"
                        onClick={() => onSelectKpi(kpi.id)}
                        className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:underline truncate"
                      >
                        {kpi.name}
                      </button>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                        ·
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        Target: {kpi.targetValue} {kpi.unit} ({evaluation.periodLabel})
                      </span>
                    </div>
                    <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 pl-6">
                      <span>{area?.name}</span>
                      <span aria-hidden="true">·</span>
                      <span>{goal?.title}</span>
                      <span aria-hidden="true">·</span>
                      <span>{group?.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{evaluation.period.label}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-6 sm:pl-0 shrink-0">
                    <button
                      type="button"
                      onClick={() => onQuickLog(kpi.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Log First Entry
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section D: Recent Activity */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Recent Activity
            </h2>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          {store.recentActivity.length === 0 && store.trackingLogs.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="w-6 h-6 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No recent logs or changes yet. Record a KPI measurement to see your activity stream.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto pr-1">
              {store.recentActivity.slice(0, 12).map((act) => {
                const dateOnly = act.timestamp.slice(0, 10);
                return (
                  <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{act.title}</p>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mt-0.5">
                      {act.subtitle && (
                        <>
                          <span className="truncate max-w-[180px]">{act.subtitle}</span>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      <span className="font-mono tabular-nums">{formatShortDate(dateOnly)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
