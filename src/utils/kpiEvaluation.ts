import {
  AreaEvaluation,
  Goal,
  GoalEvaluation,
  GroupEvaluation,
  Kpi,
  KpiEvaluation,
  KpiGroup,
  LifeArea,
  PerformanceHealth,
  TrackingLog,
} from '../types/kpi';
import {
  diffDays,
  formatIntervalLabel,
  getKpiPeriodWindow,
  getTodayDateString,
} from './periodMath';

/**
 * Computes the aggregated numeric value from a list of TrackingLogs for a KPI.
 * Returns null if there are no logs in the given period.
 */
export function aggregateLogsValue(
  logs: TrackingLog[],
  method: Kpi['aggregationMethod']
): number | null {
  if (!logs || logs.length === 0) {
    return null;
  }

  if (method === 'count') {
    return logs.length;
  }

  if (method === 'sum') {
    const sum = logs.reduce((acc, log) => acc + Number(log.value || 0), 0);
    return Number(sum.toFixed(2));
  }

  if (method === 'average') {
    const sum = logs.reduce((acc, log) => acc + Number(log.value || 0), 0);
    return Number((sum / logs.length).toFixed(2));
  }

  // 'latest': sort by date descending, then updatedAt descending
  const sorted = [...logs].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.updatedAt.localeCompare(a.updatedAt);
  });
  return Number(sorted[0].value);
}

/**
 * Evaluates a single KPI for a specific period offset (default 0 = current period).
 */
export function evaluateKpi(
  kpi: Kpi,
  allKpiLogs: TrackingLog[],
  periodOffset: number = 0,
  todayStr: string = getTodayDateString()
): KpiEvaluation {
  const period = getKpiPeriodWindow(kpi.interval, periodOffset, todayStr);
  const periodLabel = formatIntervalLabel(kpi.interval);

  // Filter logs belonging to this period window [startDate, endDate]
  const logsInPeriod = allKpiLogs
    .filter((log) => log.date >= period.startDate && log.date <= period.endDate)
    .sort((a, b) => b.date.localeCompare(a.date));

  const sortedAllLogs = [...allKpiLogs].sort((a, b) => b.date.localeCompare(a.date));
  const lastLogDate = sortedAllLogs.length > 0 ? sortedAllLogs[0].date : null;
  const daysSinceLastLog = lastLogDate ? Math.max(0, diffDays(lastLogDate, todayStr)) : null;

  const currentValue = aggregateLogsValue(logsInPeriod, kpi.aggregationMethod);

  const isCumulative = kpi.aggregationMethod === 'sum' || kpi.aggregationMethod === 'count';
  const expectedProgressPct = isCumulative
    ? Math.round(period.elapsedRatio * 100)
    : null;

  // Determine if logging is overdue or insufficient data
  if (currentValue === null) {
    // No entries logged in this period yet
    let health: PerformanceHealth = 'insufficient_data';
    let statusReason = 'No entries logged for this period yet';

    if (period.isCurrent) {
      // Check if tracking is overdue:
      // E.g. if more than 45% of the period has elapsed (or at least 3 days into a multi-day period) with 0 entries
      const overdueThresholdRatio = period.totalDays <= 1 ? 1.1 : 0.45;
      if (period.elapsedRatio >= overdueThresholdRatio && allKpiLogs.length > 0) {
        health = 'overdue_log';
        statusReason = `Tracking is overdue (${period.elapsedDays} of ${period.totalDays} days elapsed without a log)`;
      } else if (period.elapsedRatio >= 0.65) {
        health = 'overdue_log';
        statusReason = `No measurements recorded; ${period.remainingDays} ${period.remainingDays === 1 ? 'day' : 'days'} remaining in period`;
      } else {
        health = 'insufficient_data';
        statusReason = 'Awaiting initial entries for this period';
      }
    } else if (period.isPast) {
      health = 'insufficient_data';
      statusReason = 'No data recorded during this historical period';
    }

    return {
      kpi,
      period,
      logsInPeriod,
      allLogsCount: allKpiLogs.length,
      lastLogDate,
      daysSinceLastLog,
      currentValue: null,
      rawAchievementPct: null,
      normalizedScore: null,
      expectedProgressPct,
      isTargetSatisfied: null,
      health,
      statusReason,
      periodLabel,
    };
  }

  // We have at least one measurement in the period
  let rawAchievementPct: number | null = null;
  let normalizedScore: number = 0;
  let isTargetSatisfied = false;
  let health: PerformanceHealth = 'on_track';
  let statusReason = '';

  if (kpi.targetDirection === 'at_least') {
    if (isCumulative) {
      // Quantitative additive/count KPI (e.g., 4 / 6 Gym Sessions -> 67%)
      const target = kpi.targetValue > 0 ? kpi.targetValue : 1;
      rawAchievementPct = Math.round((currentValue / target) * 100);
      normalizedScore = Math.min(100, Math.max(0, rawAchievementPct));
      isTargetSatisfied = currentValue >= target;

      if (rawAchievementPct > 105) {
        health = 'exceeding';
        statusReason = `Exceeding target (${currentValue} / ${kpi.targetValue} ${kpi.unit})`;
      } else if (isTargetSatisfied) {
        health = 'on_track';
        statusReason = `Target met (${currentValue} / ${kpi.targetValue} ${kpi.unit})`;
      } else if (period.isPast) {
        health = 'at_risk';
        statusReason = `Missed target (${currentValue} of ${kpi.targetValue} ${kpi.unit} completed)`;
      } else {
        // Compare against expected pace in current period
        const expectedNow = expectedProgressPct ?? 50;
        if (rawAchievementPct >= expectedNow - 12) {
          health = 'on_track';
          statusReason = `On pace (${currentValue} of ${kpi.targetValue} ${kpi.unit}; ${period.remainingDays}d left)`;
        } else if (rawAchievementPct >= expectedNow - 30) {
          health = 'behind_pace';
          statusReason = `${currentValue} of ${kpi.targetValue} ${kpi.unit} completed; ${period.remainingDays} ${period.remainingDays === 1 ? 'day' : 'days'} remaining`;
        } else {
          health = 'at_risk';
          statusReason = `Behind schedule — ${currentValue} of ${kpi.targetValue} ${kpi.unit} completed; ${period.remainingDays}d remaining`;
        }
      }
    } else {
      // Threshold-based 'at_least' (e.g. Average Sleep Duration >= 7.5 hrs)
      // Avoid misleading Current/Target % when no baseline is provided unless appropriate, or calculate satisfaction clearly
      isTargetSatisfied = currentValue >= kpi.targetValue;
      if (kpi.baselineValue !== undefined && kpi.targetValue > kpi.baselineValue) {
        const span = kpi.targetValue - kpi.baselineValue;
        const progress = ((currentValue - kpi.baselineValue) / span) * 100;
        rawAchievementPct = Math.round(Math.max(0, progress));
        normalizedScore = Math.min(100, Math.max(0, rawAchievementPct));
      } else {
        const ratio = kpi.targetValue > 0 ? (currentValue / kpi.targetValue) * 100 : 100;
        rawAchievementPct = Math.round(ratio);
        normalizedScore = isTargetSatisfied ? 100 : Math.min(99, Math.max(0, Math.round(ratio)));
      }

      if (isTargetSatisfied) {
        health = currentValue > kpi.targetValue * 1.05 ? 'exceeding' : 'on_track';
        statusReason = `Target satisfied (${currentValue} ${kpi.unit} vs ≥ ${kpi.targetValue} ${kpi.unit})`;
      } else {
        const diff = Number((kpi.targetValue - currentValue).toFixed(2));
        health = normalizedScore >= 85 ? 'behind_pace' : 'at_risk';
        statusReason = `${diff} ${kpi.unit} below threshold (target ≥ ${kpi.targetValue} ${kpi.unit})`;
      }
    }
  } else if (kpi.targetDirection === 'at_most') {
    // Lower-is-better (e.g. Resting Heart Rate <= 60 bpm, Body Weight <= 75 kg, Spending <= $500)
    isTargetSatisfied = currentValue <= kpi.targetValue;

    if (isCumulative) {
      // Budget / cap KPI (e.g. Dining Out <= $300)
      const cap = kpi.targetValue > 0 ? kpi.targetValue : 1;
      const usagePct = Math.round((currentValue / cap) * 100);
      rawAchievementPct = usagePct; // For budget, shows % of cap used
      if (currentValue <= kpi.targetValue) {
        // Check if burning budget too fast relative to elapsed ratio
        const expectedMaxUsage = (expectedProgressPct ?? 100) + 15;
        if (usagePct <= expectedMaxUsage) {
          normalizedScore = 100;
          health = 'on_track';
          statusReason = `Within limit (${currentValue} / ${kpi.targetValue} ${kpi.unit} max)`;
        } else {
          normalizedScore = 75;
          health = 'behind_pace';
          statusReason = `Pacing high (${usagePct}% of limit used with ${period.remainingDays}d left)`;
        }
      } else {
        const overage = Number((currentValue - kpi.targetValue).toFixed(2));
        normalizedScore = Math.max(0, Math.round(100 - ((currentValue - kpi.targetValue) / cap) * 100));
        health = 'at_risk';
        statusReason = `Exceeded limit by ${overage} ${kpi.unit} (max ${kpi.targetValue} ${kpi.unit})`;
      }
    } else {
      // Threshold measurement (e.g. Resting Heart Rate <= 60 bpm, Body Fat <= 15%)
      // Never compute a nonsensical Current/Target ratio for heart rate or weight without context
      if (kpi.baselineValue !== undefined && kpi.baselineValue > kpi.targetValue) {
        const totalToLose = kpi.baselineValue - kpi.targetValue;
        const lostSoFar = kpi.baselineValue - currentValue;
        const pct = Math.round((lostSoFar / totalToLose) * 100);
        rawAchievementPct = pct;
        normalizedScore = Math.min(100, Math.max(0, pct));
      } else {
        rawAchievementPct = null; // Threshold-based without baseline: display distance to threshold instead of fake %
        if (isTargetSatisfied) {
          normalizedScore = 100;
        } else {
          const distanceRatio = kpi.targetValue > 0 ? (currentValue - kpi.targetValue) / kpi.targetValue : 0.5;
          normalizedScore = Math.max(0, Math.round((1 - Math.min(1, distanceRatio * 2)) * 100));
        }
      }

      if (isTargetSatisfied) {
        health = 'on_track';
        statusReason = `Target satisfied (${currentValue} ${kpi.unit} ≤ ${kpi.targetValue} ${kpi.unit})`;
      } else {
        const aboveBy = Number((currentValue - kpi.targetValue).toFixed(2));
        health = normalizedScore >= 75 ? 'behind_pace' : 'at_risk';
        statusReason = `${aboveBy} ${kpi.unit} above target threshold (≤ ${kpi.targetValue} ${kpi.unit})`;
      }
    }
  } else {
    // 'within_range' (e.g. Body Weight 72 - 75 kg, Daily Calories 2000 - 2200 kcal)
    const minVal = kpi.targetValue;
    const maxVal = kpi.targetMax !== undefined && kpi.targetMax >= minVal ? kpi.targetMax : minVal;
    isTargetSatisfied = currentValue >= minVal && currentValue <= maxVal;
    rawAchievementPct = null; // Range-based shows satisfaction & distance from range

    if (isTargetSatisfied) {
      normalizedScore = 100;
      health = 'on_track';
      statusReason = `Within target range (${minVal}–${maxVal} ${kpi.unit})`;
    } else if (currentValue < minVal) {
      const belowBy = Number((minVal - currentValue).toFixed(2));
      const scale = minVal > 0 ? minVal * 0.25 : 10;
      normalizedScore = Math.max(0, Math.round((1 - Math.min(1, belowBy / scale)) * 100));
      health = normalizedScore >= 70 ? 'behind_pace' : 'at_risk';
      statusReason = `${belowBy} ${kpi.unit} below range (${minVal}–${maxVal} ${kpi.unit})`;
    } else {
      const aboveBy = Number((currentValue - maxVal).toFixed(2));
      const scale = maxVal > 0 ? maxVal * 0.25 : 10;
      normalizedScore = Math.max(0, Math.round((1 - Math.min(1, aboveBy / scale)) * 100));
      health = normalizedScore >= 70 ? 'behind_pace' : 'at_risk';
      statusReason = `${aboveBy} ${kpi.unit} above range (${minVal}–${maxVal} ${kpi.unit})`;
    }
  }

  return {
    kpi,
    period,
    logsInPeriod,
    allLogsCount: allKpiLogs.length,
    lastLogDate,
    daysSinceLastLog,
    currentValue,
    rawAchievementPct,
    normalizedScore,
    expectedProgressPct,
    isTargetSatisfied,
    health,
    statusReason,
    periodLabel,
  };
}

/**
 * Evaluates a KPI Group using weighted normalization of child KPIs that have sufficient data.
 */
export function evaluateKpiGroup(
  group: KpiGroup,
  groupKpis: Kpi[],
  logsByKpiId: Record<string, TrackingLog[]>,
  todayStr: string = getTodayDateString()
): GroupEvaluation {
  const activeKpis = groupKpis
    .filter((k) => k.status === 'active')
    .sort((a, b) => a.order - b.order);

  const kpiEvaluations = activeKpis.map((kpi) =>
    evaluateKpi(kpi, logsByKpiId[kpi.id] || [], 0, todayStr)
  );

  const evaluated = kpiEvaluations.filter((e) => e.normalizedScore !== null);
  const totalActiveCount = activeKpis.length;
  const evaluatedCount = evaluated.length;
  const coverageRatio = totalActiveCount > 0 ? evaluatedCount / totalActiveCount : 0;

  let normalizedScore: number | null = null;
  if (evaluatedCount > 0) {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const ev of evaluated) {
      const w = Math.max(0.1, ev.kpi.weight || 1);
      weightedSum += (ev.normalizedScore ?? 0) * w;
      totalWeight += w;
    }
    normalizedScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;
  }

  return {
    group,
    kpiEvaluations,
    normalizedScore,
    evaluatedCount,
    totalActiveCount,
    coverageRatio,
  };
}

/**
 * Evaluates a Goal using weighted aggregation of its KPI Groups.
 */
export function evaluateGoal(
  goal: Goal,
  goalGroups: KpiGroup[],
  kpisByGroupId: Record<string, Kpi[]>,
  logsByKpiId: Record<string, TrackingLog[]>,
  todayStr: string = getTodayDateString()
): GoalEvaluation {
  const sortedGroups = [...goalGroups].sort((a, b) => a.order - b.order);
  const groupEvaluations = sortedGroups.map((g) =>
    evaluateKpiGroup(g, kpisByGroupId[g.id] || [], logsByKpiId, todayStr)
  );

  const kpiEvaluations = groupEvaluations.flatMap((ge) => ge.kpiEvaluations);
  const totalActiveKpis = kpiEvaluations.length;

  let onTrackCount = 0;
  let attentionCount = 0;
  let insufficientDataCount = 0;

  for (const ev of kpiEvaluations) {
    if (ev.health === 'on_track' || ev.health === 'exceeding') {
      onTrackCount++;
    } else if (
      ev.health === 'behind_pace' ||
      ev.health === 'at_risk' ||
      ev.health === 'overdue_log'
    ) {
      attentionCount++;
    } else {
      insufficientDataCount++;
    }
  }

  const evaluatedGroups = groupEvaluations.filter((ge) => ge.normalizedScore !== null);
  let normalizedScore: number | null = null;

  if (evaluatedGroups.length > 0) {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const ge of evaluatedGroups) {
      const w = Math.max(0.1, ge.group.weight || 1);
      weightedSum += (ge.normalizedScore ?? 0) * w;
      totalWeight += w;
    }
    normalizedScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;
  }

  const evaluatedKpisCount = totalActiveKpis - insufficientDataCount;
  const coverageRatio = totalActiveKpis > 0 ? evaluatedKpisCount / totalActiveKpis : 0;

  let paceStatus: GoalEvaluation['paceStatus'] = 'insufficient_data';
  if (goal.status === 'completed') {
    paceStatus = 'completed';
  } else if (normalizedScore === null) {
    paceStatus = 'insufficient_data';
  } else if (attentionCount > 0 || normalizedScore < 75) {
    paceStatus = 'needs_attention';
  } else {
    paceStatus = 'on_track';
  }

  return {
    goal,
    groupEvaluations,
    kpiEvaluations,
    normalizedScore,
    onTrackCount,
    attentionCount,
    insufficientDataCount,
    totalActiveKpis,
    coverageRatio,
    paceStatus,
  };
}

/**
 * Evaluates a Life Area using weighted aggregation of its active Goals.
 */
export function evaluateLifeArea(
  area: LifeArea,
  areaGoals: Goal[],
  groupsByGoalId: Record<string, KpiGroup[]>,
  kpisByGroupId: Record<string, Kpi[]>,
  logsByKpiId: Record<string, TrackingLog[]>,
  todayStr: string = getTodayDateString()
): AreaEvaluation {
  const sortedGoals = [...areaGoals]
    .filter((g) => g.status !== 'archived')
    .sort((a, b) => a.order - b.order);

  const goalEvaluations = sortedGoals.map((goal) =>
    evaluateGoal(goal, groupsByGoalId[goal.id] || [], kpisByGroupId, logsByKpiId, todayStr)
  );

  const activeGoalEvals = goalEvaluations.filter((ge) => ge.goal.status === 'active');
  const activeGoalsCount = activeGoalEvals.length;

  let activeKpisCount = 0;
  let onTrackKpisCount = 0;
  let attentionKpisCount = 0;
  let insufficientKpisCount = 0;

  for (const ge of activeGoalEvals) {
    activeKpisCount += ge.totalActiveKpis;
    onTrackKpisCount += ge.onTrackCount;
    attentionKpisCount += ge.attentionCount;
    insufficientKpisCount += ge.insufficientDataCount;
  }

  const evaluatedGoals = activeGoalEvals.filter((ge) => ge.normalizedScore !== null);
  let normalizedScore: number | null = null;

  if (evaluatedGoals.length > 0) {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const ge of evaluatedGoals) {
      const w = Math.max(0.1, ge.goal.weight || 1);
      weightedSum += (ge.normalizedScore ?? 0) * w;
      totalWeight += w;
    }
    normalizedScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;
  }

  const evaluatedKpisCount = activeKpisCount - insufficientKpisCount;
  const coverageRatio = activeKpisCount > 0 ? evaluatedKpisCount / activeKpisCount : 0;

  return {
    area,
    goalEvaluations,
    activeGoalsCount,
    activeKpisCount,
    onTrackKpisCount,
    attentionKpisCount,
    insufficientKpisCount,
    normalizedScore,
    coverageRatio,
  };
}
