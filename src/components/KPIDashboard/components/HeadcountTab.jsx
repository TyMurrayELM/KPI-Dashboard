// src/components/KPIDashboard/components/HeadcountTab.jsx

import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { calculateTotalBonus, calculateActualTotalBonus } from '../utils/bonusCalculations';

/**
 * Headcount & Financial Planning Tab Component
 * Manages headcount, salaries, and bonus forecasting
 */
const HeadcountTab = ({
  positions,
  headcount,
  bonusMultiplier,
  handleBonusMultiplierChange,
  handleHeadcountChange,
  handleBonusPercentageChange,
  calculateTotalPositionBonus,
  calculateGrandTotalBonus
}) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Headcount & Financial Planning</h2>
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-4">Bonus Forecast Slider</h3>
        <div className="flex items-center mb-2">
          <div className="flex-1 mr-4">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={bonusMultiplier}
              onChange={(e) => handleBonusMultiplierChange(e.target.value)}
              className="w-full h-8 rounded-lg appearance-none cursor-pointer"
              style={{
                backgroundColor: '#eef7ff',
                background: 'linear-gradient(to right, #4a90e2, #eef7ff)',
                backgroundSize: `${bonusMultiplier}% 100%`,
                transition: 'background 0.3s ease'
              }}
            />
          </div>
          <div className="flex items-center">
            <input
              type="number"
              value={bonusMultiplier}
              onChange={(e) => handleBonusMultiplierChange(e.target.value)}
              className="w-20 border border-gray-300 rounded px-2 py-1 text-lg font-bold text-blue-600 bg-white"
              min="0"
              max="100"
              step="5"
            />
            <span className="text-blue-600 text-lg font-bold ml-1">%</span>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Adjust this slider to forecast different bonus scenarios. The percentage represents how much of the total available bonus will be paid out.
          <br />
          <span className="flex mt-2 items-center">
            <span className="font-medium">Available Bonus Budget ({bonusMultiplier}%):</span>
            <span className="ml-2 font-bold text-blue-600">{formatCurrency(calculateGrandTotalBonus())}</span>
            <span className="mx-2">vs.</span>
            <span className="font-medium">Performance-Based Bonus:</span>
            <span className="ml-2 font-bold text-gray-800">{formatCurrency(
              Object.keys(positions).reduce((total, positionKey) => {
                const position = positions[positionKey];
                const count = headcount[positionKey];
                const performanceBasedBonus = calculateActualTotalBonus(position) * count;
                return total + performanceBasedBonus;
              }, 0)
            )}</span>
          </span>
        </p>
      </div>
      
      {/* Bonus Summary Table */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-4">Bonus Budget Summary</h3>
        
        {/* Mobile view - card layout */}
        <div className="md:hidden">
          {Object.keys(positions).map((positionKey) => {
            const position = positions[positionKey];
            const count = headcount[positionKey];
            const availableBonusPerPerson = calculateTotalBonus(position);
            const performanceBasedBonusPerPerson = calculateActualTotalBonus(position);
            
            // Calculate forecasted bonus based on slider
            const forecastedBonusPerPerson = availableBonusPerPerson * (bonusMultiplier / 100);
            const forecastedTotalBonus = forecastedBonusPerPerson * count;
            const performanceBasedTotalBonus = performanceBasedBonusPerPerson * count;
            
            const totalSalary = position.salary * count;
            const totalCompensation = totalSalary + forecastedTotalBonus;
            
            return (
              <div key={positionKey} className="mb-4 border rounded shadow-sm">
                <div className="bg-gray-100 p-2 border-b">
                  <h4 className="font-medium">{position.title}</h4>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <p className="text-xs text-gray-500">Headcount</p>
                      <div className="flex items-center justify-start mt-1">
                        <input
                          type="number"
                          value={headcount[positionKey]}
                          onChange={(e) => handleHeadcountChange(positionKey, e.target.value)}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm font-medium text-gray-900 bg-white text-center"
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Bonus %</p>
                      <div className="flex items-center justify-start mt-1">
                        <input
                          type="number"
                          value={position.bonusPercentage}
                          onChange={(e) => handleBonusPercentageChange(positionKey, e.target.value)}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm font-medium text-blue-600 bg-white text-center"
                          min="0"
                          max="100"
                          step="0.5"
                        />
                        <span className="text-blue-600 text-sm font-medium ml-1">%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <p className="text-xs text-gray-500">Avg Salary</p>
                      <p className="text-sm font-medium">{formatCurrency(position.salary)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Bonus Per Person</p>
                      <p className="text-sm font-medium">{formatCurrency(forecastedBonusPerPerson)}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Total Bonus</p>
                        <p className="text-sm font-medium text-blue-600">{formatCurrency(forecastedTotalBonus)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Compensation</p>
                        <p className="text-sm font-medium">{formatCurrency(totalCompensation)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Mobile Grand Total Card */}
          <div className="mt-4 bg-blue-50 p-3 rounded shadow-sm border border-blue-100">
            <h4 className="font-medium mb-2">Grand Total</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500">Total Bonus</p>
                <p className="text-sm font-bold text-blue-600">{formatCurrency(calculateGrandTotalBonus())}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Compensation</p>
                <p className="text-sm font-bold">{formatCurrency(
                  Object.keys(positions).reduce((total, positionKey) => {
                    const position = positions[positionKey];
                    const count = headcount[positionKey];
                    const totalSalary = position.salary * count;
                    const forecastedTotalBonus = calculateTotalBonus(position) * count * (bonusMultiplier / 100);
                    
                    return total + totalSalary + forecastedTotalBonus;
                  }, 0)
                )}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop view - regular table */}
        <div className="hidden md:block">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border text-left">Position</th>
                <th className="py-2 px-4 border text-center">Headcount</th>
                <th className="py-2 px-4 border text-center">Bonus %</th>
                <th className="py-2 px-4 border text-center">Bonus Per Person</th>
                <th className="py-2 px-4 border text-center">Avg Salary</th>
                <th className="py-2 px-4 border text-center">Total Bonus</th>
                <th className="py-2 px-4 border text-center">Total Compensation</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(positions).map((positionKey) => {
                const position = positions[positionKey];
                const count = headcount[positionKey];
                const availableBonusPerPerson = calculateTotalBonus(position);
                const performanceBasedBonusPerPerson = calculateActualTotalBonus(position);
                
                // Calculate forecasted bonus based on slider
                const forecastedBonusPerPerson = availableBonusPerPerson * (bonusMultiplier / 100);
                const forecastedTotalBonus = forecastedBonusPerPerson * count;
                const performanceBasedTotalBonus = performanceBasedBonusPerPerson * count;
                
                const totalSalary = position.salary * count;
                const totalCompensation = totalSalary + forecastedTotalBonus;
                
                return (
                  <tr key={positionKey} className="border-b">
                    <td className="py-2 px-4 border font-medium">{position.title}</td>
                    <td className="py-2 px-4 border">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          value={headcount[positionKey]}
                          onChange={(e) => handleHeadcountChange(positionKey, e.target.value)}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-lg font-medium text-gray-900 bg-white text-center"
                          min="0"
                          step="1"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-4 border text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          value={position.bonusPercentage}
                          onChange={(e) => handleBonusPercentageChange(positionKey, e.target.value)}
                          className="w-20 border border-gray-300 rounded px-2 py-1 font-medium text-blue-600 bg-white text-center"
                          min="0"
                          max="100"
                          step="0.5"
                        />
                        <span className="text-blue-600 font-medium ml-1">%</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 border text-right">
                      {formatCurrency(forecastedBonusPerPerson)}
                      <div className="text-xs text-gray-500">
                        (Available: {formatCurrency(availableBonusPerPerson)})
                      </div>
                      <div className="text-xs text-gray-500">
                        (Performance: {formatCurrency(performanceBasedBonusPerPerson)})
                      </div>
                    </td>
                    <td className="py-2 px-4 border text-right">{formatCurrency(position.salary)}</td>
                    <td className="py-2 px-4 border text-right font-medium text-blue-600">
                      {formatCurrency(forecastedTotalBonus)}
                      <div className="text-xs text-gray-500">
                        (Available: {formatCurrency(availableBonusPerPerson * count)})
                      </div>
                      <div className="text-xs text-gray-500">
                        (Performance: {formatCurrency(performanceBasedTotalBonus)})
                      </div>
                    </td>
                    <td className="py-2 px-4 border text-right">{formatCurrency(totalCompensation)}</td>
                  </tr>
                );
              })}
              <tr className="bg-blue-50">
                <td colSpan="5" className="py-3 px-4 border font-semibold text-right">Grand Total:</td>
                <td className="py-3 px-4 border text-right font-bold text-blue-600">
                  {formatCurrency(calculateGrandTotalBonus())}
                  <div className="text-xs text-gray-600">
                    (Available at 100%: {formatCurrency(
                      Object.keys(positions).reduce((total, positionKey) => {
                        const position = positions[positionKey];
                        const count = headcount[positionKey];
                        const availableBonusPerPerson = calculateTotalBonus(position);
                        return total + (availableBonusPerPerson * count);
                      }, 0)
                    )})
                  </div>
                  <div className="text-xs text-gray-600">
                    (Performance-based: {formatCurrency(
                      Object.keys(positions).reduce((total, positionKey) => {
                        const position = positions[positionKey];
                        const count = headcount[positionKey];
                        const performanceBasedBonus = calculateActualTotalBonus(position) * count;
                        return total + performanceBasedBonus;
                      }, 0)
                    )})
                  </div>
                </td>
                <td className="py-3 px-4 border text-right font-bold">{formatCurrency(
                  Object.keys(positions).reduce((total, positionKey) => {
                    const position = positions[positionKey];
                    const count = headcount[positionKey];
                    const totalSalary = position.salary * count;
                    const forecastedTotalBonus = calculateTotalBonus(position) * count * (bonusMultiplier / 100);
                    
                    return total + totalSalary + forecastedTotalBonus;
                  }, 0)
                )}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HeadcountTab;