// src/components/KPIDashboard/components/KPICard.jsx

import React, { useRef, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { formatCurrency, formatKPIActual } from '../utils/formatters';
import { computePeriodBonusMax } from '../utils/bonusCalculations';
import { getMinValueForKPI, getMaxValueForKPI, getAnnualMaxValueForKPI, getQuarterFloorForKPI, getAnnualMinValueForKPI } from '../utils/kpiHelpers';
import { QUARTER_MONTHS, YEAR_MONTHS, parseEligibilityDate, getProrationMonths } from '../utils/proration';

/**
 * Green checkmark SVG — shown when a quarter/annual target is met.
 */
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline text-gray-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-label="Official">
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

/**
 * Interactive progress bar — click or drag to set value.
 */
const ProgressBar = ({ actual, target, isInverse, variant = 'default', kpiName, min, max, step, onChange }) => {
  const barRef = useRef(null);
  const dragging = useRef(false);

  const computeValueFromX = useCallback((clientX) => {
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

    // Invert the same formula the bar uses for display percentage
    let raw;
    if (kpiName === 'Net Maintenance Growth') {
      if (variant === 'annual') {
        // pct = (actual - 10) / (25 - 10) * 100
        raw = 10 + ratio * (25 - 10);
      } else {
        // Quarterly: -15% to 10% range
        raw = -15 + ratio * (10 - -15);
      }
    } else if (kpiName === 'Extra Services Revenue') {
      // pct = (actual - 80) / (140 - 80) * 100
      raw = 80 + ratio * (140 - 80);
    } else if (kpiName === 'Arbor Team Sales Goal' && variant === 'annual') {
      raw = ratio * 120;
    } else if (kpiName === 'Enhancement Team Sales Goal') {
      raw = ratio * 120;
    } else if (kpiName === 'Direct Labor Maintenance %') {
      // Left-to-right: left = 30% (best), right = 50% (worst)
      raw = 30 + ratio * (50 - 30);
    } else if (kpiName === 'Total Gross Margin % on Completed Jobs') {
      // 50-70 range, left = 50%, right = 70%
      raw = 50 + ratio * (70 - 50);
    } else if (kpiName === 'Net Controllable Income Goal') {
      // 80-130 range
      raw = 80 + ratio * (130 - 80);
    } else if (isInverse) {
      raw = min + (1 - ratio) * (max - min);
    } else {
      // pct = actual / target * 100 (capped at 100%)
      raw = ratio * target;
    }

    const snapped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, snapped));
  }, [min, max, step, kpiName, variant, isInverse, target]);

  const handlePointerDown = useCallback((e) => {
    if (!onChange) return;
    dragging.current = true;
    barRef.current.setPointerCapture(e.pointerId);
    onChange(computeValueFromX(e.clientX));
  }, [onChange, computeValueFromX]);

  const handlePointerMove = useCallback((e) => {
    if (!dragging.current || !onChange) return;
    onChange(computeValueFromX(e.clientX));
  }, [onChange, computeValueFromX]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  if (target === 0 && !onChange) return <div className="w-full bg-gray-200 rounded-full h-2" />;

  let pct;
  if (kpiName === 'Net Maintenance Growth') {
    if (variant === 'annual') {
      pct = actual <= 10 ? 0 : Math.min(100, ((actual - 10) / (25 - 10)) * 100);
    } else {
      // Quarterly: -15% to 10% range
      pct = actual <= -15 ? 0 : Math.min(100, ((actual - -15) / (10 - -15)) * 100);
    }
  } else if (kpiName === 'Extra Services Revenue') {
    pct = actual <= 80 ? 0 : Math.min(100, ((actual - 80) / (140 - 80)) * 100);
  } else if (kpiName === 'Arbor Team Sales Goal' && variant === 'annual') {
    pct = Math.min(100, (actual / 120) * 100);
  } else if (kpiName === 'Enhancement Team Sales Goal') {
    pct = Math.min(100, (actual / 120) * 100);
  } else if (kpiName === 'Direct Labor Maintenance %') {
    // Left-to-right: 30% (left) to 50% (right), bar shows position in range
    pct = actual <= 30 ? 0 : Math.min(100, ((actual - 30) / (50 - 30)) * 100);
  } else if (kpiName === 'Total Gross Margin % on Completed Jobs') {
    // 50-70 range
    pct = actual <= 50 ? 0 : Math.min(100, ((actual - 50) / (70 - 50)) * 100);
  } else if (kpiName === 'Net Controllable Income Goal') {
    // 80-130 range, uncapped visually at 130
    pct = actual <= 80 ? 0 : Math.min(100, ((actual - 80) / (130 - 80)) * 100);
  } else if (isInverse) {
    pct = actual <= target ? 100 : Math.max(0, (target / actual) * 100);
  } else {
    pct = Math.min(100, (actual / target) * 100);
  }

  let barColor;
  if (kpiName === 'Net Maintenance Growth') {
    if (variant === 'annual') {
      barColor = actual >= 16 ? 'bg-green-500' : actual > 10 ? 'bg-red-300' : 'bg-gray-300';
    } else {
      barColor = actual >= 4 ? 'bg-green-500' : actual > 0 ? 'bg-red-300' : 'bg-gray-300';
    }
  } else if (kpiName === 'Extra Services Revenue') {
    barColor = actual >= 120 ? 'bg-green-500' : actual >= 100 ? 'bg-yellow-400' : actual > 80 ? 'bg-red-300' : 'bg-gray-300';
  } else if (kpiName === 'Direct Labor Maintenance %') {
    // Lower is better: green at 40% or below, red above 40%
    barColor = actual <= 40 ? 'bg-green-500' : 'bg-red-400';
  } else if (kpiName === 'Total Gross Margin % on Completed Jobs') {
    // All-or-nothing at 60%
    barColor = actual >= 60 ? 'bg-green-500' : actual > 50 ? 'bg-red-300' : 'bg-gray-300';
  } else if (kpiName === 'Net Controllable Income Goal') {
    // Linear: green at 100%+, yellow 90-100%, red below 90%
    barColor = actual >= 100 ? 'bg-green-500' : actual >= 90 ? 'bg-yellow-400' : actual > 80 ? 'bg-red-300' : 'bg-gray-300';
  } else if (kpiName === 'Arbor Team Sales Goal' || kpiName === 'Enhancement Team Sales Goal') {
    barColor = actual >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-yellow-400' : 'bg-gray-300';
  } else if (variant === 'annual') {
    barColor = pct >= 100 ? 'bg-blue-500' : pct > 0 ? 'bg-blue-300' : 'bg-gray-300';
  } else {
    if (isInverse) {
      barColor = actual <= target ? 'bg-green-500' : actual <= target * 1.1 ? 'bg-yellow-400' : 'bg-red-400';
    } else {
      barColor = pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-yellow-400' : 'bg-gray-300';
    }
  }

  return (
    <div
      ref={barRef}
      className={`w-full bg-gray-200 rounded-full h-2 ${onChange ? 'cursor-pointer' : ''}`}
      onPointerDown={onChange ? handlePointerDown : undefined}
      onPointerMove={onChange ? handlePointerMove : undefined}
      onPointerUp={onChange ? handlePointerUp : undefined}
      style={{ touchAction: 'none' }}
    >
      <div
        className={`h-2 rounded-full transition-all duration-100 ${barColor}`}
        style={{ width: `${pct}%`, pointerEvents: 'none' }}
      />
    </div>
  );
};

/**
 * Individual KPI Card Component — quarterly/annual layout
 */
const KPICard = ({
  kpi,
  index,
  position,
  positionKey,
  handleQuarterChange,
  handleQuarterIncrement,
  handleQuarterDecrement,
  handleAnnualChange,
  handleAnnualIncrement,
  handleAnnualDecrement,
  expandedSuccessFactors,
  toggleSuccessFactors,
  calculateKpiBonus,
  calculateKpiBonusForPeriods,
  calculateTotalBonus,
  onWeightChange,
  userBranch,
  userDepartment,
  userEligibilityDate,
  isAdmin
}) => {
  const eligibilityDate = parseEligibilityDate(userEligibilityDate);
  const [collapsed, setCollapsed] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(String(kpi.weight));
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [previewBranch, setPreviewBranch] = useState(userBranch || null);
  const periodBonus = calculateKpiBonusForPeriods(position, index);
  const { perQuarter: perQuarterMax, annual: annualMax } = computePeriodBonusMax(
    position, kpi.weight, kpi.bonusSplit
  );
  const totalMax = perQuarterMax * 4 + annualMax;

  const isQuarterOnTarget = (q) => {
    if (kpi.isInverse) return q.actual <= q.target;
    return q.actual >= q.target;
  };

  const isAnnualOnTarget = () => {
    if (kpi.isInverse) return kpi.annual.actual <= kpi.annual.target;
    return kpi.annual.actual >= kpi.annual.target;
  };

  const scopeConfig = {
    company:          { label: 'Company',          bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200' },
    'region-phoenix': { label: 'Region - Phoenix', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    'region-lasvegas':{ label: 'Region - Las Vegas',bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    individual:       { label: 'Individual',       bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200' },
  };
  let scope = scopeConfig[kpi.scope] || scopeConfig.individual;
  // For Maintenance Operations Manager, "Individual" Net Maintenance Growth and
  // Direct Labor Maintenance % are actually branch-level KPIs.
  const branchPositions = ['Maintenance Operations Manager', 'Maintenance Quality Specialist'];
  const isBranchKpi =
    kpi.scope === 'individual' &&
    branchPositions.includes(position?.title) &&
    (kpi.name === 'Net Maintenance Growth' || kpi.name === 'Direct Labor Maintenance %');
  if (isBranchKpi) {
    const branchColors = {
      'Phoenix - North':     { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      'Phoenix - SouthWest': { bg: 'bg-blue-100',  text: 'text-blue-700',  border: 'border-blue-200' },
      'Phoenix - SouthEast': { bg: 'bg-red-100',   text: 'text-red-700',   border: 'border-red-200' },
    };
    const colors = branchColors[previewBranch] || { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' };
    scope = {
      label: previewBranch ? `Branch - ${previewBranch}` : 'Branch',
      ...colors,
    };
  }
  // Department badge for hard-coded department-scoped KPIs (e.g. Net Controllable Income Goal).
  // Department is derived from the position title since these KPIs are hardcoded per role.
  const positionDepartmentMap = {
    'Arbor Manager': 'Arbor',
    'Spray Manager': 'Spray',
    'Senior Manager of Maintenance Operations': 'Enhancements',
  };
  const positionDepartment = positionDepartmentMap[position?.title] || null;
  const isDepartmentKpi =
    kpi.name === 'Net Controllable Income Goal' && positionDepartment != null;
  const departmentColors = {
    Arbor:        { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200' },
    Spray:        { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200' },
    Irrigation:   { bg: 'bg-sky-100',    text: 'text-sky-700',    border: 'border-sky-200' },
    Enhancements: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  };
  const deptBadgeColors = departmentColors[positionDepartment] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };

  // Per-user KPI picker (admin-only). Mirrors the branch picker pattern.
  // Driven by kpi.userOptions ([{email,name}]) and kpi.userValues
  // ({ [email]: { Q1: {actual,locked}, ..., Annual: {...} } }).
  const isPerUserKpi = isAdmin && Array.isArray(kpi.userOptions) && kpi.userOptions.length > 0;
  const [previewUserEmail, setPreviewUserEmail] = useState(null);
  const handleUserSelect = (email) => {
    setPreviewUserEmail(email || null);
    if (!email) return;
    const v = (kpi.userValues || {})[email];
    if (!v) return;
    const periodToIdx = { Q1: 0, Q2: 1, Q3: 2, Q4: 3 };
    ['Q1','Q2','Q3','Q4'].forEach(p => {
      if (v[p]?.actual != null && handleQuarterChange && kpi.quarters?.[periodToIdx[p]]) {
        handleQuarterChange(positionKey, index, kpi.quarters[periodToIdx[p]].id, v[p].actual);
      }
    });
    if (v.Annual?.actual != null && handleAnnualChange) {
      handleAnnualChange(positionKey, index, v.Annual.actual);
    }
  };

  const branchOptions = kpi.branchQ1Values ? Object.keys(kpi.branchQ1Values) : [];
  const canToggleBranch = isBranchKpi && isAdmin && branchOptions.length > 0;
  const handleBranchSelect = (branch) => {
    setPreviewBranch(branch);
    const val = kpi.branchQ1Values?.[branch];
    if (val != null && handleQuarterChange && kpi.quarters?.[0]) {
      handleQuarterChange(positionKey, index, kpi.quarters[0].id, val);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      {/* Header: Title + Total Bonus */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 mr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center gap-1 focus:outline-none"
              aria-expanded={!collapsed}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <h3 className="text-sm md:text-lg font-semibold text-gray-800">{kpi.name}</h3>
            </button>
            {canToggleBranch ? (
              <select
                value={previewBranch || ''}
                onChange={(e) => handleBranchSelect(e.target.value)}
                title="Switch branch (admin)"
                className={`px-2 py-0.5 rounded text-xs font-medium border cursor-pointer ${scope.bg} ${scope.text} ${scope.border} focus:outline-none`}
              >
                {!previewBranch && <option value="">— Select branch —</option>}
                {branchOptions.map(b => (
                  <option key={b} value={b}>Branch - {b}</option>
                ))}
              </select>
            ) : (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${scope.bg} ${scope.text} ${scope.border}`}>
                {scope.label}
              </span>
            )}
            {isPerUserKpi && (
              <select
                value={previewUserEmail || ''}
                onChange={(e) => handleUserSelect(e.target.value)}
                title="View as user (admin)"
                className="px-2 py-0.5 rounded text-xs font-medium border bg-indigo-100 text-indigo-700 border-indigo-200 cursor-pointer focus:outline-none"
              >
                <option value="">— View as user —</option>
                {kpi.userOptions.map(u => (
                  <option key={u.email} value={u.email}>{u.name}</option>
                ))}
              </select>
            )}
            {isDepartmentKpi && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${deptBadgeColors.bg} ${deptBadgeColors.text} ${deptBadgeColors.border}`}
                title="Department scope for this KPI"
              >
                {`Department - ${positionDepartment}`}
              </span>
            )}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200 ${onWeightChange ? 'cursor-pointer hover:bg-gray-200' : ''}`}
              title="Weighting of KPI"
              onClick={() => { if (onWeightChange) { setWeightInput(String(kpi.weight)); setEditingWeight(true); } }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477 6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
              </svg>
              {editingWeight ? (
                <input
                  type="number"
                  className="w-10 bg-white border border-gray-300 rounded text-xs text-center py-0 px-0.5 focus:outline-none focus:border-blue-400"
                  value={weightInput}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setWeightInput(e.target.value)}
                  onBlur={() => {
                    const val = parseFloat(weightInput);
                    if (!isNaN(val) && val >= 0 && val <= 100) {
                      onWeightChange(positionKey, index, val);
                    }
                    setEditingWeight(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.target.blur(); }
                    if (e.key === 'Escape') { setEditingWeight(false); }
                  }}
                />
              ) : (
                <>{kpi.weight}%</>
              )}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{kpi.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500">Total Bonus</p>
          <p className={`text-lg font-bold ${periodBonus.total > 0 ? 'text-green-600' : 'text-gray-400'}`}>
            {formatCurrency(periodBonus.total)}
          </p>
          <p className="text-xs text-gray-500">of {formatCurrency(totalMax)}</p>
        </div>
      </div>

      {/* Collapsible content */}
      {!collapsed && (<>
      {/* Quarter-based Incentives */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quarter-based Incentives</span>
          <span className="text-xs text-gray-500">
            Target: {formatKPIActual(kpi.quarters[0]?.target, kpi.unit)}
            {kpi.dollarTarget && <span className="ml-1 text-gray-500">({formatCurrency(kpi.dollarTarget / 4)})</span>}
            {kpi.isInverse && <span className="ml-1 text-gray-400">(lower is better)</span>}
          </span>
        </div>

        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
          {kpi.quarters.map((q) => {
            const qBonus = periodBonus.quarterBonuses[q.id] || 0;
            const onTarget = isQuarterOnTarget(q);
            const qMin = getQuarterFloorForKPI(kpi.name);
            const qMax = getMaxValueForKPI(kpi.name);
            const qMonthRange = QUARTER_MONTHS[q.id];
            const qProration = qMonthRange
              ? getProrationMonths(eligibilityDate, qMonthRange[0], qMonthRange[1])
              : null;
            const showQProration = qProration && qProration.eligibleMonths < qProration.totalMonths;

            return (
              <div key={q.id} className="grid grid-cols-12 gap-2 items-center px-3 py-2">
                {/* Period label */}
                <div className="col-span-2 sm:col-span-2">
                  <span className="text-xs font-medium text-black">{q.id}</span>
                  <span className="text-xs text-black ml-1 hidden sm:inline">{q.period}</span>
                </div>

                {/* Progress bar — now draggable */}
                <div className="col-span-3 sm:col-span-3 flex items-center">
                  <ProgressBar
                    actual={q.actual}
                    target={q.target}
                    isInverse={kpi.isInverse}
                    kpiName={kpi.name}
                    min={qMin}
                    max={qMax}
                    step={kpi.stepSize}
                    onChange={(val) => handleQuarterChange(positionKey, index, q.id, val)}
                  />
                </div>

                {/* Actual value + target */}
                <div className="col-span-2 sm:col-span-2 flex items-center justify-center gap-1">
                  <span className={`text-xs font-medium ${onTarget ? 'text-green-600' : 'text-black'}`}>
                    {formatKPIActual(q.actual, kpi.unit)}
                  </span>
                  <span className="inline-flex items-center text-xs text-orange-500" title="Target">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-2a4 4 0 100-8 4 4 0 000 8zm0-2a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {formatKPIActual(q.target, kpi.unit)}
                  </span>
                  {kpi.dollarTarget && <span className="text-xs text-gray-500">({formatCurrency(kpi.dollarTarget / 4)})</span>}
                </div>

                {/* +/- buttons */}
                <div className="col-span-2 sm:col-span-2 flex justify-center">
                  <button
                    onClick={() => handleQuarterDecrement(positionKey, index, q.id)}
                    className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 rounded-l border border-gray-300 text-xs"
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleQuarterIncrement(positionKey, index, q.id)}
                    className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 rounded-r border-t border-r border-b border-gray-300 text-xs"
                  >
                    +
                  </button>
                </div>

                {/* Bonus earned / available + check */}
                <div className="col-span-3 sm:col-span-3 flex items-center justify-end space-x-1">
                  {showQProration && (
                    <span
                      className="text-[10px] font-medium text-amber-600 italic mr-1"
                      title={`Eligible for ${qProration.eligibleMonths} of ${qProration.totalMonths} months this quarter`}
                    >
                      Pro-rated {qProration.eligibleMonths}/{qProration.totalMonths}
                    </span>
                  )}
                  {kpi.lockedQuarters?.includes(q.id) && <LockIcon />}
                  <span className={`text-xs font-medium ${qBonus > 0 ? 'text-green-600' : 'text-black'}`}>
                    {formatCurrency(qBonus)}
                  </span>
                  <span className="text-xs text-black">/ {formatCurrency(perQuarterMax)}</span>
                  {onTarget && q.actual > 0 && <CheckIcon />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Year-Performance */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-3 mb-3">
        <div className="grid grid-cols-12 gap-2 items-center">
          {/* Label */}
          <div className="col-span-2 sm:col-span-2">
            <span className="text-xs font-medium text-blue-800">Full Year-Performance</span>
          </div>

          {/* Progress bar — now draggable */}
          <div className="col-span-3 sm:col-span-3 flex items-center">
            <ProgressBar
              actual={kpi.annual.actual}
              target={kpi.annual.target}
              isInverse={kpi.isInverse}
              variant="annual"
              kpiName={kpi.name}
              min={getAnnualMinValueForKPI(kpi.name)}
              max={getAnnualMaxValueForKPI(kpi.name)}
              step={kpi.stepSize}
              onChange={(val) => handleAnnualChange(positionKey, index, val)}
            />
          </div>

          {/* Actual value + target */}
          <div className="col-span-2 sm:col-span-2 flex items-center justify-center gap-1">
            <span className={`text-xs font-medium ${isAnnualOnTarget() && kpi.annual.actual > 0 ? 'text-blue-800' : 'text-blue-800'}`}>
              {formatKPIActual(kpi.annual.actual, kpi.unit)}
            </span>
            <span className="inline-flex items-center text-xs text-orange-500" title="Target">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-2a4 4 0 100-8 4 4 0 000 8zm0-2a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {formatKPIActual(kpi.annual.target, kpi.unit)}
            </span>
            {kpi.dollarTarget && <span className="text-xs text-gray-500 ml-1">({formatCurrency(kpi.dollarTarget)})</span>}
          </div>

          {/* +/- buttons */}
          <div className="col-span-2 sm:col-span-2 flex justify-center">
            <button
              onClick={() => handleAnnualDecrement(positionKey, index)}
              className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 rounded-l border border-blue-200 text-xs text-blue-700"
            >
              -
            </button>
            <button
              onClick={() => handleAnnualIncrement(positionKey, index)}
              className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 rounded-r border-t border-r border-b border-blue-200 text-xs text-blue-700"
            >
              +
            </button>
          </div>

          {/* Bonus / available + pay date */}
          <div className="col-span-3 sm:col-span-3 flex items-center justify-end space-x-1">
            {kpi.lockedAnnual && <LockIcon />}
            <span className={`text-xs font-medium ${periodBonus.annualBonus > 0 ? 'text-blue-800' : 'text-blue-800'}`}>
              {formatCurrency(periodBonus.annualBonus)}
            </span>
            <span className="text-xs text-blue-800">/ {formatCurrency(annualMax)}</span>
            {isAnnualOnTarget() && kpi.annual.actual > 0 && <CheckIcon />}
            <span className="text-xs text-blue-800 hidden sm:inline ml-1">{kpi.annualPayDate}</span>
          </div>
        </div>
      </div>

      {/* Success Factors section */}
      {kpi.successFactors && kpi.successFactors.length > 0 && (
        <>
          <div className="border-t border-gray-200 mt-2 mb-2"></div>

          <div
            className="flex items-center cursor-pointer py-1 px-2 hover:bg-gray-50 rounded-md transition-colors"
            onClick={() => toggleSuccessFactors(positionKey, index)}
            aria-expanded={expandedSuccessFactors[`${positionKey}-${index}`] || false}
            role="button"
            tabIndex={0}
          >
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Success Factors
            </h4>
            <div className="text-blue-500 flex items-center ml-2">
              <span className="text-xs mr-1 text-blue-600">
                {expandedSuccessFactors[`${positionKey}-${index}`] ? 'Hide' : 'Show'}
              </span>
              {expandedSuccessFactors[`${positionKey}-${index}`] ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expandedSuccessFactors[`${positionKey}-${index}`]
                ? 'max-h-96 opacity-100'
                : 'max-h-0 opacity-0'
            }`}
          >
            <div className="bg-blue-50 p-3 rounded-lg mt-2">
              <ul className="space-y-2">
                {kpi.successFactors.map((factor, factorIndex) => (
                  <li key={factorIndex} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Success Guide section — collapsible long-form explainer */}
      {kpi.successGuide && (
        <>
          <div className="border-t border-gray-200 mt-2 mb-2"></div>

          <div
            className="flex items-center cursor-pointer py-1 px-2 hover:bg-gray-50 rounded-md transition-colors"
            onClick={() => setGuideExpanded(!guideExpanded)}
            aria-expanded={guideExpanded}
            role="button"
            tabIndex={0}
          >
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              KPI Success Guide
            </h4>
            <div className="text-green-500 flex items-center ml-2">
              <span className="text-xs mr-1 text-green-600">
                {guideExpanded ? 'Hide' : 'Show'}
              </span>
              {guideExpanded ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>

          {guideExpanded && (
            <div
              className="bg-green-50 p-4 rounded-lg mt-2 text-sm text-gray-700 leading-relaxed max-h-[600px] overflow-y-auto prose prose-sm max-w-none
                prose-headings:text-sm prose-headings:font-bold prose-headings:text-gray-800 prose-headings:mt-3 prose-headings:mb-1
                prose-p:my-1 prose-ul:my-1 prose-li:my-0.5"
            >
              <ReactMarkdown>{kpi.successGuide}</ReactMarkdown>
            </div>
          )}
        </>
      )}
      </>)}
    </div>
  );
};

export default KPICard;
