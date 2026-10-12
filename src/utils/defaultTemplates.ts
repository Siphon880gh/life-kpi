import {
  AreaColor,
  AreaIconName,
  Goal,
  Kpi,
  KpiGroup,
  LifeArea,
  QuickIncrement,
} from '../types/kpi';
import { addMonths, getTodayDateString } from './periodMath';

export interface SuggestedAreaTemplate {
  name: string;
  description: string;
  icon: AreaIconName;
  color: AreaColor;
  weight: number;
  sampleGoals: {
    title: string;
    description: string;
    successCriteria: string;
    groups: {
      name: string;
      kpis: {
        name: string;
        description: string;
        unit: string;
        targetValue: number;
        targetMax?: number;
        targetDirection: Kpi['targetDirection'];
        kpiType: Kpi['kpiType'];
        aggregationMethod: Kpi['aggregationMethod'];
        intervalCount: number;
        intervalUnit: Kpi['interval']['intervalUnit'];
        alignmentMode: Kpi['interval']['alignmentMode'];
        quickIncrements?: QuickIncrement[];
      }[];
    }[];
  }[];
}

export const DEFAULT_AREA_TEMPLATES: SuggestedAreaTemplate[] = [
  {
    name: 'Health & Fitness',
    description: 'Physical vitality, strength conditioning, body composition, and restorative sleep.',
    icon: 'HeartPulse',
    color: 'emerald',
    weight: 1.5,
    sampleGoals: [
      {
        title: 'Improve Overall Physical Fitness & Conditioning',
        description: 'Build sustainable strength, cardiovascular endurance, and consistent recovery habits.',
        successCriteria: 'Maintain consistent multi-week training cycles and keep resting heart rate below 60 bpm.',
        groups: [
          {
            name: 'Exercise & Conditioning',
            kpis: [
              {
                name: 'Gym Strength Sessions',
                description: 'Full-body or split resistance training workouts.',
                unit: 'sessions',
                targetValue: 6,
                targetDirection: 'at_least',
                kpiType: 'leading',
                aggregationMethod: 'sum',
                intervalCount: 3,
                intervalUnit: 'weeks',
                alignmentMode: 'calendar',
                quickIncrements: [
                  { label: '+1 Session', amount: 1 },
                  { label: '+2 Sessions', amount: 2 },
                ],
              },
              {
                name: 'Cardio Conditioning Hours',
                description: 'Zone 2 aerobic endurance and interval conditioning.',
                unit: 'hours',
                targetValue: 4.5,
                targetDirection: 'at_least',
                kpiType: 'leading',
                aggregationMethod: 'sum',
                intervalCount: 2,
                intervalUnit: 'weeks',
                alignmentMode: 'calendar',
                quickIncrements: [
                  { label: '+0.5 hr', amount: 0.5 },
                  { label: '+1 hr', amount: 1 },
                ],
              },
            ],
          },
          {
            name: 'Body Composition',
            kpis: [
              {
                name: 'Body Weight',
                description: 'Morning fasted scale weight within optimal healthy range.',
                unit: 'kg',
                targetValue: 72,
                targetMax: 75,
                targetDirection: 'within_range',
                kpiType: 'lagging',
                aggregationMethod: 'latest',
                intervalCount: 2,
                intervalUnit: 'weeks',
                alignmentMode: 'calendar',
              },
              {
                name: 'Body Fat Percentage',
                description: 'Calibrated bio-impedance or caliper measurement.',
                unit: '%',
                targetValue: 15,
                targetDirection: 'at_most',
                kpiType: 'lagging',
                aggregationMethod: 'latest',
                intervalCount: 1,
                intervalUnit: 'months',
                alignmentMode: 'calendar',
              },
            ],
          },
          {
            name: 'Recovery & Sleep',
            kpis: [
              {
                name: 'Sleep Duration',
                description: 'Average nightly restorative sleep duration.',
                unit: 'hours',
                targetValue: 7.5,
                targetDirection: 'at_least',
                kpiType: 'leading',
                aggregationMethod: 'average',
                intervalCount: 1,
                intervalUnit: 'weeks',
                alignmentMode: 'calendar',
                quickIncrements: [
                  { label: '7.5 hrs', amount: 7.5 },
                  { label: '8.0 hrs', amount: 8.0 },
                ],
              },
              {
                name: 'Resting Heart Rate',
                description: 'Morning resting heart rate measurement.',
                unit: 'bpm',
                targetValue: 58,
                targetDirection: 'at_most',
                kpiType: 'lagging',
                aggregationMethod: 'average',
                intervalCount: 2,
                intervalUnit: 'months',
                alignmentMode: 'calendar',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Wealth & Finance',
    description: 'Savings velocity, investment allocation, cash flow discipline, and long-term net worth.',
    icon: 'Wallet',
    color: 'blue',
    weight: 1.2,
    sampleGoals: [
      {
        title: 'Accelerate Core Investment & Savings Rate',
        description: 'Consistently allocate capital to index portfolios while maintaining disciplined discretionary spending.',
        successCriteria: 'Meet bi-monthly investment contribution targets and keep discretionary dining within budget.',
        groups: [
          {
            name: 'Capital Allocation',
            kpis: [
              {
                name: 'Portfolio Contributions',
                description: 'Direct transfers into long-term investment accounts.',
                unit: 'USD',
                targetValue: 1500,
                targetDirection: 'at_least',
                kpiType: 'leading',
                aggregationMethod: 'sum',
                intervalCount: 1,
                intervalUnit: 'months',
                alignmentMode: 'calendar',
                quickIncrements: [
                  { label: '+$250', amount: 250 },
                  { label: '+$500', amount: 500 },
                ],
              },
            ],
          },
          {
            name: 'Spending Discipline',
            kpis: [
              {
                name: 'Discretionary Dining & Takeout',
                description: 'Total spending on restaurants, coffee shops, and delivery.',
                unit: 'USD',
                targetValue: 280,
                targetDirection: 'at_most',
                kpiType: 'leading',
                aggregationMethod: 'sum',
                intervalCount: 2,
                intervalUnit: 'weeks',
                alignmentMode: 'calendar',
                quickIncrements: [
                  { label: '+$15', amount: 15 },
                  { label: '+$40', amount: 40 },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Career & Business',
    description: 'Deep work execution, high-leverage project delivery, and professional growth.',
    icon: 'Briefcase',
    color: 'indigo',
    weight: 1.3,
    sampleGoals: [
      {
        title: 'Sustain High-Leverage Deep Work Output',
        description: 'Protect uninterrupted focus blocks and ship key architectural milestones.',
        successCriteria: 'Complete 25+ hours of distraction-free deep work every week.',
        groups: [
          {
            name: 'Focus & Execution',
            kpis: [
              {
                name: 'Deep Work Hours',
                description: 'Uninterrupted 90-minute focus blocks on core deliverables.',
                unit: 'hours',
                targetValue: 20,
                targetDirection: 'at_least',
                kpiType: 'leading',
                aggregationMethod: 'sum',
                intervalCount: 1,
                intervalUnit: 'weeks',
                alignmentMode: 'calendar',
                quickIncrements: [
                  { label: '+1.5 hrs', amount: 1.5 },
                  { label: '+3 hrs', amount: 3 },
                ],
              },
              {
                name: 'Key Milestones Shipped',
                description: 'Completed production releases, features, or strategic deliverables.',
                unit: 'milestones',
                targetValue: 3,
                targetDirection: 'at_least',
                kpiType: 'lagging',
                aggregationMethod: 'sum',
                intervalCount: 3,
                intervalUnit: 'weeks',
                alignmentMode: 'calendar',
                quickIncrements: [{ label: '+1 Milestone', amount: 1 }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Learning & Intellectual Growth',
    description: 'Technical mastery, deliberate study, book reading, and synthesis notes.',
    icon: 'BookOpen',
    color: 'amber',
    weight: 1.0,
    sampleGoals: [
      {
        title: 'Deepen Technical & Analytical Mastery',
        description: 'Read foundational books and maintain consistent deliberate study sessions.',
        successCriteria: 'Complete 6 reading sessions every 10 days and finish 2 books per quarter.',
        groups: [
          {
            name: 'Deliberate Study',
            kpis: [
              {
                name: 'Reading & Synthesis Sessions',
                description: '45-minute focused reading sessions with written evergreen notes.',
                unit: 'sessions',
                targetValue: 6,
                targetDirection: 'at_least',
                kpiType: 'leading',
                aggregationMethod: 'sum',
                intervalCount: 10,
                intervalUnit: 'days',
                alignmentMode: 'custom_anchor',
                quickIncrements: [{ label: '+1 Session', amount: 1 }],
              },
              {
                name: 'Books Completed',
                description: 'Non-fiction or technical books read cover-to-cover.',
                unit: 'books',
                targetValue: 2,
                targetDirection: 'at_least',
                kpiType: 'lagging',
                aggregationMethod: 'sum',
                intervalCount: 3,
                intervalUnit: 'months',
                alignmentMode: 'calendar',
                quickIncrements: [{ label: '+1 Book', amount: 1 }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Relationships & Family',
    description: 'Intentional connection with partner, family, and close friendships.',
    icon: 'Users',
    color: 'rose',
    weight: 1.2,
    sampleGoals: [
      {
        title: 'Cultivate Intentional Presence with Loved Ones',
        description: 'Prioritize device-free quality time and regular check-ins with family and close friends.',
        successCriteria: 'Dedicated weekly quality outings and biweekly family calls.',
        groups: [
          {
            name: 'Connection Habits',
            kpis: [
              {
                name: 'Quality Unplugged Outings',
                description: 'Device-free dinners, walks, or shared activities.',
                unit: 'outings',
                targetValue: 2,
                targetDirection: 'at_least',
                kpiType: 'leading',
                aggregationMethod: 'sum',
                intervalCount: 2,
                intervalUnit: 'weeks',
                alignmentMode: 'calendar',
                quickIncrements: [{ label: '+1 Outing', amount: 1 }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Mind & Spirituality',
    description: 'Mindfulness, mental clarity, journaling, and stress regulation.',
    icon: 'Sparkles',
    color: 'violet',
    weight: 1.0,
    sampleGoals: [
      {
        title: 'Maintain Mental Clarity & Emotional Equanimity',
        description: 'Practice daily mindfulness and regular reflective journaling.',
        successCriteria: 'Consistent meditation minutes and low perceived stress.',
        groups: [
          {
            name: 'Mindfulness Practice',
            kpis: [
              {
                name: 'Meditation Minutes',
                description: 'Silent breathwork or mindfulness meditation.',
                unit: 'minutes',
                targetValue: 90,
                targetDirection: 'at_least',
                kpiType: 'leading',
                aggregationMethod: 'sum',
                intervalCount: 1,
                intervalUnit: 'weeks',
                alignmentMode: 'calendar',
                quickIncrements: [
                  { label: '+15 min', amount: 15 },
                  { label: '+20 min', amount: 20 },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export interface KpiQuickPreset {
  name: string;
  description: string;
  unit: string;
  targetValue: number;
  targetMax?: number;
  targetDirection: Kpi['targetDirection'];
  kpiType: Kpi['kpiType'];
  aggregationMethod: Kpi['aggregationMethod'];
  intervalCount: number;
  intervalUnit: Kpi['interval']['intervalUnit'];
  alignmentMode: Kpi['interval']['alignmentMode'];
  quickIncrements?: QuickIncrement[];
}

export const KPI_QUICK_PRESETS: KpiQuickPreset[] = [
  {
    name: 'Gym Sessions',
    description: 'Strength and resistance training sessions',
    unit: 'sessions',
    targetValue: 6,
    targetDirection: 'at_least',
    kpiType: 'leading',
    aggregationMethod: 'sum',
    intervalCount: 3,
    intervalUnit: 'weeks',
    alignmentMode: 'calendar',
    quickIncrements: [{ label: '+1 Session', amount: 1 }],
  },
  {
    name: 'Cardio Hours',
    description: 'Aerobic conditioning and endurance training',
    unit: 'hours',
    targetValue: 4,
    targetDirection: 'at_least',
    kpiType: 'leading',
    aggregationMethod: 'sum',
    intervalCount: 2,
    intervalUnit: 'weeks',
    alignmentMode: 'calendar',
    quickIncrements: [
      { label: '+0.5 hr', amount: 0.5 },
      { label: '+1 hr', amount: 1 },
    ],
  },
  {
    name: 'Body Weight',
    description: 'Morning scale weight within target range',
    unit: 'kg',
    targetValue: 72,
    targetMax: 75,
    targetDirection: 'within_range',
    kpiType: 'lagging',
    aggregationMethod: 'latest',
    intervalCount: 2,
    intervalUnit: 'weeks',
    alignmentMode: 'calendar',
  },
  {
    name: 'Resting Heart Rate',
    description: 'Morning resting heart rate measurement',
    unit: 'bpm',
    targetValue: 58,
    targetDirection: 'at_most',
    kpiType: 'lagging',
    aggregationMethod: 'average',
    intervalCount: 1,
    intervalUnit: 'months',
    alignmentMode: 'calendar',
  },
  {
    name: 'Deep Work Hours',
    description: 'Distraction-free high-leverage focus hours',
    unit: 'hours',
    targetValue: 20,
    targetDirection: 'at_least',
    kpiType: 'leading',
    aggregationMethod: 'sum',
    intervalCount: 1,
    intervalUnit: 'weeks',
    alignmentMode: 'calendar',
    quickIncrements: [
      { label: '+1 hr', amount: 1 },
      { label: '+2 hrs', amount: 2 },
    ],
  },
  {
    name: 'Reading Sessions',
    description: 'Focused study or reading sessions',
    unit: 'sessions',
    targetValue: 5,
    targetDirection: 'at_least',
    kpiType: 'leading',
    aggregationMethod: 'sum',
    intervalCount: 10,
    intervalUnit: 'days',
    alignmentMode: 'custom_anchor',
    quickIncrements: [{ label: '+1 Session', amount: 1 }],
  },
  {
    name: 'Savings Contributions',
    description: 'Direct transfers to savings or investments',
    unit: 'USD',
    targetValue: 1000,
    targetDirection: 'at_least',
    kpiType: 'leading',
    aggregationMethod: 'sum',
    intervalCount: 1,
    intervalUnit: 'months',
    alignmentMode: 'calendar',
    quickIncrements: [
      { label: '+$100', amount: 100 },
      { label: '+$500', amount: 500 },
    ],
  },
];

/**
 * Generates initial structure from selected area templates WITHOUT creating fake historical tracking logs
 * (honoring section 16: "Do not create fake historical tracking data").
 */
export function buildStarterHierarchyFromTemplates(
  selectedAreaNames: string[],
  includeSampleGoalsAndKpis: boolean
): {
  lifeAreas: LifeArea[];
  goals: Goal[];
  kpiGroups: KpiGroup[];
  kpis: Kpi[];
} {
  const today = getTodayDateString();
  const targetSixMonths = addMonths(today, 6);
  const nowIso = new Date().toISOString();

  const lifeAreas: LifeArea[] = [];
  const goals: Goal[] = [];
  const kpiGroups: KpiGroup[] = [];
  const kpis: Kpi[] = [];

  const chosenTemplates = DEFAULT_AREA_TEMPLATES.filter((t) =>
    selectedAreaNames.includes(t.name)
  );

  chosenTemplates.forEach((tpl, areaIdx) => {
    const areaId = `area_${ areaIdx + 1 }_${Date.now().toString(36)}`;
    lifeAreas.push({
      id: areaId,
      name: tpl.name,
      description: tpl.description,
      icon: tpl.icon,
      color: tpl.color,
      weight: tpl.weight,
      order: areaIdx,
      archived: false,
      createdAt: nowIso,
    });

    if (includeSampleGoalsAndKpis) {
      tpl.sampleGoals.forEach((gTpl, gIdx) => {
        const goalId = `goal_${areaIdx + 1}_${gIdx + 1}_${Date.now().toString(36)}`;
        goals.push({
          id: goalId,
          lifeAreaId: areaId,
          title: gTpl.title,
          description: gTpl.description,
          startDate: today,
          targetDate: targetSixMonths,
          status: 'active',
          priority: 'high',
          successCriteria: gTpl.successCriteria,
          weight: 1.0,
          order: gIdx,
          createdAt: nowIso,
        });

        gTpl.groups.forEach((grpTpl, grpIdx) => {
          const groupId = `group_${areaIdx + 1}_${gIdx + 1}_${grpIdx + 1}_${Date.now().toString(36)}`;
          kpiGroups.push({
            id: groupId,
            goalId,
            name: grpTpl.name,
            weight: 1.0,
            order: grpIdx,
            collapsed: false,
            createdAt: nowIso,
          });

          grpTpl.kpis.forEach((kpiTpl, kpiIdx) => {
            const kpiId = `kpi_${areaIdx + 1}_${gIdx + 1}_${grpIdx + 1}_${kpiIdx + 1}_${Date.now().toString(36)}`;
            kpis.push({
              id: kpiId,
              kpiGroupId: groupId,
              name: kpiTpl.name,
              description: kpiTpl.description,
              unit: kpiTpl.unit,
              targetValue: kpiTpl.targetValue,
              targetMax: kpiTpl.targetMax,
              targetDirection: kpiTpl.targetDirection,
              kpiType: kpiTpl.kpiType,
              aggregationMethod: kpiTpl.aggregationMethod,
              interval: {
                intervalCount: kpiTpl.intervalCount,
                intervalUnit: kpiTpl.intervalUnit,
                alignmentMode: kpiTpl.alignmentMode,
                anchorDate: today,
                weekStartsOn: 1,
              },
              startDate: today,
              status: 'active',
              weight: 1.0,
              order: kpiIdx,
              quickIncrements: kpiTpl.quickIncrements,
              createdAt: nowIso,
            });
          });
        });
      });
    }
  });

  return { lifeAreas, goals, kpiGroups, kpis };
}
