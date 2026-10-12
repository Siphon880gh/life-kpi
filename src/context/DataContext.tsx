import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityEvent,
  AppDataStore,
  AppSettings,
  AreaEvaluation,
  Goal,
  GoalEvaluation,
  Kpi,
  KpiEvaluation,
  KpiGroup,
  LifeArea,
  ReviewEntry,
  TrackingLog,
} from '../types/kpi';
import { evaluateGoal, evaluateKpi, evaluateLifeArea } from '../utils/kpiEvaluation';
import { getTodayDateString } from '../utils/periodMath';
import { buildStarterHierarchyFromTemplates } from '../utils/defaultTemplates';

const STORAGE_KEY = 'life_kpi_os_v1';
const CURRENT_SCHEMA_VERSION = 1;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  compactKpiCards: false,
  defaultReviewInterval: {
    preset: 'biweekly',
    intervalCount: 2,
    intervalUnit: 'weeks',
  },
  hasCompletedOnboarding: false,
  sidebarCollapsed: false,
};

function createEmptyStore(): AppDataStore {
  return {
    version: CURRENT_SCHEMA_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    lifeAreas: [],
    goals: [],
    kpiGroups: [],
    kpis: [],
    trackingLogs: [],
    reviews: [],
    recentActivity: [],
  };
}

function validateAndMigrateStore(raw: unknown): AppDataStore {
  if (!raw || typeof raw !== 'object') {
    return createEmptyStore();
  }
  const obj = raw as Partial<AppDataStore>;
  return {
    version: CURRENT_SCHEMA_VERSION,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(obj.settings || {}),
    },
    lifeAreas: Array.isArray(obj.lifeAreas) ? obj.lifeAreas : [],
    goals: Array.isArray(obj.goals) ? obj.goals : [],
    kpiGroups: Array.isArray(obj.kpiGroups) ? obj.kpiGroups : [],
    kpis: Array.isArray(obj.kpis) ? obj.kpis : [],
    trackingLogs: Array.isArray(obj.trackingLogs) ? obj.trackingLogs : [],
    reviews: Array.isArray(obj.reviews) ? obj.reviews : [],
    recentActivity: Array.isArray(obj.recentActivity) ? obj.recentActivity : [],
  };
}

interface DataContextValue {
  store: AppDataStore;
  storageError: string | null;
  todayStr: string;

  // Derived lookups & evaluations
  areaEvaluations: AreaEvaluation[];
  goalEvaluationsById: Record<string, GoalEvaluation>;
  kpiEvaluationsById: Record<string, KpiEvaluation>;
  logsByKpiId: Record<string, TrackingLog[]>;
  groupsByGoalId: Record<string, KpiGroup[]>;
  kpisByGroupId: Record<string, Kpi[]>;
  overallDashboardStats: {
    activeAreasCount: number;
    activeGoalsCount: number;
    activeKpisCount: number;
    onTrackKpisCount: number;
    attentionKpisCount: number;
    insufficientKpisCount: number;
    overallScore: number | null;
    coverageRatio: number;
    hasSufficientData: boolean;
  };

  // Settings actions
  updateSettings: (partial: Partial<AppSettings>) => void;

  // Onboarding
  initializeFromTemplates: (selectedAreaNames: string[], includeSampleGoals: boolean) => void;
  skipOnboardingToEmpty: () => void;

  // Life Area CRUD
  addLifeArea: (area: Omit<LifeArea, 'id' | 'order' | 'createdAt' | 'archived'>) => LifeArea;
  updateLifeArea: (id: string, updates: Partial<LifeArea>) => void;
  reorderLifeAreas: (orderedIds: string[]) => void;
  deleteLifeArea: (id: string) => void;

  // Goal CRUD
  addGoal: (
    goalData: Omit<Goal, 'id' | 'order' | 'createdAt'>,
    initialGroupNames?: string[]
  ) => { goal: Goal; defaultGroup: KpiGroup };
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  // KPI Group CRUD
  addKpiGroup: (goalId: string, name: string, weight?: number) => KpiGroup;
  updateKpiGroup: (id: string, updates: Partial<KpiGroup>) => void;
  reorderKpiGroups: (goalId: string, orderedGroupIds: string[]) => void;
  deleteKpiGroup: (id: string) => void;

  // KPI CRUD
  addKpi: (kpiData: Omit<Kpi, 'id' | 'order' | 'createdAt'>) => Kpi;
  updateKpi: (id: string, updates: Partial<Kpi>) => void;
  moveKpiToGroup: (kpiId: string, targetGroupId: string) => void;
  reorderKpis: (groupId: string, orderedKpiIds: string[]) => void;
  deleteKpi: (id: string) => void;

  // Tracking Log CRUD
  addTrackingLog: (kpiId: string, date: string, value: number, notes?: string) => TrackingLog;
  updateTrackingLog: (id: string, updates: { date?: string; value?: number; notes?: string }) => void;
  deleteTrackingLog: (id: string) => void;

  // Reviews CRUD
  addReview: (reviewData: Omit<ReviewEntry, 'id' | 'createdAt' | 'updatedAt'>) => ReviewEntry;
  updateReview: (id: string, updates: Partial<ReviewEntry>) => void;
  deleteReview: (id: string) => void;

  // Backup / Restore / Reset
  exportJsonBackup: () => string;
  importJsonBackup: (jsonStr: string) => { ok: boolean; error?: string };
  resetAllData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storageError, setStorageError] = useState<string | null>(null);

  const [store, setStore] = useState<AppDataStore>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return validateAndMigrateStore(parsed);
      }
    } catch (err) {
      console.error('Failed to read from localStorage:', err);
    }
    return createEmptyStore();
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      setStorageError(null);
    } catch (err) {
      console.error('Failed to write to localStorage:', err);
      setStorageError('Browser storage is full or unavailable. Export a JSON backup to prevent data loss.');
    }
  }, [store]);

  // Apply light/dark theme to document.documentElement
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      store.settings.theme === 'dark' ||
      (store.settings.theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [store.settings.theme]);

  const todayStr = getTodayDateString();

  // Compute indexed collections and hierarchical evaluations
  const derived = useMemo(() => {
    const logsByKpiId: Record<string, TrackingLog[]> = {};
    for (const log of store.trackingLogs) {
      if (!logsByKpiId[log.kpiId]) logsByKpiId[log.kpiId] = [];
      logsByKpiId[log.kpiId].push(log);
    }

    const kpisByGroupId: Record<string, Kpi[]> = {};
    for (const kpi of store.kpis) {
      if (!kpisByGroupId[kpi.kpiGroupId]) kpisByGroupId[kpi.kpiGroupId] = [];
      kpisByGroupId[kpi.kpiGroupId].push(kpi);
    }

    const groupsByGoalId: Record<string, KpiGroup[]> = {};
    for (const group of store.kpiGroups) {
      if (!groupsByGoalId[group.goalId]) groupsByGoalId[group.goalId] = [];
      groupsByGoalId[group.goalId].push(group);
    }

    const goalsByAreaId: Record<string, Goal[]> = {};
    for (const goal of store.goals) {
      if (!goalsByAreaId[goal.lifeAreaId]) goalsByAreaId[goal.lifeAreaId] = [];
      goalsByAreaId[goal.lifeAreaId].push(goal);
    }

    const kpiEvaluationsById: Record<string, KpiEvaluation> = {};
    for (const kpi of store.kpis) {
      kpiEvaluationsById[kpi.id] = evaluateKpi(kpi, logsByKpiId[kpi.id] || [], 0, todayStr);
    }

    const goalEvaluationsById: Record<string, GoalEvaluation> = {};
    for (const goal of store.goals) {
      goalEvaluationsById[goal.id] = evaluateGoal(
        goal,
        groupsByGoalId[goal.id] || [],
        kpisByGroupId,
        logsByKpiId,
        todayStr
      );
    }

    const activeAreas = [...store.lifeAreas]
      .filter((a) => !a.archived)
      .sort((a, b) => a.order - b.order);

    const areaEvaluations: AreaEvaluation[] = activeAreas.map((area) =>
      evaluateLifeArea(
        area,
        goalsByAreaId[area.id] || [],
        groupsByGoalId,
        kpisByGroupId,
        logsByKpiId,
        todayStr
      )
    );

    // Overall Dashboard Aggregation
    let activeGoalsCount = 0;
    let activeKpisCount = 0;
    let onTrackKpisCount = 0;
    let attentionKpisCount = 0;
    let insufficientKpisCount = 0;

    for (const ae of areaEvaluations) {
      activeGoalsCount += ae.activeGoalsCount;
      activeKpisCount += ae.activeKpisCount;
      onTrackKpisCount += ae.onTrackKpisCount;
      attentionKpisCount += ae.attentionKpisCount;
      insufficientKpisCount += ae.insufficientKpisCount;
    }

    const evaluatedKpisTotal = activeKpisCount - insufficientKpisCount;
    const coverageRatio = activeKpisCount > 0 ? evaluatedKpisTotal / activeKpisCount : 0;

    const evaluatedAreas = areaEvaluations.filter((ae) => ae.normalizedScore !== null);
    let overallScore: number | null = null;
    if (evaluatedAreas.length > 0 && evaluatedKpisTotal > 0) {
      let weightedSum = 0;
      let totalWeight = 0;
      for (const ae of evaluatedAreas) {
        const w = Math.max(0.1, ae.area.weight || 1);
        weightedSum += (ae.normalizedScore ?? 0) * w;
        totalWeight += w;
      }
      overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;
    }

    const hasSufficientData = evaluatedKpisTotal > 0 && overallScore !== null;

    return {
      logsByKpiId,
      kpisByGroupId,
      groupsByGoalId,
      kpiEvaluationsById,
      goalEvaluationsById,
      areaEvaluations,
      overallDashboardStats: {
        activeAreasCount: activeAreas.length,
        activeGoalsCount,
        activeKpisCount,
        onTrackKpisCount,
        attentionKpisCount,
        insufficientKpisCount,
        overallScore,
        coverageRatio,
        hasSufficientData,
      },
    };
  }, [store, todayStr]);

  const appendActivity = (
    prev: ActivityEvent[],
    event: Omit<ActivityEvent, 'id' | 'timestamp'>
  ): ActivityEvent[] => {
    const newEvent: ActivityEvent = {
      ...event,
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    return [newEvent, ...prev].slice(0, 35);
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    setStore((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...partial },
    }));
  };

  const initializeFromTemplates = (selectedAreaNames: string[], includeSampleGoals: boolean) => {
    const generated = buildStarterHierarchyFromTemplates(selectedAreaNames, includeSampleGoals);
    setStore((prev) => ({
      ...prev,
      settings: { ...prev.settings, hasCompletedOnboarding: true },
      lifeAreas: generated.lifeAreas,
      goals: generated.goals,
      kpiGroups: generated.kpiGroups,
      kpis: generated.kpis,
      trackingLogs: [],
      recentActivity: appendActivity(prev.recentActivity, {
        type: 'goal_created',
        title: `Configured ${generated.lifeAreas.length} Life Areas`,
        subtitle: includeSampleGoals
          ? `Added ${generated.goals.length} starter goals and ${generated.kpis.length} KPIs`
          : 'Ready to create your first custom goals',
      }),
    }));
  };

  const skipOnboardingToEmpty = () => {
    setStore((prev) => ({
      ...prev,
      settings: { ...prev.settings, hasCompletedOnboarding: true },
    }));
  };

  // Life Area CRUD
  const addLifeArea = (
    areaData: Omit<LifeArea, 'id' | 'order' | 'createdAt' | 'archived'>
  ): LifeArea => {
    const newArea: LifeArea = {
      ...areaData,
      id: `area_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      order: store.lifeAreas.length,
      archived: false,
      createdAt: new Date().toISOString(),
    };
    setStore((prev) => ({
      ...prev,
      lifeAreas: [...prev.lifeAreas, newArea],
      settings: { ...prev.settings, hasCompletedOnboarding: true },
    }));
    return newArea;
  };

  const updateLifeArea = (id: string, updates: Partial<LifeArea>) => {
    setStore((prev) => ({
      ...prev,
      lifeAreas: prev.lifeAreas.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  };

  const reorderLifeAreas = (orderedIds: string[]) => {
    setStore((prev) => ({
      ...prev,
      lifeAreas: prev.lifeAreas.map((a) => {
        const idx = orderedIds.indexOf(a.id);
        return idx >= 0 ? { ...a, order: idx } : a;
      }),
    }));
  };

  const deleteLifeArea = (id: string) => {
    setStore((prev) => {
      const goalIdsToRemove = new Set(
        prev.goals.filter((g) => g.lifeAreaId === id).map((g) => g.id)
      );
      const groupIdsToRemove = new Set(
        prev.kpiGroups.filter((grp) => goalIdsToRemove.has(grp.goalId)).map((grp) => grp.id)
      );
      const kpiIdsToRemove = new Set(
        prev.kpis.filter((k) => groupIdsToRemove.has(k.kpiGroupId)).map((k) => k.id)
      );

      return {
        ...prev,
        lifeAreas: prev.lifeAreas.filter((a) => a.id !== id),
        goals: prev.goals.filter((g) => !goalIdsToRemove.has(g.id)),
        kpiGroups: prev.kpiGroups.filter((grp) => !groupIdsToRemove.has(grp.id)),
        kpis: prev.kpis.filter((k) => !kpiIdsToRemove.has(k.id)),
        trackingLogs: prev.trackingLogs.filter((l) => !kpiIdsToRemove.has(l.kpiId)),
      };
    });
  };

  // Goal CRUD
  const addGoal = (
    goalData: Omit<Goal, 'id' | 'order' | 'createdAt'>,
    initialGroupNames?: string[]
  ): { goal: Goal; defaultGroup: KpiGroup } => {
    const nowIso = new Date().toISOString();
    const goalId = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newGoal: Goal = {
      ...goalData,
      id: goalId,
      order: store.goals.filter((g) => g.lifeAreaId === goalData.lifeAreaId).length,
      createdAt: nowIso,
    };

    const groupNames =
      initialGroupNames && initialGroupNames.length > 0 ? initialGroupNames : ['General'];

    const createdGroups: KpiGroup[] = groupNames.map((name, idx) => ({
      id: `group_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      goalId,
      name: name.trim() || 'General',
      weight: 1.0,
      order: idx,
      collapsed: false,
      createdAt: nowIso,
    }));

    setStore((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
      kpiGroups: [...prev.kpiGroups, ...createdGroups],
      recentActivity: appendActivity(prev.recentActivity, {
        type: 'goal_created',
        title: `Created goal: ${newGoal.title}`,
        relatedId: newGoal.id,
        areaId: newGoal.lifeAreaId,
      }),
    }));

    return { goal: newGoal, defaultGroup: createdGroups[0] };
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setStore((prev) => {
      const target = prev.goals.find((g) => g.id === id);
      const justCompleted =
        target && target.status !== 'completed' && updates.status === 'completed';

      return {
        ...prev,
        goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        recentActivity: justCompleted
          ? appendActivity(prev.recentActivity, {
              type: 'goal_completed',
              title: `Completed goal: ${updates.title || target.title}`,
              relatedId: id,
              areaId: target.lifeAreaId,
            })
          : prev.recentActivity,
      };
    });
  };

  const deleteGoal = (id: string) => {
    setStore((prev) => {
      const groupIdsToRemove = new Set(
        prev.kpiGroups.filter((grp) => grp.goalId === id).map((grp) => grp.id)
      );
      const kpiIdsToRemove = new Set(
        prev.kpis.filter((k) => groupIdsToRemove.has(k.kpiGroupId)).map((k) => k.id)
      );
      return {
        ...prev,
        goals: prev.goals.filter((g) => g.id !== id),
        kpiGroups: prev.kpiGroups.filter((grp) => !groupIdsToRemove.has(grp.id)),
        kpis: prev.kpis.filter((k) => !kpiIdsToRemove.has(k.id)),
        trackingLogs: prev.trackingLogs.filter((l) => !kpiIdsToRemove.has(l.kpiId)),
      };
    });
  };

  // KPI Group CRUD
  const addKpiGroup = (goalId: string, name: string, weight: number = 1.0): KpiGroup => {
    const existingCount = store.kpiGroups.filter((g) => g.goalId === goalId).length;
    const newGroup: KpiGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      goalId,
      name: name.trim() || 'General',
      weight,
      order: existingCount,
      collapsed: false,
      createdAt: new Date().toISOString(),
    };
    setStore((prev) => ({
      ...prev,
      kpiGroups: [...prev.kpiGroups, newGroup],
    }));
    return newGroup;
  };

  const updateKpiGroup = (id: string, updates: Partial<KpiGroup>) => {
    setStore((prev) => ({
      ...prev,
      kpiGroups: prev.kpiGroups.map((grp) => (grp.id === id ? { ...grp, ...updates } : grp)),
    }));
  };

  const reorderKpiGroups = (goalId: string, orderedGroupIds: string[]) => {
    setStore((prev) => ({
      ...prev,
      kpiGroups: prev.kpiGroups.map((grp) => {
        if (grp.goalId !== goalId) return grp;
        const idx = orderedGroupIds.indexOf(grp.id);
        return idx >= 0 ? { ...grp, order: idx } : grp;
      }),
    }));
  };

  const deleteKpiGroup = (id: string) => {
    setStore((prev) => {
      const kpiIdsToRemove = new Set(
        prev.kpis.filter((k) => k.kpiGroupId === id).map((k) => k.id)
      );
      return {
        ...prev,
        kpiGroups: prev.kpiGroups.filter((grp) => grp.id !== id),
        kpis: prev.kpis.filter((k) => !kpiIdsToRemove.has(k.id)),
        trackingLogs: prev.trackingLogs.filter((l) => !kpiIdsToRemove.has(l.kpiId)),
      };
    });
  };

  // KPI CRUD
  const addKpi = (kpiData: Omit<Kpi, 'id' | 'order' | 'createdAt'>): Kpi => {
    const existingCount = store.kpis.filter((k) => k.kpiGroupId === kpiData.kpiGroupId).length;
    const newKpi: Kpi = {
      ...kpiData,
      id: `kpi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      order: existingCount,
      createdAt: new Date().toISOString(),
    };
    setStore((prev) => ({
      ...prev,
      kpis: [...prev.kpis, newKpi],
      recentActivity: appendActivity(prev.recentActivity, {
        type: 'kpi_created',
        title: `Added KPI: ${newKpi.name}`,
        subtitle: `Target: ${newKpi.targetValue} ${newKpi.unit}`,
        relatedId: newKpi.id,
      }),
    }));
    return newKpi;
  };

  const updateKpi = (id: string, updates: Partial<Kpi>) => {
    setStore((prev) => ({
      ...prev,
      kpis: prev.kpis.map((k) => (k.id === id ? { ...k, ...updates } : k)),
    }));
  };

  const moveKpiToGroup = (kpiId: string, targetGroupId: string) => {
    setStore((prev) => {
      const countInTarget = prev.kpis.filter((k) => k.kpiGroupId === targetGroupId).length;
      return {
        ...prev,
        kpis: prev.kpis.map((k) =>
          k.id === kpiId ? { ...k, kpiGroupId: targetGroupId, order: countInTarget } : k
        ),
      };
    });
  };

  const reorderKpis = (groupId: string, orderedKpiIds: string[]) => {
    setStore((prev) => ({
      ...prev,
      kpis: prev.kpis.map((k) => {
        if (k.kpiGroupId !== groupId) return k;
        const idx = orderedKpiIds.indexOf(k.id);
        return idx >= 0 ? { ...k, order: idx } : k;
      }),
    }));
  };

  const deleteKpi = (id: string) => {
    setStore((prev) => ({
      ...prev,
      kpis: prev.kpis.filter((k) => k.id !== id),
      trackingLogs: prev.trackingLogs.filter((l) => l.kpiId !== id),
    }));
  };

  // Tracking Log CRUD
  const addTrackingLog = (
    kpiId: string,
    date: string,
    value: number,
    notes?: string
  ): TrackingLog => {
    const nowIso = new Date().toISOString();
    const newLog: TrackingLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kpiId,
      date,
      value: Number(value),
      notes: notes?.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setStore((prev) => {
      const kpi = prev.kpis.find((k) => k.id === kpiId);
      return {
        ...prev,
        trackingLogs: [newLog, ...prev.trackingLogs],
        recentActivity: appendActivity(prev.recentActivity, {
          type: 'log_added',
          title: `Logged ${newLog.value} ${kpi?.unit || ''} for ${kpi?.name || 'KPI'}`,
          subtitle: newLog.notes ? `"${newLog.notes}"` : `Recorded for ${newLog.date}`,
          relatedId: kpiId,
        }),
      };
    });
    return newLog;
  };

  const updateTrackingLog = (
    id: string,
    updates: { date?: string; value?: number; notes?: string }
  ) => {
    const nowIso = new Date().toISOString();
    setStore((prev) => ({
      ...prev,
      trackingLogs: prev.trackingLogs.map((l) =>
        l.id === id
          ? {
              ...l,
              date: updates.date ?? l.date,
              value: updates.value !== undefined ? Number(updates.value) : l.value,
              notes: updates.notes !== undefined ? updates.notes.trim() || undefined : l.notes,
              updatedAt: nowIso,
            }
          : l
      ),
    }));
  };

  const deleteTrackingLog = (id: string) => {
    setStore((prev) => ({
      ...prev,
      trackingLogs: prev.trackingLogs.filter((l) => l.id !== id),
    }));
  };

  // Reviews CRUD
  const addReview = (
    reviewData: Omit<ReviewEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): ReviewEntry => {
    const nowIso = new Date().toISOString();
    const newReview: ReviewEntry = {
      ...reviewData,
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setStore((prev) => ({
      ...prev,
      reviews: [newReview, ...prev.reviews],
      recentActivity: appendActivity(prev.recentActivity, {
        type: 'review_completed',
        title: `Completed review: ${newReview.title}`,
        subtitle: `${newReview.periodStart} to ${newReview.periodEnd}`,
        relatedId: newReview.id,
      }),
    }));
    return newReview;
  };

  const updateReview = (id: string, updates: Partial<ReviewEntry>) => {
    setStore((prev) => ({
      ...prev,
      reviews: prev.reviews.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      ),
    }));
  };

  const deleteReview = (id: string) => {
    setStore((prev) => ({
      ...prev,
      reviews: prev.reviews.filter((r) => r.id !== id),
    }));
  };

  // Backup / Restore / Reset
  const exportJsonBackup = (): string => {
    return JSON.stringify(store, null, 2);
  };

  const importJsonBackup = (jsonStr: string): { ok: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        return { ok: false, error: 'Invalid JSON structure.' };
      }
      if (!Array.isArray(parsed.lifeAreas) || !Array.isArray(parsed.kpis)) {
        return {
          ok: false,
          error: 'Backup file is missing required Life KPI collections (lifeAreas, kpis).',
        };
      }
      const migrated = validateAndMigrateStore(parsed);
      setStore(migrated);
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Could not parse JSON file.',
      };
    }
  };

  const resetAllData = () => {
    const fresh = createEmptyStore();
    setStore(fresh);
  };

  return (
    <DataContext.Provider
      value={{
        store,
        storageError,
        todayStr,
        ...derived,
        updateSettings,
        initializeFromTemplates,
        skipOnboardingToEmpty,
        addLifeArea,
        updateLifeArea,
        reorderLifeAreas,
        deleteLifeArea,
        addGoal,
        updateGoal,
        deleteGoal,
        addKpiGroup,
        updateKpiGroup,
        reorderKpiGroups,
        deleteKpiGroup,
        addKpi,
        updateKpi,
        moveKpiToGroup,
        reorderKpis,
        deleteKpi,
        addTrackingLog,
        updateTrackingLog,
        deleteTrackingLog,
        addReview,
        updateReview,
        deleteReview,
        exportJsonBackup,
        importJsonBackup,
        resetAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useLifeKpi() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useLifeKpi must be used inside a DataProvider');
  }
  return ctx;
}
