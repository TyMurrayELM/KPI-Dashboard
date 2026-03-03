// src/components/KPIDashboard/components/KPICard.jsx

import React, { useRef, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { formatCurrency, formatKPIActual } from '../utils/formatters';
import { computePeriodBonusMax } from '../utils/bonusCalculations';
import { getMinValueForKPI, getMaxValueForKPI, getAnnualMaxValueForKPI, getQuarterFloorForKPI, getAnnualMinValueForKPI } from '../utils/kpiHelpers';

/**
 * Green checkmark SVG — shown when a quarter/annual target is met.
 */
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
        // pct = actual / 10 * 100 (0-10 range)
        raw = ratio * 10;
      }
    } else if (kpiName === 'Extra Services Revenue') {
      // pct = (actual - 80) / (140 - 80) * 100
      raw = 80 + ratio * (140 - 80);
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
      // Quarterly: 0-10% range
      pct = actual <= 0 ? 0 : Math.min(100, (actual / 10) * 100);
    }
  } else if (kpiName === 'Extra Services Revenue') {
    pct = actual <= 80 ? 0 : Math.min(100, ((actual - 80) / (140 - 80)) * 100);
  } else if (isInverse) {
    pct = actual <= target ? 100 : Math.max(0, (target / actual) * 100);
  } else {
    pct = Math.min(100, (actual / target) * 100);
  }

  let barColor;
  if (kpiName === 'Net Maintenance Growth') {
    if (variant === 'annual') {
      barColor = actual >= 24 ? 'bg-green-500' : actual >= 16 ? 'bg-yellow-400' : actual > 10 ? 'bg-red-300' : 'bg-gray-300';
    } else {
      barColor = actual >= 6 ? 'bg-green-500' : actual >= 4 ? 'bg-yellow-400' : actual > 0 ? 'bg-red-300' : 'bg-gray-300';
    }
  } else if (kpiName === 'Extra Services Revenue') {
    barColor = actual >= 120 ? 'bg-green-500' : actual >= 100 ? 'bg-yellow-400' : actual > 80 ? 'bg-red-300' : 'bg-gray-300';
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
  calculateTotalBonus
}) => {
  const [guideExpanded, setGuideExpanded] = useState(false);
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
  const scope = scopeConfig[kpi.scope] || scopeConfig.individual;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      {/* Header: Title + Total Earned */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 mr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm md:text-lg font-semibold text-gray-800">{kpi.name}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${scope.bg} ${scope.text} ${scope.border}`}>
              {scope.label}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200" title="Weighting of KPI">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477 6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
              </svg>
              {kpi.weight}%
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{kpi.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500">Total Earned</p>
          <p className={`text-lg font-bold ${periodBonus.total > 0 ? 'text-green-600' : 'text-gray-400'}`}>
            {formatCurrency(periodBonus.total)}
          </p>
          <p className="text-xs text-gray-500">of {formatCurrency(totalMax)}</p>
        </div>
      </div>

      {/* Quarterly Payments */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quarterly Payments</span>
          <span className="text-xs text-gray-500">
            Target: {formatKPIActual(kpi.quarters[0]?.target, kpi.unit)}
            {kpi.isInverse && <span className="ml-1 text-gray-400">(lower is better)</span>}
          </span>
        </div>

        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
          {kpi.quarters.map((q) => {
            const qBonus = periodBonus.quarterBonuses[q.id] || 0;
            const onTarget = isQuarterOnTarget(q);
            const qMin = getQuarterFloorForKPI(kpi.name);
            const qMax = getMaxValueForKPI(kpi.name);

            return (
              <div key={q.id} className="grid grid-cols-12 gap-2 items-center px-3 py-2">
                {/* Period label */}
                <div className="col-span-2 sm:col-span-2">
                  <span className="text-xs font-medium text-gray-700">{q.id}</span>
                  <span className="text-xs text-gray-400 ml-1 hidden sm:inline">{q.period}</span>
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
                  <span className={`text-xs font-medium ${onTarget ? 'text-green-600' : q.actual > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                    {formatKPIActual(q.actual, kpi.unit)}
                  </span>
                  <span className="inline-flex items-center text-xs text-orange-500" title="Target">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-2a4 4 0 100-8 4 4 0 000 8zm0-2a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {formatKPIActual(q.target, kpi.unit)}
                  </span>
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
                  <span className={`text-xs font-medium ${qBonus > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {formatCurrency(qBonus)}
                  </span>
                  <span className="text-xs text-gray-400">/ {formatCurrency(perQuarterMax)}</span>
                  {onTarget && q.actual > 0 && <CheckIcon />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Year-End / Annual Payment */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-3 mb-3">
        <div className="grid grid-cols-12 gap-2 items-center">
          {/* Label */}
          <div className="col-span-2 sm:col-span-2">
            <span className="text-xs font-medium text-blue-700">Annual</span>
            <span className="text-xs text-blue-400 ml-1 hidden sm:inline">Year-End</span>
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
            <span className={`text-xs font-medium ${isAnnualOnTarget() && kpi.annual.actual > 0 ? 'text-blue-700' : 'text-gray-500'}`}>
              {formatKPIActual(kpi.annual.actual, kpi.unit)}
            </span>
            <span className="inline-flex items-center text-xs text-orange-500" title="Target">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-2a4 4 0 100-8 4 4 0 000 8zm0-2a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {formatKPIActual(kpi.annual.target, kpi.unit)}
            </span>
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
            <span className={`text-xs font-medium ${periodBonus.annualBonus > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
              {formatCurrency(periodBonus.annualBonus)}
            </span>
            <span className="text-xs text-blue-400">/ {formatCurrency(annualMax)}</span>
            {isAnnualOnTarget() && kpi.annual.actual > 0 && <CheckIcon />}
            <span className="text-xs text-blue-400 hidden sm:inline ml-1">{kpi.annualPayDate}</span>
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
    </div>
  );
};

export default KPICard;
