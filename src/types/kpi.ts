export type ThemeMode = 'light' | 'dark' | 'system';

export type AreaColor = 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'violet' | 'cyan' | 'slate';

export type AreaIconName =
  | 'HeartPulse'
  | 'Wallet'
  | 'Briefcase'
  | 'BookOpen'
  | 'Users'
  | 'Sparkles'
  | 'Dumbbell'
  | 'Target'
  | 'Compass'
  | 'Home'
  | 'Globe'
  | 'Cpu';

export interface LifeArea {
  id: string;
  name: string;
  description: string;
  icon: AreaIconName;
  color: AreaColor;
  weight: number; // Importance weight (default 1.0, e.g., 1 to 5)
  order: number;
  archived: boolean;
  createdAt: string;
}

export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Goal {
  id: string;
  lifeAreaId: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  targetDate?: string; // YYYY-MM-DD
  status: GoalStatus;
  priority?: GoalPriority;
  successCriteria?: string;
  weight: number; // Importance weight (default 1.0)
  order: number;
  createdAt: string;
}

export interface KpiGroup {
  id: string;
  goalId: string;
  name: string;
  weight: number; // Importance weight (default 1.0)
  order: number;
  collapsed?: boolean;
  createdAt: string;
}

export type TargetDirection = 'at_least' | 'at_most' | 'within_range';
export type KpiType = 'leading' | 'lagging';
export type AggregationMethod = 'sum' | 'average' | 'latest' | 'count';
export type IntervalUnit = 'days' | 'weeks' | 'months' | 'years';
export type AlignmentMode = 'calendar' | 'custom_anchor';
export type KpiStatus = 'active' | 'paused' | 'archived';

export interface KpiIntervalConfig {
  intervalCount: number; // Positive whole number, e.g. 1, 2, 3, 5, 10, 90, 18
  intervalUnit: IntervalUnit; // 'days' | 'weeks' | 'months' | 'years'
  alignmentMode: AlignmentMode; // 'calendar' | 'custom_anchor'
  anchorDate: string; // YYYY-MM-DD (used as custom start date or calendar reference anchor)
  weekStartsOn?: 0 | 1; // 1 = Monday (default), 0 = Sunday
}

export interface QuickIncrement {
  label: string;
  amount: number;
}

export interface Kpi {
  id: string;
  kpiGroupId: string;
  name: string;
  description: string;
  unit: string;
  targetValue: number; // Primary target or minimum of range
  targetMax?: number; // Upper bound if targetDirection === 'within_range'
  baselineValue?: number; // Optional starting baseline for threshold/lagging metrics
  targetDirection: TargetDirection;
  kpiType: KpiType;
  aggregationMethod: AggregationMethod;
  interval: KpiIntervalConfig;
  startDate: string; // YYYY-MM-DD
  status: KpiStatus;
  weight: number; // Importance weight (default 1.0)
  order: number;
  quickIncrements?: QuickIncrement[];
  createdAt: string;
}

export interface TrackingLog {
  id: string;
  kpiId: string;
  date: string; // YYYY-MM-DD (date-only local calendar value)
  value: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewIntervalConfig {
  preset: 'weekly' | 'biweekly' | '3weeks' | 'monthly' | '2months' | 'quarterly' | 'custom';
  intervalCount: number;
  intervalUnit: IntervalUnit;
}

export interface ReviewEntry {
  id: string;
  title: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  intervalLabel: string;
  wentWell: string;
  didNotGoWell: string;
  shouldImprove: string;
  deservesAttention: string;
  nextPriorities: string;
  snapshotSummary?: {
    goalsProgressed: number;
    goalsCompleted: number;
    kpisMeetingTarget: number;
    kpisNeedingAttention: number;
    overallScore: number | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  theme: ThemeMode;
  compactKpiCards: boolean;
  defaultReviewInterval: ReviewIntervalConfig;
  hasCompletedOnboarding: boolean;
  sidebarCollapsed: boolean;
}

export interface ActivityEvent {
  id: string;
  type: 'log_added' | 'goal_created' | 'goal_completed' | 'kpi_created' | 'review_completed';
  title: string;
  subtitle?: string;
  timestamp: string;
  relatedId?: string;
  areaId?: string;
}

export interface AppDataStore {
  version: number;
  settings: AppSettings;
  lifeAreas: LifeArea[];
  goals: Goal[];
  kpiGroups: KpiGroup[];
  kpis: Kpi[];
  trackingLogs: TrackingLog[];
  reviews: ReviewEntry[];
  recentActivity: ActivityEvent[];
}

export interface PeriodWindow {
  index: number; // 0 for current period, -1 for previous, +1 for next, etc. (or absolute index from anchor)
  startDate: string; // YYYY-MM-DD inclusive
  endDate: string; // YYYY-MM-DD inclusive
  label: string; // e.g., "Oct 5 – Oct 25, 2026"
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  elapsedRatio: number; // 0 to 1
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export type PerformanceHealth =
  | 'on_track'
  | 'exceeding'
  | 'behind_pace'
  | 'at_risk'
  | 'overdue_log'
  | 'insufficient_data';

export interface KpiEvaluation {
  kpi: Kpi;
  period: PeriodWindow;
  logsInPeriod: TrackingLog[];
  allLogsCount: number;
  lastLogDate: string | null;
  daysSinceLastLog: number | null;
  currentValue: number | null; // null if no logs in period
  rawAchievementPct: number | null; // Can exceed 100% for quantitative progress
  normalizedScore: number | null; // 0 to 100 normalized for group/goal aggregation, null if insufficient data
  expectedProgressPct: number | null; // Based on elapsed time in period for cumulative KPIs
  isTargetSatisfied: boolean | null;
  health: PerformanceHealth;
  statusReason: string;
  periodLabel: string; // e.g. "Every 3 Weeks"
}

export interface GroupEvaluation {
  group: KpiGroup;
  kpiEvaluations: KpiEvaluation[];
  normalizedScore: number | null;
  evaluatedCount: number;
  totalActiveCount: number;
  coverageRatio: number;
}

export interface GoalEvaluation {
  goal: Goal;
  groupEvaluations: GroupEvaluation[];
  kpiEvaluations: KpiEvaluation[];
  normalizedScore: number | null;
  onTrackCount: number;
  attentionCount: number;
  insufficientDataCount: number;
  totalActiveKpis: number;
  coverageRatio: number;
  paceStatus: 'on_track' | 'needs_attention' | 'insufficient_data' | 'completed';
}

export interface AreaEvaluation {
  area: LifeArea;
  goalEvaluations: GoalEvaluation[];
  activeGoalsCount: number;
  activeKpisCount: number;
  onTrackKpisCount: number;
  attentionKpisCount: number;
  insufficientKpisCount: number;
  normalizedScore: number | null;
  coverageRatio: number;
}
