// src/components/KPIDashboard/components/PositionHeader.jsx

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import { getHeaderColor, getPerformanceStatusColor } from '../utils/styles';
import { getKpiSummary } from '../utils/kpiHelpers';
import { calculateTotalBonus, calculateActualTotalBonus, calculateKpiBonus } from '../utils/bonusCalculations';

/**
 * Position Header Component
 * Displays salary, bonus info, KPI summary, and bonus breakdown
 */
const PositionHeader = ({
  activeTab,
  position,
  handleSalaryChange,
  handleBonusPercentageChange,
  expandedBreakdown,
  setExpandedBreakdown
}) => {
  const summary = getKpiSummary(position);
  
  // State for formatted salary display
  const [displaySalary, setDisplaySalary] = useState(position.salary.toLocaleString('en-US'));
  
  // Update display when position changes
  useEffect(() => {
    setDisplaySalary(position.salary.toLocaleString('en-US'));
  }, [position.salary]);
  
  // Handle salary input changes
  const handleSalaryInputChange = (e) => {
    const value = e.target.value;
    
    // Allow user to clear the field
    if (value === '') {
      setDisplaySalary('');
      handleSalaryChange(activeTab, '0');
      return;
    }
    
    // Remove all non-numeric characters except commas
    const cleanedValue = value.replace(/[^\d,]/g, '');
    
    // Remove commas for processing
    const numericValue = cleanedValue.replace(/,/g, '');
    
    // Update the display with commas
    if (numericValue) {
      const numberValue = parseInt(numericValue, 10);
      setDisplaySalary(numberValue.toLocaleString('en-US'));
      handleSalaryChange(activeTab, numericValue);
    } else {
      setDisplaySalary(cleanedValue);
    }
  };
  
  return (
    <div className={`p-4 rounded-lg shadow-md mb-6 sticky top-0 z-10 ${getHeaderColor(activeTab)}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <h3 className="text-xs md:text-lg font-semibold text-gray-800">Annual Salary</h3>
          <div className="flex items-center mt-2">
            <span className="text-gray-500 mr-1">$</span>
            <input
              type="text"
              value={displaySalary}
              onChange={handleSalaryInputChange}
              className="w-full border border-gray-300 rounded px-2 py-1 text-base md:text-xl font-bold text-gray-900 bg-white"
            />
          </div>
        </div>
        <div>
          <h3 className="text-xs md:text-lg font-semibold text-gray-800">Bonus %</h3>
          <div className="flex items-center mt-2">
            <input
              type="number"
              value={position.bonusPercentage}
              onChange={(e) => handleBonusPercentageChange(activeTab, e.target.value)}
              className="w-24 border border-gray-300 rounded px-2 py-1 text-base md:text-xl font-bold text-blue-600 bg-white"
              min="0"
              max="100"
              step="0.5"
            />
            <span className="text-blue-600 text-base md:text-xl font-bold ml-1">%</span>
          </div>
        </div>
        <div>
          <h3 className="text-xs md:text-lg font-semibold text-gray-800">Projected Bonus</h3>
          <p className="text-lg md:text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(calculateActualTotalBonus(position))}
          </p>
        </div>
        <div>
          <h3 className="text-xs md:text-lg font-semibold text-gray-800">Available Bonus</h3>
          <p className="text-lg md:text-2xl font-bold text-blue-600 mt-2">
            {formatCurrency(calculateTotalBonus(position))}
          </p>
        </div>
      </div>
      
      {/* KPI Summary - Compact Version */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">
            <span className="font-medium">{summary.onTarget}</span> of <span className="font-medium">{summary.total}</span> KPIs on target
            {summary.onTarget === summary.total && 
              <span className="ml-1 text-green-600 font-medium">(All targets met!)</span>
            }
          </span>
          
          <div className="flex-1 mr-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  summary.percent === 100 ? 'bg-green-500' :
                  summary.percent >= 75 ? 'bg-green-400' :
                  summary.percent >= 50 ? 'bg-yellow-400' :
                  summary.percent >= 25 ? 'bg-orange-400' : 
                  'bg-red-400'
                }`}
                style={{ width: `${summary.percent}%` }}
              ></div>
            </div>
          </div>
          
          <span className={`text-xs font-medium ${getPerformanceStatusColor(summary.percent)} min-w-[70px] text-right`}>
            {summary.percent}% on Track
          </span>
        </div>
      </div>
      
      {/* KPI Current Bonus Breakdown - Toggleable */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div 
            className="flex items-center cursor-pointer py-1 px-2 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setExpandedBreakdown(!expandedBreakdown)}
          >
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              KPI Current Bonus Breakdown
            </h4>
            <div className="text-blue-500 flex items-center ml-2">
              <span className="text-xs mr-1 text-blue-600">
                {expandedBreakdown ? 'Hide' : 'Show'}
              </span>
              {expandedBreakdown ? (
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
          
          {/* Period indicator - hidden on mobile */}
          <div className="hidden md:flex items-center text-xs bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200 text-blue-700 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Period: <span className="font-medium">Jan-Dec 2025</span></span>
          </div>
        </div>
        
        {/* KPI Breakdown Content - with smooth animation */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            expandedBreakdown 
              ? 'max-h-96 opacity-100 mt-2' 
              : 'max-h-0 opacity-0'
          }`}
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-4">
            {position.kpis.map((kpi, index) => {
              const kpiBonus = calculateKpiBonus(position, index);
              const maxKpiBonus = calculateTotalBonus(position) / position.kpis.length;
              const percentage = Math.round((kpiBonus / maxKpiBonus) * 100);
              
              return (
                <div key={index} className="bg-white p-2 rounded shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600 truncate" title={kpi.name}>
                      {kpi.name}
                    </span>
                    <span className={`text-xs font-bold ${
                      percentage >= 90 ? 'text-green-600' : 
                      percentage >= 50 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {formatCurrency(kpiBonus)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full ${
                        percentage >= 90 ? 'bg-green-500' :
                        percentage >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionHeader;