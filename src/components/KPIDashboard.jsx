'use client';

import React, { useState, useEffect, useCallback } from 'react';

const KPIDashboard = () => {
  const [activeTab, setActiveTab] = useState('general-manager');
  
  // Initial positions data
  const initialPositions = {
    'general-manager': {
      title: 'General Manager',
      salary: 120000,
      kpis: [
        {
          name: 'Retention %',
          description: 'Percentage of properties that are still under maintenance contract when compared to January books of business. Maintaining strong client relationships ensures stable revenue and reduces acquisition costs.',
          target: 90,
          actual: 90
        },
        {
          name: 'Visit Note Creation',
          description: 'Percentage of weekly maintenance visits with quality visit notes provided for crew instruction. Thorough documentation ensures consistent service quality and helps address client concerns proactively.',
          target: 90,
          actual: 90
        },
        {
          name: 'Extra Sales',
          description: 'Additional enhancement and arbor services sold as a percentage of the base maintenance book of business (BOB). Collaborative work with Specialists to ensure client proposals meet client needs and result in satisfied customers.',
          target: 100,
          actual: 90
        },
        {
          name: 'Direct Labor Maintenance %',
          description: 'Direct maintenance labor cost as a percentage of maintenance revenue. Lower percentages indicate more efficient labor utilization and better profitability.',
          target: 40,
          actual: 40,
          isInverse: true
        },
        {
          name: 'LV Maintenance Growth',
          description: 'Growth in recurring landscape maintenance contracts. Measured as percentage increase in maintenance contract value compared to previous year.',
          target: 3,
          actual: 1
        }
      ]
    },
    'branch-manager': {
      title: 'Branch Manager',
      salary: 95000,
      kpis: [
        {
          name: 'Retention %',
          description: 'Percentage of properties that are still under maintenance contract when compared to January books of business. Maintaining strong client relationships ensures stable revenue and reduces acquisition costs.',
          target: 90,
          actual: 90
        },
        {
          name: 'Visit Note Creation',
          description: 'Percentage of weekly maintenance visits with quality visit notes provided for crew instruction. Thorough documentation ensures consistent service quality and helps address client concerns proactively.',
          target: 90,
          actual: 90
        },
        {
          name: 'Extra Sales',
          description: 'Additional enhancement and arbor services sold as a percentage of the base maintenance book of business (BOB). Collaborative work with Specialists to ensure client proposals meet client needs and result in satisfied customers.',
          target: 100,
          actual: 90
        },
        {
          name: 'Direct Labor Maintenance %',
          description: 'Direct maintenance labor cost as a percentage of maintenance revenue. Lower percentages indicate more efficient labor utilization and better profitability.',
          target: 40,
          actual: 40,
          isInverse: true
        }
      ]
    },
    'account-manager': {
      title: 'Account Manager',
      salary: 75000,
      kpis: [
        {
          name: 'Retention %',
          description: 'Percentage of properties that are still under maintenance contract when compared to January books of business. Maintaining strong client relationships ensures stable revenue and reduces acquisition costs.',
          target: 90,
          actual: 90
        },
        {
          name: 'Visit Note Creation',
          description: 'Percentage of weekly maintenance visits with quality visit notes provided for crew instruction. Thorough documentation ensures consistent service quality and helps address client concerns proactively.',
          target: 90,
          actual: 90
        },
        {
          name: 'Extra Sales',
          description: 'Additional enhancement and arbor services sold as a percentage of the base maintenance book of business (BOB). Collaborative work with Specialists to ensure client proposals meet client needs and result in satisfied customers.',
          target: 100,
          actual: 90
        },
        {
          name: 'Property Checklist Item Completion',
          description: 'Ensure all items on visit note checklists are completed, and completed satisfactorily, on a daily basis to keep properties in great condition and improve retention.',
          target: 100,
          actual: 80
        }
      ]
    },
    'field-supervisor': {
      title: 'Field Supervisor',
      salary: 60000,
      kpis: [
        {
          name: 'Retention %',
          description: 'Percentage of properties that are still under maintenance contract when compared to January books of business. Maintaining strong client relationships ensures stable revenue and reduces acquisition costs.',
          target: 90,
          actual: 90
        },
        {
          name: 'Visit Note Creation',
          description: 'Percentage of weekly maintenance visits with quality visit notes provided for crew instruction. Thorough documentation ensures consistent service quality and helps address client concerns proactively.',
          target: 90,
          actual: 90
        },
        {
          name: 'Extra Sales',
          description: 'Additional enhancement and arbor services sold as a percentage of the base maintenance book of business (BOB). Collaborative work with Specialists to ensure client proposals meet client needs and result in satisfied customers.',
          target: 100,
          actual: 90
        },
        {
          name: 'Property Checklist Item Completion',
          description: 'Ensure all items on visit note checklists are completed, and completed satisfactorily, on a daily basis to keep properties in great condition and improve retention.',
          target: 100,
          actual: 80
        }
      ]
    },
    'specialist': {
      title: 'Specialist',
      salary: 65000,
      kpis: [
        {
          name: 'Sales Goal Met',
          description: 'Percentage of sales targets achieved across all service lines. Meeting or exceeding sales goals ensures business growth and sustainability.',
          target: 100,
          actual: 90
        },
        {
          name: 'Total Gross Margin % on Completed Jobs',
          description: 'Total gross margin percentage across all completed enhancement and arbor jobs. Higher margins indicate effective pricing and cost management.',
          target: 60,
          actual: 60
        },
        {
          name: 'Arbor/Enhancement Process Followed',
          description: 'Percentage of jobs that strictly followed the prescribed process from estimate to completion. Proper process adherence ensures quality, safety, and profitability.',
          target: 95,
          actual: 90
        },
        {
          name: 'Pipeline Updates Current',
          description: 'Percentage of pipeline projects with up-to-date status and follow-ups scheduled at various data checkpoints. Maintaining current pipeline data improves forecasting accuracy, resource planning and improves closing rates.',
          target: 100,
          actual: 90
        }
      ]
    }
  };

  // State to track positions data including slider values
  const [positions, setPositions] = useState(initialPositions);
  
  // State for bonus percentage (default 10%)
  const [bonusPercentage, setBonusPercentage] = useState(10);
  
  // State for headcount with company default values
  const [headcount, setHeadcount] = useState({
    'general-manager': 1,
    'branch-manager': 4,
    'account-manager': 7,
    'field-supervisor': 10,
    'specialist': 7
  });

  // User authentication and role management (placeholder for future implementation)
  // In a real application, this would come from your authentication system
  const [currentUser, setCurrentUser] = useState({
    email: 'admin@example.com',
    role: 'admin', // 'admin', 'general-manager', 'branch-manager', 'account-manager', 'field-supervisor', 'specialist'
    allowedTabs: ['general-manager', 'branch-manager', 'account-manager', 'field-supervisor', 'specialist', 'headcount']
  });

  // Calculate the total potential bonus
  const calculateTotalBonus = (salary) => {
    return salary * (bonusPercentage / 100);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  // Format salary with thousand separators for display
  const formatSalaryForDisplay = (salary) => {
    return salary.toLocaleString('en-US');
  };
  
  // Get tab color for each position
  const getTabColor = (tabKey) => {
    switch(tabKey) {
      case 'general-manager':
        return 'bg-blue-50';
      case 'branch-manager':
        return 'bg-green-50';
      case 'account-manager':
        return 'bg-purple-50';
      case 'field-supervisor':
        return 'bg-amber-50';
      case 'specialist':
        return 'bg-cyan-50';
      case 'headcount':
        return 'bg-gray-50';
      default:
        return 'bg-white';
    }
  };
  
  // Get more pronounced header color for the active tab
  const getHeaderColor = (tabKey) => {
    switch(tabKey) {
      case 'general-manager':
        return 'bg-blue-100';
      case 'branch-manager':
        return 'bg-green-100';
      case 'account-manager':
        return 'bg-purple-100';
      case 'field-supervisor':
        return 'bg-amber-100';
      case 'specialist':
        return 'bg-cyan-100';
      case 'headcount':
        return 'bg-gray-100';
      default:
        return 'bg-white';
    }
  };

  // Check if a tab is accessible to the current user
  const isTabAccessible = useCallback((tabKey) => {
    // Admin can access all tabs
    if (currentUser.role === 'admin') {
      return true;
    }
    
    // Users can access their own tab and headcount tab
    return currentUser.allowedTabs.includes(tabKey);
  }, [currentUser]);

  // Calculate the bonus amount per KPI
  const calculateKpiBonus = (position, kpiIndex) => {
    const totalBonus = calculateTotalBonus(position.salary);
    const kpi = position.kpis[kpiIndex];
    const kpiWeight = 1 / position.kpis.length; // Equal weight for each KPI
    const kpiTotalAvailable = totalBonus * kpiWeight; // Equal distribution of total bonus for each KPI
    
    // Special calculation for Retention % and Visit Note Creation (both use same logic)
    if (kpi.name === 'Retention %' || kpi.name === 'Visit Note Creation') {
      // Below target (90%)
      if (kpi.actual < 90) {
        return 0;
      }
      // At target exactly (90%)
      else if (kpi.actual === 90) {
        return kpiTotalAvailable * 0.5; // 50% of KPI bonus
      }
      // Between target and 100%
      else if (kpi.actual > 90 && kpi.actual <= 100) {
        // Base 50% for hitting target
        const baseAmount = kpiTotalAvailable * 0.5;
        // Calculate progress from 90% to 100% (0-100%)
        const progressAboveTarget = (kpi.actual - 90) / 10;
        // Remaining 50% is prorated based on progress
        const additionalAmount = (kpiTotalAvailable * 0.5) * progressAboveTarget;
        
        return baseAmount + additionalAmount;
      }
      // Above 100%
      else {
        return kpiTotalAvailable; // 100% of KPI bonus
      }
    }
    // Special calculation for Extra Sales
    else if (kpi.name === 'Extra Sales') {
      // Below target (100%)
      if (kpi.actual < 100) {
        // Linear progression from 0 to 50% of bonus
        return kpiTotalAvailable * 0.5 * (kpi.actual / 100);
      }
      // At target exactly (100%)
      else if (kpi.actual === 100) {
        return kpiTotalAvailable * 0.5; // 50% of KPI bonus
      }
      // Between target and 110%
      else if (kpi.actual > 100 && kpi.actual <= 110) {
        // Base 50% for hitting target
        const baseAmount = kpiTotalAvailable * 0.5;
        // Calculate progress from 100% to 110% (0-100%)
        const progressAboveTarget = (kpi.actual - 100) / 10;
        // Remaining 50% is prorated based on progress
        const additionalAmount = (kpiTotalAvailable * 0.5) * progressAboveTarget;
        
        return baseAmount + additionalAmount;
      }
      // Above 110%
      else {
        return kpiTotalAvailable; // 100% of KPI bonus
      }
    }
    // Special calculation for Total Gross Margin % on Completed Jobs
    else if (kpi.name === 'Total Gross Margin % on Completed Jobs') {
      // Below minimum target (60%)
      if (kpi.actual < 60) {
        return 0;
      }
      // At minimum target exactly (60%)
      else if (kpi.actual === 60) {
        return kpiTotalAvailable * 0.5; // 50% of KPI bonus
      }
      // Between 60% and 70%
      else if (kpi.actual > 60 && kpi.actual < 70) {
        // Base 50% for hitting minimum target
        const baseAmount = kpiTotalAvailable * 0.5;
        // Calculate progress from 60% to 70% (0-100%)
        const progressAboveTarget = (kpi.actual - 60) / 10;
        // Remaining 50% is prorated based on progress
        const additionalAmount = (kpiTotalAvailable * 0.5) * progressAboveTarget;
        
        return baseAmount + additionalAmount;
      }
      // At or above 70%
      else {
        return kpiTotalAvailable; // 100% of KPI bonus
      }
    }
    // Special calculation for Direct Labor Maintenance %
    else if (kpi.name === 'Direct Labor Maintenance %') {
      // For this KPI, lower is better
      // Target is 40%, full bonus at 38% or below
      
      // Above target (worse performance)
      if (kpi.actual > 40) {
        return 0;
      }
      // At target exactly (40%)
      else if (kpi.actual === 40) {
        return kpiTotalAvailable * 0.5; // 50% of KPI bonus
      }
      // Between 38% and 40%
      else if (kpi.actual > 38 && kpi.actual < 40) {
        // Base 50% for hitting target
        const baseAmount = kpiTotalAvailable * 0.5;
        // Calculate progress from 40% to 38% (0-100%)
        const progressBelowTarget = (40 - kpi.actual) / 2;
        // Remaining 50% is prorated based on progress
        const additionalAmount = (kpiTotalAvailable * 0.5) * progressBelowTarget;
        
        return baseAmount + additionalAmount;
      }
      // At or below 38%
      else {
        return kpiTotalAvailable; // 100% of KPI bonus
      }
    }
    // Special calculation for LV Maintenance Growth
    else if (kpi.name === 'LV Maintenance Growth') {
      // Below 0%
      if (kpi.actual < 0) {
        return 0;
      }
      // Between 0% and target (3%)
      else if (kpi.actual >= 0 && kpi.actual < 3) {
        // Linear progression from 0 to 100% of bonus as we approach 3%
        return kpiTotalAvailable * (kpi.actual / 3);
      }
      // At or above target (3%)
      else {
        return kpiTotalAvailable; // 100% of KPI bonus
      }
    }
    // Special calculation for Property Checklist Item Completion
    else if (kpi.name === 'Property Checklist Item Completion') {
      // Below minimum target (80%)
      if (kpi.actual < 80) {
        return 0;
      }
      // At minimum target exactly (80%)
      else if (kpi.actual === 80) {
        return kpiTotalAvailable * 0.5; // 50% of KPI bonus
      }
      // Between 80% and 100%
      else if (kpi.actual > 80 && kpi.actual < 100) {
        // Base 50% for hitting minimum target
        const baseAmount = kpiTotalAvailable * 0.5;
        // Calculate progress from 80% to 100% (0-100%)
        const progressAboveTarget = (kpi.actual - 80) / 20;
        // Remaining 50% is prorated based on progress
        const additionalAmount = (kpiTotalAvailable * 0.5) * progressAboveTarget;
        
        return baseAmount + additionalAmount;
      }
      // At or above 100%
      else {
        return kpiTotalAvailable; // 100% of KPI bonus
      }
    }
    // For other KPIs, use a simple percentage calculation for now
    else {
      // Calculate achievement percentage (capped at 100%)
      const achievementPercentage = Math.min(100, (kpi.actual / kpi.target) * 100) / 100;
      
      // Calculate the actual bonus amount
      return kpiTotalAvailable * achievementPercentage;
    }
  };

  // Calculate total actual bonus
  const calculateActualTotalBonus = (position) => {
    let totalActualBonus = 0;
    
    position.kpis.forEach((kpi, index) => {
      totalActualBonus += calculateKpiBonus(position, index);
    });
    
    return totalActualBonus;
  };

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
  const handleBonusPercentageChange = (newPercentage) => {
    setBonusPercentage(parseFloat(newPercentage) || 0);
  };
  
  // Handle headcount change
  const handleHeadcountChange = (positionKey, newCount) => {
    setHeadcount(prevHeadcount => ({
      ...prevHeadcount,
      [positionKey]: parseInt(newCount) || 0
    }));
  };

  // Calculate total bonus for all employees in a position
  const calculateTotalPositionBonus = (positionKey) => {
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
  
  // Effect to set initial active tab based on user's role
  useEffect(() => {
    // If user doesn't have access to current active tab, set to first allowed tab
    if (!isTabAccessible(activeTab)) {
      const firstAllowedTab = currentUser.allowedTabs[0] || 'general-manager';
      setActiveTab(firstAllowedTab);
    }
  }, [currentUser, activeTab, isTabAccessible]);

  // Handle increment/decrement buttons for KPI values
  const handleIncrementKPI = (positionKey, kpiIndex) => {
    setPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      const kpi = newPositions[positionKey].kpis[kpiIndex];
      let max = 100;
      
      if (kpi.name === 'Direct Labor Maintenance %') {
        max = 45;
      } else if (kpi.name === 'Extra Sales') {
        max = 110;
      } else if (kpi.name === 'Total Gross Margin % on Completed Jobs') {
        max = 80;
      } else if (kpi.name === 'LV Maintenance Growth') {
        max = 10;
      }
      
      kpi.actual = Math.min(max, kpi.actual + 1);
      return newPositions;
    });
  };
  
  const handleDecrementKPI = (positionKey, kpiIndex) => {
    setPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      const kpi = newPositions[positionKey].kpis[kpiIndex];
      let min = 0;
      
      if (kpi.name === 'Direct Labor Maintenance %') {
        min = 25;
      } else if (kpi.name === 'Retention %' || kpi.name === 'Visit Note Creation' || kpi.name === 'Extra Sales') {
        min = 50;
      } else if (kpi.name === 'Total Gross Margin % on Completed Jobs') {
        min = 40;
      } else if (kpi.name === 'Property Checklist Item Completion') {
        min = 50;
      }
      
      kpi.actual = Math.max(min, kpi.actual - 1);
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
        allowedTabs: ['general-manager', 'branch-manager', 'account-manager', 'field-supervisor', 'specialist', 'headcount']
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
      'account-manager': {
        email: 'am@example.com',
        role: 'account-manager',
        allowedTabs: ['account-manager'] // Removed 'headcount'
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
      }
    };
    
    // If user is currently on headcount tab but is switching to non-admin role, 
    // change active tab to their role-specific tab
    if (activeTab === 'headcount' && role !== 'admin') {
      setActiveTab(role);
    }
    
    setCurrentUser(roleMap[role] || roleMap.admin);
  };

  // Render KPI cards with sliders and increment/decrement buttons
  const renderKPICards = (position, positionKey) => {
    return position.kpis.map((kpi, index) => {
      const kpiBonus = calculateKpiBonus(position, index);
      
      return (
        <div key={index} className="bg-white p-4 rounded-lg shadow-md mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{kpi.name}</h3>
          <p className="text-sm text-gray-600 mt-1 mb-3">{kpi.description}</p>
          
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Target</p>
              <p className="text-md font-medium text-gray-800">{kpi.target}%</p>
            </div>
            
            <div className="col-span-2">
              <p className="text-xs text-gray-500">Actual</p>
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 mr-4">
                    <input 
                      type="range" 
                      min={kpi.name === 'Direct Labor Maintenance %' ? 25 : 
                          (kpi.name === 'Retention %' || kpi.name === 'Visit Note Creation' || kpi.name === 'Extra Sales') ? 50 : 
                          kpi.name === 'Total Gross Margin % on Completed Jobs' ? 40 :
                          kpi.name === 'Property Checklist Item Completion' ? 50 : 0}
                      max={kpi.name === 'Direct Labor Maintenance %' ? 45 : 
                          kpi.name === 'Extra Sales' ? 110 : 
                          kpi.name === 'Total Gross Margin % on Completed Jobs' ? 80 :
                          kpi.name === 'LV Maintenance Growth' ? 10 : 100}
                      value={kpi.actual}
                      onChange={(e) => handleSliderChange(positionKey, index, e.target.value)}
                      className="w-full h-6 bg-blue-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <span className="text-gray-800 font-medium min-w-[40px] text-center">{kpi.actual}%</span>
                  
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
                
                {(kpi.name === 'Retention %' || kpi.name === 'Visit Note Creation') && (
                  <div className="mt-1 text-xs text-gray-500">
                    {kpi.actual < 90 ? 
                      "Below 90% target" : 
                      kpi.actual === 90 ? 
                        "At target (50% bonus)" : 
                        kpi.actual > 100 ? 
                          "Maximum bonus reached" : 
                          `${Math.round(((kpi.actual - 90) / 10) * 100)}% progress above target`
                    }
                  </div>
                )}
                {kpi.name === 'Extra Sales' && (
                  <div className="mt-1 text-xs text-gray-500">
                    {kpi.actual < 100 ? 
                      `${Math.round((kpi.actual / 100) * 50)}% of bonus` : 
                      kpi.actual === 100 ? 
                        "At target (50% bonus)" : 
                        kpi.actual >= 110 ? 
                          "Maximum bonus reached" : 
                          `${50 + Math.round(((kpi.actual - 100) / 10) * 50)}% of bonus`
                    }
                  </div>
                )}
                {kpi.name === 'Total Gross Margin % on Completed Jobs' && (
                  <div className="mt-1 text-xs text-gray-500">
                    {kpi.actual < 60 ? 
                      "Below 60% target (0% bonus)" : 
                      kpi.actual === 60 ? 
                        "At minimum target (50% bonus)" : 
                        kpi.actual >= 70 ? 
                          "Maximum bonus reached" : 
                          `${50 + Math.round(((kpi.actual - 60) / 10) * 50)}% of bonus`
                    }
                  </div>
                )}
                {kpi.name === 'Direct Labor Maintenance %' && (
                  <div className="mt-1 text-xs text-gray-500">
                    {kpi.actual > 40 ? 
                      "Above 40% target (0% bonus)" : 
                      kpi.actual === 40 ? 
                        "At target (50% bonus)" : 
                        kpi.actual <= 38 ? 
                          "Maximum bonus reached" : 
                          `${50 + Math.round(((40 - kpi.actual) / 2) * 50)}% of bonus`
                    }
                  </div>
                )}
                {kpi.name === 'LV Maintenance Growth' && (
                  <div className="mt-1 text-xs text-gray-500">
                    {kpi.actual < 3 ? 
                      `${Math.round((kpi.actual / 3) * 100)}% of bonus` : 
                      "At or above 3% target (full bonus)"
                    }
                  </div>
                )}
                {kpi.name === 'Property Checklist Item Completion' && (
                  <div className="mt-1 text-xs text-gray-500">
                    {kpi.actual < 80 ? 
                      "Below 80% target (0% bonus)" : 
                      kpi.actual === 80 ? 
                        "At minimum target (50% bonus)" : 
                        kpi.actual >= 100 ? 
                          "Maximum bonus reached" : 
                          `${50 + Math.round(((kpi.actual - 80) / 20) * 50)}% of bonus`
                    }
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-xs text-gray-500">Bonus Impact</p>
              <div>
                <p className={`text-md font-medium ${
                  (kpi.name === 'Direct Labor Maintenance %' && kpi.actual <= kpi.target) || 
                  (kpi.name !== 'Direct Labor Maintenance %' && kpi.actual >= kpi.target) ? 
                  'text-green-600' : 'text-yellow-600'}`}>
                  {formatCurrency(kpiBonus)}
                </p>
                <p className="text-xs text-gray-500">
                  (Max: {formatCurrency(calculateTotalBonus(position.salary) / position.kpis.length)})
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  // Render the headcount tab content
  const renderHeadcountTab = () => {
    return (
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Headcount & Financial Planning</h2>
        
        {/* Input Grid */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Staff Headcount</h3>
          <div className="grid grid-cols-4 gap-6">
            {Object.keys(positions).map((positionKey) => (
              <div key={positionKey} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">{positions[positionKey].title}</h4>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={headcount[positionKey]}
                    onChange={(e) => handleHeadcountChange(positionKey, e.target.value)}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-lg font-medium text-gray-900 bg-white"
                    min="0"
                    step="1"
                  />
                  <span className="ml-2 text-sm text-gray-500">employees</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bonus Summary Table */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Bonus Budget Summary</h3>
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border text-left">Position</th>
                <th className="py-2 px-4 border text-center">Headcount</th>
                <th className="py-2 px-4 border text-center">Bonus Per Person</th>
                <th className="py-2 px-4 border text-center">Salary</th>
                <th className="py-2 px-4 border text-center">Total Bonus</th>
                <th className="py-2 px-4 border text-center">Total Compensation</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(positions).map((positionKey) => {
                const position = positions[positionKey];
                const count = headcount[positionKey];
                const bonusPerPerson = calculateActualTotalBonus(position);
                const totalBonus = bonusPerPerson * count;
                const totalSalary = position.salary * count;
                const totalCompensation = totalSalary + totalBonus;
                
                return (
                  <tr key={positionKey} className="border-b">
                    <td className="py-2 px-4 border font-medium">{position.title}</td>
                    <td className="py-2 px-4 border text-center">{count}</td>
                    <td className="py-2 px-4 border text-right">{formatCurrency(bonusPerPerson)}</td>
                    <td className="py-2 px-4 border text-right">{formatCurrency(position.salary)}</td>
                    <td className="py-2 px-4 border text-right font-medium text-green-600">{formatCurrency(totalBonus)}</td>
                    <td className="py-2 px-4 border text-right">{formatCurrency(totalCompensation)}</td>
                  </tr>
                );
              })}
              <tr className="bg-blue-50">
                <td colSpan="4" className="py-3 px-4 border font-semibold text-right">Grand Total:</td>
                <td className="py-3 px-4 border text-right font-bold text-green-700">{formatCurrency(calculateGrandTotalBonus())}</td>
                <td className="py-3 px-4 border text-right font-bold">{formatCurrency(
                  Object.keys(positions).reduce((total, positionKey) => {
                    const position = positions[positionKey];
                    const count = headcount[positionKey];
                    return total + (position.salary * count) + (calculateActualTotalBonus(position) * count);
                  }, 0)
                )}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Employee KPI Dashboard</h1>
      
      {/* Demo User Role Selector - would be removed in production */}
      <div className="mb-4 bg-white p-3 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Demo: Select User Role</h3>
        <div className="flex flex-wrap gap-2">
          {['admin', 'general-manager', 'branch-manager', 'account-manager', 'field-supervisor', 'specialist'].map(role => (
            <button
              key={role}
              onClick={() => handleUserChange(role)}
              className={`px-3 py-1 text-xs rounded ${
                currentUser.role === role 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {role === 'admin' ? 'Admin (All Access)' : positions[role].title}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Current user: {currentUser.email} ({currentUser.role})
        </p>
      </div>
      
      {/* Tabs - only render tabs that the user has access to */}
      <div className="flex border-b border-gray-200 mb-6">
        {['general-manager', 'branch-manager', 'account-manager', 'field-supervisor', 'specialist', 'headcount']
          .filter(tabKey => isTabAccessible(tabKey))
          .map((tabKey) => (
          <button
            key={tabKey}
            className={`py-2 px-4 font-medium text-sm ${
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
        renderHeadcountTab()
      ) : (
        <div className={`p-6 rounded-lg ${getTabColor(activeTab)}`}>
          {/* Salary and Bonus Info */}
          <div className={`p-4 rounded-lg shadow-md mb-6 ${getHeaderColor(activeTab)}`}>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Annual Salary</h3>
                <div className="flex items-center mt-2">
                  <span className="text-gray-500 mr-1">$</span>
                  <input
                    type="text"
                    value={formatSalaryForDisplay(positions[activeTab].salary)}
                    onChange={(e) => handleSalaryChange(activeTab, e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xl font-bold text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Bonus Percentage</h3>
                <div className="flex items-center mt-2">
                  <input
                    type="number"
                    value={bonusPercentage}
                    onChange={(e) => handleBonusPercentageChange(e.target.value)}
                    className="w-24 border border-gray-300 rounded px-2 py-1 text-xl font-bold text-blue-600 bg-white"
                    min="0"
                    max="100"
                    step="0.5"
                  />
                  <span className="text-blue-600 text-xl font-bold ml-1">%</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Current Projected Bonus</h3>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {formatCurrency(calculateActualTotalBonus(positions[activeTab]))}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Available Bonus</h3>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {formatCurrency(calculateTotalBonus(positions[activeTab].salary))}
                </p>
              </div>
            </div>
          </div>
          
          {/* KPI Section Header */}
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Key Performance Indicators</h2>
          
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 gap-4">
            {renderKPICards(positions[activeTab], activeTab)}
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIDashboard;