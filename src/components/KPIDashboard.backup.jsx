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

const KPIDashboard = ({ isAdmin = false, allowedRoles = [] }) => {
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
            const quarters = config.quarters.map(q => ({
              id: q.id,
              period: q.period,
              payDate: q.payDate,
              target: qTarget,
              actual: qFloor,
            }));

            return {
              name: rk.kpi.name,
              description: rk.kpi.description,
              target: annualTarget,
              actual: 0, // will be derived from quarters
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
                actual: getAnnualMinValueForKPI(rk.kpi.name),
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
      const qBonus = calculateQuarterBonus(q, kpi.isInverse, perQuarter, kpi.name);
      quarterBonuses[q.id] = qBonus;
      quarterlyTotal += qBonus;
    }

    // Annual bonus
    const annualBonus = calculateAnnualBonus(kpi.annual, kpi.isInverse, annualMax, kpi.name);

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
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default KPIDashboard;