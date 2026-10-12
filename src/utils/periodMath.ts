import { KpiIntervalConfig, PeriodWindow } from '../types/kpi';

/**
 * Parses a YYYY-MM-DD string into a local Date at midnight (00:00:00)
 * without any UTC timezone shift.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Formats a local Date into YYYY-MM-DD string.
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's local date string in YYYY-MM-DD.
 */
export function getTodayDateString(): string {
  return formatLocalDate(new Date());
}

/**
 * Adds exact calendar days to a YYYY-MM-DD string.
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

/**
 * Adds calendar months to a YYYY-MM-DD string, clamping to the end of month if needed.
 */
export function addMonths(dateStr: string, months: number): string {
  const [y, m, day] = dateStr.split('-').map(Number);
  const targetMonthIndex = m - 1 + months;
  const targetYear = y + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const maxDaysInTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const clampedDay = Math.min(day, maxDaysInTargetMonth);
  return formatLocalDate(new Date(targetYear, normalizedMonth, clampedDay));
}

/**
 * Adds calendar years to a YYYY-MM-DD string, handling Feb 29 on leap years.
 */
export function addYears(dateStr: string, years: number): string {
  return addMonths(dateStr, years * 12);
}

/**
 * Returns the difference in whole calendar days: (dateB - dateA).
 */
export function diffDays(dateA: string, dateB: string): number {
  const [yA, mA, dA] = dateA.split('-').map(Number);
  const [yB, mB, dB] = dateB.split('-').map(Number);
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

/**
 * Gets the Monday (or Sunday) of the week containing dateStr.
 */
export function getStartOfWeek(dateStr: string, weekStartsOn: 0 | 1 = 1): string {
  const d = parseLocalDate(dateStr);
  const day = d.getDay(); // 0 is Sun, 1 is Mon
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  d.setDate(d.getDate() - diff);
  return formatLocalDate(d);
}

/**
 * Formats a human-readable period interval label (e.g., "Daily", "Weekly", "Every 3 Weeks", "Every 90 Days").
 */
export function formatIntervalLabel(interval: KpiIntervalConfig): string {
  const count = Math.max(1, Math.floor(interval.intervalCount || 1));
  const unit = interval.intervalUnit;

  if (count === 1) {
    if (unit === 'days') return 'Daily';
    if (unit === 'weeks') return 'Weekly';
    if (unit === 'months') return 'Monthly';
    if (unit === 'years') return 'Yearly';
  }
  if (count === 2 && unit === 'weeks') return 'Biweekly (2 Weeks)';
  if (count === 3 && unit === 'months') return 'Quarterly';
  if (count === 6 && unit === 'months') return 'Every 6 Months';

  const unitLabel = unit.charAt(0).toUpperCase() + unit.slice(1);
  return `Every ${count} ${unitLabel}`;
}

/**
 * Formats a date range nicely, e.g., "Oct 5 – Oct 25, 2026" or "Dec 20, 2026 – Jan 9, 2027".
 */
export function formatDateRangeLabel(startDate: string, endDate: string): string {
  const s = parseLocalDate(startDate);
  const e = parseLocalDate(endDate);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (startDate === endDate) {
    return `${months[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()}`;
  }

  const sMonth = months[s.getMonth()];
  const eMonth = months[e.getMonth()];
  const sYear = s.getFullYear();
  const eYear = e.getFullYear();

  if (sYear === eYear) {
    if (sMonth === eMonth) {
      return `${sMonth} ${s.getDate()} – ${e.getDate()}, ${sYear}`;
    }
    return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}, ${sYear}`;
  }
  return `${sMonth} ${s.getDate()}, ${sYear} – ${eMonth} ${e.getDate()}, ${eYear}`;
}

/**
 * Formats a single YYYY-MM-DD string to a readable date, e.g. "Oct 12, 2026".
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Computes the effective base anchor date for an interval configuration.
 * - For 'calendar' alignment:
 *   - days: uses anchorDate (or Jan 1 of current year if not set)
 *   - weeks: uses the Monday (or Sunday) of the anchorDate week so multi-week cycles align to Monday-Sunday boundaries consistently
 *   - months: uses the 1st of January of the anchorDate's year (or anchorDate's month 1st) so calendar months align cleanly (e.g., Jan-Feb, Mar-Apr)
 *   - years: uses Jan 1 of anchorDate's year
 * - For 'custom_anchor' alignment:
 *   - uses exact anchorDate provided by user
 */
export function getNormalizedAnchorDate(interval: KpiIntervalConfig): string {
  const rawAnchor = interval.anchorDate || getTodayDateString();
  if (interval.alignmentMode === 'custom_anchor') {
    return rawAnchor;
  }

  // Calendar-aligned mode
  const d = parseLocalDate(rawAnchor);
  const year = d.getFullYear();

  if (interval.intervalUnit === 'days') {
    if (interval.intervalCount === 1) {
      return rawAnchor;
    }
    // Align multi-day calendar blocks to Jan 1 of the anchor year
    return `${year}-01-01`;
  }

  if (interval.intervalUnit === 'weeks') {
    return getStartOfWeek(rawAnchor, interval.weekStartsOn ?? 1);
  }

  if (interval.intervalUnit === 'months') {
    // Align multi-month calendar blocks to January 1st of the anchor year
    // so 2-month blocks are Jan-Feb, Mar-Apr, etc., and 3-month blocks are Q1, Q2, Q3, Q4.
    return `${year}-01-01`;
  }

  if (interval.intervalUnit === 'years') {
    return `${year}-01-01`;
  }

  return rawAnchor;
}

/**
 * Given a normalized anchor date and cycle index `k` (where k can be negative, 0, or positive),
 * returns the [startDate, endDate] of cycle `k`.
 */
function getCycleBoundsFromAnchor(
  baseAnchor: string,
  intervalCount: number,
  intervalUnit: KpiIntervalConfig['intervalUnit'],
  cycleIndex: number
): { startDate: string; endDate: string } {
  const count = Math.max(1, Math.floor(intervalCount || 1));

  if (intervalUnit === 'days') {
    const spanDays = count;
    const startDate = addDays(baseAnchor, cycleIndex * spanDays);
    const endDate = addDays(startDate, spanDays - 1);
    return { startDate, endDate };
  }

  if (intervalUnit === 'weeks') {
    const spanDays = count * 7;
    const startDate = addDays(baseAnchor, cycleIndex * spanDays);
    const endDate = addDays(startDate, spanDays - 1);
    return { startDate, endDate };
  }

  if (intervalUnit === 'months') {
    const startDate = addMonths(baseAnchor, cycleIndex * count);
    const nextStartDate = addMonths(baseAnchor, (cycleIndex + 1) * count);
    const endDate = addDays(nextStartDate, -1);
    return { startDate, endDate };
  }

  // intervalUnit === 'years'
  const startDate = addYears(baseAnchor, cycleIndex * count);
  const nextStartDate = addYears(baseAnchor, (cycleIndex + 1) * count);
  const endDate = addDays(nextStartDate, -1);
  return { startDate, endDate };
}

/**
 * Finds the cycle index `k` from `baseAnchor` that contains `referenceDateStr`.
 */
function findCycleIndexForDate(
  baseAnchor: string,
  intervalCount: number,
  intervalUnit: KpiIntervalConfig['intervalUnit'],
  referenceDateStr: string
): number {
  const count = Math.max(1, Math.floor(intervalCount || 1));

  if (intervalUnit === 'days' || intervalUnit === 'weeks') {
    const spanDays = intervalUnit === 'weeks' ? count * 7 : count;
    const deltaDays = diffDays(baseAnchor, referenceDateStr);
    return Math.floor(deltaDays / spanDays);
  }

  // For months or years, estimate cycle index first using month difference, then refine
  const [aY, aM] = baseAnchor.split('-').map(Number);
  const [rY, rM] = referenceDateStr.split('-').map(Number);
  const totalMonthsDiff = (rY - aY) * 12 + (rM - aM);
  const stepMonths = intervalUnit === 'years' ? count * 12 : count;

  let k = Math.floor(totalMonthsDiff / stepMonths);

  // Refine k by checking boundaries
  for (let iter = 0; iter < 5; iter++) {
    const bounds = getCycleBoundsFromAnchor(baseAnchor, count, intervalUnit, k);
    if (referenceDateStr < bounds.startDate) {
      k--;
    } else if (referenceDateStr > bounds.endDate) {
      k++;
    } else {
      break;
    }
  }
  return k;
}

/**
 * Computes a PeriodWindow for a KPI at a relative period offset from today
 * (`offset = 0` is current period, `offset = -1` is previous period, `offset = +1` is next period).
 */
export function getKpiPeriodWindow(
  interval: KpiIntervalConfig,
  offsetFromCurrent: number = 0,
  todayStr: string = getTodayDateString()
): PeriodWindow {
  const baseAnchor = getNormalizedAnchorDate(interval);
  const currentCycleIndex = findCycleIndexForDate(
    baseAnchor,
    interval.intervalCount,
    interval.intervalUnit,
    todayStr
  );

  const targetCycleIndex = currentCycleIndex + offsetFromCurrent;
  const { startDate, endDate } = getCycleBoundsFromAnchor(
    baseAnchor,
    interval.intervalCount,
    interval.intervalUnit,
    targetCycleIndex
  );

  const totalDays = Math.max(1, diffDays(startDate, endDate) + 1);
  const isCurrent = todayStr >= startDate && todayStr <= endDate;
  const isPast = endDate < todayStr;
  const isFuture = startDate > todayStr;

  let elapsedDays = 0;
  let remainingDays = 0;

  if (isPast) {
    elapsedDays = totalDays;
    remainingDays = 0;
  } else if (isFuture) {
    elapsedDays = 0;
    remainingDays = totalDays;
  } else {
    // Current period: include today in elapsed days so mid-day logging reflects realistic elapsed ratio
    elapsedDays = Math.min(totalDays, Math.max(1, diffDays(startDate, todayStr) + 1));
    remainingDays = Math.max(0, diffDays(todayStr, endDate));
  }

  const elapsedRatio = Math.min(1, Math.max(0, elapsedDays / totalDays));

  return {
    index: offsetFromCurrent,
    startDate,
    endDate,
    label: formatDateRangeLabel(startDate, endDate),
    totalDays,
    elapsedDays,
    remainingDays,
    elapsedRatio,
    isCurrent,
    isPast,
    isFuture,
  };
}

/**
 * Generates a chronological series of PeriodWindows for historical analytics & navigation.
 * E.g. `count = 8` returns `[-7, -6, -5, -4, -3, -2, -1, 0]`.
 */
export function getHistoricalPeriodWindows(
  interval: KpiIntervalConfig,
  periodCount: number = 8,
  upToOffset: number = 0,
  todayStr: string = getTodayDateString()
): PeriodWindow[] {
  const windows: PeriodWindow[] = [];
  for (let i = periodCount - 1; i >= 0; i--) {
    const offset = upToOffset - i;
    windows.push(getKpiPeriodWindow(interval, offset, todayStr));
  }
  return windows;
}
