import React, { useMemo, useState } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useLifeKpi } from '../context/DataContext';
import { Kpi } from '../types/kpi';
import { KpiCard } from '../components/KpiCard';
import { aggregateLogsValue, evaluateKpi } from '../utils/kpiEvaluation';
import {
  formatIntervalLabel,
  formatShortDate,
  getHistoricalPeriodWindows,
  getKpiPeriodWindow,
  parseLocalDate,
} from '../utils/periodMath';
import { AREA_COLOR_MAP, getHealthVisuals } from '../utils/visualThemes';

// ---------------------------------------------------------------------------
// 1. All KPIs Explorer View
// ---------------------------------------------------------------------------

interface AllKpisViewProps {
  onSelectKpi: (kpiId: string) => void;
  onQuickLog: (kpiId: string) => void;
  onOpenNewKpi: () => void;
  onEditKpi: (kpi: Kpi) => void;
}

export const AllKpisView: React.FC<AllKpisViewProps> = ({
  onSelectKpi,
  onQuickLog,
  onOpenNewKpi,
  onEditKpi,
}) => {
  const { store, kpiEvaluationsById, updateSettings } = useLifeKpi();

  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'leading' | 'lagging'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvaluations = useMemo(() => {
    return store.kpis
      .filter((k) => k.status !== 'archived')
      .map((kpi) => {
        const evaluation = kpiEvaluationsById[kpi.id];
        const group = store.kpiGroups.find((g) => g.id === kpi.kpiGroupId);
        const goal = store.goals.find((g) => g.id === group?.goalId);
        const area = store.lifeAreas.find((a) => a.id === goal?.lifeAreaId);
        return { kpi, evaluation, group, goal, area };
      })
      .filter(({ kpi, evaluation, area }) => {
        if (!evaluation) return false;
        if (areaFilter !== 'all' && area?.id !== areaFilter) return false;
        if (typeFilter !== 'all' && kpi.kpiType !== typeFilter) return false;
        if (
          searchQuery.trim() &&
          !kpi.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !kpi.unit.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
  }, [store, kpiEvaluationsById, areaFilter, typeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            All KPIs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor, log, and inspect every leading and lagging indicator across your goals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              updateSettings({ compactKpiCards: !store.settings.compactKpiCards })
            }
            className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
          >
            {store.settings.compactKpiCards ? 'Standard Cards' : 'Compact Cards'}
          </button>
          <button
            type="button"
            onClick={onOpenNewKpi}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 rounded-lg whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add KPI
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start">
          {(['all', 'leading', 'lagging'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 ${
                typeFilter === t
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t === 'all' ? 'All Indicators' : `${t} Indicators`}
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
            placeholder="Search KPIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 w-48"
          />
        </div>
      </div>

      {filteredEvaluations.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            No KPIs match the current filters.
          </p>
          <button
            type="button"
            onClick={onOpenNewKpi}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" /> Create KPI
          </button>
        </div>
      ) : (
        <div
          className={
            store.settings.compactKpiCards
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5'
              : 'grid grid-cols-1 md:grid-cols-2 gap-4'
          }
        >
          {filteredEvaluations.map(({ evaluation }) => (
            <KpiCard
              key={evaluation.kpi.id}
              evaluation={evaluation}
              compact={store.settings.compactKpiCards}
              onQuickLog={onQuickLog}
              onViewHistory={onSelectKpi}
              onEditKpi={onEditKpi}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. KPI History & Period Navigation Detail Page (Sections 3 & 12)
// ---------------------------------------------------------------------------

interface KpiDetailViewProps {
  kpiId: string;
  onBack: () => void;
  onSelectGoal: (goalId: string) => void;
  onSelectArea: (areaId: string) => void;
  onQuickLog: (kpiId: string) => void;
  onEditKpi: (kpi: Kpi) => void;
}

export const KpiDetailView: React.FC<KpiDetailViewProps> = ({
  kpiId,
  onBack,
  onSelectGoal,
  onSelectArea,
  onQuickLog,
  onEditKpi,
}) => {
  const { store, logsByKpiId, updateTrackingLog, deleteTrackingLog } = useLifeKpi();

  // Period offset navigation: 0 = Current Period, -1 = Previous, +1 = Next
  const [periodOffset, setPeriodOffset] = useState<number>(0);

  // Chart mode: 'native' (KPI's custom period) vs 'calendar_monthly' (Calendar month aggregation)
  const [chartMode, setChartMode] = useState<'native' | 'calendar_monthly'>('native');

  // Inline log editing
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const kpi = store.kpis.find((k) => k.id === kpiId);

  if (!kpi) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">KPI not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg"
        >
          Back
        </button>
      </div>
    );
  }

  const group = store.kpiGroups.find((g) => g.id === kpi.kpiGroupId);
  const goal = store.goals.find((g) => g.id === group?.goalId);
  const area = store.lifeAreas.find((a) => a.id === goal?.lifeAreaId);
  const colorTokens = area ? AREA_COLOR_MAP[area.color] : AREA_COLOR_MAP.slate;

  const allKpiLogs = logsByKpiId[kpi.id] || [];
  const selectedEval = evaluateKpi(kpi, allKpiLogs, periodOffset);
  const prevEval = evaluateKpi(kpi, allKpiLogs, periodOffset - 1);
  const nextWindow = getKpiPeriodWindow(kpi.interval, periodOffset + 1);
  const visuals = getHealthVisuals(selectedEval.health);

  // Historical periods dropdown options (-12 to +2)
  const historicalSelectableWindows = useMemo(() => {
    const list = [];
    for (let off = 2; off >= -12; off--) {
      list.push(getKpiPeriodWindow(kpi.interval, off));
    }
    return list;
  }, [kpi.interval]);

  // 8 consecutive native periods ending at max(0, periodOffset)
  const nativeSeries = useMemo(() => {
    const windows = getHistoricalPeriodWindows(
      kpi.interval,
      8,
      Math.min(0, periodOffset)
    );
    return windows.map((w) => {
      const logs = allKpiLogs.filter((l) => l.date >= w.startDate && l.date <= w.endDate);
      const val = aggregateLogsValue(logs, kpi.aggregationMethod);
      return {
        label: w.label,
        shortLabel: w.startDate.slice(5), // MM-DD
        value: val,
        isSelected: w.index === periodOffset,
      };
    });
  }, [kpi.interval, kpi.aggregationMethod, allKpiLogs, periodOffset]);

  // Optional Calendar Month Aggregation View (last 6 calendar months)
  const calendarMonthlySeries = useMemo(() => {
    const now = new Date();
    const monthsNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const series = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const prefix = `${y}-${m}`;
      const logs = allKpiLogs.filter((l) => l.date.startsWith(prefix));
      const val = aggregateLogsValue(logs, kpi.aggregationMethod);
      series.push({
        label: `${monthsNames[d.getMonth()]} ${y}`,
        shortLabel: `${monthsNames[d.getMonth()]} '${String(y).slice(2)}`,
        value: val,
        isSelected: false,
      });
    }
    return series;
  }, [allKpiLogs, kpi.aggregationMethod]);

  const activeSeries = chartMode === 'native' ? nativeSeries : calendarMonthlySeries;
  const numericPoints = activeSeries
    .map((s) => s.value)
    .filter((v): v is number => v !== null);
  const maxChartVal =
    numericPoints.length > 0 ? Math.max(...numericPoints, kpi.targetValue, 1) * 1.15 : kpi.targetValue || 10;

  // Period-over-period delta
  const periodDelta =
    selectedEval.currentValue !== null && prevEval.currentValue !== null
      ? Number((selectedEval.currentValue - prevEval.currentValue).toFixed(2))
      : null;

  const isCumulative = kpi.aggregationMethod === 'sum' || kpi.aggregationMethod === 'count';

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          {area && (
            <>
              <span>/</span>
              <button
                type="button"
                onClick={() => onSelectArea(area.id)}
                className={`hover:underline ${colorTokens.text}`}
              >
                {area.name}
              </button>
            </>
          )}
          {goal && (
            <>
              <span>/</span>
              <button
                type="button"
                onClick={() => onSelectGoal(goal.id)}
                className="hover:underline truncate max-w-[200px]"
              >
                {goal.title}
              </button>
            </>
          )}
          <span>/</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{kpi.name}</span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEditKpi(kpi)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5" /> Configure KPI
          </button>
          <button
            type="button"
            onClick={() => onQuickLog(kpi.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 rounded-lg whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Log Entry
          </button>
        </div>
      </div>

      {/* KPI Header & Independent Period Navigation Bar (Section 3) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {kpi.name}
            </h1>
            {kpi.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400">{kpi.description}</p>
            )}
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums pt-1">
              <span>
                Target:{' '}
                {kpi.targetDirection === 'within_range'
                  ? `${kpi.targetValue}–${kpi.targetMax} ${kpi.unit}`
                  : kpi.targetDirection === 'at_most'
                  ? `≤ ${kpi.targetValue} ${kpi.unit}`
                  : `≥ ${kpi.targetValue} ${kpi.unit}`}{' '}
                ({formatIntervalLabel(kpi.interval).toLowerCase()})
              </span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">Aggregation: {kpi.aggregationMethod}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{kpi.kpiType} indicator</span>
              <span aria-hidden="true">·</span>
              <span>
                Alignment:{' '}
                {kpi.interval.alignmentMode === 'calendar'
                  ? 'Calendar-aligned'
                  : `Anchored (${kpi.interval.anchorDate})`}
              </span>
            </div>
          </div>

          {/* Period Navigation Controls: Previous / Current / Next / Select Historical */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/70 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 self-start">
            <button
              type="button"
              onClick={() => setPeriodOffset((o) => o - 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100"
              title="Previous Period"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>

            <button
              type="button"
              onClick={() => setPeriodOffset(0)}
              disabled={periodOffset === 0}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                periodOffset === 0
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Current Period
            </button>

            <button
              type="button"
              onClick={() => setPeriodOffset((o) => o + 1)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100"
              title="Next Period"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <select
              value={periodOffset}
              onChange={(e) => setPeriodOffset(Number(e.target.value))}
              aria-label="Select Historical Period"
              className="px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
            >
              {historicalSelectableWindows.map((w) => (
                <option key={w.index} value={w.index}>
                  {w.index === 0
                    ? `Current: ${w.label}`
                    : w.index > 0
                    ? `+${w.index}: ${w.label}`
                    : `${w.index}: ${w.label}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Period Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Selected Period Window
            </span>
            <span className="mt-1 block text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {selectedEval.period.label}
            </span>
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {selectedEval.period.isCurrent
                ? `${selectedEval.period.remainingDays} days remaining (${selectedEval.period.elapsedDays}/${selectedEval.period.totalDays}d elapsed)`
                : selectedEval.period.isPast
                ? `Completed period (${selectedEval.period.totalDays} days)`
                : `Upcoming period (${selectedEval.period.totalDays} days)`}
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Period Measurement
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {selectedEval.currentValue !== null ? selectedEval.currentValue : '—'}
              </span>
              <span className="text-xs font-mono text-slate-500">
                / {kpi.targetValue} {kpi.unit}
              </span>
            </div>
            <span className={`mt-1 block text-xs font-medium ${visuals.textClass}`}>
              {selectedEval.statusReason}
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              vs Equivalent Previous Period
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              {periodDelta !== null ? (
                <>
                  {periodDelta > 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : periodDelta < 0 ? (
                    <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {periodDelta > 0 ? `+${periodDelta}` : periodDelta} {kpi.unit}
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-slate-500">No prior comparison</span>
              )}
            </div>
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              Prev ({prevEval.period.label}):{' '}
              {prevEval.currentValue !== null ? `${prevEval.currentValue} ${kpi.unit}` : '—'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Next Period Schedule
            </span>
            <span className="mt-1 block text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {nextWindow.label}
            </span>
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
              Automatically rolls over when current cycle ends
            </span>
          </div>
        </div>
      </div>

      {/* Custom Interval Analytics Chart (Section 12) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {chartMode === 'native'
                ? `Native Measurement Interval Chart (${formatIntervalLabel(kpi.interval)})`
                : 'Calendar Monthly Aggregation Chart'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {chartMode === 'native'
                ? `Displays consecutive ${formatIntervalLabel(
                    kpi.interval
                  ).toLowerCase()} periods without forcing calendar month approximations.`
                : `Aggregates logged entries by calendar month (${kpi.aggregationMethod}) for broader seasonal comparison.`}
            </p>
          </div>

          {/* Toggle between KPI's native measurement period vs Calendar aggregation */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setChartMode('native')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                chartMode === 'native'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Native Period ({formatIntervalLabel(kpi.interval)})
            </button>
            <button
              type="button"
              onClick={() => setChartMode('calendar_monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                chartMode === 'calendar_monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Calendar Monthly View
            </button>
          </div>
        </div>

        {/* SVG Bar / Line Chart */}
        {isCumulative ? (
          // Bar Chart for per-period totals (Sum / Count)
          <div className="pt-4">
            <div className="grid grid-cols-8 gap-2 sm:gap-4 items-end h-48 pt-6 pb-2 px-2 border-b border-slate-200 dark:border-slate-800 relative">
              {activeSeries.map((pt, idx) => {
                const heightPct =
                  pt.value !== null
                    ? Math.min(100, Math.max(6, Math.round((pt.value / maxChartVal) * 100)))
                    : 4;
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-end h-full group"
                    title={`${pt.label}: ${pt.value !== null ? `${pt.value} ${kpi.unit}` : 'No data'}`}
                  >
                    <span className="text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-400 mb-1.5">
                      {pt.value !== null ? pt.value : '—'}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[42px] rounded-t-md transition-all ${
                        pt.value === null
                          ? 'bg-slate-100 dark:bg-slate-800'
                          : pt.isSelected
                          ? colorTokens.barFill
                          : 'bg-slate-700 dark:bg-slate-400 opacity-80 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-8 gap-2 sm:gap-4 pt-2 text-center">
              {activeSeries.map((pt, idx) => (
                <div
                  key={idx}
                  className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate"
                  title={pt.label}
                >
                  {pt.shortLabel}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Continuous Line + Point Chart for Average / Latest measurements
          <div className="pt-4">
            <div className="grid grid-cols-8 gap-2 sm:gap-4 items-end h-48 pt-6 pb-2 px-2 border-b border-slate-200 dark:border-slate-800">
              {activeSeries.map((pt, idx) => {
                const heightPct =
                  pt.value !== null
                    ? Math.min(100, Math.max(10, Math.round((pt.value / maxChartVal) * 100)))
                    : 6;
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-end h-full"
                    title={`${pt.label}: ${pt.value !== null ? `${pt.value} ${kpi.unit}` : 'No data'}`}
                  >
                    <span className="text-[11px] font-mono tabular-nums text-slate-700 dark:text-slate-300 mb-1.5">
                      {pt.value !== null ? pt.value : '—'}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full flex flex-col items-center justify-start"
                    >
                      <span
                        className={`w-3 h-3 rounded-full border-2 ${
                          pt.value === null
                            ? 'border-slate-300 dark:border-slate-700 bg-transparent'
                            : 'border-white dark:border-slate-900 bg-emerald-600 dark:bg-emerald-400'
                        }`}
                      />
                      <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-8 gap-2 sm:gap-4 pt-2 text-center">
              {activeSeries.map((pt, idx) => (
                <div
                  key={idx}
                  className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate"
                  title={pt.label}
                >
                  {pt.shortLabel}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Complete Tracking Log Table for this KPI */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Tracking Log History ({allKpiLogs.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All recorded measurements for {kpi.name}. Entries inside the selected period (
              {selectedEval.period.label}) are highlighted.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onQuickLog(kpi.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" /> Add Entry
          </button>
        </div>

        {allKpiLogs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              No measurements logged for {kpi.name} yet.
            </p>
            <button
              type="button"
              onClick={() => onQuickLog(kpi.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Log First Measurement
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium text-right">Value</th>
                  <th className="py-2.5 px-4 font-medium">Notes</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...allKpiLogs]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((log) => {
                    const inSelectedPeriod =
                      log.date >= selectedEval.period.startDate &&
                      log.date <= selectedEval.period.endDate;

                    return (
                      <tr
                        key={log.id}
                        className={
                          inSelectedPeriod
                            ? 'bg-slate-50/80 dark:bg-slate-800/30'
                            : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/20'
                        }
                      >
                        {editingLogId === log.id ? (
                          <td colSpan={4} className="py-2.5 px-4">
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
                                className="flex-1 min-w-[160px] px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
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
                            <td className="py-2.5 px-4 font-mono tabular-nums text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {formatShortDate(log.date)}
                              {inSelectedPeriod && (
                                <span className="ml-2 text-[11px] font-sans text-slate-400">
                                  · Active Period
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-semibold tabular-nums text-right text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              {log.value} {kpi.unit}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 max-w-md truncate">
                              {log.notes || '—'}
                            </td>
                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLogId(log.id);
                                  setEditDate(log.date);
                                  setEditValue(String(log.value));
                                  setEditNotes(log.notes || '');
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                                title="Edit Entry"
                              >
                                <Edit2 className="w-3.5 h-3.5 inline" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTrackingLog(log.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded ml-1"
                                title="Delete Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
