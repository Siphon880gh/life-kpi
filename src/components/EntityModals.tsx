import React, { useEffect, useState } from 'react';
import { X, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useLifeKpi } from '../context/DataContext';
import {
  AggregationMethod,
  AlignmentMode,
  AreaColor,
  AreaIconName,
  Goal,
  GoalPriority,
  GoalStatus,
  IntervalUnit,
  Kpi,
  KpiType,
  LifeArea,
  QuickIncrement,
  TargetDirection,
} from '../types/kpi';
import { AREA_COLOR_MAP, AREA_ICONS, renderAreaIcon } from '../utils/visualThemes';
import { KPI_QUICK_PRESETS } from '../utils/defaultTemplates';
import { formatIntervalLabel, getKpiPeriodWindow, getTodayDateString } from '../utils/periodMath';

// ---------------------------------------------------------------------------
// 1. Life Area Form Modal
// ---------------------------------------------------------------------------

interface AreaModalProps {
  isOpen: boolean;
  editingArea?: LifeArea | null;
  onClose: () => void;
}

export const AreaFormModal: React.FC<AreaModalProps> = ({ isOpen, editingArea, onClose }) => {
  const { addLifeArea, updateLifeArea } = useLifeKpi();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<AreaIconName>('HeartPulse');
  const [color, setColor] = useState<AreaColor>('emerald');
  const [weight, setWeight] = useState('1.0');

  useEffect(() => {
    if (isOpen) {
      if (editingArea) {
        setName(editingArea.name);
        setDescription(editingArea.description);
        setIcon(editingArea.icon);
        setColor(editingArea.color);
        setWeight(String(editingArea.weight ?? 1.0));
      } else {
        setName('');
        setDescription('');
        setIcon('Target');
        setColor('emerald');
        setWeight('1.0');
      }
    }
  }, [isOpen, editingArea]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const numericWeight = Math.max(0.1, parseFloat(weight) || 1.0);

    if (editingArea) {
      updateLifeArea(editingArea.id, {
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        weight: numericWeight,
      });
    } else {
      addLifeArea({
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        weight: numericWeight,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {editingArea ? 'Edit Life Area' : 'Create Life Area'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Area Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g., Health & Fitness"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="What outcomes and standards define this domain of your life?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Color Theme
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(AREA_COLOR_MAP) as AreaColor[]).map((cKey) => {
                const token = AREA_COLOR_MAP[cKey];
                const isSelected = color === cKey;
                return (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => setColor(cKey)}
                    className={`flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: token.hex }}
                    />
                    <span className="truncate">{cKey.charAt(0).toUpperCase() + cKey.slice(1)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {(Object.keys(AREA_ICONS) as AreaIconName[]).map((iKey) => {
                const isSelected = icon === iKey;
                return (
                  <button
                    key={iKey}
                    type="button"
                    onClick={() => setIcon(iKey)}
                    className={`flex items-center justify-center p-2.5 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-slate-900 dark:border-slate-100 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    title={iKey}
                  >
                    {renderAreaIcon(iKey, 'w-4 h-4')}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Importance Weight (Optional, default 1.0)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-32 px-3 py-1.5 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg"
            >
              {editingArea ? 'Save Changes' : 'Create Area'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. Goal Form Modal (Supports partial setup + initial KPI groups)
// ---------------------------------------------------------------------------

interface GoalModalProps {
  isOpen: boolean;
  defaultAreaId?: string;
  editingGoal?: Goal | null;
  onClose: () => void;
  onCreatedGoal?: (goalId: string) => void;
}

export const GoalFormModal: React.FC<GoalModalProps> = ({
  isOpen,
  defaultAreaId,
  editingGoal,
  onClose,
  onCreatedGoal,
}) => {
  const { store, addGoal, updateGoal } = useLifeKpi();

  const activeAreas = store.lifeAreas.filter((a) => !a.archived);

  const [lifeAreaId, setLifeAreaId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<GoalStatus>('active');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [weight, setWeight] = useState('1.0');
  const [initialGroupsText, setInitialGroupsText] = useState('General');

  useEffect(() => {
    if (isOpen) {
      if (editingGoal) {
        setLifeAreaId(editingGoal.lifeAreaId);
        setTitle(editingGoal.title);
        setDescription(editingGoal.description);
        setStartDate(editingGoal.startDate);
        setTargetDate(editingGoal.targetDate || '');
        setStatus(editingGoal.status);
        setPriority(editingGoal.priority || 'medium');
        setSuccessCriteria(editingGoal.successCriteria || '');
        setWeight(String(editingGoal.weight ?? 1.0));
      } else {
        setLifeAreaId(defaultAreaId || activeAreas[0]?.id || '');
        setTitle('');
        setDescription('');
        setStartDate(getTodayDateString());
        setTargetDate('');
        setStatus('active');
        setPriority('high');
        setSuccessCriteria('');
        setWeight('1.0');
        setInitialGroupsText('General');
      }
    }
  }, [isOpen, editingGoal, defaultAreaId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !lifeAreaId) return;

    const numWeight = Math.max(0.1, parseFloat(weight) || 1.0);

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        lifeAreaId,
        title: title.trim(),
        description: description.trim(),
        startDate,
        targetDate: targetDate || undefined,
        status,
        priority,
        successCriteria: successCriteria.trim() || undefined,
        weight: numWeight,
      });
      onClose();
    } else {
      const groupNames = initialGroupsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const { goal } = addGoal(
        {
          lifeAreaId,
          title: title.trim(),
          description: description.trim(),
          startDate,
          targetDate: targetDate || undefined,
          status,
          priority,
          successCriteria: successCriteria.trim() || undefined,
          weight: numWeight,
        },
        groupNames.length > 0 ? groupNames : ['General']
      );
      onClose();
      if (onCreatedGoal) {
        onCreatedGoal(goal.id);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {editingGoal ? 'Edit Goal' : 'Create Goal'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Life Area
            </label>
            <select
              value={lifeAreaId}
              onChange={(e) => setLifeAreaId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              {activeAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Goal Title
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g., Improve Overall Physical Fitness"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Describe the meaningful long-term outcome you want to accomplish..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Target Completion Date (Optional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as GoalPriority)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Weight
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Success Criteria (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Consistent 6 gym workouts per 3-week cycle & sub-60 resting HR"
              value={successCriteria}
              onChange={(e) => setSuccessCriteria(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          {!editingGoal && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Initial KPI Groups (Comma-separated, defaults to &quot;General&quot;)
              </label>
              <input
                type="text"
                placeholder="e.g., Exercise, Body Composition, Recovery"
                value={initialGroupsText}
                onChange={(e) => setInitialGroupsText(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You can save this goal now and add or customize KPI groups and KPIs anytime.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg"
            >
              {editingGoal ? 'Save Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. KPI Form Modal (With Preset Periods, Custom Period Builder & Alignment)
// ---------------------------------------------------------------------------

interface KpiModalProps {
  isOpen: boolean;
  defaultGoalId?: string;
  defaultGroupId?: string;
  editingKpi?: Kpi | null;
  onClose: () => void;
}

const INTERVAL_PRESETS: { label: string; count: number; unit: IntervalUnit }[] = [
  { label: 'Daily', count: 1, unit: 'days' },
  { label: 'Weekly', count: 1, unit: 'weeks' },
  { label: 'Biweekly (2w)', count: 2, unit: 'weeks' },
  { label: 'Every 3 Weeks', count: 3, unit: 'weeks' },
  { label: 'Every 4 Weeks', count: 4, unit: 'weeks' },
  { label: 'Monthly', count: 1, unit: 'months' },
  { label: 'Every 2 Months', count: 2, unit: 'months' },
  { label: 'Quarterly (3m)', count: 3, unit: 'months' },
  { label: 'Every 6 Months', count: 6, unit: 'months' },
  { label: 'Yearly', count: 1, unit: 'years' },
];

export const KpiFormModal: React.FC<KpiModalProps> = ({
  isOpen,
  defaultGoalId,
  defaultGroupId,
  editingKpi,
  onClose,
}) => {
  const { store, addKpi, updateKpi } = useLifeKpi();

  const [kpiGroupId, setKpiGroupId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('sessions');
  const [targetValue, setTargetValue] = useState('6');
  const [targetMax, setTargetMax] = useState('');
  const [baselineValue, setBaselineValue] = useState('');
  const [targetDirection, setTargetDirection] = useState<TargetDirection>('at_least');
  const [kpiType, setKpiType] = useState<KpiType>('leading');
  const [aggregationMethod, setAggregationMethod] = useState<AggregationMethod>('sum');

  // Flexible period state
  const [intervalCount, setIntervalCount] = useState('3');
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>('weeks');
  const [alignmentMode, setAlignmentMode] = useState<AlignmentMode>('calendar');
  const [anchorDate, setAnchorDate] = useState(getTodayDateString());

  // Advanced collapsible section
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [weight, setWeight] = useState('1.0');
  const [status, setStatus] = useState<Kpi['status']>('active');
  const [quickIncrements, setQuickIncrements] = useState<QuickIncrement[]>([
    { label: '+1', amount: 1 },
  ]);

  useEffect(() => {
    if (isOpen) {
      if (editingKpi) {
        setKpiGroupId(editingKpi.kpiGroupId);
        setName(editingKpi.name);
        setDescription(editingKpi.description);
        setUnit(editingKpi.unit);
        setTargetValue(String(editingKpi.targetValue));
        setTargetMax(editingKpi.targetMax !== undefined ? String(editingKpi.targetMax) : '');
        setBaselineValue(
          editingKpi.baselineValue !== undefined ? String(editingKpi.baselineValue) : ''
        );
        setTargetDirection(editingKpi.targetDirection);
        setKpiType(editingKpi.kpiType);
        setAggregationMethod(editingKpi.aggregationMethod);
        setIntervalCount(String(editingKpi.interval.intervalCount));
        setIntervalUnit(editingKpi.interval.intervalUnit);
        setAlignmentMode(editingKpi.interval.alignmentMode);
        setAnchorDate(editingKpi.interval.anchorDate || getTodayDateString());
        setWeight(String(editingKpi.weight ?? 1.0));
        setStatus(editingKpi.status);
        setQuickIncrements(editingKpi.quickIncrements || []);
      } else {
        let initialGroup = defaultGroupId || '';
        if (!initialGroup && defaultGoalId) {
          const grp = store.kpiGroups.find((g) => g.goalId === defaultGoalId);
          if (grp) initialGroup = grp.id;
        }
        if (!initialGroup && store.kpiGroups.length > 0) {
          initialGroup = store.kpiGroups[0].id;
        }
        setKpiGroupId(initialGroup);
        setName('');
        setDescription('');
        setUnit('sessions');
        setTargetValue('6');
        setTargetMax('');
        setBaselineValue('');
        setTargetDirection('at_least');
        setKpiType('leading');
        setAggregationMethod('sum');
        setIntervalCount('3');
        setIntervalUnit('weeks');
        setAlignmentMode('calendar');
        setAnchorDate(getTodayDateString());
        setWeight('1.0');
        setStatus('active');
        setQuickIncrements([{ label: '+1 Session', amount: 1 }]);
        setShowAdvanced(false);
      }
    }
  }, [isOpen, editingKpi, defaultGoalId, defaultGroupId, store.kpiGroups]);

  if (!isOpen) return null;

  const applyTemplatePreset = (presetIndex: number) => {
    const preset = KPI_QUICK_PRESETS[presetIndex];
    if (!preset) return;
    setName(preset.name);
    setDescription(preset.description);
    setUnit(preset.unit);
    setTargetValue(String(preset.targetValue));
    setTargetMax(preset.targetMax !== undefined ? String(preset.targetMax) : '');
    setTargetDirection(preset.targetDirection);
    setKpiType(preset.kpiType);
    setAggregationMethod(preset.aggregationMethod);
    setIntervalCount(String(preset.intervalCount));
    setIntervalUnit(preset.intervalUnit);
    setAlignmentMode(preset.alignmentMode);
    setQuickIncrements(preset.quickIncrements || []);
  };

  // Live preview of the configured period
  const previewInterval = {
    intervalCount: Math.max(1, parseInt(intervalCount, 10) || 1),
    intervalUnit,
    alignmentMode,
    anchorDate: anchorDate || getTodayDateString(),
    weekStartsOn: 1 as const,
  };
  const previewWindow = getKpiPeriodWindow(previewInterval, 0);
  const nextWindow = getKpiPeriodWindow(previewInterval, 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !kpiGroupId) return;

    const numTarget = parseFloat(targetValue);
    if (isNaN(numTarget)) return;

    const numMax = targetMax !== '' ? parseFloat(targetMax) : undefined;
    const numBaseline = baselineValue !== '' ? parseFloat(baselineValue) : undefined;
    const numWeight = Math.max(0.1, parseFloat(weight) || 1.0);

    const payload: Omit<Kpi, 'id' | 'order' | 'createdAt'> = {
      kpiGroupId,
      name: name.trim(),
      description: description.trim(),
      unit: unit.trim() || 'units',
      targetValue: numTarget,
      targetMax: targetDirection === 'within_range' ? numMax : undefined,
      baselineValue: numBaseline,
      targetDirection,
      kpiType,
      aggregationMethod,
      interval: previewInterval,
      startDate: anchorDate || getTodayDateString(),
      status,
      weight: numWeight,
      quickIncrements: quickIncrements.filter((q) => q.label.trim() && !isNaN(q.amount)),
    };

    if (editingKpi) {
      updateKpi(editingKpi.id, payload);
    } else {
      addKpi(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {editingKpi ? 'Edit KPI Configuration' : 'Create Measurable KPI'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure target metrics and independent measurement intervals
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5">
          {/* Quick Template Suggestions for new KPI */}
          {!editingKpi && (
            <div>
              <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Quick Templates (Optional)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {KPI_QUICK_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyTemplatePreset(idx)}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                KPI Name
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g., Gym Sessions"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Goal & KPI Group
              </label>
              <select
                value={kpiGroupId}
                onChange={(e) => setKpiGroupId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {store.kpiGroups.map((grp) => {
                  const goal = store.goals.find((g) => g.id === grp.goalId);
                  const area = store.lifeAreas.find((a) => a.id === goal?.lifeAreaId);
                  return (
                    <option key={grp.id} value={grp.id}>
                      {area ? `${area.name} › ` : ''}
                      {goal ? `${goal.title} › ` : ''}
                      {grp.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Target & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Target Direction
              </label>
              <select
                value={targetDirection}
                onChange={(e) => setTargetDirection(e.target.value as TargetDirection)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="at_least">At Least (≥ Target)</option>
                <option value="at_most">At Most (≤ Target)</option>
                <option value="within_range">Within Range (Min–Max)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {targetDirection === 'within_range' ? 'Minimum Value' : 'Target Value'}
              </label>
              <input
                type="number"
                step="any"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            {targetDirection === 'within_range' ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Maximum Value
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={targetMax}
                  onChange={(e) => setTargetMax(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Unit
                </label>
                <input
                  type="text"
                  required
                  placeholder="sessions, hours, kg, %, USD..."
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
          </div>

          {targetDirection === 'within_range' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Unit
              </label>
              <input
                type="text"
                required
                placeholder="kg, kcal, hours..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full sm:w-1/2 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          {/* Aggregation & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Aggregation Method
              </label>
              <select
                value={aggregationMethod}
                onChange={(e) => setAggregationMethod(e.target.value as AggregationMethod)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="sum">Sum of Entries in Period</option>
                <option value="average">Average of Entries in Period</option>
                <option value="latest">Latest Measurement in Period</option>
                <option value="count">Count of Logged Records</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                KPI Indicator Type
              </label>
              <select
                value={kpiType}
                onChange={(e) => setKpiType(e.target.value as KpiType)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="leading">Leading Indicator (Input / Behavior)</option>
                <option value="lagging">Lagging Indicator (Outcome / Result)</option>
              </select>
            </div>
          </div>

          {/* Flexible Tracking Period Builder */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Flexible Tracking Period
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                {formatIntervalLabel(previewInterval)}
              </span>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                Preset Intervals
              </span>
              <div className="flex flex-wrap gap-1.5">
                {INTERVAL_PRESETS.map((p) => {
                  const isActive =
                    parseInt(intervalCount, 10) === p.count && intervalUnit === p.unit;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setIntervalCount(String(p.count));
                        setIntervalUnit(p.unit);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Repeat Every Builder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Repeat Every (Custom Interval)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    required
                    value={intervalCount}
                    onChange={(e) => setIntervalCount(e.target.value)}
                    className="w-24 px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                  <select
                    value={intervalUnit}
                    onChange={(e) => setIntervalUnit(e.target.value as IntervalUnit)}
                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Period Alignment
                </label>
                <select
                  value={alignmentMode}
                  onChange={(e) => setAlignmentMode(e.target.value as AlignmentMode)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="calendar">Calendar-Aligned (Monday weeks / 1st of month)</option>
                  <option value="custom_anchor">Custom Start Date Anchor</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {alignmentMode === 'custom_anchor'
                    ? 'Cycle Anchor Start Date'
                    : 'Reference Calendar Anchor'}
                </label>
                <input
                  type="date"
                  value={anchorDate}
                  onChange={(e) => setAnchorDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800">
                <div>
                  <span className="text-slate-400">Current Period: </span>
                  <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                    {previewWindow.label}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Next Period: </span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    {nextWindow.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Advanced Options */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Advanced Options (Description, Weight, Baseline, Quick Shortcuts)
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Description / Measurement Protocol
                  </label>
                  <input
                    type="text"
                    placeholder="How and when is this KPI measured?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Importance Weight
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Baseline Value (Optional)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Starting value"
                      value={baselineValue}
                      onChange={(e) => setBaselineValue(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as Kpi['status'])}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Quick Increments */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Quick Log Increment Buttons
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setQuickIncrements([...quickIncrements, { label: '+1', amount: 1 }])
                      }
                      className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Shortcut
                    </button>
                  </div>
                  <div className="space-y-2">
                    {quickIncrements.map((inc, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Label (e.g. +1 Workout)"
                          value={inc.label}
                          onChange={(e) => {
                            const next = [...quickIncrements];
                            next[i] = { ...next[i], label: e.target.value };
                            setQuickIncrements(next);
                          }}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Amount"
                          value={inc.amount}
                          onChange={(e) => {
                            const next = [...quickIncrements];
                            next[i] = { ...next[i], amount: parseFloat(e.target.value) || 0 };
                            setQuickIncrements(next);
                          }}
                          className="w-24 px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setQuickIncrements(quickIncrements.filter((_, idx) => idx !== i))
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg"
            >
              {editingKpi ? 'Save KPI Changes' : 'Create KPI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
