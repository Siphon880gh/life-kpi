import React from 'react';
import {
  HeartPulse,
  Wallet,
  Briefcase,
  BookOpen,
  Users,
  Sparkles,
  Dumbbell,
  Target,
  Compass,
  Home,
  Globe,
  Cpu,
} from 'lucide-react';
import { AreaColor, AreaIconName, PerformanceHealth } from '../types/kpi';

export const AREA_ICONS: Record<AreaIconName, React.ComponentType<{ className?: string }>> = {
  HeartPulse,
  Wallet,
  Briefcase,
  BookOpen,
  Users,
  Sparkles,
  Dumbbell,
  Target,
  Compass,
  Home,
  Globe,
  Cpu,
};

export function renderAreaIcon(iconName: AreaIconName, className: string = 'w-5 h-5') {
  const IconComponent = AREA_ICONS[iconName] || Target;
  return <IconComponent className={className} />;
}

export interface ColorTokens {
  label: string;
  text: string;
  bgSoft: string;
  borderSoft: string;
  barFill: string;
  hex: string;
}

export const AREA_COLOR_MAP: Record<AreaColor, ColorTokens> = {
  emerald: {
    label: 'Emerald Green',
    text: 'text-emerald-700 dark:text-emerald-400',
    bgSoft: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    borderSoft: 'border-emerald-200 dark:border-emerald-800/60',
    barFill: 'bg-emerald-600 dark:bg-emerald-500',
    hex: '#10b981',
  },
  blue: {
    label: 'Ocean Blue',
    text: 'text-blue-700 dark:text-blue-400',
    bgSoft: 'bg-blue-500/10 dark:bg-blue-500/15',
    borderSoft: 'border-blue-200 dark:border-blue-800/60',
    barFill: 'bg-blue-600 dark:bg-blue-500',
    hex: '#3b82f6',
  },
  indigo: {
    label: 'Indigo',
    text: 'text-indigo-700 dark:text-indigo-400',
    bgSoft: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    borderSoft: 'border-indigo-200 dark:border-indigo-800/60',
    barFill: 'bg-indigo-600 dark:bg-indigo-500',
    hex: '#6366f1',
  },
  amber: {
    label: 'Warm Amber',
    text: 'text-amber-700 dark:text-amber-400',
    bgSoft: 'bg-amber-500/10 dark:bg-amber-500/15',
    borderSoft: 'border-amber-200 dark:border-amber-800/60',
    barFill: 'bg-amber-600 dark:bg-amber-500',
    hex: '#f59e0b',
  },
  rose: {
    label: 'Rose',
    text: 'text-rose-700 dark:text-rose-400',
    bgSoft: 'bg-rose-500/10 dark:bg-rose-500/15',
    borderSoft: 'border-rose-200 dark:border-rose-800/60',
    barFill: 'bg-rose-600 dark:bg-rose-500',
    hex: '#f43f5e',
  },
  violet: {
    label: 'Violet',
    text: 'text-violet-700 dark:text-violet-400',
    bgSoft: 'bg-violet-500/10 dark:bg-violet-500/15',
    borderSoft: 'border-violet-200 dark:border-violet-800/60',
    barFill: 'bg-violet-600 dark:bg-violet-500',
    hex: '#8b5cf6',
  },
  cyan: {
    label: 'Teal Cyan',
    text: 'text-cyan-700 dark:text-cyan-400',
    bgSoft: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    borderSoft: 'border-cyan-200 dark:border-cyan-800/60',
    barFill: 'bg-cyan-600 dark:bg-cyan-500',
    hex: '#06b6d4',
  },
  slate: {
    label: 'Neutral Slate',
    text: 'text-slate-700 dark:text-slate-300',
    bgSoft: 'bg-slate-500/10 dark:bg-slate-500/15',
    borderSoft: 'border-slate-200 dark:border-slate-700',
    barFill: 'bg-slate-700 dark:bg-slate-400',
    hex: '#64748b',
  },
};

export function getHealthVisuals(health: PerformanceHealth): {
  label: string;
  textClass: string;
  barClass: string;
} {
  switch (health) {
    case 'exceeding':
      return {
        label: 'Exceeding Target',
        textClass: 'text-emerald-700 dark:text-emerald-400',
        barClass: 'bg-emerald-600 dark:bg-emerald-500',
      };
    case 'on_track':
      return {
        label: 'On Track',
        textClass: 'text-emerald-700 dark:text-emerald-400',
        barClass: 'bg-emerald-600 dark:bg-emerald-500',
      };
    case 'behind_pace':
      return {
        label: 'Behind Pace',
        textClass: 'text-amber-700 dark:text-amber-400',
        barClass: 'bg-amber-500 dark:bg-amber-400',
      };
    case 'overdue_log':
      return {
        label: 'Log Overdue',
        textClass: 'text-amber-700 dark:text-amber-400',
        barClass: 'bg-amber-500 dark:bg-amber-400',
      };
    case 'at_risk':
      return {
        label: 'Needs Attention',
        textClass: 'text-rose-700 dark:text-rose-400',
        barClass: 'bg-rose-600 dark:bg-rose-500',
      };
    case 'insufficient_data':
    default:
      return {
        label: 'Awaiting Data',
        textClass: 'text-slate-500 dark:text-slate-400',
        barClass: 'bg-slate-300 dark:bg-slate-700',
      };
  }
}
