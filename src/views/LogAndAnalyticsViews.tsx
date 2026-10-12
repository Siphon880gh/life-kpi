import React, { useMemo, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useLifeKpi } from '../context/DataContext';
import { formatIntervalLabel, formatShortDate } from '../utils/periodMath';
import { AREA_COLOR_MAP, getHealthVisuals } from '../utils/visualThemes';

// ---------------------------------------------------------------------------
// 1. Complete Tracking Log View (Level 5 Ledger)
// ---------------------------------------------------------------------------

interface TrackingLogViewProps {
  onQuickLog: (kpiId?: string) => void;
  onSelectKpi: (kpiId: string) => void;
}

export const TrackingLogView: React.FC<TrackingLogViewProps> = ({
  onQuickLog,
  onSelectKpi,
}) => {
  const { store, updateTrackingLog, deleteTrackingLog } = useLifeKpi();

  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [kpiFilter, setKpiFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const enrichedLogs = useMemo(() => {
    return [...store.trackingLogs]
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      })
      .map((log) => {
        const kpi = store.kpis.find((k) => k.id === log.kpiId);
        const group = store.kpiGroups.find((g) => g.id === kpi?.kpiGroupId);
        const goal = store.goals.find((g) => g.id === group?.goalId);
        const area = store.lifeAreas.find((a) => a.id === goal?.lifeAreaId);
        return { log, kpi, group, goal, area };
      })
      .filter(({ log, kpi, area }) => {
        if (!kpi) return false;
        if (areaFilter !== 'all' && area?.id !== areaFilter) return false;
        if (kpiFilter !== 'all' && kpi.id !== kpiFilter) return false;
        if (
          searchQuery.trim() &&
          !kpi.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(log.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
  }, [store, areaFilter, kpiFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Tracking Log
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Complete chronological ledger of all recorded KPI measurements and notes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onQuickLog(kpiFilter !== 'all' ? kpiFilter : undefined)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 rounded-lg self-start whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Record Measurement
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={areaFilter}
            onChange={(e) => {
              setAreaFilter(e.target.value);
              setKpiFilter('all');
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Life Areas</option>
            {store.lifeAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={kpiFilter}
            onChange={(e) => setKpiFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
          >
            <option value="all">All KPIs</option>
            {store.kpis.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({k.unit})
              </option>
            ))}
          </select>
        </div>

        <input
          type="search"
          placeholder="Search KPI name or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 w-56"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {enrichedLogs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              No tracking entries recorded yet.
            </p>
            <button
              type="button"
              onClick={() => onQuickLog()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Log First Entry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">KPI</th>
                  <th className="py-3 px-4 font-medium">Life Area & Goal</th>
                  <th className="py-3 px-4 font-medium text-right">Value</th>
                  <th className="py-3 px-4 font-medium">Notes</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {enrichedLogs.map(({ log, kpi, goal, area }) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {editingLogId === log.id ? (
                      <td colSpan={6} className="py-2.5 px-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="px-2.5 py-1 font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                          />
                          <input
                            type="number"
                            step="any"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 px-2.5 py-1 font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                          />
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Notes..."
                            className="flex-1 min-w-[180px] px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const num = parseFloat(editValue);
                              if (!isNaN(num)) {
                                updateTrackingLog(log.id, {
                                  date: editDate,
                                  value: num,
                                  notes: editNotes,
                                });
                                setEditingLogId(null);
                              }
                            }}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingLogId(null)}
                            className="p-1.5 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {formatShortDate(log.date)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          <button
                            type="button"
                            onClick={() => kpi && onSelectKpi(kpi.id)}
                            className="hover:underline text-left"
                          >
                            {kpi?.name}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {area?.name} {goal ? `· ${goal.title}` : ''}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold tabular-nums text-right text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {log.value} {kpi?.unit}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {log.notes || '—'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLogId(log.id);
                              setEditDate(log.date);
                              setEditValue(String(log.value));
                              setEditNotes(log.notes || '');
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5 inline" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTrackingLog(log.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. Analytics & Cross-Hierarchy Performance View (Sections 11 & 12)
// ---------------------------------------------------------------------------

interface AnalyticsViewProps {
  onSelectArea: (areaId: string) => void;
  onSelectGoal: (goalId: string) => void;
  onSelectKpi: (kpiId: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  onSelectArea,
  onSelectGoal,
  onSelectKpi,
}) => {
  const { store, areaEvaluations, overallDashboardStats, kpiEvaluationsById } = useLifeKpi();

  const leadingVsLaggingStats = useMemo(() => {
    const activeEvals = store.kpis
      .filter((k) => k.status === 'active')
      .map((k) => kpiEvaluationsById[k.id])
      .filter(Boolean);

    const leading = activeEvals.filter((e) => e.kpi.kpiType === 'leading');
    const lagging = activeEvals.filter((e) => e.kpi.kpiType === 'lagging');

    const avgScore = (list: typeof activeEvals) => {
      const withScore = list.filter((e) => e.normalizedScore !== null);
      if (withScore.length === 0) return null;
      const sum = withScore.reduce((acc, e) => acc + (e.normalizedScore ?? 0), 0);
      return Math.round(sum / withScore.length);
    };

    return {
      leadingCount: leading.length,
      leadingEvaluated: leading.filter((e) => e.normalizedScore !== null).length,
      leadingScore: avgScore(leading),
      laggingCount: lagging.length,
      laggingEvaluated: lagging.filter((e) => e.normalizedScore !== null).length,
      laggingScore: avgScore(lagging),
    };
  }, [store.kpis, kpiEvaluationsById]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Analytics & Weighted Alignment
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Normalized achievement scores, data coverage transparency, and Leading vs. Lagging
          indicator performance across custom measurement intervals.
        </p>
      </div>

      {/* Top Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">
            Overall Weighted Life Score
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {overallDashboardStats.hasSufficientData
                ? `${overallDashboardStats.overallScore}%`
                : 'Insufficient Data'}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {Math.round(overallDashboardStats.coverageRatio * 100)}% KPI coverage
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Unlogged metrics are excluded rather than treated as 0% or 100%.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">
            Leading Indicators (Inputs & Habits)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {leadingVsLaggingStats.leadingScore !== null
                ? `${leadingVsLaggingStats.leadingScore}%`
                : '—'}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {leadingVsLaggingStats.leadingEvaluated} / {leadingVsLaggingStats.leadingCount} logged
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Measures execution of controllable actions and recurring routines.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">
            Lagging Indicators (Outcomes & Thresholds)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {leadingVsLaggingStats.laggingScore !== null
                ? `${leadingVsLaggingStats.laggingScore}%`
                : '—'}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {leadingVsLaggingStats.laggingEvaluated} / {leadingVsLaggingStats.laggingCount} logged
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Measures target satisfaction and physiological/financial results.
          </p>
        </div>
      </div>

      {/* Life Area Comparative Bar Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Life Area Performance & Data Coverage
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Weighted goal aggregation per Life Area alongside active KPI logging coverage.
            </p>
          </div>
          <BarChart3 className="w-5 h-5 text-slate-400" />
        </div>

        {areaEvaluations.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No active Life Areas to analyze.</p>
        ) : (
          <div className="space-y-4">
            {areaEvaluations.map((ae) => {
              const colorTokens = AREA_COLOR_MAP[ae.area.color] || AREA_COLOR_MAP.slate;
              return (
                <div key={ae.area.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectArea(ae.area.id)}
                        className="font-semibold text-slate-900 dark:text-slate-100 hover:underline"
                      >
                        {ae.area.name}
                      </button>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        Weight {ae.area.weight}x
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {Math.round(ae.coverageRatio * 100)}% data coverage ({ae.activeKpisCount - ae.insufficientKpisCount}/{ae.activeKpisCount} KPIs)
                      </span>
                    </div>

                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {ae.normalizedScore !== null ? `${ae.normalizedScore}%` : 'Insufficient Data'}
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ae.normalizedScore !== null
                          ? colorTokens.barFill
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{ width: `${ae.normalizedScore ?? 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complete KPI Period Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Independent KPI Measurement Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any KPI to inspect its historical period-by-period chart and custom interval
            alignment.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/40">
                <th className="py-3 px-4 font-medium">KPI</th>
                <th className="py-3 px-4 font-medium">Goal</th>
                <th className="py-3 px-4 font-medium">Native Interval</th>
                <th className="py-3 px-4 font-medium">Active Period Window</th>
                <th className="py-3 px-4 font-medium text-right">Current / Target</th>
                <th className="py-3 px-4 font-medium text-right">Score</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {store.kpis
                .filter((k) => k.status === 'active')
                .map((kpi) => {
                  const ev = kpiEvaluationsById[kpi.id];
                  if (!ev) return null;
                  const grp = store.kpiGroups.find((g) => g.id === kpi.kpiGroupId);
                  const goal = store.goals.find((g) => g.id === grp?.goalId);
                  const visuals = getHealthVisuals(ev.health);

                  return (
                    <tr
                      key={kpi.id}
                      onClick={() => onSelectKpi(kpi.id)}
                      className="cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {kpi.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {goal ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectGoal(goal.id);
                            }}
                            className="hover:underline"
                          >
                            {goal.title}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatIntervalLabel(kpi.interval)}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {ev.period.label}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {ev.currentValue !== null ? ev.currentValue : '—'} / {kpi.targetValue}{' '}
                        {kpi.unit}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold tabular-nums text-right text-slate-900 dark:text-slate-100">
                        {ev.normalizedScore !== null ? `${ev.normalizedScore}%` : '—'}
                      </td>
                      <td className={`py-3 px-4 font-medium whitespace-nowrap ${visuals.textClass}`}>
                        {visuals.label}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
