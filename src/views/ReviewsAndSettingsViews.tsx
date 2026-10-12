import React, { useMemo, useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  HardDrive,
} from 'lucide-react';
import { useLifeKpi } from '../context/DataContext';
import { IntervalUnit, ReviewIntervalConfig, ThemeMode } from '../types/kpi';
import {
  formatDateRangeLabel,
  formatIntervalLabel,
  formatShortDate,
  getKpiPeriodWindow,
  getTodayDateString,
} from '../utils/periodMath';
import { evaluateKpi } from '../utils/kpiEvaluation';

// ---------------------------------------------------------------------------
// 1. Flexible Reviews & Reflections View (Section 13)
// ---------------------------------------------------------------------------

const REVIEW_PRESETS: {
  id: ReviewIntervalConfig['preset'];
  label: string;
  count: number;
  unit: IntervalUnit;
}[] = [
  { id: 'weekly', label: 'Weekly', count: 1, unit: 'weeks' },
  { id: 'biweekly', label: 'Biweekly (2w)', count: 2, unit: 'weeks' },
  { id: '3weeks', label: 'Every 3 Weeks', count: 3, unit: 'weeks' },
  { id: 'monthly', label: 'Monthly', count: 1, unit: 'months' },
  { id: '2months', label: 'Every 2 Months', count: 2, unit: 'months' },
  { id: 'quarterly', label: 'Quarterly', count: 3, unit: 'months' },
  { id: 'custom', label: 'Custom Interval', count: 10, unit: 'days' },
];

export const ReviewsView: React.FC = () => {
  const {
    store,
    areaEvaluations,
    overallDashboardStats,
    kpiEvaluationsById,
    logsByKpiId,
    addReview,
    deleteReview,
    updateSettings,
  } = useLifeKpi();

  const savedCfg = store.settings.defaultReviewInterval;
  const [preset, setPreset] = useState<ReviewIntervalConfig['preset']>(savedCfg.preset);
  const [intervalCount, setIntervalCount] = useState<string>(String(savedCfg.intervalCount));
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>(savedCfg.intervalUnit);

  // Reflection fields
  const [wentWell, setWentWell] = useState('');
  const [didNotGoWell, setDidNotGoWell] = useState('');
  const [shouldImprove, setShouldImprove] = useState('');
  const [deservesAttention, setDeservesAttention] = useState('');
  const [nextPriorities, setNextPriorities] = useState('');

  // Historical filter
  const [historyFilterStart, setHistoryFilterStart] = useState('');
  const [historyFilterEnd, setHistoryFilterEnd] = useState('');
  const [justSavedBanner, setJustSavedBanner] = useState(false);

  const reviewWindow = useMemo(() => {
    const count = Math.max(1, parseInt(intervalCount, 10) || 1);
    return getKpiPeriodWindow(
      {
        intervalCount: count,
        intervalUnit,
        alignmentMode: 'calendar',
        anchorDate: getTodayDateString(),
        weekStartsOn: 1,
      },
      0
    );
  }, [intervalCount, intervalUnit]);

  // Compute automated review summary content (Section 13)
  const reviewInsights = useMemo(() => {
    const activeGoals = store.goals.filter((g) => g.status === 'active');
    const completedGoals = store.goals.filter((g) => g.status === 'completed');

    const activeKpis = store.kpis.filter((k) => k.status === 'active');
    const kpisMeeting = activeKpis.filter((k) => {
      const ev = kpiEvaluationsById[k.id];
      return ev && (ev.health === 'on_track' || ev.health === 'exceeding');
    });
    const kpisAttention = activeKpis.filter((k) => {
      const ev = kpiEvaluationsById[k.id];
      return (
        ev &&
        (ev.health === 'at_risk' || ev.health === 'behind_pace' || ev.health === 'overdue_log')
      );
    });

    // Best performing areas vs areas lacking tracking data
    const sortedAreasByScore = [...areaEvaluations]
      .filter((ae) => ae.normalizedScore !== null)
      .sort((a, b) => (b.normalizedScore ?? 0) - (a.normalizedScore ?? 0));

    const areasLackingData = areaEvaluations.filter(
      (ae) => ae.activeKpisCount > 0 && ae.coverageRatio < 0.5
    );

    // Period-over-period changes across active KPIs
    let improvedKpisCount = 0;
    let declinedKpisCount = 0;
    for (const kpi of activeKpis) {
      const logs = logsByKpiId[kpi.id] || [];
      const curr = evaluateKpi(kpi, logs, 0);
      const prev = evaluateKpi(kpi, logs, -1);
      if (curr.normalizedScore !== null && prev.normalizedScore !== null) {
        if (curr.normalizedScore > prev.normalizedScore) improvedKpisCount++;
        else if (curr.normalizedScore < prev.normalizedScore) declinedKpisCount++;
      }
    }

    // Goals progressed (goals with at least 1 logged entry during the review window)
    const kpiIdsLoggedInReview = new Set(
      store.trackingLogs
        .filter((l) => l.date >= reviewWindow.startDate && l.date <= reviewWindow.endDate)
        .map((l) => l.kpiId)
    );
    const goalsProgressed = activeGoals.filter((g) => {
      const groupIds = new Set(
        store.kpiGroups.filter((grp) => grp.goalId === g.id).map((grp) => grp.id)
      );
      return store.kpis.some(
        (k) => groupIds.has(k.kpiGroupId) && kpiIdsLoggedInReview.has(k.id)
      );
    });

    return {
      goalsProgressed,
      completedGoals,
      kpisMeeting,
      kpisAttention,
      bestAreas: sortedAreasByScore.slice(0, 2),
      areasLackingData,
      improvedKpisCount,
      declinedKpisCount,
    };
  }, [
    store,
    areaEvaluations,
    kpiEvaluationsById,
    logsByKpiId,
    reviewWindow.startDate,
    reviewWindow.endDate,
  ]);

  const handleSelectPreset = (p: (typeof REVIEW_PRESETS)[number]) => {
    setPreset(p.id);
    if (p.id !== 'custom') {
      setIntervalCount(String(p.count));
      setIntervalUnit(p.unit);
      updateSettings({
        defaultReviewInterval: {
          preset: p.id,
          intervalCount: p.count,
          intervalUnit: p.unit,
        },
      });
    }
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    const count = Math.max(1, parseInt(intervalCount, 10) || 1);
    const intervalLabel = formatIntervalLabel({
      intervalCount: count,
      intervalUnit,
      alignmentMode: 'calendar',
      anchorDate: getTodayDateString(),
    });

    addReview({
      title: `${intervalLabel} Review (${reviewWindow.label})`,
      periodStart: reviewWindow.startDate,
      periodEnd: reviewWindow.endDate,
      intervalLabel,
      wentWell: wentWell.trim(),
      didNotGoWell: didNotGoWell.trim(),
      shouldImprove: shouldImprove.trim(),
      deservesAttention: deservesAttention.trim(),
      nextPriorities: nextPriorities.trim(),
      snapshotSummary: {
        goalsProgressed: reviewInsights.goalsProgressed.length,
        goalsCompleted: reviewInsights.completedGoals.length,
        kpisMeetingTarget: reviewInsights.kpisMeeting.length,
        kpisNeedingAttention: reviewInsights.kpisAttention.length,
        overallScore: overallDashboardStats.overallScore,
      },
    });

    setWentWell('');
    setDidNotGoWell('');
    setShouldImprove('');
    setDeservesAttention('');
    setNextPriorities('');
    setJustSavedBanner(true);
    setTimeout(() => setJustSavedBanner(false), 4000);
  };

  const filteredHistoricalReviews = store.reviews.filter((rev) => {
    if (historyFilterStart && rev.periodEnd < historyFilterStart) return false;
    if (historyFilterEnd && rev.periodStart > historyFilterEnd) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Reviews & Reflections
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Conduct structured reviews on your own independent schedule—weekly, every 3 weeks,
          quarterly, or any custom interval.
        </p>
      </div>

      {/* Review Interval Configuration Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Review Schedule Cadence
          </span>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Review Period Window: {reviewWindow.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {REVIEW_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                preset === p.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-slate-600 dark:text-slate-400">Repeat Every:</span>
            <input
              type="number"
              min="1"
              max="365"
              value={intervalCount}
              onChange={(e) => setIntervalCount(e.target.value)}
              className="w-20 px-2.5 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
            <select
              value={intervalUnit}
              onChange={(e) => setIntervalUnit(e.target.value as IntervalUnit)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
        )}
      </div>

      {/* Automated Review Snapshot Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Automated Period Snapshot ({reviewWindow.label})
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Goals Progressed
            </span>
            <span className="mt-1 block text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {reviewInsights.goalsProgressed.length}
            </span>
            <span className="text-[11px] text-slate-500">
              {reviewInsights.completedGoals.length} completed overall
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              KPIs Meeting Target
            </span>
            <span className="mt-1 block text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
              {reviewInsights.kpisMeeting.length}
            </span>
            <span className="text-[11px] text-slate-500">
              {reviewInsights.kpisAttention.length} needing attention
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Best-Performing Area
            </span>
            <span className="mt-1 block text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {reviewInsights.bestAreas[0]
                ? `${reviewInsights.bestAreas[0].area.name} (${reviewInsights.bestAreas[0].normalizedScore}%)`
                : 'Insufficient Data'}
            </span>
            <span className="text-[11px] text-slate-500">
              {reviewInsights.areasLackingData.length} areas low on logs
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Period-over-Period Shift
            </span>
            <span className="mt-1 block text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {reviewInsights.improvedKpisCount} up · {reviewInsights.declinedKpisCount} down
            </span>
            <span className="text-[11px] text-slate-500">vs prior equivalent cycle</span>
          </div>
        </div>
      </div>

      {/* Reflection Prompts Form */}
      <form
        onSubmit={handleSaveReview}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Guided Period Reflection
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Capture honest qualitative context alongside your quantitative KPI metrics.
            </p>
          </div>
          {justSavedBanner && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Review saved to local history
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              1. What went well?
            </label>
            <textarea
              rows={3}
              required
              placeholder="Wins, consistent habits, and positive momentum..."
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              2. What did not go well?
            </label>
            <textarea
              rows={3}
              placeholder="Bottlenecks, missed sessions, or unexpected friction..."
              value={didNotGoWell}
              onChange={(e) => setDidNotGoWell(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              3. What should improve?
            </label>
            <textarea
              rows={3}
              placeholder="System adjustments, environment changes, or schedule tweaks..."
              value={shouldImprove}
              onChange={(e) => setShouldImprove(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              4. What deserves more attention?
            </label>
            <textarea
              rows={3}
              placeholder="Under-tracked areas or neglected lagging outcomes..."
              value={deservesAttention}
              onChange={(e) => setDeservesAttention(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            5. What are the priorities for the next period?
          </label>
          <textarea
            rows={2}
            required
            placeholder="Top 1–3 concrete commitments for the upcoming cycle..."
            value={nextPriorities}
            onChange={(e) => setNextPriorities(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" /> Save Review Entry
          </button>
        </div>
      </form>

      {/* Historical Reviews Archive */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Historical Reviews ({filteredHistoricalReviews.length})
          </h2>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Filter Date Range:</span>
            <input
              type="date"
              value={historyFilterStart}
              onChange={(e) => setHistoryFilterStart(e.target.value)}
              className="px-2.5 py-1 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={historyFilterEnd}
              onChange={(e) => setHistoryFilterEnd(e.target.value)}
              className="px-2.5 py-1 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
            />
          </div>
        </div>

        {filteredHistoricalReviews.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-500">No saved reviews in this date range yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistoricalReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {rev.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      <span>{formatDateRangeLabel(rev.periodStart, rev.periodEnd)}</span>
                      <span>·</span>
                      <span>Saved {formatShortDate(rev.createdAt.slice(0, 10))}</span>
                      {rev.snapshotSummary && (
                        <>
                          <span>·</span>
                          <span>
                            {rev.snapshotSummary.kpisMeetingTarget} KPIs on track ·{' '}
                            {rev.snapshotSummary.goalsProgressed} goals progressed
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteReview(rev.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {rev.wentWell && (
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                        What went well
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                        {rev.wentWell}
                      </p>
                    </div>
                  )}
                  {rev.didNotGoWell && (
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                        What did not go well
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                        {rev.didNotGoWell}
                      </p>
                    </div>
                  )}
                  {rev.shouldImprove && (
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                        What should improve
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                        {rev.shouldImprove}
                      </p>
                    </div>
                  )}
                  {rev.deservesAttention && (
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                        Deserves more attention
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                        {rev.deservesAttention}
                      </p>
                    </div>
                  )}
                </div>

                {rev.nextPriorities && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                      Next Period Priorities
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                      {rev.nextPriorities}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. Settings, Local Persistence & JSON Backup View (Section 15)
// ---------------------------------------------------------------------------

export const SettingsView: React.FC = () => {
  const {
    store,
    updateSettings,
    exportJsonBackup,
    importJsonBackup,
    resetAllData,
    initializeFromTemplates,
  } = useLifeKpi();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importPendingText, setImportPendingText] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleDownloadBackup = () => {
    const json = exportJsonBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-kpi-backup-${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImportPendingText(reader.result);
        setImportStatus(null);
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!importPendingText) return;
    const res = importJsonBackup(importPendingText);
    if (res.ok) {
      setImportStatus({
        type: 'success',
        message: 'Backup restored and validated successfully.',
      });
      setImportPendingText(null);
    } else {
      setImportStatus({
        type: 'error',
        message: res.error || 'Failed to import JSON backup.',
      });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Settings & Data Backup
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure appearance, card density, and local JSON backup and restoration.
        </p>
      </div>

      {/* Theme & Display Preferences */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Appearance & Display
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 block">
              Color Theme
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Switch between crisp light mode, high-contrast dark mode, or system preference.
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start">
            {(
              [
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Monitor },
              ] as { id: ThemeMode; label: string; icon: typeof Sun }[]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => updateSettings({ theme: id })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  store.settings.theme === id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 block">
              Compact KPI Cards
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Display denser 3-column KPI cards to scan more indicators at once.
            </span>
          </div>

          <input
            type="checkbox"
            checked={store.settings.compactKpiCards}
            onChange={(e) => updateSettings({ compactKpiCards: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Local Storage Architecture & JSON Backup/Restore */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <HardDrive className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Local Storage & Data Portability
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Life KPI stores all data locally in your browser&apos;s{' '}
              <code className="font-mono text-slate-700 dark:text-slate-300">localStorage</code>{' '}
              for privacy and instant performance. Because browser localStorage does not
              automatically synchronize between different browsers or devices, export a JSON backup
              regularly to safeguard or transfer your records.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs font-mono tabular-nums">
          <div>
            <span className="text-slate-400 block">Life Areas</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              {store.lifeAreas.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Goals</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              {store.goals.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">KPI Groups</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              {store.kpiGroups.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">KPIs</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              {store.kpis.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Tracking Logs</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              {store.trackingLogs.length}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
          >
            <Download className="w-4 h-4" /> Export JSON Backup
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
          >
            <Upload className="w-4 h-4" /> Import JSON Backup
          </button>
        </div>

        {/* Pending Import Confirmation */}
        {importPendingText && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Confirm Data Replacement
                </p>
                <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                  Importing this JSON file will replace your current local workspace data.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={confirmImport}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
              >
                Confirm & Replace Data
              </button>
              <button
                type="button"
                onClick={() => setImportPendingText(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {importStatus && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'
            }`}
          >
            <FileJson className="w-4 h-4 shrink-0" />
            <span>{importStatus.message}</span>
          </div>
        )}
      </div>

      {/* Danger Zone: Reset Workspace */}
      <div className="bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/50 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-rose-700 dark:text-rose-400">
            Reset Workspace Data
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Permanently clear all Life Areas, Goals, KPI Groups, KPIs, Tracking Logs, and Reviews
            from this browser, or reload starter templates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset All Data
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  setConfirmReset(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Confirm Permanent Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
          )}

          {store.lifeAreas.length === 0 && (
            <button
              type="button"
              onClick={() =>
                initializeFromTemplates(
                  [
                    'Health & Fitness',
                    'Wealth & Finance',
                    'Career & Business',
                    'Learning & Intellectual Growth',
                    'Relationships & Family',
                    'Mind & Spirituality',
                  ],
                  true
                )
              }
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              Load Starter Templates
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
