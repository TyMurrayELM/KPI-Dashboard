// src/components/KPIDashboard/data/kpiPeriodConfigs.js

const STANDARD_QUARTERS = [
  { id: 'Q1', period: 'Jan – Mar', payDate: 'Apr 30' },
  { id: 'Q2', period: 'Apr – Jun', payDate: 'Jul 31' },
  { id: 'Q3', period: 'Jul – Sep', payDate: 'Oct 30' },
  { id: 'Q4', period: 'Oct – Dec', payDate: 'Jan 29' },
];

const DEFAULTS = {
  unit: '%',
  stepSize: 1,
  targetType: 'rate',           // same target each quarter
  bonusSplit: { quarterly: 0.5, annual: 0.5 },
  annualPayDate: 'Feb 28',
};

// Overrides keyed by DB kpi.name
const KPI_OVERRIDES = {
  'LV Maintenance Growth': {
    targetType: 'cumulative',
    stepSize: 0.5,
  },
  'Net Maintenance Growth': {
    targetType: 'rate',
    stepSize: 0.5,
    quarterlyTarget: 4,  // quarterly target differs from annual (16%)
  },
  'Extra Services Revenue': {
    unit: '%',
    stepSize: 1,
    targetType: 'rate',
  },
  'Direct Labor Maintenance %': {
    unit: '%',
    stepSize: 1,
    targetType: 'rate',
  },
  'Net Controllable Income Goal': {
    unit: '%',
    stepSize: 1,
    targetType: 'rate',
  },
  'Client Retention %': {
    unit: '%',
    stepSize: 0.5,
    targetType: 'rate',
    quarterlyTargets: [97.5, 95, 92.5, 90],  // Q1–Q4 cascading thresholds
  },
  // Gross Margin, Client Retention, etc. — defaults work fine
};

/**
 * Get the full period config for a KPI by name.
 * Merges DEFAULTS + any KPI_OVERRIDES + STANDARD_QUARTERS.
 */
export const getKpiPeriodConfig = (kpiName) => {
  const overrides = KPI_OVERRIDES[kpiName] || {};
  return {
    ...DEFAULTS,
    ...overrides,
    quarters: STANDARD_QUARTERS,
  };
};
