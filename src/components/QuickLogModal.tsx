import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { useLifeKpi } from '../context/DataContext';
import { formatShortDate, getTodayDateString } from '../utils/periodMath';
import { formatIntervalLabel } from '../utils/periodMath';

interface QuickLogModalProps {
  isOpen: boolean;
  kpiId: string | null;
  onClose: () => void;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({ isOpen, kpiId, onClose }) => {
  const {
    store,
    kpiEvaluationsById,
    addTrackingLog,
    updateTrackingLog,
    deleteTrackingLog,
  } = useLifeKpi();

  const [selectedKpiId, setSelectedKpiId] = useState<string>(kpiId || '');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [valueStr, setValueStr] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Inline edit state for recent logs
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const fallbackId = kpiId || store.kpis.find((k) => k.status === 'active')?.id || '';
      setSelectedKpiId(fallbackId);
      setDate(getTodayDateString());
      setValueStr('');
      setNotes('');
      setEditingLogId(null);
    }
  }, [isOpen, kpiId, store.kpis]);

  if (!isOpen) return null;

  const activeKpis = store.kpis.filter((k) => k.status !== 'archived');
  const currentKpi = store.kpis.find((k) => k.id === selectedKpiId);
  const currentEval = selectedKpiId ? kpiEvaluationsById[selectedKpiId] : undefined;

  const handleQuickIncrement = (amount: number) => {
    if (!currentKpi) return;
    if (
      currentKpi.aggregationMethod === 'latest' ||
      currentKpi.aggregationMethod === 'average'
    ) {
      setValueStr(String(amount));
    } else {
      const currentInputVal = parseFloat(valueStr);
      const nextVal = isNaN(currentInputVal) ? amount : Number((currentInputVal + amount).toFixed(2));
      setValueStr(String(nextVal));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKpiId) return;
    const numericVal = parseFloat(valueStr);
    if (isNaN(numericVal)) return;

    addTrackingLog(selectedKpiId, date, numericVal, notes);
    setValueStr('');
    setNotes('');
    onClose();
  };

  const startEditingLog = (log: { id: string; date: string; value: number; notes?: string }) => {
    setEditingLogId(log.id);
    setEditDate(log.date);
    setEditValue(String(log.value));
    setEditNotes(log.notes || '');
  };

  const saveEditedLog = (logId: string) => {
    const num = parseFloat(editValue);
    if (isNaN(num)) return;
    updateTrackingLog(logId, {
      date: editDate,
      value: num,
      notes: editNotes,
    });
    setEditingLogId(null);
  };

  // Default increment shortcuts if none configured on KPI
  const quickIncrements =
    currentKpi?.quickIncrements && currentKpi.quickIncrements.length > 0
      ? currentKpi.quickIncrements
      : currentKpi?.aggregationMethod === 'sum' || currentKpi?.aggregationMethod === 'count'
      ? [
          { label: `+1 ${currentKpi.unit}`, amount: 1 },
          { label: `+5 ${currentKpi.unit}`, amount: 5 },
          { label: `+10 ${currentKpi.unit}`, amount: 10 },
        ]
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-log-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 id="quick-log-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Quick Log Entry
            </h2>
            {currentEval && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {formatIntervalLabel(currentEval.kpi.interval)} · {currentEval.period.label}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {activeKpis.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No active KPIs found. Create a Goal and KPI first to begin logging measurements.
              </p>
            </div>
          ) : (
            <form id="quick-log-form" onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Select KPI
                </label>
                <select
                  value={selectedKpiId}
                  onChange={(e) => setSelectedKpiId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
                >
                  {activeKpis.map((k) => {
                    const grp = store.kpiGroups.find((g) => g.id === k.kpiGroupId);
                    const goal = store.goals.find((g) => g.id === grp?.goalId);
                    return (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.unit}) {goal ? `— ${goal.title}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {currentEval && (
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Current Period: </span>
                    <span className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                      {currentEval.currentValue !== null ? currentEval.currentValue : '—'}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {' '}
                      / {currentEval.kpi.targetDirection === 'within_range'
                        ? `${currentEval.kpi.targetValue}–${currentEval.kpi.targetMax}`
                        : currentEval.kpi.targetValue}{' '}
                      {currentEval.kpi.unit}
                    </span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    {currentEval.period.remainingDays}d left
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Value ({currentKpi?.unit || 'units'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    autoFocus
                    placeholder={`Enter ${currentKpi?.unit || 'value'}...`}
                    value={valueStr}
                    onChange={(e) => setValueStr(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
                  />
                </div>
              </div>

              {quickIncrements.length > 0 && (
                <div>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    Quick Shortcuts
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quickIncrements.map((inc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickIncrement(inc.amount)}
                        className="px-3 py-1.5 text-xs font-medium font-mono tabular-nums bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        {inc.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Context, workout summary, or reflection..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
                />
              </div>
            </form>
          )}

          {/* Previous entries in current period for quick edit/delete */}
          {currentEval && currentEval.logsInPeriod.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2.5">
                Entries in Current Period ({currentEval.logsInPeriod.length})
              </h3>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {currentEval.logsInPeriod.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800"
                  >
                    {editingLogId === log.id ? (
                      <div className="flex flex-wrap items-center gap-2 w-full">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                        />
                        <input
                          type="number"
                          step="any"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-20 px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                        />
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Note"
                          className="flex-1 min-w-[100px] px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => saveEditedLog(log.id)}
                          className="p-1 text-emerald-600 hover:text-emerald-700"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingLogId(null)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                              {log.value} {currentEval.kpi.unit}
                            </span>
                            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                              ·
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                              {formatShortDate(log.date)}
                            </span>
                          </div>
                          {log.notes && (
                            <p className="text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {log.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditingLog(log)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                            title="Edit entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTrackingLog(log.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Cancel
          </button>
          {activeKpis.length > 0 && (
            <button
              type="submit"
              form="quick-log-form"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Save Entry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
