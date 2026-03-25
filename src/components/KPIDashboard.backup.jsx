'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabaseClient';

// Utility imports
import {
  formatCurrency,
  formatSalaryForDisplay,
  formatKPIValue
} from './KPIDashboard/utils/formatters';

import {
  sliderStyles,
  getPerformanceStatusColor
} from './KPIDashboard/utils/styles';

import {
  getMinValueForKPI,
  getQuarterFloorForKPI,
  getAnnualMinValueForKPI,
  getMaxValueForKPI,
  getAnnualMaxValueForKPI,
  isKpiOnTarget,
  getProgressStatusText,
  getSliderColorClass,
  getKpiSummary
} from './KPIDashboard/utils/kpiHelpers';

import { getKpiPeriodConfig } from './KPIDashboard/data/kpiPeriodConfigs';
import {
  computePeriodBonusMax,
  calculateQuarterBonus,
  calculateAnnualBonus,
} from './KPIDashboard/utils/bonusCalculations';

// Keep your existing components
import KPICard from './KPIDashboard/components/KPICard';
import PositionHeader from './KPIDashboard/components/PositionHeader';

const KPIDashboard = ({ isAdmin = false, allowedRoles = [], userSalary = null }) => {
  const [activeTab, setActiveTab] = useState(null);
  
  // Data from Supabase
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState({});
  const [bonusFormulas, setBonusFormulas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI state
  const [expandedSuccessFactors, setExpandedSuccessFactors] = useState({});
  const [expandedBreakdown, setExpandedBreakdown] = useState(false);

  // Determine which tabs the user can see
  const getAccessibleTabs = useCallback((positionKeys) => {
    if (isAdmin) {
      // Admins see all role tabs
      return [...positionKeys];
    }
    // Non-admins only see their assigned roles
    return positionKeys.filter(key => allowedRoles.includes(key));
  }, [isAdmin, allowedRoles]);

  // Fetch all data from Supabase
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Set initial active tab once positions are loaded
  useEffect(() => {
    if (Object.keys(positions).length > 0 && activeTab === null) {
      const accessibleTabs = getAccessibleTabs(Object.keys(positions));
      if (accessibleTabs.length > 0) {
        setActiveTab(accessibleTabs[0]);
      }
    }
  }, [positions, activeTab, getAccessibleTabs]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch roles with their KPIs
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select(`
          *,
          role_kpis (
            *,
            kpi:kpis (*)
          )
        `)
        .order('display_order');

      if (rolesError) throw rolesError;

      // Fetch all bonus formulas
      const { data: formulasData, error: formulasError } = await supabase
        .from('bonus_formulas')
        .select('*');

      if (formulasError) throw formulasError;

      // Transform data into the format your dashboard expects
      const transformedPositions = {};
      const formulaMap = {};

      // Only show roles marked as visible
      const visibleRoles = rolesData.filter(role => role.is_visible !== false);

      visibleRoles.forEach(role => {
        // Transform KPIs for this role, expanding with period data
        const kpis = role.role_kpis
          .sort((a, b) => a.display_order - b.display_order)
          .map(rk => {
            const config = getKpiPeriodConfig(rk.kpi.name);
            const annualTarget = rk.target_value;

            // Build quarter objects
            const qFloor = getQuarterFloorForKPI(rk.kpi.name);
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
              // Period fields
              hasPeriods: true,
              unit: config.unit,
              stepSize: config.stepSize,
              targetType: config.targetType,
              bonusSplit: config.bonusSplit,
              annualPayDate: config.annualPayDate,
              quarters,
              annual: {
                target: annualTarget,
                actual: annualTarget,
              },
            };
          });

        transformedPositions[role.key] = {
          title: role.name,
          salary: role.base_salary,
          bonusPercentage: role.bonus_percentage,
          color: role.color || '#dbeafe', // Include color from database
          kpis: kpis
        };

        // Store formulas for this role
        formulasData
          .filter(f => f.role_id === role.id)
          .forEach(formula => {
            const kpi = role.role_kpis.find(rk => rk.kpi_id === formula.kpi_id);
            if (kpi) {
              formulaMap[`${role.key}-${kpi.kpi.name}`] = formula.formula_config;
            }
          });
      });

      // Inject hardcoded KPIs into Arbor Manager
      const arborKey = Object.keys(transformedPositions).find(
        k => transformedPositions[k].title === 'Arbor Manager'
      );
      if (arborKey) {
        const buildKpi = (name, description, target, scope, overrides = {}) => {
          const config = getKpiPeriodConfig(name);
          const qTarget = config.quarterlyTarget != null
            ? config.quarterlyTarget
            : config.targetType === 'rate' ? target : target / 4;
          const quarters = config.quarters.map(q => ({
            id: q.id, period: q.period, payDate: q.payDate,
            target: qTarget, actual: qTarget,
          }));
          return {
            name, description, target, actual: target,
            weight: 25, isInverse: false, scope,
            successFactors: [], successGuide: '',
            hasPeriods: true, unit: config.unit, stepSize: config.stepSize,
            targetType: config.targetType, bonusSplit: config.bonusSplit,
            annualPayDate: config.annualPayDate, quarters,
            annual: { target, actual: target },
            ...overrides,
          };
        };

        transformedPositions[arborKey].kpis = [
          { ...buildKpi('Net Maintenance Growth', '', 16, 'company'), weight: 34 },
          { ...buildKpi('Extra Services Revenue', '', 120, 'company'), formulaKey: 'Extra Services Revenue (Arbor)', weight: 33 },
          { ...buildKpi('Net Controllable Income Goal',
            'Percentage of Arbor Net Controllable Income goal achieved. Annual target for Phoenix Arbor is $3.5M.',
            100, 'region-phoenix'), dollarTarget: 3500000, weight: 33 },
        ];
      }

      // Inject hardcoded KPIs into Spray Manager (same structure as Arbor Manager)
      const sprayKey = Object.keys(transformedPositions).find(
        k => transformedPositions[k].title === 'Spray Manager'
      );
      if (sprayKey) {
        const buildSprayKpi = (name, description, target, scope, overrides = {}) => {
          const config = getKpiPeriodConfig(name);
          const qTarget = config.quarterlyTarget != null
            ? config.quarterlyTarget
            : config.targetType === 'rate' ? target : target / 4;
          const quarters = config.quarters.map(q => ({
            id: q.id, period: q.period, payDate: q.payDate,
            target: qTarget, actual: qTarget,
          }));
          return {
            name, description, target, actual: target,
            weight: 25, isInverse: false, scope,
            successFactors: [], successGuide: '',
            hasPeriods: true, unit: config.unit, stepSize: config.stepSize,
            targetType: config.targetType, bonusSplit: config.bonusSplit,
            annualPayDate: config.annualPayDate, quarters,
            annual: { target, actual: target },
            ...overrides,
          };
        };

        transformedPositions[sprayKey].kpis = [
          { ...buildSprayKpi('Net Maintenance Growth', '', 16, 'company'), weight: 34 },
          { ...buildSprayKpi('Extra Services Revenue', '', 120, 'company'), formulaKey: 'Extra Services Revenue (Spray)', weight: 33 },
          { ...buildSprayKpi('Net Controllable Income Goal',
            'Percentage of Spray Net Controllable Income goal achieved. Annual target for Phoenix Spray is $940K. In-contract spray revenue captured at $105/hr based on actual hours spent on in-contract jobs.',
            100, 'region-phoenix'), dollarTarget: 940000, weight: 33 },
        ];
      }

      // Inject hardcoded KPIs into Senior Manager of Maintenance Operations (fully hardcoded, ignores DB assignments)
      const maintOpsKey = Object.keys(transformedPositions).find(
        k => transformedPositions[k].title === 'Senior Manager of Maintenance Operations'
      );
      if (maintOpsKey) {
        const buildSrMaintOpsKpi = (name, description, target, scope, overrides = {}) => {
          const config = getKpiPeriodConfig(name);
          const qTarget = config.quarterlyTarget != null
            ? config.quarterlyTarget
            : config.targetType === 'rate' ? target : target / 4;
          const quarters = config.quarters.map(q => ({
            id: q.id, period: q.period, payDate: q.payDate,
            target: qTarget, actual: qTarget,
          }));
          return {
            name, description, target, actual: target,
            weight: 25, isInverse: false, scope,
            successFactors: [], successGuide: '',
            hasPeriods: true, unit: config.unit, stepSize: config.stepSize,
            targetType: config.targetType, bonusSplit: config.bonusSplit,
            annualPayDate: config.annualPayDate, quarters,
            annual: { target, actual: target },
            ...overrides,
          };
        };

        transformedPositions[maintOpsKey].kpis = [
          { ...buildSrMaintOpsKpi('Net Maintenance Growth', '', 16, 'region-phoenix'), weight: 25 },
          { ...buildSrMaintOpsKpi('Extra Services Revenue', '', 120, 'region-phoenix'), weight: 25 },
          { ...buildSrMaintOpsKpi('Direct Labor Maintenance %', '', 40, 'region-phoenix', { isInverse: true }), weight: 25 },
          { ...buildSrMaintOpsKpi('Net Controllable Income Goal',
            'Percentage of Enhancements Net Controllable Income goal achieved. Annual target for Phoenix Enhancements is $2.15M.',
            100, 'region-phoenix', { dollarTarget: 2150000 }), weight: 25 },
        ];
      }

      // Inject hardcoded KPIs into Maintenance Operations Manager (same pattern as Arbor/Spray Manager)
      const maintOpsMgrKey = Object.keys(transformedPositions).find(
        k => transformedPositions[k].title === 'Maintenance Operations Manager'
      );
      if (maintOpsMgrKey) {
        const buildMaintOpsKpi = (name, description, target, scope, overrides = {}) => {
          const config = getKpiPeriodConfig(name);
          const qTarget = config.quarterlyTarget != null
            ? config.quarterlyTarget
            : config.targetType === 'rate' ? target : target / 4;
          const quarters = config.quarters.map(q => ({
            id: q.id, period: q.period, payDate: q.payDate,
            target: qTarget, actual: qTarget,
          }));
          return {
            name, description, target, actual: target,
            weight: 33, isInverse: false, scope,
            successFactors: [], successGuide: '',
            hasPeriods: true, unit: config.unit, stepSize: config.stepSize,
            targetType: config.targetType, bonusSplit: config.bonusSplit,
            annualPayDate: config.annualPayDate, quarters,
            annual: { target, actual: target },
            ...overrides,
          };
        };

        transformedPositions[maintOpsMgrKey].kpis = [
          { ...buildMaintOpsKpi('Net Maintenance Growth', '', 16, 'region-phoenix'), weight: 25 },
          { ...buildMaintOpsKpi('Net Maintenance Growth', '', 16, 'individual'), weight: 25 },
          { ...buildMaintOpsKpi('Extra Services Revenue', '', 120, 'region-phoenix'), weight: 20 },
          { ...buildMaintOpsKpi('Direct Labor Maintenance %', '', 40, 'individual', { isInverse: true }), weight: 30 },
        ];
      }

      // Inject hardcoded KPIs into Maintenance Quality Specialist (same as Maintenance Operations Manager)
      const mqsKey = Object.keys(transformedPositions).find(
        k => transformedPositions[k].title === 'Maintenance Quality Specialist'
      );
      if (mqsKey) {
        const buildMqsKpi = (name, description, target, scope, overrides = {}) => {
          const config = getKpiPeriodConfig(name);
          const qTarget = config.quarterlyTarget != null
            ? config.quarterlyTarget
            : config.targetType === 'rate' ? target : target / 4;
          const quarters = config.quarters.map(q => ({
            id: q.id, period: q.period, payDate: q.payDate,
            target: qTarget, actual: qTarget,
          }));
          return {
            name, description, target, actual: target,
            weight: 33, isInverse: false, scope,
            successFactors: [], successGuide: '',
            hasPeriods: true, unit: config.unit, stepSize: config.stepSize,
            targetType: config.targetType, bonusSplit: config.bonusSplit,
            annualPayDate: config.annualPayDate, quarters,
            annual: { target, actual: target },
            ...overrides,
          };
        };

        transformedPositions[mqsKey].kpis = [
          { ...buildMqsKpi('Net Maintenance Growth', '', 16, 'region-phoenix'), weight: 25 },
          { ...buildMqsKpi('Net Maintenance Growth', '', 16, 'individual'), weight: 25 },
          { ...buildMqsKpi('Extra Services Revenue', '', 120, 'region-phoenix'), weight: 20 },
          { ...buildMqsKpi('Direct Labor Maintenance %', '', 40, 'individual', { isInverse: true }), weight: 30 },
        ];
      }

      // Inject hardcoded KPIs into Maintenance Field Supervisor (same as Maintenance Quality Specialist)
      const mfsKey = Object.keys(transformedPositions).find(
        k => transformedPositions[k].title === 'Maintenance Field Supervisor'
      );
      if (mfsKey) {
        const buildMfsKpi = (name, description, target, scope, overrides = {}) => {
          const config = getKpiPeriodConfig(name);
          const qTarget = config.quarterlyTarget != null
            ? config.quarterlyTarget
            : config.targetType === 'rate' ? target : target / 4;
          const quarters = config.quarters.map(q => ({
            id: q.id, period: q.period, payDate: q.payDate,
            target: qTarget, actual: qTarget,
          }));
          return {
            name, description, target, actual: target,
            weight: 33, isInverse: false, scope,
            successFactors: [], successGuide: '',
            hasPeriods: true, unit: config.unit, stepSize: config.stepSize,
            targetType: config.targetType, bonusSplit: config.bonusSplit,
            annualPayDate: config.annualPayDate, quarters,
            annual: { target, actual: target },
            ...overrides,
          };
        };

        transformedPositions[mfsKey].kpis = [
          { ...buildMfsKpi('Net Maintenance Growth', '', 16, 'region-phoenix'), weight: 25 },
          { ...buildMfsKpi('Net Maintenance Growth', '', 16, 'individual'), weight: 25 },
          { ...buildMfsKpi('Extra Services Revenue', '', 120, 'region-phoenix'), weight: 20 },
          { ...buildMfsKpi('Direct Labor Maintenance %', '', 40, 'individual', { isInverse: true }), weight: 30 },
        ];
      }

      // Inject hardcoded KPIs into Client Success Manager (fully hardcoded, ignores DB assignments)
      const csmKey = Object.keys(transformedPositions).find(
        k => transformedPositions[k].title === 'Client Success Manager'
      );
      if (csmKey) {
        const buildCsmKpi = (name, description, target, scope, overrides = {}) => {
          const config = getKpiPeriodConfig(name);
          const qTarget = config.quarterlyTarget != null
            ? config.quarterlyTarget
            : config.targetType === 'rate' ? target : target / 4;
          const quarters = config.quarters.map(q => ({
            id: q.id, period: q.period, payDate: q.payDate,
            target: qTarget, actual: qTarget,
          }));
          return {
            name, description, target, actual: target,
            weight: 25, isInverse: false, scope,
            successFactors: [], successGuide: '',
            hasPeriods: true, unit: config.unit, stepSize: config.stepSize,
            targetType: config.targetType, bonusSplit: config.bonusSplit,
            annualPayDate: config.annualPayDate, quarters,
            annual: { target, actual: target },
            ...overrides,
          };
        };

        transformedPositions[csmKey].kpis = [
          { ...buildCsmKpi('Net Maintenance Growth', '', 16, 'company'), weight: 25 },
          { ...buildCsmKpi('Net Maintenance Growth', '', 16, 'region-phoenix'), weight: 25 },
          { ...buildCsmKpi('Extra Services Revenue', '', 120, 'company'), weight: 25 },
          { ...buildCsmKpi('Extra Services Revenue', '', 120, 'region-phoenix'), weight: 25 },
        ];
      }

      // Inject hardcoded KPIs into Client Success Specialist (fully hardcoded, ignores DB assignments)
      const cssKey = Object.keys(transformedPositions).find(
        k => transformedPositions[k].title === 'Client Success Specialist'
      );
      if (cssKey) {
        const buildCssKpi = (name, description, target, scope, overrides = {}) => {
          const config = getKpiPeriodConfig(name);
          const qTarget = config.quarterlyTarget != null
            ? config.quarterlyTarget
            : config.targetType === 'rate' ? target : target / 4;
          const quarters = config.quarters.map(q => ({
            id: q.id, period: q.period, payDate: q.payDate,
            target: qTarget, actual: qTarget,
          }));
          return {
            name, description, target, actual: target,
            weight: 33, isInverse: false, scope,
            successFactors: [], successGuide: '',
            hasPeriods: true, unit: config.unit, stepSize: config.stepSize,
            targetType: config.targetType, bonusSplit: config.bonusSplit,
            annualPayDate: config.annualPayDate, quarters,
            annual: { target, actual: target },
            ...overrides,
          };
        };

        transformedPositions[cssKey].kpis = [
          { ...buildCssKpi('Net Maintenance Growth', '', 16, 'region-phoenix'), weight: 34 },
          { ...buildCssKpi('Client Retention %', '', 100, 'individual'), weight: 33 },
          { ...buildCssKpi('Extra Services Revenue', '', 120, 'region-phoenix'), weight: 33 },
        ];
      }

      // Override salary with user's personal salary for non-admins
      if (!isAdmin && userSalary != null) {
        Object.keys(transformedPositions).forEach(key => {
          transformedPositions[key].salary = userSalary;
        });
      }

      setRoles(rolesData);
      setPositions(transformedPositions);
      setBonusFormulas(formulaMap);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Bonus calculation using period-based proportional model
  const calculateKpiBonusForPeriods = useCallback((position, kpiIndex) => {
    const kpi = position.kpis[kpiIndex];
    const { perQuarter, annual: annualMax } = computePeriodBonusMax(
      position, kpi.weight, kpi.bonusSplit
    );

    // Sum quarterly bonuses
    let quarterlyTotal = 0;
    const quarterBonuses = {};
    for (const q of kpi.quarters) {
      const formulaKey = kpi.formulaKey || kpi.name;
      const qBonus = calculateQuarterBonus(q, kpi.isInverse, perQuarter, formulaKey);
      quarterBonuses[q.id] = qBonus;
      quarterlyTotal += qBonus;
    }

    // Annual bonus
    const formulaKey = kpi.formulaKey || kpi.name;
    const annualBonus = calculateAnnualBonus(kpi.annual, kpi.isInverse, annualMax, formulaKey);

    return {
      quarterBonuses,
      quarterlyTotal,
      annualBonus,
      total: quarterlyTotal + annualBonus,
      perQuarterMax: perQuarter,
      annualMax,
    };
  }, []);

  // Legacy-compatible wrapper that returns just the total number
  const calculateKpiBonus = useCallback((position, kpiIndex, positionKey) => {
    const kpi = position.kpis[kpiIndex];
    if (kpi.hasPeriods) {
      return calculateKpiBonusForPeriods(position, kpiIndex).total;
    }
    // Fallback for any non-period KPIs (shouldn't happen with current setup)
    const totalBonus = position.salary * (position.bonusPercentage / 100);
    const kpiWeight = 1 / position.kpis.length;
    const kpiTotalAvailable = totalBonus * kpiWeight;
    const formulaKey = `${positionKey}-${kpi.name}`;
    const formula = bonusFormulas[formulaKey];
    if (!formula) {
      const achievementPercentage = Math.min(100, (kpi.actual / kpi.target) * 100) / 100;
      return kpiTotalAvailable * achievementPercentage;
    }
    return applyBonusFormula(kpi, kpiTotalAvailable, formula);
  }, [bonusFormulas, calculateKpiBonusForPeriods]);

  const applyBonusFormula = (kpi, kpiTotalAvailable, formula) => {
    const { type, tiers, range_rules } = formula;
    const actual = kpi.actual;

    // Find applicable tier
    let bonusPercentage = 0;

    for (const tier of tiers) {
      if (tier.exact_match && actual === tier.threshold) {
        bonusPercentage = tier.bonus_percentage;
        break;
      } else if (tier.comparison === 'below' && actual < tier.threshold) {
        bonusPercentage = tier.bonus_percentage;
        break;
      } else if (tier.comparison === 'above' && actual > tier.threshold) {
        bonusPercentage = tier.bonus_percentage;
        break;
      } else if (tier.comparison === 'below_or_equal' && actual <= tier.threshold) {
        bonusPercentage = tier.bonus_percentage;
        break;
      } else if (tier.comparison === 'above_or_equal' && actual >= tier.threshold) {
        bonusPercentage = tier.bonus_percentage;
        break;
      }
    }

    // Check if value falls in a range rule for interpolation
    if (range_rules) {
      for (const rule of range_rules) {
        if (actual >= rule.min && actual <= rule.max) {
          const progress = (actual - rule.min) / (rule.max - rule.min);
          
          if (rule.scaling === 'proportional') {
            bonusPercentage = rule.base_percentage + (rule.additional_percentage * progress);
          } else if (rule.scaling === 'proportional_inverse') {
            bonusPercentage = rule.base_percentage + (rule.additional_percentage * (1 - progress));
          }
          break;
        }
      }
    }

    return (kpiTotalAvailable * bonusPercentage) / 100;
  };

  const calculateTotalBonus = (position) => {
    return position.salary * (position.bonusPercentage / 100);
  };

  const calculateActualTotalBonus = useCallback((position, positionKey) => {
    let totalActualBonus = 0;
    position.kpis.forEach((kpi, index) => {
      totalActualBonus += calculateKpiBonus(position, index, positionKey);
    });
    return totalActualBonus;
  }, [calculateKpiBonus]);

  // --- Handlers ---

  const handleSalaryChange = (positionKey, newSalary) => {
    const numericValue = newSalary.replace(/[^0-9.]/g, '');
    setPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      newPositions[positionKey].salary = parseFloat(numericValue) || 0;
      return newPositions;
    });
  };

  const handleBonusPercentageChange = (positionKey, newPercentage) => {
    setPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      newPositions[positionKey].bonusPercentage = parseFloat(newPercentage) || 0;
      return newPositions;
    });
  };

  const toggleSuccessFactors = (positionKey, kpiIndex) => {
    setExpandedSuccessFactors(prev => {
      const key = `${positionKey}-${kpiIndex}`;
      return { ...prev, [key]: !prev[key] };
    });
  };

  // Weight change: update a KPI's weight value
  const handleWeightChange = (positionKey, kpiIndex, newWeight) => {
    setPositions(prevPositions => {
      const newPositions = JSON.parse(JSON.stringify(prevPositions));
      newPositions[positionKey].kpis[kpiIndex].weight = newWeight;
      return newPositions;
    });
  };

  // Quarter-level change: set a specific quarter's actual value
  const handleQuarterChange = (positionKey, kpiIndex, quarterId, newValue) => {
    setPositions(prevPositions => {
      const newPositions = JSON.parse(JSON.stringify(prevPositions));
      const kpi = newPositions[positionKey].kpis[kpiIndex];
      const quarter = kpi.quarters.find(q => q.id === quarterId);
      if (quarter) {
        quarter.actual = newValue;
      }
      return newPositions;
    });
  };

  const handleQuarterIncrement = (positionKey, kpiIndex, quarterId) => {
    setPositions(prevPositions => {
      const newPositions = JSON.parse(JSON.stringify(prevPositions));
      const kpi = newPositions[positionKey].kpis[kpiIndex];
      const quarter = kpi.quarters.find(q => q.id === quarterId);
      if (quarter) {
        const max = getMaxValueForKPI(kpi.name);
        quarter.actual = Math.min(max, quarter.actual + kpi.stepSize);
      }
      return newPositions;
    });
  };

  const handleQuarterDecrement = (positionKey, kpiIndex, quarterId) => {
    setPositions(prevPositions => {
      const newPositions = JSON.parse(JSON.stringify(prevPositions));
      const kpi = newPositions[positionKey].kpis[kpiIndex];
      const quarter = kpi.quarters.find(q => q.id === quarterId);
      if (quarter) {
        const qFloor = getQuarterFloorForKPI(kpi.name);
        quarter.actual = Math.max(qFloor, quarter.actual - kpi.stepSize);
      }
      return newPositions;
    });
  };

  const handleAnnualChange = (positionKey, kpiIndex, newValue) => {
    setPositions(prevPositions => {
      const newPositions = JSON.parse(JSON.stringify(prevPositions));
      const kpi = newPositions[positionKey].kpis[kpiIndex];
      kpi.annual.actual = newValue;
      kpi.actual = newValue;
      return newPositions;
    });
  };

  const handleAnnualIncrement = (positionKey, kpiIndex) => {
    setPositions(prevPositions => {
      const newPositions = JSON.parse(JSON.stringify(prevPositions));
      const kpi = newPositions[positionKey].kpis[kpiIndex];
      const max = getAnnualMaxValueForKPI(kpi.name);
      kpi.annual.actual = Math.min(max, kpi.annual.actual + kpi.stepSize);
      kpi.actual = kpi.annual.actual;
      return newPositions;
    });
  };

  const handleAnnualDecrement = (positionKey, kpiIndex) => {
    setPositions(prevPositions => {
      const newPositions = JSON.parse(JSON.stringify(prevPositions));
      const kpi = newPositions[positionKey].kpis[kpiIndex];
      const min = getAnnualMinValueForKPI(kpi.name);
      kpi.annual.actual = Math.max(min, kpi.annual.actual - kpi.stepSize);
      kpi.actual = kpi.annual.actual;
      return newPositions;
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Get accessible tabs for this user
  const accessibleTabs = getAccessibleTabs(Object.keys(positions));

  // If user has no accessible tabs (new user waiting for role assignment)
  if (accessibleTabs.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-end mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-800">Employee KPI Dashboard</h1>
          <div className="text-xs md:text-sm text-gray-600 flex items-center">
            <span className="mr-1">Performance Period:</span>
            <span className="font-medium">Jan-Dec 2026</span>
          </div>
        </div>
        
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '60px auto'
        }}>
          {/* Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            background: '#fef3c7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#d97706" 
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          
          <h2 style={{
            fontSize: '22px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '12px'
          }}>
            Welcome! Your Account is Ready
          </h2>
          
          <p style={{
            color: '#6b7280',
            lineHeight: '1.6',
            marginBottom: '24px'
          }}>
            Your account has been created, but you haven't been assigned a role yet. 
            An administrator will assign you to the appropriate dashboard view shortly.
          </p>
          
          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            <strong style={{ color: '#374151' }}>What happens next?</strong>
            <p style={{ marginTop: '8px', marginBottom: '0' }}>
              Once your role is assigned, you'll see your KPIs and bonus information here. 
              Check back soon or contact your manager if you need immediate access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <style>{sliderStyles}</style>
      
      {/* Tabs - Modern pill style with role colors */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '24px',
        padding: '12px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e5e7eb'
      }}>
        {accessibleTabs.map((tabKey) => {
          const isActive = activeTab === tabKey;
          const roleColor = positions[tabKey]?.color || '#dbeafe';
          
          return (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              style={{
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                borderRadius: '8px',
                border: isActive ? '2px solid #1e293b' : '2px solid transparent',
                background: isActive ? roleColor : 'transparent',
                color: '#1e293b',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                position: 'relative',
                boxShadow: isActive ? '0 2px 4px rgba(0, 0, 0, 0.08)' : 'none'
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = roleColor;
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* Color indicator dot for inactive tabs */}
              {!isActive && (
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: roleColor,
                  marginRight: '8px',
                  border: '1px solid #1e293b',
                  verticalAlign: 'middle'
                }} />
              )}
              {positions[tabKey]?.title}
            </button>
          );
        })}
      </div>
      
      {/* Content */}
      {activeTab && positions[activeTab] ? (
        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: positions[activeTab]?.color || '#dbeafe' }}
        >
          <PositionHeader
            activeTab={activeTab}
            position={positions[activeTab]}
            handleSalaryChange={handleSalaryChange}
            handleBonusPercentageChange={handleBonusPercentageChange}
            expandedBreakdown={expandedBreakdown}
            setExpandedBreakdown={setExpandedBreakdown}
            calculateTotalBonus={calculateTotalBonus}
            calculateActualTotalBonus={calculateActualTotalBonus}
            calculateKpiBonus={calculateKpiBonus}
            calculateKpiBonusForPeriods={calculateKpiBonusForPeriods}
          />

          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Key Performance Indicators</h2>
          
          <div className="grid grid-cols-1 gap-4">
            {positions[activeTab]?.kpis.map((kpi, index) => (
              <KPICard
                key={index}
                kpi={kpi}
                index={index}
                position={positions[activeTab]}
                positionKey={activeTab}
                handleQuarterChange={handleQuarterChange}
                handleQuarterIncrement={handleQuarterIncrement}
                handleQuarterDecrement={handleQuarterDecrement}
                handleAnnualChange={handleAnnualChange}
                handleAnnualIncrement={handleAnnualIncrement}
                handleAnnualDecrement={handleAnnualDecrement}
                expandedSuccessFactors={expandedSuccessFactors}
                toggleSuccessFactors={toggleSuccessFactors}
                calculateKpiBonus={calculateKpiBonus}
                calculateKpiBonusForPeriods={calculateKpiBonusForPeriods}
                calculateTotalBonus={calculateTotalBonus}
                onWeightChange={handleWeightChange}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default KPIDashboard;