'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Add this import after your React imports
import { 
  formatCurrency, 
  formatSalaryForDisplay, 
  formatKPIValue 
} from './KPIDashboard/utils/formatters';

import { 
  getTabColor, 
  getHeaderColor, 
  sliderStyles,
  getPerformanceStatusColor 
} from './KPIDashboard/utils/styles';

import {
  KPI_CLIENT_RETENTION,
  KPI_PUNCH_LIST_CREATION,
  KPI_EXTRA_SERVICES,
  KPI_DIRECT_LABOR_MAINTENANCE,
  KPI_LV_MAINTENANCE_GROWTH,
  KPI_PROPERTY_CHECKLIST_ITEM_COMPLETION,
  KPI_SALES_GOAL_MET,
  KPI_TOTAL_GROSS_MARGIN,
  KPI_ARBOR_ENHANCEMENT_PROCESS,
  KPI_PIPELINE_UPDATES_CURRENT,
  KPI_FLEET_UPTIME_RATE,
  KPI_PREVENTATIVE_VS_REACTIVE,
  KPI_ACCIDENT_INCIDENT_RATE,
  KPI_SAFETY_INCIDENTS_MAGNITUDE
} from './KPIDashboard/utils/kpiConstants';

import {
  getMinValueForKPI,
  getMaxValueForKPI,
  isKpiOnTarget,
  getProgressStatusText,
  getSliderColorClass,
  getKpiSummary
} from './KPIDashboard/utils/kpiHelpers';

import {
  calculateTotalBonus,
  calculateKpiBonus,
  calculateActualTotalBonus
} from './KPIDashboard/utils/bonusCalculations';

// Add this single import instead:
import { initialPositions, defaultHeadcount } from './KPIDashboard/data/initialPositions';



import UserRoleSelector from './KPIDashboard/components/UserRoleSelector';
import KPICard from './KPIDashboard/components/KPICard';
import HeadcountTab from './KPIDashboard/components/HeadcountTab';
import PositionHeader from './KPIDashboard/components/PositionHeader';





const KPIDashboard = () => {
  // TEMPORARY FEATURE FLAG - Set to false to show all tabs
  const SHOW_ONLY_BRANCH_MANAGER = true;  // TODO: Set to false before production
  
  const [activeTab, setActiveTab] = useState(SHOW_ONLY_BRANCH_MANAGER ? 'branch-manager' : 'general-manager');

  const [userRoleExpanded, setUserRoleExpanded] = useState(false); // Start collapsed
  
 

  // State to track positions data including slider values
  const [positions, setPositions] = useState(initialPositions);
  
  // State for bonus multiplier (global adjustment to all bonuses)
  const [bonusMultiplier, setBonusMultiplier] = useState(100);
  
// State for headcount with company default values
const [headcount, setHeadcount] = useState(defaultHeadcount);

  // User authentication and role management (placeholder for future implementation)
  // In a real application, this would come from your authentication system
  const [currentUser, setCurrentUser] = useState({
    email: 'admin@example.com',
    role: 'admin', // 'admin', 'general-manager', 'branch-manager', 'client-specialist', 'field-supervisor', 'specialist', 'asset-risk-manager'
    allowedTabs: ['general-manager', 'branch-manager', 'client-specialist', 'field-supervisor', 'specialist', 'asset-risk-manager', 'headcount']
  });





  // Check if a tab is accessible to the current user
  const isTabAccessible = useCallback((tabKey) => {
    // Admin can access all tabs
    if (currentUser.role === 'admin') {
      return true;
    }
    
    // Users can access their own tab and headcount tab
    return currentUser.allowedTabs.includes(tabKey);
  }, [currentUser]);




  // Handle slider change
  const handleSliderChange = (positionKey, kpiIndex, newValue) => {
    setPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      newPositions[positionKey].kpis[kpiIndex].actual = parseInt(newValue, 10);
      return newPositions;
    });
  };
  
  // Handle salary change
  const handleSalaryChange = (positionKey, newSalary) => {
    // Remove any non-numeric characters except for decimal points
    const numericValue = newSalary.replace(/[^0-9.]/g, '');
    
    setPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      newPositions[positionKey].salary = parseFloat(numericValue) || 0;
      return newPositions;
    });
  };
  
  // Handle bonus percentage change
  const handleBonusPercentageChange = (positionKey, newPercentage) => {
    setPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      newPositions[positionKey].bonusPercentage = parseFloat(newPercentage) || 0;
      return newPositions;
    });
  };
  
  // Handle bonus multiplier change
  const handleBonusMultiplierChange = (newMultiplier) => {
    setBonusMultiplier(parseFloat(newMultiplier) || 0);
  };
  
  // Handle headcount change
  const handleHeadcountChange = (positionKey, newCount) => {
    setHeadcount(prevHeadcount => ({
      ...prevHeadcount,
      [positionKey]: parseInt(newCount) || 0
    }));
  };

  // Calculate total bonus for all employees in a position based on forecast percentage
  const calculateTotalPositionBonus = (positionKey) => {
    const position = positions[positionKey];
    const count = headcount[positionKey];
    
    if (bonusMultiplier === 100) {
      // If slider is at 100%, use the actual earned bonus
      const bonusPerPerson = calculateActualTotalBonus(position);
      return bonusPerPerson * count;
    } else {
      // Otherwise, use the percentage of available bonus
      const availableBonusPerPerson = calculateTotalBonus(position);
      return availableBonusPerPerson * count * (bonusMultiplier / 100);
    }
  };

  // Calculate original total bonus for all employees in a position (based on KPI performance)
  const calculateOriginalTotalPositionBonus = (positionKey) => {
    const position = positions[positionKey];
    const count = headcount[positionKey];
    const bonusPerPerson = calculateActualTotalBonus(position);
    return bonusPerPerson * count;
  };

  // Calculate grand total bonus across all positions
  const calculateGrandTotalBonus = () => {
    return Object.keys(positions).reduce((total, positionKey) => {
      return total + calculateTotalPositionBonus(positionKey);
    }, 0);
  };
  
  // Calculate grand total original bonus (without multiplier)
  const calculateGrandTotalOriginalBonus = () => {
    return Object.keys(positions).reduce((total, positionKey) => {
      return total + calculateOriginalTotalPositionBonus(positionKey);
    }, 0);
  };
  

  
  // Effect to set initial active tab based on user's role
  useEffect(() => {
    // If user doesn't have access to current active tab, set to first allowed tab
    if (!isTabAccessible(activeTab)) {
      const firstAllowedTab = currentUser.allowedTabs[0] || 'general-manager';
      setActiveTab(firstAllowedTab);
    }
  }, [currentUser, activeTab, isTabAccessible]);
  
  const [expandedSuccessFactors, setExpandedSuccessFactors] = useState({});
  const [expandedBreakdown, setExpandedBreakdown] = useState(false);

  // Toggle success factors visibility
  const toggleSuccessFactors = (positionKey, kpiIndex) => {
    setExpandedSuccessFactors(prev => {
      const key = `${positionKey}-${kpiIndex}`;
      return {
        ...prev,
        [key]: !prev[key]
      };
    });
  };
  
  // Initialize success factors to be collapsed
  useEffect(() => {
    // This will keep track of which KPIs have their success factors expanded
    // By default, all will be collapsed (not in the state)
    setExpandedSuccessFactors({});
  }, []);

  // Completely revised increment function to ensure exact 1% increments
  const handleIncrementKPI = (positionKey, kpiIndex) => {
    setPositions(prevPositions => {
      // Create deep clone to avoid mutation issues
      const newPositions = JSON.parse(JSON.stringify(prevPositions));
      const kpi = newPositions[positionKey].kpis[kpiIndex];
      
      // Determine maximum value for this KPI
      let max = 100;
      if (kpi.name === 'Direct Labor Maintenance %') max = 45;
      else if (kpi.name === 'Extra Services') max = 110;
      else if (kpi.name === 'Total Gross Margin % on Completed Jobs') max = 80;
      else if (kpi.name === 'LV Maintenance Growth') max = 10;
      else if (kpi.name === 'Fleet Uptime Rate') max = 100;
      else if (kpi.name === 'Preventative vs. Reactive Maintenance Ratio') max = 100;
      else if (kpi.name === 'Accident/Incident Rate') max = 15;
      else if (kpi.name === 'Safety Incidents Magnitude') max = 20;
      
      // Force to integer and add exactly 1
      const newValue = Math.min(max, parseInt(kpi.actual) + 1);
      kpi.actual = newValue;
      
      return newPositions;
    });
  };
  
  // Completely revised decrement function to ensure exact 1% decrements
  const handleDecrementKPI = (positionKey, kpiIndex) => {
    setPositions(prevPositions => {
      // Create deep clone to avoid mutation issues
      const newPositions = JSON.parse(JSON.stringify(prevPositions));
      const kpi = newPositions[positionKey].kpis[kpiIndex];
      
      // Determine minimum value for this KPI
      let min = 0;
      if (kpi.name === 'Direct Labor Maintenance %') min = 25;
      else if (kpi.name === 'Client Retention %' || kpi.name === 'Visit Note Creation' || kpi.name === 'Extra Services') min = 50;
      else if (kpi.name === 'Total Gross Margin % on Completed Jobs') min = 40;
      else if (kpi.name === 'Property Checklist Item Completion') min = 50;
      else if (kpi.name === 'Fleet Uptime Rate') min = 85;
      else if (kpi.name === 'Preventative vs. Reactive Maintenance Ratio') min = 50;
      
      // Force to integer and subtract exactly 1
      const newValue = Math.max(min, parseInt(kpi.actual) - 1);
      kpi.actual = newValue;
      
      return newPositions;
    });
  };
  
  // Simulated user login function - would be replaced with actual auth in production
  const handleUserChange = (role) => {
    // This is just for demonstration - in a real app, this would come from your auth system
    const roleMap = {
      'admin': {
        email: 'admin@example.com',
        role: 'admin',
        allowedTabs: ['general-manager', 'branch-manager', 'client-specialist', 'field-supervisor', 'specialist', 'asset-risk-manager', 'headcount']
      },
      'general-manager': {
        email: 'gm@example.com',
        role: 'general-manager',
        allowedTabs: ['general-manager'] // Removed 'headcount'
      },
      'branch-manager': {
        email: 'bm@example.com',
        role: 'branch-manager',
        allowedTabs: ['branch-manager'] // Removed 'headcount'
      },
      'client-specialist': {
        email: 'cs@example.com',
        role: 'client-specialist',
        allowedTabs: ['client-specialist'] // Removed 'headcount'
      },
      'field-supervisor': {
        email: 'fs@example.com',
        role: 'field-supervisor',
        allowedTabs: ['field-supervisor'] // Removed 'headcount'
      },
      'specialist': {
        email: 'specialist@example.com',
        role: 'specialist',
        allowedTabs: ['specialist'] // Removed 'headcount'
      },
      'asset-risk-manager': {
        email: 'arm@example.com',
        role: 'asset-risk-manager',
        allowedTabs: ['asset-risk-manager'] // Removed 'headcount'
      }
    };
    
    // If user is currently on headcount tab but is switching to non-admin role, 
    // change active tab to their role-specific tab
    if (activeTab === 'headcount' && role !== 'admin') {
      setActiveTab(role);
    }
    
    setCurrentUser(roleMap[role] || roleMap.admin);
  };





  

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Add custom slider styles */}
      <style>{sliderStyles}</style>
      
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-xl md:text-3xl font-bold text-gray-800">Employee KPI Dashboard</h1>
        <div className="text-xs md:text-sm text-gray-600 flex items-center">
          <span className="mr-1">Performance Period:</span>
          <span className="font-medium">Jan-Dec 2025</span>
        </div>
      </div>
      

{/* Demo User Role Selector - would be removed in production */}
{!SHOW_ONLY_BRANCH_MANAGER && (
  <UserRoleSelector 
    userRoleExpanded={userRoleExpanded}
    setUserRoleExpanded={setUserRoleExpanded}
    currentUser={currentUser}
    handleUserChange={handleUserChange}
    positions={positions}
  />
)}
      
      {/* Tabs - only render tabs that the user has access to */}
      <div className="flex flex-wrap border-b border-gray-200 mb-6 overflow-x-auto">
        {(SHOW_ONLY_BRANCH_MANAGER 
          ? ['branch-manager']  // Show only Branch Manager when flag is true
          : ['general-manager', 'branch-manager', 'client-specialist', 'specialist', 'field-supervisor', 'asset-risk-manager', 'headcount']  // Show all tabs when flag is false
        )
          .filter(tabKey => isTabAccessible(tabKey))
          .map((tabKey) => (
          <button
            key={tabKey}
            className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
              activeTab === tabKey
                ? `border-b-2 border-blue-500 text-blue-600 ${getTabColor(tabKey)}`
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tabKey)}
          >
            {tabKey === 'headcount' 
              ? 'Headcount & Planning' 
              : positions[tabKey].title}
          </button>
        ))}
      </div>
      
{/* Content */}
{activeTab === 'headcount' ? (
  <HeadcountTab
    positions={positions}
    headcount={headcount}
    bonusMultiplier={bonusMultiplier}
    handleBonusMultiplierChange={handleBonusMultiplierChange}
    handleHeadcountChange={handleHeadcountChange}
    handleBonusPercentageChange={handleBonusPercentageChange}
    calculateTotalPositionBonus={calculateTotalPositionBonus}
    calculateGrandTotalBonus={calculateGrandTotalBonus}
  />
) : (
  <div className={`p-6 rounded-lg ${getTabColor(activeTab)}`}>
    {/* Beta/Under Construction Banner - Only for Branch Manager tab */}
    {activeTab === 'branch-manager' && (
      <div className="mb-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 text-center">
        <h3 className="text-lg font-bold text-yellow-800">
          🚧 BETA VERSION - UNDER CONSTRUCTION 🚧
        </h3>
        <p className="text-sm text-yellow-700 mt-1">
          Test values only. Not for actual performance evaluation. KPIs unofficial
        </p>
      </div>
    )}
    
{/* Salary and Bonus Info with KPI Summary - Sticky Header */}
<PositionHeader
  activeTab={activeTab}
  position={positions[activeTab]}
  handleSalaryChange={handleSalaryChange}
  handleBonusPercentageChange={handleBonusPercentageChange}
  expandedBreakdown={expandedBreakdown}
  setExpandedBreakdown={setExpandedBreakdown}
/>


          {/* KPI Section Header */}
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Key Performance Indicators</h2>
          
{/* KPI Cards Grid */}
<div className="grid grid-cols-1 gap-4">
  {positions[activeTab].kpis.map((kpi, index) => (
    <KPICard
      key={index}
      kpi={kpi}
      index={index}
      position={positions[activeTab]}
      positionKey={activeTab}
      handleSliderChange={handleSliderChange}
      handleIncrementKPI={handleIncrementKPI}
      handleDecrementKPI={handleDecrementKPI}
      expandedSuccessFactors={expandedSuccessFactors}
      toggleSuccessFactors={toggleSuccessFactors}
    />
  ))}
</div>
        </div>
      )}
    </div>
  );
};

export default KPIDashboard;