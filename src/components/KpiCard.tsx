import React, { useState } from 'react';
import {
  MoreHorizontal,
  Plus,
  History,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  FolderInput,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Kpi, KpiEvaluation, KpiGroup } from '../types/kpi';
import { getHealthVisuals } from '../utils/visualThemes';
import { aggregateLogsValue } from '../utils/kpiEvaluation';
import { getHistoricalPeriodWindows } from '../utils/periodMath';
import { useLifeKpi } from '../context/DataContext';

interface KpiCardProps {
  evaluation: KpiEvaluation;
  compact?: boolean;
  availableGroups?: KpiGroup[];
  onQuickLog: (kpiId: string) => void;
  onViewHistory: (kpiId: string) => void;
  onEditKpi: (kpi: Kpi) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  evaluation,
  compact = false,
  availableGroups = [],
  onQuickLog,
  onViewHistory,
  onEditKpi,
  onMoveUp,
  onMoveDown,
}) => {
  const { logsByKpiId, deleteKpi, moveKpiToGroup } = useLifeKpi();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    kpi,
    period,
    currentValue,
    rawAchievementPct,
    normalizedScore,
    isTargetSatisfied,
    health,
    periodLabel,
  } = evaluation;

  const visuals = getHealthVisuals(health);

  // Format target string
  let targetSummary = '';
  if (kpi.targetDirection === 'within_range') {
    targetSummary = `${kpi.targetValue}–${kpi.targetMax ?? kpi.targetValue} ${kpi.unit}`;
  } else if (kpi.targetDirection === 'at_most') {
    targetSummary = `≤ ${kpi.targetValue} ${kpi.unit}`;
  } else {
    targetSummary = `${kpi.targetValue} ${kpi.unit}`;
  }

  // Compute 6-period sparkline points for compact / visual trend
  const allLogs = logsByKpiId[kpi.id] || [];
  const sparkWindows = getHistoricalPeriodWindows(kpi.interval, 6, 0);
  const sparkValues = sparkWindows.map((w) => {
    const logsInW = allLogs.filter((l) => l.date >= w.startDate && l.date <= w.endDate);
    return aggregateLogsValue(logsInW, kpi.aggregationMethod);
  });

  const nonNullSpark = sparkValues.filter((v): v is number => v !== null);
  const maxSpark = nonNullSpark.length > 0 ? Math.max(...nonNullSpark, kpi.targetValue, 1) : 1;

  // Determine progress bar fill width (0 to 100%)
  const barWidthPct =
    rawAchievementPct !== null
      ? Math.min(100, Math.max(0, rawAchievementPct))
      : normalizedScore !== null
      ? Math.min(100, Math.max(0, normalizedScore))
      : 0;

  return (
    <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between transition-colors hover:border-slate-300 dark:hover:border-slate-700">
      {/* Top: KPI Name, Leading/Lagging indicator, More actions menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => onViewHistory(kpi.id)}
            className="text-left text-sm font-semibold text-slate-900 dark:text-slate-100 hover:underline truncate block max-w-full"
          >
            {kpi.name}
          </button>
          {/* Clean unboxed metadata with typographic separators */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span>{kpi.kpiType === 'leading' ? 'Leading' : 'Lagging'}</span>
            <span aria-hidden="true">·</span>
            <span>{periodLabel}</span>
            <span aria-hidden="true">·</span>
            <span className={`font-medium ${visuals.textClass}`}>{visuals.label}</span>
          </div>
        </div>

        {/* More Actions Menu */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(!menuOpen);
              setConfirmDelete(false);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
            aria-label="More KPI actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-30 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEditKpi(kpi);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Configuration
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onViewHistory(kpi.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <History className="w-3.5 h-3.5" /> View Period History
              </button>

              {(onMoveUp || onMoveDown) && (
                <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                  {onMoveUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onMoveUp();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <ArrowUp className="w-3.5 h-3.5" /> Move Earlier
                    </button>
                  )}
                  {onMoveDown && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onMoveDown();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <ArrowDown className="w-3.5 h-3.5" /> Move Later
                    </button>
                  )}
                </div>
              )}

              {availableGroups.length > 1 && (
                <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                  <div className="px-3 py-1 text-[11px] text-slate-400 flex items-center gap-1">
                    <FolderInput className="w-3 h-3" /> Move to Group:
                  </div>
                  {availableGroups
                    .filter((g) => g.id !== kpi.kpiGroupId)
                    .map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          moveKpiToGroup(kpi.id, g.id);
                          setMenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 truncate"
                      >
                        → {g.name}
                      </button>
                    ))}
                </div>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete KPI
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      deleteKpi(kpi.id);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left font-semibold text-white bg-rose-600 hover:bg-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Prominent current value, target value & unit, visual progress bar */}
      <div className={compact ? 'my-2.5' : 'my-4'}>
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {currentValue !== null ? currentValue : '—'}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              / {targetSummary}
            </span>
          </div>

          {/* Right side of value: either quantitative Achievement % or Threshold Satisfaction + mini sparkline */}
          <div className="flex items-center gap-2.5">
            {!compact && nonNullSpark.length > 1 && (
              <div
                className="flex items-end gap-0.5 h-5"
                title="Last 6 periods trend"
                aria-hidden="true"
              >
                {sparkValues.map((val, idx) => {
                  const hPct =
                    val !== null ? Math.max(18, Math.min(100, Math.round((val / maxSpark) * 100))) : 10;
                  return (
                    <span
                      key={idx}
                      style={{ height: `${hPct}%` }}
                      className={`w-1 rounded-t-xs ${
                        val === null
                          ? 'bg-slate-200 dark:bg-slate-800'
                          : idx === sparkValues.length - 1
                          ? 'bg-slate-800 dark:bg-slate-200'
                          : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                    />
                  );
                })}
              </div>
            )}

            {rawAchievementPct !== null ? (
              <span className="text-xs font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                {rawAchievementPct}%
              </span>
            ) : currentValue !== null ? (
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${
                  isTargetSatisfied
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {isTargetSatisfied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Satisfied
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" /> Off Target
                  </>
                )}
              </span>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">No logs yet</span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2.5 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-transform duration-150 origin-left ${visuals.barClass}`}
            style={{ width: `${barWidthPct}%` }}
          />
        </div>
      </div>

      {/* Bottom: Period date range, time remaining, Quick Log, History action */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <div className="min-w-0 text-slate-500 dark:text-slate-400 truncate">
          <span className="font-mono tabular-nums">{period.label}</span>
          <span aria-hidden="true" className="mx-1.5">
            ·
          </span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock className="w-3 h-3 inline" />
            {period.remainingDays}d left
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onViewHistory(kpi.id)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            History
          </button>
          <button
            type="button"
            onClick={() => onQuickLog(kpi.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Log
          </button>
        </div>
      </div>
    </div>
  );
};
