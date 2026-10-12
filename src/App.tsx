/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Target,
  Gauge,
  ClipboardList,
  BarChart3,
  BookCheck,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  MoreHorizontal,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { DataProvider, useLifeKpi } from './context/DataContext';
import { Goal, Kpi, LifeArea } from './types/kpi';
import { DashboardView } from './views/DashboardView';
import { LifeAreaDetailView, LifeAreasListView } from './views/LifeAreaViews';
import { GoalDetailView, GoalsListView } from './views/GoalViews';
import { AllKpisView, KpiDetailView } from './views/KpiViews';
import { AnalyticsView, TrackingLogView } from './views/LogAndAnalyticsViews';
import { ReviewsView, SettingsView } from './views/ReviewsAndSettingsViews';
import { QuickLogModal } from './components/QuickLogModal';
import { AreaFormModal, GoalFormModal, KpiFormModal } from './components/EntityModals';

type NavSection =
  | 'dashboard'
  | 'areas'
  | 'area_detail'
  | 'goals'
  | 'goal_detail'
  | 'kpis'
  | 'kpi_detail'
  | 'logs'
  | 'analytics'
  | 'reviews'
  | 'settings';

const PRIMARY_SIDEBAR_ITEMS: {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'areas', label: 'Life Areas', icon: Layers },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'kpis', label: 'All KPIs', icon: Gauge },
  { id: 'logs', label: 'Tracking Log', icon: ClipboardList },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reviews', label: 'Reviews', icon: BookCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const LifeKpiShell: React.FC = () => {
  const { store, storageError, updateSettings } = useLifeKpi();

  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null);

  // Mobile "More" Drawer
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  // Modals state
  const [quickLogState, setQuickLogState] = useState<{ open: boolean; kpiId: string | null }>({
    open: false,
    kpiId: null,
  });

  const [areaModalState, setAreaModalState] = useState<{
    open: boolean;
    editingArea: LifeArea | null;
  }>({ open: false, editingArea: null });

  const [goalModalState, setGoalModalState] = useState<{
    open: boolean;
    defaultAreaId?: string;
    editingGoal: Goal | null;
  }>({ open: false, editingGoal: null });

  const [kpiModalState, setKpiModalState] = useState<{
    open: boolean;
    defaultGoalId?: string;
    defaultGroupId?: string;
    editingKpi: Kpi | null;
  }>({ open: false, editingKpi: null });

  // Navigation helpers
  const navigateToArea = (areaId: string) => {
    setSelectedAreaId(areaId);
    setActiveNav('area_detail');
    setMobileMoreOpen(false);
  };

  const navigateToGoal = (goalId: string) => {
    setSelectedGoalId(goalId);
    setActiveNav('goal_detail');
    setMobileMoreOpen(false);
  };

  const navigateToKpi = (kpiId: string) => {
    setSelectedKpiId(kpiId);
    setActiveNav('kpi_detail');
    setMobileMoreOpen(false);
  };

  const navigateSection = (section: NavSection) => {
    setActiveNav(section);
    setMobileMoreOpen(false);
  };

  const collapsed = store.settings.sidebarCollapsed;

  // Determine active top-level section for highlighting
  const currentTopSection: NavSection =
    activeNav === 'area_detail'
      ? 'areas'
      : activeNav === 'goal_detail'
      ? 'goals'
      : activeNav === 'kpi_detail'
      ? 'kpis'
      : activeNav;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Desktop Persistent Left Navigation Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 h-screen transition-all ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="h-15 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            {!collapsed && (
              <button
                type="button"
                onClick={() => navigateSection('dashboard')}
                className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
              >
                Life KPI
              </button>
            )}
            <button
              type="button"
              onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors mx-auto md:mx-0"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Primary Nav Items */}
          <nav className="p-2.5 space-y-1">
            {PRIMARY_SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = currentTopSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigateSection(id)}
                  title={collapsed ? label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Quick Actions & Theme Switch */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            type="button"
            onClick={() => setQuickLogState({ open: true, kpiId: null })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Quick Log Measurement"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Quick Log</span>}
          </button>

          <button
            type="button"
            onClick={() =>
              updateSettings({
                theme: store.settings.theme === 'dark' ? 'light' : 'dark',
              })
            }
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Toggle Light / Dark Theme"
          >
            {store.settings.theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Light Mode</span>}
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Dark Mode</span>}
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Top Bar Contract (3 zones separated by gap-8) */}
        <header className="h-15 flex items-center justify-between gap-8 px-5 sm:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          {/* Zone 1: Single text element wordmark / active breadcrumb title */}
          <button
            type="button"
            onClick={() => navigateSection('dashboard')}
            className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
          >
            Life KPI
          </button>

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => navigateSection('dashboard')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                currentTopSection === 'dashboard'
                  ? 'text-slate-900 dark:text-white underline underline-offset-4'
                  : ''
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigateSection('areas')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                currentTopSection === 'areas'
                  ? 'text-slate-900 dark:text-white underline underline-offset-4'
                  : ''
              }`}
            >
              Life Areas
            </button>
            <button
              type="button"
              onClick={() => navigateSection('goals')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                currentTopSection === 'goals'
                  ? 'text-slate-900 dark:text-white underline underline-offset-4'
                  : ''
              }`}
            >
              Goals
            </button>
            <button
              type="button"
              onClick={() => navigateSection('analytics')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                currentTopSection === 'analytics'
                  ? 'text-slate-900 dark:text-white underline underline-offset-4'
                  : ''
              }`}
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => navigateSection('reviews')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                currentTopSection === 'reviews'
                  ? 'text-slate-900 dark:text-white underline underline-offset-4'
                  : ''
              }`}
            >
              Reviews
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setQuickLogState({ open: true, kpiId: null })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Quick Log
            </button>
          </div>
        </header>

        {/* Storage Error Alert if localStorage is full */}
        {storageError && (
          <div className="mx-5 sm:mx-8 mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            {storageError}
          </div>
        )}

        {/* Main Viewport Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {activeNav === 'dashboard' && (
            <DashboardView
              onSelectArea={navigateToArea}
              onSelectGoal={navigateToGoal}
              onSelectKpi={navigateToKpi}
              onQuickLog={(kpiId) => setQuickLogState({ open: true, kpiId: kpiId || null })}
              onOpenNewArea={() => setAreaModalState({ open: true, editingArea: null })}
              onOpenNewGoal={() => setGoalModalState({ open: true, editingGoal: null })}
              onOpenNewKpi={() => setKpiModalState({ open: true, editingKpi: null })}
              onNavigateReviews={() => navigateSection('reviews')}
            />
          )}

          {activeNav === 'areas' && (
            <LifeAreasListView
              onSelectArea={navigateToArea}
              onOpenNewArea={() => setAreaModalState({ open: true, editingArea: null })}
              onEditArea={(area) => setAreaModalState({ open: true, editingArea: area })}
            />
          )}

          {activeNav === 'area_detail' && selectedAreaId && (
            <LifeAreaDetailView
              areaId={selectedAreaId}
              onBack={() => navigateSection('areas')}
              onSelectGoal={navigateToGoal}
              onOpenNewGoal={(areaId) =>
                setGoalModalState({ open: true, defaultAreaId: areaId, editingGoal: null })
              }
              onEditArea={(area) => setAreaModalState({ open: true, editingArea: area })}
              onEditGoal={(goal) => setGoalModalState({ open: true, editingGoal: goal })}
            />
          )}

          {activeNav === 'goals' && (
            <GoalsListView
              onSelectArea={navigateToArea}
              onSelectGoal={navigateToGoal}
              onOpenNewGoal={() => setGoalModalState({ open: true, editingGoal: null })}
              onEditGoal={(goal) => setGoalModalState({ open: true, editingGoal: goal })}
            />
          )}

          {activeNav === 'goal_detail' && selectedGoalId && (
            <GoalDetailView
              goalId={selectedGoalId}
              onSelectArea={navigateToArea}
              onBackToGoals={() => navigateSection('goals')}
              onEditGoal={(goal) => setGoalModalState({ open: true, editingGoal: goal })}
              onOpenNewKpi={(gId, grpId) =>
                setKpiModalState({
                  open: true,
                  defaultGoalId: gId,
                  defaultGroupId: grpId,
                  editingKpi: null,
                })
              }
              onEditKpi={(kpi) => setKpiModalState({ open: true, editingKpi: kpi })}
              onQuickLog={(kpiId) => setQuickLogState({ open: true, kpiId })}
              onViewKpiHistory={navigateToKpi}
            />
          )}

          {activeNav === 'kpis' && (
            <AllKpisView
              onSelectKpi={navigateToKpi}
              onQuickLog={(kpiId) => setQuickLogState({ open: true, kpiId })}
              onOpenNewKpi={() => setKpiModalState({ open: true, editingKpi: null })}
              onEditKpi={(kpi) => setKpiModalState({ open: true, editingKpi: kpi })}
            />
          )}

          {activeNav === 'kpi_detail' && selectedKpiId && (
            <KpiDetailView
              kpiId={selectedKpiId}
              onBack={() => navigateSection('kpis')}
              onSelectGoal={navigateToGoal}
              onSelectArea={navigateToArea}
              onQuickLog={(kpiId) => setQuickLogState({ open: true, kpiId })}
              onEditKpi={(kpi) => setKpiModalState({ open: true, editingKpi: kpi })}
            />
          )}

          {activeNav === 'logs' && (
            <TrackingLogView
              onQuickLog={(kpiId) => setQuickLogState({ open: true, kpiId: kpiId || null })}
              onSelectKpi={navigateToKpi}
            />
          )}

          {activeNav === 'analytics' && (
            <AnalyticsView
              onSelectArea={navigateToArea}
              onSelectGoal={navigateToGoal}
              onSelectKpi={navigateToKpi}
            />
          )}

          {activeNav === 'reviews' && <ReviewsView />}

          {activeNav === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Section 5: Dashboard, Goals, Quick Log, Analytics, More) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 h-14 px-2 flex items-center justify-around">
        <button
          type="button"
          onClick={() => navigateSection('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 text-[11px] font-medium ${
            currentTopSection === 'dashboard'
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => navigateSection('goals')}
          className={`flex flex-col items-center justify-center py-1 px-2 text-[11px] font-medium ${
            currentTopSection === 'goals'
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Target className="w-4 h-4 mb-0.5" />
          <span>Goals</span>
        </button>

        <button
          type="button"
          onClick={() => setQuickLogState({ open: true, kpiId: null })}
          className="flex items-center justify-center gap-1 px-3.5 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Log</span>
        </button>

        <button
          type="button"
          onClick={() => navigateSection('analytics')}
          className={`flex flex-col items-center justify-center py-1 px-2 text-[11px] font-medium ${
            currentTopSection === 'analytics'
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          <span>Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
          className={`flex flex-col items-center justify-center py-1 px-2 text-[11px] font-medium ${
            mobileMoreOpen
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <MoreHorizontal className="w-4 h-4 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer */}
      {mobileMoreOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs flex items-end">
          <div className="w-full bg-white dark:bg-slate-900 rounded-t-2xl border-t border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                More Sections
              </span>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => navigateSection('areas')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                <Layers className="w-4 h-4" /> Life Areas
              </button>
              <button
                type="button"
                onClick={() => navigateSection('kpis')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                <Gauge className="w-4 h-4" /> All KPIs
              </button>
              <button
                type="button"
                onClick={() => navigateSection('logs')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                <ClipboardList className="w-4 h-4" /> Tracking Log
              </button>
              <button
                type="button"
                onClick={() => navigateSection('reviews')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                <BookCheck className="w-4 h-4" /> Reviews
              </button>
              <button
                type="button"
                onClick={() => navigateSection('settings')}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                <Settings className="w-4 h-4" /> Settings & Backup
              </button>
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    theme: store.settings.theme === 'dark' ? 'light' : 'dark',
                  })
                }
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                {store.settings.theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" /> Dark Mode
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <QuickLogModal
        isOpen={quickLogState.open}
        kpiId={quickLogState.kpiId}
        onClose={() => setQuickLogState({ open: false, kpiId: null })}
      />

      <AreaFormModal
        isOpen={areaModalState.open}
        editingArea={areaModalState.editingArea}
        onClose={() => setAreaModalState({ open: false, editingArea: null })}
      />

      <GoalFormModal
        isOpen={goalModalState.open}
        defaultAreaId={goalModalState.defaultAreaId}
        editingGoal={goalModalState.editingGoal}
        onClose={() => setGoalModalState({ open: false, editingGoal: null })}
        onCreatedGoal={(newGoalId) => navigateToGoal(newGoalId)}
      />

      <KpiFormModal
        isOpen={kpiModalState.open}
        defaultGoalId={kpiModalState.defaultGoalId}
        defaultGroupId={kpiModalState.defaultGroupId}
        editingKpi={kpiModalState.editingKpi}
        onClose={() => setKpiModalState({ open: false, editingKpi: null })}
      />
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <LifeKpiShell />
    </DataProvider>
  );
}
