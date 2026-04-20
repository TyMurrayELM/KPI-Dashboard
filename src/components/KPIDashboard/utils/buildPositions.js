// src/components/KPIDashboard/utils/buildPositions.js
//
// Pure transformation from raw DB reads into `positions` shape used by
// the dashboard AND the admin incentive summary. Mirrors the hardcoded
// role-specific KPI injections currently in KPIDashboard.backup.jsx so
// admin-side aggregation stays in sync with what users see on screen.

import { getKpiPeriodConfig } from '../data/kpiPeriodConfigs';
import { getQuarterFloorForKPI } from './kpiHelpers';

const makeKpiBuilder = (defaultWeight) => (name, description, target, scope, overrides = {}) => {
  const config = getKpiPeriodConfig(name);
  const qTarget = config.quarterlyTarget != null
    ? config.quarterlyTarget
    : config.targetType === 'rate' ? target : target / 4;
  const quarters = config.quarters.map((q, qi) => {
    const t = config.quarterlyTargets ? config.quarterlyTargets[qi] : qTarget;
    return { id: q.id, period: q.period, payDate: q.payDate, target: t, actual: t };
  });
  return {
    name, description, target, actual: target,
    weight: defaultWeight, isInverse: false, scope,
    successFactors: [], successGuide: '',
    hasPeriods: true, unit: config.unit, stepSize: config.stepSize,
    targetType: config.targetType, bonusSplit: config.bonusSplit,
    annualPayDate: config.annualPayDate, quarters,
    annual: { target, actual: target },
    ...overrides,
  };
};

export const buildPositions = ({
  rolesData,
  formulasData,
  userActualsByKpi = {},
  cssUserOptions = [],
  userContext = {},
}) => {
  const {
    isAdmin = false,
    userEmail = null,
    userSalary = null,
    userBranch = null,
  } = userContext;

  const transformedPositions = {};
  const formulaMap = {};

  const visibleRoles = (rolesData || []).filter(role => role.is_visible !== false);

  visibleRoles.forEach(role => {
    const kpis = (role.role_kpis || [])
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map(rk => {
        const config = getKpiPeriodConfig(rk.kpi.name);
        const annualTarget = rk.target_value;
        const qTarget = config.quarterlyTarget != null
          ? config.quarterlyTarget
          : config.targetType === 'rate' ? annualTarget : annualTarget / 4;
        const quarters = config.quarters.map((q, qi) => ({
          id: q.id,
          period: q.period,
          payDate: q.payDate,
          target: config.quarterlyTargets ? config.quarterlyTargets[qi] : qTarget,
          actual: config.quarterlyTargets ? config.quarterlyTargets[qi] : qTarget,
        }));

        return {
          name: rk.kpi.name,
          description: rk.kpi.description,
          target: annualTarget,
          actual: annualTarget,
          weight: rk.weight,
          isInverse: rk.kpi.is_inverse,
          scope: rk.scope || 'individual',
          successFactors: rk.kpi.success_factors || [],
          successGuide: rk.kpi.success_guide || '',
          hasPeriods: true,
          unit: config.unit,
          stepSize: config.stepSize,
          targetType: config.targetType,
          bonusSplit: config.bonusSplit,
          annualPayDate: config.annualPayDate,
          quarters,
          annual: { target: annualTarget, actual: annualTarget },
        };
      });

    transformedPositions[role.key] = {
      title: role.name,
      salary: role.base_salary,
      bonusPercentage: role.bonus_percentage,
      color: role.color || '#dbeafe',
      kpis,
    };

    (formulasData || [])
      .filter(f => f.role_id === role.id)
      .forEach(formula => {
        const kpi = (role.role_kpis || []).find(rk => rk.kpi_id === formula.kpi_id);
        if (kpi) formulaMap[`${role.key}-${kpi.kpi.name}`] = formula.formula_config;
      });
  });

  const findKey = (title) =>
    Object.keys(transformedPositions).find(k => transformedPositions[k].title === title);

  // --- Arbor Manager ---
  const arborKey = findKey('Arbor Manager');
  if (arborKey) {
    const build = makeKpiBuilder(25);
    transformedPositions[arborKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 5.2 };
        k.annual = { ...k.annual, actual: 5.2 };
        return { ...k, weight: 34, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 88 };
        k.annual = { ...k.annual, actual: 88 };
        return { ...k, formulaKey: 'Extra Services Revenue (Arbor)', weight: 33, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Net Controllable Income Goal',
          'Percentage of Arbor Net Controllable Income goal achieved. Annual target for Phoenix Arbor is $3.5M.',
          100, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 47 };
        return { ...k, dollarTarget: 3500000, weight: 33, lockedQuarters: ['Q1'] };
      })(),
    ];
  }

  // --- Enhancement Manager ---
  const enhMgrKey = findKey('Enhancement Manager');
  if (enhMgrKey) {
    const build = makeKpiBuilder(25);
    transformedPositions[enhMgrKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 5.2 };
        k.annual = { ...k.annual, actual: 5.2 };
        return { ...k, weight: 34, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 88 };
        k.annual = { ...k.annual, actual: 88 };
        return { ...k, formulaKey: 'Extra Services Revenue (Arbor)', weight: 33, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Net Controllable Income Goal',
          'Percentage of Enhancements Net Controllable Income goal achieved. Annual target for Phoenix Enhancements is $2.15M.',
          100, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 47 };
        return { ...k, dollarTarget: 2150000, weight: 33, lockedQuarters: ['Q1'] };
      })(),
    ];
  }

  // --- Spray Manager ---
  const sprayKey = findKey('Spray Manager');
  if (sprayKey) {
    const build = makeKpiBuilder(25);
    transformedPositions[sprayKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 5.2 };
        k.annual = { ...k.annual, actual: 5.2 };
        return { ...k, weight: 34, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 88 };
        k.annual = { ...k.annual, actual: 88 };
        return { ...k, formulaKey: 'Extra Services Revenue (Spray)', weight: 33, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Net Controllable Income Goal',
          'Percentage of Spray Net Controllable Income goal achieved. Annual target for Phoenix Spray is $940K. In-contract spray revenue captured at $105/hr based on actual hours spent on in-contract jobs.',
          100, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 59 };
        return { ...k, dollarTarget: 940000, weight: 33, lockedQuarters: ['Q1'] };
      })(),
    ];
  }

  // --- Senior Manager of Maintenance Operations ---
  const maintOpsKey = findKey('Senior Manager of Maintenance Operations');
  if (maintOpsKey) {
    const build = makeKpiBuilder(25);
    transformedPositions[maintOpsKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 4.2 };
        k.annual = { ...k.annual, actual: 4.2 };
        return { ...k, weight: 25, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 88.3 };
        k.annual = { ...k.annual, actual: 88.3 };
        return { ...k, weight: 25, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Direct Labor Maintenance %', '', 40, 'region-phoenix', { isInverse: true });
        k.quarters[0] = { ...k.quarters[0], actual: 33 };
        return { ...k, weight: 25, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Net Controllable Income Goal',
          'Percentage of Enhancements Net Controllable Income goal achieved. Annual target for Phoenix Enhancements is $2.15M.',
          100, 'region-phoenix', { dollarTarget: 2150000 });
        const q1Actual = Math.round((407907 / (2150000 / 4)) * 100);
        k.quarters[0] = { ...k.quarters[0], actual: q1Actual };
        return { ...k, weight: 25, lockedQuarters: ['Q1'] };
      })(),
    ];
  }

  // --- Maintenance Operations Manager ---
  const maintOpsMgrKey = findKey('Maintenance Operations Manager');
  if (maintOpsMgrKey) {
    const build = makeKpiBuilder(33);
    const nmgBranch = {
      'Phoenix - North': -3.7,
      'Phoenix - SouthEast': -12.9,
      'Phoenix - SouthWest': 8.8,
    };
    const dlmBranch = {
      'Phoenix - North': 33.4,
      'Phoenix - SouthEast': 35.4,
      'Phoenix - SouthWest': 31,
    };
    transformedPositions[maintOpsMgrKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 4.2 };
        k.annual = { ...k.annual, actual: 4.2 };
        return { ...k, weight: 25, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'individual');
        if (userBranch && nmgBranch[userBranch] != null) {
          k.quarters[0] = { ...k.quarters[0], actual: nmgBranch[userBranch] };
        }
        return { ...k, weight: 25, lockedQuarters: ['Q1'], branchQ1Values: nmgBranch };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 88.3 };
        k.annual = { ...k.annual, actual: 88.3 };
        return { ...k, weight: 20, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Direct Labor Maintenance %', '', 40, 'individual', { isInverse: true });
        if (userBranch && dlmBranch[userBranch] != null) {
          k.quarters[0] = { ...k.quarters[0], actual: dlmBranch[userBranch] };
        }
        return { ...k, weight: 30, lockedQuarters: ['Q1'], branchQ1Values: dlmBranch };
      })(),
    ];
  }

  // --- Maintenance Quality Specialist ---
  const mqsKey = findKey('Maintenance Quality Specialist');
  if (mqsKey) {
    const build = makeKpiBuilder(33);
    const nmgBranch = {
      'Phoenix - North': -3.7,
      'Phoenix - SouthEast': -12.9,
      'Phoenix - SouthWest': 8.8,
    };
    const dlmBranch = {
      'Phoenix - North': 33.4,
      'Phoenix - SouthEast': 35.4,
      'Phoenix - SouthWest': 31,
    };
    transformedPositions[mqsKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 4.2 };
        k.annual = { ...k.annual, actual: 4.2 };
        return { ...k, weight: 25, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'individual');
        if (userBranch && nmgBranch[userBranch] != null) {
          k.quarters[0] = { ...k.quarters[0], actual: nmgBranch[userBranch] };
        }
        return { ...k, weight: 25, lockedQuarters: ['Q1'], branchQ1Values: nmgBranch };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 88.3 };
        k.annual = { ...k.annual, actual: 88.3 };
        return { ...k, weight: 20, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Direct Labor Maintenance %', '', 40, 'individual', { isInverse: true });
        if (userBranch && dlmBranch[userBranch] != null) {
          k.quarters[0] = { ...k.quarters[0], actual: dlmBranch[userBranch] };
        }
        return { ...k, weight: 30, lockedQuarters: ['Q1'], branchQ1Values: dlmBranch };
      })(),
    ];
  }

  // --- Maintenance Field Supervisor ---
  const mfsKey = findKey('Maintenance Field Supervisor');
  if (mfsKey) {
    const build = makeKpiBuilder(33);
    transformedPositions[mfsKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 4.2 };
        k.annual = { ...k.annual, actual: 4.2 };
        return { ...k, weight: 25, lockedQuarters: ['Q1'] };
      })(),
      { ...build('Net Maintenance Growth', '', 16, 'individual'), weight: 25 },
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 88.3 };
        k.annual = { ...k.annual, actual: 88.3 };
        return { ...k, weight: 20, lockedQuarters: ['Q1'] };
      })(),
      { ...build('Direct Labor Maintenance %', '', 40, 'individual', { isInverse: true }), weight: 30 },
    ];
  }

  // --- Client Success Manager ---
  const csmKey = findKey('Client Success Manager');
  if (csmKey) {
    const build = makeKpiBuilder(25);
    transformedPositions[csmKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 5.2 };
        k.annual = { ...k.annual, actual: 5.2 };
        return { ...k, weight: 25, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 4.2 };
        k.annual = { ...k.annual, actual: 4.2 };
        return { ...k, weight: 25, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 88 };
        k.annual = { ...k.annual, actual: 88 };
        return { ...k, weight: 25, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 88.3 };
        k.annual = { ...k.annual, actual: 88.3 };
        return { ...k, weight: 25, lockedQuarters: ['Q1'] };
      })(),
    ];
  }

  // --- Client Success Specialist (per-user Client Retention) ---
  const cssKey = findKey('Client Success Specialist');
  if (cssKey) {
    const build = makeKpiBuilder(33);
    transformedPositions[cssKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 4.2 };
        k.annual = { ...k.annual, actual: 4.2 };
        return { ...k, weight: 34, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Client Retention %', '', 100, 'individual');
        const perUserMap = userActualsByKpi['Client Retention %'] || {};
        const periodToQuarterIdx = { Q1: 0, Q2: 1, Q3: 2, Q4: 3 };
        if (!isAdmin && userEmail && perUserMap[userEmail]) {
          const v = perUserMap[userEmail];
          ['Q1','Q2','Q3','Q4'].forEach(p => {
            if (v[p]?.actual != null) {
              const i = periodToQuarterIdx[p];
              k.quarters[i] = { ...k.quarters[i], actual: v[p].actual };
            }
          });
          if (v.Annual?.actual != null) k.annual = { ...k.annual, actual: v.Annual.actual };
        }
        return {
          ...k, weight: 33, lockedQuarters: ['Q1'],
          userValues: perUserMap, userOptions: cssUserOptions,
        };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 88.3 };
        k.annual = { ...k.annual, actual: 88.3 };
        return { ...k, weight: 33, lockedQuarters: ['Q1'] };
      })(),
    ];
  }

  // --- Arbor Sales Specialist ---
  const salesSpecKey = findKey('Arbor Sales Specialist');
  if (salesSpecKey) {
    const build = makeKpiBuilder(50);
    transformedPositions[salesSpecKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 4.2 };
        k.annual = { ...k.annual, actual: 4.2 };
        return { ...k, weight: 34, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 88.3 };
        k.annual = { ...k.annual, actual: 88.3 };
        return { ...k, weight: 33, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Arbor Team Sales Goal', '', 100, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 100 };
        k.annual = { ...k.annual, actual: 100 };
        return { ...k, weight: 33, lockedQuarters: ['Q1'] };
      })(),
    ];
  }

  // --- Enhancement Sales Specialist ---
  const enhSalesSpecKey = findKey('Enhancement Sales Specialist');
  if (enhSalesSpecKey) {
    const build = makeKpiBuilder(50);
    transformedPositions[enhSalesSpecKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 4.2 };
        k.annual = { ...k.annual, actual: 4.2 };
        return { ...k, weight: 34, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 88.3 };
        k.annual = { ...k.annual, actual: 88.3 };
        return { ...k, weight: 33, lockedQuarters: ['Q1'] };
      })(),
      (() => {
        const k = build('Enhancement Team Sales Goal', '', 100, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 136 };
        k.annual = { ...k.annual, actual: 136 };
        return { ...k, weight: 33, lockedQuarters: ['Q1'] };
      })(),
    ];
  }

  // Override salary with user's personal salary (non-admin or admin-viewing-user)
  if (userSalary != null) {
    Object.keys(transformedPositions).forEach(key => {
      transformedPositions[key].salary = userSalary;
    });
  }

  return { transformedPositions, formulaMap };
};
