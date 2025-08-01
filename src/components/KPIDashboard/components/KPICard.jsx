// src/components/KPIDashboard/components/KPICard.jsx

import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { 
  getMinValueForKPI, 
  getMaxValueForKPI, 
  isKpiOnTarget, 
  getProgressStatusText, 
  getSliderColorClass 
} from '../utils/kpiHelpers';
import { calculateTotalBonus, calculateKpiBonus } from '../utils/bonusCalculations';

/**
 * Individual KPI Card Component
 * Displays a single KPI with slider, status, and bonus impact
 */
const KPICard = ({ 
  kpi, 
  index, 
  position, 
  positionKey, 
  handleSliderChange, 
  handleIncrementKPI, 
  handleDecrementKPI, 
  expandedSuccessFactors, 
  toggleSuccessFactors 
}) => {
  const kpiBonus = calculateKpiBonus(position, index);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h3 className="text-sm md:text-lg font-semibold text-gray-800">{kpi.name}</h3>
      <p className="text-sm text-gray-600 mt-1 mb-3">{kpi.description}</p>
      
      {/* Responsive grid for KPI details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Target section - stacks on mobile, becomes a column on desktop */}
        <div className="mb-3 md:mb-0">
          <p className="text-xs text-gray-500">Target</p>
          <p className="text-md font-medium text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-2a4 4 0 100-8 4 4 0 000 8zm0-2a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {kpi.target}%
          </p>
          <div className="flex items-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477 6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-700 font-medium">Weighting: {kpi.weight}%</span>
          </div>
        </div>
        
        {/* Actual section with slider - spans 2 columns on desktop */}
        <div className="col-span-1 md:col-span-2 mb-3 md:mb-0">
          <p className="text-xs text-gray-500 mb-2">Actual</p>
          <div className="flex flex-col">
            {/* Mobile and desktop slider layout */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-2">
              <div className="flex-1 w-full mb-2 sm:mb-0 sm:mr-4">
                <input 
                  type="range" 
                  min={getMinValueForKPI(kpi.name)}
                  max={getMaxValueForKPI(kpi.name)}
                  value={kpi.actual}
                  onChange={(e) => handleSliderChange(positionKey, index, e.target.value)}
                  className={`w-full ${getSliderColorClass(kpi)}`}
                  style={{
                    '--track-fill': kpi.isInverse 
                      ? `${100 - ((kpi.actual - getMinValueForKPI(kpi.name)) / (getMaxValueForKPI(kpi.name) - getMinValueForKPI(kpi.name)) * 100)}%` 
                      : `${((kpi.actual - getMinValueForKPI(kpi.name)) / (getMaxValueForKPI(kpi.name) - getMinValueForKPI(kpi.name)) * 100)}%`
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between w-full sm:w-auto">
                <span className={`font-medium min-w-[40px] text-center mr-4 sm:mr-2 ${
                  isKpiOnTarget(kpi) ? 'text-green-600' : 'text-gray-800'
                }`}>{kpi.actual}%</span>
                
                <div className="flex">
                  <button 
                    onClick={() => handleDecrementKPI(positionKey, index)} 
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-l border border-gray-300"
                  >
                    -
                  </button>
                  <button 
                    onClick={() => handleIncrementKPI(positionKey, index)} 
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-r border-t border-r border-b border-gray-300"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            
            {/* Status text */}
            {kpi.name === 'Client Retention %' || kpi.name === 'Punch List Creation' ? (
              <div className={`mt-1 text-xs ${getProgressStatusText(kpi).color}`}>
                {getProgressStatusText(kpi).text}
              </div>
            ) : kpi.name === 'Extra Services' ? (
              <div className={`mt-1 text-xs ${getProgressStatusText(kpi).color}`}>
                {getProgressStatusText(kpi).text}
              </div>
            ) : kpi.name === 'Total Gross Margin % on Completed Jobs' ? (
              <div className={`mt-1 text-xs ${kpi.actual < 60 ? "text-red-600" : kpi.actual >= 70 ? "text-green-600" : "text-yellow-600"}`}>
                {kpi.actual < 60 ? 
                  "Below 60% target (0% bonus)" : 
                  kpi.actual === 60 ? 
                    "At minimum target (50% bonus)" : 
                    kpi.actual >= 70 ? 
                      "Maximum bonus reached" : 
                      `${50 + Math.round(((kpi.actual - 60) / 10) * 50)}% of bonus`
                }
              </div>
            ) : kpi.name === 'Direct Labor Maintenance %' ? (
              <div className={`mt-1 text-xs ${kpi.actual > 40 ? "text-red-600" : kpi.actual <= 38 ? "text-green-600" : "text-yellow-600"}`}>
                {kpi.actual > 40 ? 
                  "Above 40% target (0% bonus)" : 
                  kpi.actual === 40 ? 
                    "At target (50% bonus)" : 
                    kpi.actual <= 38 ? 
                      "Maximum bonus reached" : 
                      `${50 + Math.round(((40 - kpi.actual) / 2) * 50)}% of bonus`
                }
              </div>
            ) : kpi.name === 'LV Maintenance Growth' ? (
              <div className={`mt-1 text-xs ${kpi.actual < 3 ? "text-yellow-600" : "text-green-600"}`}>
                {kpi.actual < 3 ? 
                  `${Math.round((kpi.actual / 3) * 100)}% of bonus` : 
                  "At or above 3% target (full bonus)"
                }
              </div>
            ) : null}
            
            {kpi.name === 'Property Checklist Item Completion' ? (
              <div className={`mt-1 text-xs ${kpi.actual < 80 ? "text-red-600" : kpi.actual >= 100 ? "text-green-600" : "text-yellow-600"}`}>
                {kpi.actual < 80 ? 
                  "Below 80% target (0% bonus)" : 
                  kpi.actual === 80 ? 
                    "At minimum target (50% bonus)" : 
                    kpi.actual >= 100 ? 
                      "Maximum bonus reached" : 
                      `${50 + Math.round(((kpi.actual - 80) / 20) * 50)}% of bonus`
                }
              </div>
            ) : kpi.name === 'Fleet Uptime Rate' ? (
              <div className={`mt-1 text-xs ${kpi.actual < 90 ? "text-red-600" : kpi.actual >= 98 ? "text-green-600" : "text-yellow-600"}`}>
                {kpi.actual < 90 ? 
                  "Below 90% (0% bonus)" : 
                  kpi.actual === 90 ? 
                    "At 90% (25% bonus)" :
                    kpi.actual < 95 ?
                      `${25 + Math.round(((kpi.actual - 90) / 5) * 50)}% of bonus` :
                    kpi.actual === 95 ?
                      "At target (75% bonus)" :
                    kpi.actual >= 98 ?
                      "Maximum bonus reached" :
                      `${75 + Math.round(((kpi.actual - 95) / 3) * 25)}% of bonus`
                }
              </div>
            ) : kpi.name === 'Preventative vs. Reactive Maintenance Ratio' ? (
              <div className={`mt-1 text-xs ${kpi.actual < 70 ? "text-red-600" : kpi.actual >= 90 ? "text-green-600" : "text-yellow-600"}`}>
                {kpi.actual < 70 ? 
                  "Below 70% (0% bonus)" : 
                  kpi.actual < 80 ? 
                    `${Math.round(((kpi.actual - 70) / 10) * 75)}% of bonus` :
                  kpi.actual === 80 ? 
                    "At target (75% bonus)" :
                  kpi.actual >= 90 ?
                    "Maximum bonus reached" :
                    `${75 + Math.round(((kpi.actual - 80) / 10) * 25)}% of bonus`
                }
              </div>
            ) : kpi.name === 'Accident/Incident Rate' ? (
              <div className={`mt-1 text-xs ${kpi.actual > 10 ? "text-red-600" : kpi.actual <= 5 ? "text-green-600" : "text-yellow-600"}`}>
                {kpi.actual > 10 ? 
                  "Above 10 (0% bonus)" : 
                  kpi.actual > 7 ? 
                    `${Math.round(((10 - kpi.actual) / 3) * 50)}% of bonus` :
                  kpi.actual === 7 ? 
                    "At 7 (50% bonus)" :
                  kpi.actual <= 5 ?
                    "At or below target (full bonus)" :
                    `${50 + Math.round(((7 - kpi.actual) / 2) * 50)}% of bonus`
                }
              </div>
            ) : null}
            
            {kpi.name === 'Sales Goal Met' ? (
              <div className={`mt-1 text-xs ${kpi.actual < 50 ? "text-red-600" : kpi.actual >= 100 ? "text-green-600" : "text-yellow-600"}`}>
                {kpi.actual < 50 ? 
                  "Below 50% target (limited bonus)" : 
                  kpi.actual < 100 ? 
                    `${Math.round((kpi.actual / kpi.target) * 100)}% of bonus` : 
                    "At or above target (full bonus)"
                }
              </div>
            ) : kpi.name === 'Arbor/Enhancement Process Followed' ? (
              <div className={`mt-1 text-xs ${kpi.actual < 90 ? "text-red-600" : kpi.actual >= 95 ? "text-green-600" : "text-yellow-600"}`}>
                {kpi.actual < 90 ? 
                  "Below 90% target (0% bonus)" : 
                  kpi.actual === 90 ? 
                    "At 90% (50% bonus)" :
                  kpi.actual < 95 ? 
                    `${50 + Math.round(((kpi.actual - 90) / 5) * 50)}% of bonus` : 
                    "At or above target (100% bonus)"
                }
              </div>
            ) : kpi.name === 'Pipeline Updates Current' ? (
              <div className={`mt-1 text-xs ${kpi.actual < 90 ? "text-red-600" : kpi.actual >= 100 ? "text-green-600" : "text-yellow-600"}`}>
                {kpi.actual < 90 ? 
                  "Below 90% target (0% bonus)" : 
                  kpi.actual === 90 ? 
                    "At 90% (50% bonus)" :
                  kpi.actual < 100 ? 
                    `${50 + Math.round(((kpi.actual - 90) / 10) * 50)}% of bonus` : 
                    "At or above target (100% bonus)"
                }
              </div>
            ) : null}
          </div>
        </div>
        
        {/* Bonus Impact section */}
        <div>
          <p className="text-xs text-gray-500">Bonus Impact</p>
          <div>
            <p className={`text-md font-medium ${
              (kpi.isInverse && kpi.actual <= kpi.target) || 
              (!kpi.isInverse && kpi.actual >= kpi.target) ? 
              'text-green-600' : 'text-yellow-600'}`}>
              {formatCurrency(kpiBonus)}
              <span className="ml-1">
                {(kpi.isInverse && kpi.actual <= kpi.target) || (!kpi.isInverse && kpi.actual >= kpi.target) ? 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg> : 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                }
              </span>
            </p>
            <p className="text-xs text-gray-500">
              (Max: {formatCurrency(calculateTotalBonus(position) / position.kpis.length)})
            </p>
          </div>
        </div>
      </div>

      {/* Success Factors section - only show for KPIs that have success factors */}
      {kpi.successFactors && (
        <>
          {/* Divider */}
          <div className="border-t border-gray-200 mt-4 mb-3"></div>
          
          {/* Success Factors toggle header */}
          <div 
            className="mt-3 flex items-center cursor-pointer py-1 px-2 hover:bg-gray-50 rounded-md transition-colors"
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
          
          {/* Success Factors content - with smooth animation */}
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
    </div>
  );
};

export default KPICard;