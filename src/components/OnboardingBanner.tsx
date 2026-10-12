import React, { useState } from 'react';
import { Check, ArrowRight, Layers, Target, Plus } from 'lucide-react';
import { useLifeKpi } from '../context/DataContext';
import { DEFAULT_AREA_TEMPLATES } from '../utils/defaultTemplates';
import { AREA_COLOR_MAP, renderAreaIcon } from '../utils/visualThemes';

interface OnboardingBannerProps {
  onOpenNewArea: () => void;
  onOpenNewGoal: () => void;
  onOpenNewKpi: () => void;
}

export const OnboardingBanner: React.FC<OnboardingBannerProps> = ({
  onOpenNewArea,
  onOpenNewGoal,
  onOpenNewKpi,
}) => {
  const { initializeFromTemplates, skipOnboardingToEmpty } = useLifeKpi();

  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    DEFAULT_AREA_TEMPLATES.map((t) => t.name)
  );
  const [includeSampleGoals, setIncludeSampleGoals] = useState<boolean>(true);

  const toggleArea = (name: string) => {
    setSelectedAreas((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleInitialize = () => {
    if (selectedAreas.length === 0) return;
    initializeFromTemplates(selectedAreas, includeSampleGoals);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
      <div className="max-w-2xl space-y-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          First-Run Workspace Setup
        </p>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
          Design your Personal Life Operating System
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Organize key areas of your life, define long-term goals, group related metrics, and track
          performance on flexible timelines (e.g., every 10 days, every 3 weeks, bi-monthly, or
          custom cycles). No fake historical data is added—your log begins clean today.
        </p>
      </div>

      {/* Step 1: Select Default Life Area Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            1. Select Life Areas to Include ({selectedAreas.length} selected)
          </h3>
          <button
            type="button"
            onClick={onOpenNewArea}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <Plus className="w-3.5 h-3.5" /> Or create custom area manually
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DEFAULT_AREA_TEMPLATES.map((tpl) => {
            const isSelected = selectedAreas.includes(tpl.name);
            const colorTokens = AREA_COLOR_MAP[tpl.color];
            const firstGoal = tpl.sampleGoals[0];

            return (
              <button
                key={tpl.name}
                type="button"
                onClick={() => toggleArea(tpl.name)}
                className={`text-left p-4 rounded-xl border transition-colors flex flex-col justify-between ${
                  isSelected
                    ? 'border-slate-900 dark:border-slate-100 bg-slate-50/70 dark:bg-slate-800/50'
                    : 'border-slate-200 dark:border-slate-800 opacity-65 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorTokens.bgSoft} ${colorTokens.text}`}
                      >
                        {renderAreaIcon(tpl.icon, 'w-4 h-4')}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {tpl.name}
                      </span>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                {firstGoal && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Example Goal:{' '}
                    </span>
                    {firstGoal.title}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Include Example Goals & KPI Groups Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <label className="flex items-start sm:items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeSampleGoals}
            onChange={(e) => setIncludeSampleGoals(e.target.checked)}
            className="mt-0.5 sm:mt-0 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <div>
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
              Include editable starter Goals, KPI Groups, and flexible KPIs
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Pre-populates realistic goals and multi-week/monthly KPI schedules with zero fake
              tracking logs so you can log your first entry immediately.
            </span>
          </div>
        </label>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={skipOnboardingToEmpty}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Start Blank Instead
          </button>
          <button
            type="button"
            disabled={selectedAreas.length === 0}
            onClick={handleInitialize}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Initialize Selected Areas <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Manual Setup Links */}
      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Prefer step-by-step manual creation?</span>
        <button
          type="button"
          onClick={onOpenNewArea}
          className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:underline font-medium"
        >
          <Layers className="w-3.5 h-3.5" /> 1. Add Life Area
        </button>
        <button
          type="button"
          onClick={onOpenNewGoal}
          className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:underline font-medium"
        >
          <Target className="w-3.5 h-3.5" /> 2. Create First Goal
        </button>
        <button
          type="button"
          onClick={onOpenNewKpi}
          className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:underline font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> 3. Add First KPI
        </button>
      </div>
    </div>
  );
};
