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
    userRegion = null,
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

  // Region scoping shared by specialist roles: allowed_users.region ===
  // 'Las Vegas' -> LV-scoped region KPIs; everyone else gets Phoenix.
  // Actuals stay per-role (roles legitimately differ, e.g. CSS Phoenix ESR
  // Q1 78 vs Sales Specialist 88.3) — only the scope test is shared.
  // A null actual leaves the quarter at target (unlocked).
  const isLasVegas = userRegion === 'Las Vegas';
  const regionScope = isLasVegas ? 'region-lasvegas' : 'region-phoenix';
  const applyActuals = (k, a) => {
    if (!a) return k;
    if (a.q1 != null) k.quarters[0] = { ...k.quarters[0], actual: a.q1 };
    if (a.q2 != null) k.quarters[1] = { ...k.quarters[1], actual: a.q2 };
    if (a.q3 != null) k.quarters[2] = { ...k.quarters[2], actual: a.q3 };
    if (a.q4 != null) k.quarters[3] = { ...k.quarters[3], actual: a.q4 };
    if (a.ytd != null) k.annual = { ...k.annual, actual: a.ytd };
    return k;
  };

  // --- Arbor Manager ---
  const arborKey = findKey('Arbor Manager');
  if (arborKey) {
    const build = makeKpiBuilder(25);
    transformedPositions[arborKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 5.6 };
        k.quarters[1] = { ...k.quarters[1], actual: 0.8 };
        k.annual = { ...k.annual, actual: 7.4 };
        return { ...k, weight: 34, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 81 };
        k.quarters[1] = { ...k.quarters[1], actual: 125.5 };
        k.annual = { ...k.annual, actual: 103.2 };
        return { ...k, formulaKey: 'Extra Services Revenue (Arbor)', weight: 33, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Net Controllable Income Goal',
          'Percentage of Arbor Net Controllable Income goal achieved. Annual target for Phoenix Arbor is $3.5M.',
          100, 'region-phoenix');
        const q1Actual = Math.round((407373 / (3500000 / 4)) * 100);
        k.quarters[0] = { ...k.quarters[0], actual: q1Actual };
        const q2Actual = Math.round((656568 / (3500000 / 4)) * 100);
        k.quarters[1] = { ...k.quarters[1], actual: q2Actual };
        return { ...k, dollarTarget: 3500000, weight: 33, lockedQuarters: ['Q1', 'Q2'] };
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
        k.quarters[0] = { ...k.quarters[0], actual: 5.6 };
        k.quarters[1] = { ...k.quarters[1], actual: 0.8 };
        k.annual = { ...k.annual, actual: 7.4 };
        return { ...k, weight: 34, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 81 };
        k.quarters[1] = { ...k.quarters[1], actual: 125.5 };
        k.annual = { ...k.annual, actual: 103.2 };
        return { ...k, formulaKey: 'Extra Services Revenue (Arbor)', weight: 33, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Net Controllable Income Goal',
          'Percentage of Enhancements Net Controllable Income goal achieved. Annual target for Phoenix Enhancements is $2.15M.',
          100, 'region-phoenix');
        const q1Actual = Math.round((399787 / (2150000 / 4)) * 100);
        k.quarters[0] = { ...k.quarters[0], actual: q1Actual };
        const q2Actual = Math.round((408936 / (2150000 / 4)) * 100);
        k.quarters[1] = { ...k.quarters[1], actual: q2Actual };
        return { ...k, dollarTarget: 2150000, weight: 33, lockedQuarters: ['Q1', 'Q2'] };
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
        k.quarters[0] = { ...k.quarters[0], actual: 5.6 };
        k.quarters[1] = { ...k.quarters[1], actual: 0.8 };
        k.annual = { ...k.annual, actual: 7.4 };
        return { ...k, weight: 34, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 81 };
        k.quarters[1] = { ...k.quarters[1], actual: 125.5 };
        k.annual = { ...k.annual, actual: 103.2 };
        return { ...k, formulaKey: 'Extra Services Revenue (Spray)', weight: 33, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Net Controllable Income Goal',
          'Percentage of Spray Net Controllable Income goal achieved. Annual target for Phoenix Spray is $650K. In-contract spray revenue captured at $105/hr based on actual hours spent on in-contract jobs.',
          100, 'region-phoenix');
        const qtrGoal = 650000 / 4;
        const inContractRate = 105;
        // In-contract spray hours are billed under another department; their
        // revenue (hrs × $105) is added back to the quarterly NCI here.
        const inContractHours = { Q1: 318.3, Q2: 497.7 };
        const baseNci = { Q1: 137811, Q2: 156168 };
        const fmt = (n) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
        const quarterNotes = {};
        const totalNci = {};
        ['Q1', 'Q2'].forEach((qId, i) => {
          const inContract = (inContractHours[qId] || 0) * inContractRate;
          totalNci[qId] = baseNci[qId] + inContract;
          k.quarters[i] = { ...k.quarters[i], actual: Math.round((totalNci[qId] / qtrGoal) * 100) };
          if (inContractHours[qId] != null) {
            quarterNotes[qId] = `Includes in-contract spray: ${inContractHours[qId]} hrs × $${inContractRate}/hr = ${fmt(inContract)} (NCI ${fmt(baseNci[qId])} + in-contract = ${fmt(totalNci[qId])})`;
          }
        });
        k.annual = { ...k.annual, actual: Math.round(((totalNci.Q1 + totalNci.Q2) / (2 * qtrGoal)) * 100) };
        return { ...k, dollarTarget: 650000, weight: 33, lockedQuarters: ['Q1', 'Q2'], quarterNotes };
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
        k.quarters[0] = { ...k.quarters[0], actual: 4.6 };
        k.quarters[1] = { ...k.quarters[1], actual: -1.2 };
        k.annual = { ...k.annual, actual: 4.6 };
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 88.3 };
        k.quarters[1] = { ...k.quarters[1], actual: 120.8 };
        k.annual = { ...k.annual, actual: 99.4 };
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Direct Labor Maintenance %', '', 40, 'region-phoenix', { isInverse: true });
        k.quarters[0] = { ...k.quarters[0], actual: 33 };
        k.quarters[1] = { ...k.quarters[1], actual: 37.1 };
        k.annual = { ...k.annual, actual: 35.1 };
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Net Controllable Income Goal',
          'Percentage of Enhancements Net Controllable Income goal achieved. Annual target for Phoenix Enhancements is $2.15M.',
          100, 'region-phoenix', { dollarTarget: 2150000 });
        const q1Actual = Math.round((399787 / (2150000 / 4)) * 100);
        k.quarters[0] = { ...k.quarters[0], actual: q1Actual };
        const q2Actual = Math.round((408936 / (2150000 / 4)) * 100);
        k.quarters[1] = { ...k.quarters[1], actual: q2Actual };
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'] };
      })(),
    ];
  }

  // --- Maintenance Operations Manager ---
  const maintOpsMgrKey = findKey('Maintenance Operations Manager');
  if (maintOpsMgrKey) {
    const build = makeKpiBuilder(33);
    // LV region == its single branch: LV users read the 'Las Vegas'
    // branch values even if their branch field is not set yet.
    const effBranch = isLasVegas ? 'Las Vegas' : userBranch;
    const nmgBranch = {
      'Phoenix - North': 8.1,
      'Phoenix - SouthEast': 0.9,
      'Phoenix - SouthWest': 4.2,
      'Las Vegas': 10,
    };
    const nmgBranchQ2 = {
      'Phoenix - North': -1.3,
      'Phoenix - SouthEast': 1.2,
      'Phoenix - SouthWest': -3,
      'Las Vegas': 6.9,
    };
    const nmgBranchAnnual = {
      'Phoenix - North': 7.4,
      'Phoenix - SouthEast': 5.2,
      'Phoenix - SouthWest': 2.2,
      'Las Vegas': 10.2,
    };
    const dlmBranch = {
      'Phoenix - North': 33.9,
      'Phoenix - SouthEast': 36,
      'Phoenix - SouthWest': 31.8,
      'Las Vegas': 35.5,
    };
    const dlmBranchQ2 = {
      'Phoenix - North': 40.4,
      'Phoenix - SouthEast': 37.9,
      'Phoenix - SouthWest': 35.6,
      'Las Vegas': 40.4,
    };
    const dlmBranchAnnual = {
      'Phoenix - North': 37.4,
      'Phoenix - SouthEast': 36.3,
      'Phoenix - SouthWest': 33.4,
      'Las Vegas': 40.4,
    };
    transformedPositions[maintOpsMgrKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, userRegion === 'Las Vegas' ? 'region-lasvegas' : 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: userRegion === 'Las Vegas' ? 10 : 4.6 };
        k.quarters[1] = { ...k.quarters[1], actual: userRegion === 'Las Vegas' ? 6.9 : -1.2 };
        k.annual = { ...k.annual, actual: userRegion === 'Las Vegas' ? 10.2 : 4.6 };
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Net Maintenance Growth', '', 16, isLasVegas ? 'region-lasvegas' : 'individual');
        if (effBranch && nmgBranch[effBranch] != null) {
          k.quarters[0] = { ...k.quarters[0], actual: nmgBranch[effBranch] };
        }
        if (effBranch && nmgBranchQ2[effBranch] != null) {
          k.quarters[1] = { ...k.quarters[1], actual: nmgBranchQ2[effBranch] };
        }
        if (effBranch && nmgBranchAnnual[effBranch] != null) {
          k.annual = { ...k.annual, actual: nmgBranchAnnual[effBranch] };
        }
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'], branchQ1Values: nmgBranch, branchQ2Values: nmgBranchQ2, branchAnnualValues: nmgBranchAnnual };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, userRegion === 'Las Vegas' ? 'region-lasvegas' : 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: userRegion === 'Las Vegas' ? 90.4 : 88.3 };
        k.quarters[1] = { ...k.quarters[1], actual: userRegion === 'Las Vegas' ? 139.7 : 120.8 };
        k.annual = { ...k.annual, actual: userRegion === 'Las Vegas' ? 114.9 : 99.4 };
        return { ...k, weight: 20, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Direct Labor Maintenance %', '', 40, isLasVegas ? 'region-lasvegas' : 'individual', { isInverse: true });
        if (effBranch && dlmBranch[effBranch] != null) {
          k.quarters[0] = { ...k.quarters[0], actual: dlmBranch[effBranch] };
        }
        if (effBranch && dlmBranchQ2[effBranch] != null) {
          k.quarters[1] = { ...k.quarters[1], actual: dlmBranchQ2[effBranch] };
        }
        if (effBranch && dlmBranchAnnual[effBranch] != null) {
          k.annual = { ...k.annual, actual: dlmBranchAnnual[effBranch] };
        }
        return { ...k, weight: 30, lockedQuarters: ['Q1', 'Q2'], branchQ1Values: dlmBranch, branchQ2Values: dlmBranchQ2, branchAnnualValues: dlmBranchAnnual };
      })(),
    ];
  }

  // --- Maintenance Quality Specialist ---
  const mqsKey = findKey('Maintenance Quality Specialist');
  if (mqsKey) {
    const build = makeKpiBuilder(33);
    // LV region == its single branch: LV users read the 'Las Vegas'
    // branch values even if their branch field is not set yet.
    const effBranch = isLasVegas ? 'Las Vegas' : userBranch;
    const nmgBranch = {
      'Phoenix - North': 8.1,
      'Phoenix - SouthEast': 0.9,
      'Phoenix - SouthWest': 4.2,
      'Las Vegas': 10,
    };
    const nmgBranchQ2 = {
      'Phoenix - North': -1.3,
      'Phoenix - SouthEast': 1.2,
      'Phoenix - SouthWest': -3,
      'Las Vegas': 6.9,
    };
    const nmgBranchAnnual = {
      'Phoenix - North': 7.4,
      'Phoenix - SouthEast': 5.2,
      'Phoenix - SouthWest': 2.2,
      'Las Vegas': 10.2,
    };
    const dlmBranch = {
      'Phoenix - North': 33.9,
      'Phoenix - SouthEast': 36,
      'Phoenix - SouthWest': 31.8,
      'Las Vegas': 35.5,
    };
    const dlmBranchQ2 = {
      'Phoenix - North': 40.4,
      'Phoenix - SouthEast': 37.9,
      'Phoenix - SouthWest': 35.6,
      'Las Vegas': 40.4,
    };
    const dlmBranchAnnual = {
      'Phoenix - North': 37.4,
      'Phoenix - SouthEast': 36.3,
      'Phoenix - SouthWest': 33.4,
      'Las Vegas': 40.4,
    };
    transformedPositions[mqsKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, userRegion === 'Las Vegas' ? 'region-lasvegas' : 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: userRegion === 'Las Vegas' ? 10 : 4.6 };
        k.quarters[1] = { ...k.quarters[1], actual: userRegion === 'Las Vegas' ? 6.9 : -1.2 };
        k.annual = { ...k.annual, actual: userRegion === 'Las Vegas' ? 10.2 : 4.6 };
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Net Maintenance Growth', '', 16, isLasVegas ? 'region-lasvegas' : 'individual');
        if (effBranch && nmgBranch[effBranch] != null) {
          k.quarters[0] = { ...k.quarters[0], actual: nmgBranch[effBranch] };
        }
        if (effBranch && nmgBranchQ2[effBranch] != null) {
          k.quarters[1] = { ...k.quarters[1], actual: nmgBranchQ2[effBranch] };
        }
        if (effBranch && nmgBranchAnnual[effBranch] != null) {
          k.annual = { ...k.annual, actual: nmgBranchAnnual[effBranch] };
        }
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'], branchQ1Values: nmgBranch, branchQ2Values: nmgBranchQ2, branchAnnualValues: nmgBranchAnnual };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, userRegion === 'Las Vegas' ? 'region-lasvegas' : 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: userRegion === 'Las Vegas' ? 90.4 : 88.3 };
        k.quarters[1] = { ...k.quarters[1], actual: userRegion === 'Las Vegas' ? 139.7 : 120.8 };
        k.annual = { ...k.annual, actual: userRegion === 'Las Vegas' ? 114.9 : 99.4 };
        return { ...k, weight: 20, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Direct Labor Maintenance %', '', 40, isLasVegas ? 'region-lasvegas' : 'individual', { isInverse: true });
        if (effBranch && dlmBranch[effBranch] != null) {
          k.quarters[0] = { ...k.quarters[0], actual: dlmBranch[effBranch] };
        }
        if (effBranch && dlmBranchQ2[effBranch] != null) {
          k.quarters[1] = { ...k.quarters[1], actual: dlmBranchQ2[effBranch] };
        }
        if (effBranch && dlmBranchAnnual[effBranch] != null) {
          k.annual = { ...k.annual, actual: dlmBranchAnnual[effBranch] };
        }
        return { ...k, weight: 30, lockedQuarters: ['Q1', 'Q2'], branchQ1Values: dlmBranch, branchQ2Values: dlmBranchQ2, branchAnnualValues: dlmBranchAnnual };
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
        k.quarters[0] = { ...k.quarters[0], actual: 4.6 };
        k.quarters[1] = { ...k.quarters[1], actual: -1.2 };
        k.annual = { ...k.annual, actual: 4.6 };
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      { ...build('Net Maintenance Growth', '', 16, 'individual'), weight: 25 },
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 88.3 };
        k.quarters[1] = { ...k.quarters[1], actual: 120.8 };
        k.annual = { ...k.annual, actual: 99.4 };
        return { ...k, weight: 20, lockedQuarters: ['Q1', 'Q2'] };
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
        k.quarters[0] = { ...k.quarters[0], actual: 5.6 };
        k.quarters[1] = { ...k.quarters[1], actual: 0.8 };
        k.annual = { ...k.annual, actual: 7.4 };
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 4.6 };
        k.quarters[1] = { ...k.quarters[1], actual: -1.2 };
        k.annual = { ...k.annual, actual: 4.6 };
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 81 };
        k.quarters[1] = { ...k.quarters[1], actual: 125.5 };
        k.annual = { ...k.annual, actual: 103.2 };
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 88.3 };
        k.quarters[1] = { ...k.quarters[1], actual: 120.8 };
        k.annual = { ...k.annual, actual: 99.4 };
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'] };
      })(),
    ];
  }

  // --- Client Success Specialist (per-user Client Retention) ---
  const cssKey = findKey('Client Success Specialist');
  if (cssKey) {
    const build = makeKpiBuilder(33);
    // Region scoping via the shared isLasVegas/regionScope above.
    const cssRegionScope = regionScope;
    const cssRegionActuals = isLasVegas
      ? { nmg: { q1: 10, q2: 6.9, ytd: 10.2 }, esr: { q1: 90.4, q2: 139.7, ytd: 114.9 }, locked: ['Q1', 'Q2'] }
      : { nmg: { q1: 4.6, q2: -1.2, ytd: 4.6 }, esr: { q1: 78, q2: 120.8, ytd: 99.4 }, locked: ['Q1', 'Q2'] };
    transformedPositions[cssKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, cssRegionScope);
        const a = cssRegionActuals.nmg;
        if (a.q1 != null) k.quarters[0] = { ...k.quarters[0], actual: a.q1 };
        if (a.q2 != null) k.quarters[1] = { ...k.quarters[1], actual: a.q2 };
        if (a.ytd != null) k.annual = { ...k.annual, actual: a.ytd };
        return { ...k, weight: 34, lockedQuarters: cssRegionActuals.locked };
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
          ...k, weight: 33, lockedQuarters: ['Q1', 'Q2'],
          userValues: perUserMap, userOptions: cssUserOptions,
        };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, cssRegionScope);
        const a = cssRegionActuals.esr;
        if (a.q1 != null) k.quarters[0] = { ...k.quarters[0], actual: a.q1 };
        if (a.q2 != null) k.quarters[1] = { ...k.quarters[1], actual: a.q2 };
        if (a.ytd != null) k.annual = { ...k.annual, actual: a.ytd };
        return { ...k, weight: 33, lockedQuarters: cssRegionActuals.locked };
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
        k.quarters[0] = { ...k.quarters[0], actual: 4.6 };
        k.quarters[1] = { ...k.quarters[1], actual: -1.2 };
        k.annual = { ...k.annual, actual: 4.6 };
        return { ...k, weight: 34, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 88.3 };
        k.quarters[1] = { ...k.quarters[1], actual: 120.8 };
        k.annual = { ...k.annual, actual: 99.4 };
        return { ...k, weight: 33, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Arbor Team Sales Goal', '', 100, 'region-phoenix');
        k.quarters[0] = { ...k.quarters[0], actual: 108.3 };
        k.quarters[1] = { ...k.quarters[1], actual: 94.4 };
        k.annual = { ...k.annual, actual: 101.4 };
        return { ...k, weight: 33, lockedQuarters: ['Q1', 'Q2'] };
      })(),
    ];
  }

  // --- Enhancement Sales Specialist ---
  // Region-scoped (2026-08-19, first LV user: Jose Gomez). LV Enhancement
  // Team Sales Goal actuals are pending — nulls leave those quarters at
  // target and UNLOCKED so nothing pays out on placeholder data.
  const enhSalesSpecKey = findKey('Enhancement Sales Specialist');
  if (enhSalesSpecKey) {
    const build = makeKpiBuilder(50);
    const enhActuals = isLasVegas
      ? {
          nmg: { q1: 10, q2: 6.9, ytd: 10.2 },
          esr: { q1: 90.4, q2: 139.7, ytd: 114.9 },
          team: { q2: 168 },
          teamLocked: ['Q2'],
          locked: ['Q1', 'Q2'],
        }
      : {
          nmg: { q1: 4.6, q2: -1.2, ytd: 4.6 },
          esr: { q1: 88.3, q2: 120.8, ytd: 99.4 },
          team: { q1: 109.9, q2: 52.9, ytd: 81.9 },
          teamLocked: ['Q1', 'Q2'],
          locked: ['Q1', 'Q2'],
        };
    transformedPositions[enhSalesSpecKey].kpis = [
      (() => {
        const k = applyActuals(build('Net Maintenance Growth', '', 16, regionScope), enhActuals.nmg);
        return { ...k, weight: 34, lockedQuarters: enhActuals.locked };
      })(),
      (() => {
        const k = applyActuals(build('Extra Services Revenue', '', 120, regionScope), enhActuals.esr);
        return { ...k, weight: 33, lockedQuarters: enhActuals.locked };
      })(),
      (() => {
        const k = applyActuals(build('Enhancement Team Sales Goal', '', 100, regionScope), enhActuals.team);
        return { ...k, weight: 33, lockedQuarters: enhActuals.teamLocked };
      })(),
    ];
  }

  // --- General Manager (region-scoped; first holder Steve Swanson, LV, 2026-08-19) ---
  // LV NMG/ESR actuals = the region figures already used by the LV specialist
  // roles. DL Maintenance % actuals PENDING (both regions) — quarters sit at
  // target, unlocked. A Phoenix GM (none yet) gets Phoenix NMG/ESR figures.
  const gmKey = findKey('General Manager');
  if (gmKey) {
    const build = makeKpiBuilder(34);
    const gmActuals = isLasVegas
      ? { nmg: { q1: 10, q2: 6.9, ytd: 10.2 }, esr: { q1: 90.4, q2: 139.7, ytd: 114.9 }, dl: { q1: 35.5, q2: 40.4, ytd: 40.4 }, dlLocked: ['Q1', 'Q2'], locked: ['Q1', 'Q2'] }
      : { nmg: { q1: 4.6, q2: -1.2, ytd: 4.6 }, esr: { q1: 88.3, q2: 120.8, ytd: 99.4 }, dl: null, dlLocked: [], locked: ['Q1', 'Q2'] };
    transformedPositions[gmKey].kpis = [
      (() => {
        const k = applyActuals(build('Net Maintenance Growth', '', 16, regionScope), gmActuals.nmg);
        return { ...k, weight: 34, lockedQuarters: gmActuals.locked };
      })(),
      (() => {
        const k = applyActuals(build('Extra Services Revenue', '', 120, regionScope), gmActuals.esr);
        return { ...k, weight: 33, lockedQuarters: gmActuals.locked };
      })(),
      (() => {
        const k = applyActuals(build('Direct Labor Maintenance %', '', 40, regionScope, { isInverse: true }), gmActuals.dl);
        return { ...k, weight: 33, lockedQuarters: gmActuals.dlLocked };
      })(),
    ];
  }

  // --- Irrigation Support Specialist (region-scoped; first holder Claudia
  // Landa, LV, 2026-08-19) --- LV NMG/ESR = the shared region figures.
  // Irrigation Revenue vs Goal actuals PENDING - at target, unlocked.
  // Looked up by role KEY, not display name - Tyler renamed this role to
  // "Operations Support Specialist" on 2026-08-19 and title matching broke.
  // The key is stable across renames; user_roles also stores the key.
  const irrSpecKey = transformedPositions['irrigation-support-specialist']
    ? 'irrigation-support-specialist' : undefined;
  if (irrSpecKey) {
    const build = makeKpiBuilder(34);
    const irrActuals = isLasVegas
      ? { nmg: { q1: 10, q2: 6.9, ytd: 10.2 }, esr: { q1: 90.4, q2: 139.7, ytd: 114.9 }, irr: { q1: 58.3, q2: 95.9 }, irrLocked: ['Q1', 'Q2'], locked: ['Q1', 'Q2'] }
      : { nmg: { q1: 4.6, q2: -1.2, ytd: 4.6 }, esr: { q1: 88.3, q2: 120.8, ytd: 99.4 }, irr: null, irrLocked: [], locked: ['Q1', 'Q2'] };
    transformedPositions[irrSpecKey].kpis = [
      (() => {
        const k = applyActuals(build('Net Maintenance Growth', '', 16, regionScope), irrActuals.nmg);
        return { ...k, weight: 34, lockedQuarters: irrActuals.locked };
      })(),
      (() => {
        const k = applyActuals(build('Extra Services Revenue', '', 120, regionScope), irrActuals.esr);
        return { ...k, weight: 33, lockedQuarters: irrActuals.locked };
      })(),
      (() => {
        const k = applyActuals(build('Irrigation Revenue vs Goal', '', 100, regionScope), irrActuals.irr);
        return { ...k, weight: 33, lockedQuarters: irrActuals.irrLocked };
      })(),
    ];
  }

  // --- Accounting Specialist ---
  const acctFinKey = findKey('Accounting Specialist');
  if (acctFinKey) {
    const build = makeKpiBuilder(34);
    transformedPositions[acctFinKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 5.6 };
        k.quarters[1] = { ...k.quarters[1], actual: 0.8 };
        k.annual = { ...k.annual, actual: 7.4 };
        return { ...k, weight: 33, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 81 };
        k.quarters[1] = { ...k.quarters[1], actual: 125.5 };
        k.annual = { ...k.annual, actual: 103.2 };
        return { ...k, weight: 33, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Days to Accounting Close', '', 72, 'company', { isInverse: true });
        k.quarters[1] = { ...k.quarters[1], actual: 24 };
        return { ...k, weight: 34, excludedQuarters: ['Q1'], lockedQuarters: ['Q2'] };
      })(),
    ];
  }

  // --- Financial Specialist ---
  const finSpecKey = findKey('Financial Specialist');
  if (finSpecKey) {
    const build = makeKpiBuilder(34);
    transformedPositions[finSpecKey].kpis = [
      (() => {
        const k = build('Net Maintenance Growth', '', 16, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 5.6 };
        k.quarters[1] = { ...k.quarters[1], actual: 0.8 };
        k.annual = { ...k.annual, actual: 7.4 };
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Extra Services Revenue', '', 120, 'company');
        k.quarters[0] = { ...k.quarters[0], actual: 81 };
        k.quarters[1] = { ...k.quarters[1], actual: 125.5 };
        k.annual = { ...k.annual, actual: 103.2 };
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'] };
      })(),
      (() => {
        const k = build('Days to Accounting Close', '', 72, 'company', { isInverse: true });
        k.quarters[1] = { ...k.quarters[1], actual: 24 };
        return { ...k, weight: 25, excludedQuarters: ['Q1'], lockedQuarters: ['Q2'] };
      })(),
      (() => {
        const k = build('% of Aging Over 60 Days', '', 2.5, 'company', { isInverse: true });
        // Quarterly = average of the month-end AR snapshot "% over 60" readings (ar-dashboard)
        k.quarters[0] = { ...k.quarters[0], actual: 1.3 };
        k.quarters[1] = { ...k.quarters[1], actual: 4.2 };
        k.annual = { ...k.annual, actual: 2.75 };
        return { ...k, weight: 25, lockedQuarters: ['Q1', 'Q2'] };
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
