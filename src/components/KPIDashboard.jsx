'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Define KPIs as constants to avoid duplication
const KPI_CLIENT_RETENTION = {
  name: 'Client Retention %',
  description: 'Percentage of properties still under a Maintenance contract when compared to January active Maintenance contracts. The year-end calculation is January 2026 active contracts compared to January 2025 active contracts.  Build and maintain world class client relationships.',
  target: 90,
  actual: 90,
  weight: 25,
  successFactors: [
    "Ensure Maintenance quality meets Encore standards",
    "Clear direction is consistently provided to Maintenance Crews to drive quality",
    "Monitor responsiveness, consistentency and proactiveness of all communication with Clients (draft)",
    "Maximize offering of extra services for properties in line with budgets and as needed (draft)",
    "Utilize internal systems to capture accurate status of issues so items can be addressed effeciently and effectively "
  ]
};

const KPI_VISIT_NOTE_CREATION = {
  name: 'Visit Note Creation',
  description: 'Percentage of weekly Maintenance visits with proper visit notes provided for crew instruction. Thorough documentation ensures consistent service quality and helps address client concerns proactively.',
  target: 90,
  actual: 90,
  weight: 25,
  successFactors: [
    "Make sure all visits have proper instruction created via visit notes and checklist items ahead of crew visits",
    "Inspect properties weekly to ensure client satisfaction and achieve high Maintenance quality (draft)",
    "Coordinate with team members to ensure all visits have proper notes and checklists"
  ]
};

const KPI_EXTRA_SERVICES = {
  name: 'Extra Services',
  description: 'Additional Arbor, Enhancement and Spray services sold as a percentage of the Maintenance book of business (BOB). Collaborative work with Specialists to ensure client proposals meet client needs and results in high service satisfaction.',
  target: 100,
  actual: 100,
  weight: 25,
  successFactors: [
    "Ensure all budgeted proposals for properties are proactively provided to clients",
    "Capture all client proposal requests and/or identify property needs for specialists, for creation and delivery of proposals in a timely manner"
  ]
};

const KPI_DIRECT_LABOR_MAINTENANCE = {
  name: 'Direct Labor Maintenance %',
  description: 'Direct Maintenance labor cost as a percentage of Maintenance revenue. Lower percentages indicate efficient labor utilization and increase profitability.',
  target: 40,
  actual: 40,
  weight: 25,
  isInverse: true,
  successFactors: [
    "Ensure accuracy of On-Property hours required to complete directed work",
    "Regularly review Direct Labor Dashboard and Crew Schedules to ensure we're meeting the desired Direct Labor goals",
    "Identify opportunities to maximize crew effeciency and productivity ",
    "Provide actionable and clear visit notes so crews are making the best use of hours spent on property"
  ]
};

const KPI_LV_MAINTENANCE_GROWTH = {
  name: 'LV Maintenance Growth',
  description: 'Grow Maintenance book of business for LV market. Measured as percentage increase in maintenance contract value compared to previous year.',
  target: 3,
  actual: 1,
  weight: 20,
  successFactors: [
    "Collaborate with Business Development team to maximize market opportunities",
    "Participation in local networking groups and events to drive brand recognition",
    "Nurture existing client relationships to become our client's preferrred service provider"
  ]
};

const KPI_PROPERTY_CHECKLIST_ITEM_COMPLETION = {
  name: 'Property Checklist Item Completion',
  description: 'Ensure all items on visit note checklists are completed, and completed satisfactorily, on a daily basis to keep properties in great condition and improve retention.',
  target: 100,
  actual: 80,
  weight: 25,
  successFactors: [
    "Create actionable and applicable checklist items for crews",
    "Ensure crew completes the checklists in CRM",
    "Validate completion via crew photos and property visits"
  ]
};

const KPI_SALES_GOAL_MET = {
  name: 'Sales Goal Met',
  description: 'Percentage of sales targets achieved across all service lines. Meeting or exceeding sales goals ensures business growth and sustainability.',
  target: 100,
  actual: 90,
  weight: 25,
  successFactors: [
    "Meeting Proposal Goals",
    "Managing Pipeline and Follow-ups",
    "Communicating and Coordinating with Account Managers",
    "Reviewing Budgets and Proposing all budgeted work"
  ]
};

const KPI_TOTAL_GROSS_MARGIN = {
  name: 'Total Gross Margin % on Completed Jobs',
  description: 'Total gross margin percentage across all completed enhancement and arbor jobs. Higher margins indicate effective pricing and cost management.',
  target: 60,
  actual: 60,
  weight: 25,
  successFactors: [
    "Jobs properly bid",
    "Coordinating and communicating expectations for jobs with operations",
    "Reviewing completed work to ensure no warranty work needs to occur"
  ]
};

const KPI_ARBOR_ENHANCEMENT_PROCESS = {
  name: 'Arbor/Enhancement Process Followed',
  description: 'Percentage of jobs that strictly followed the prescribed process from estimate to completion. Proper process adherence ensures quality, safety, and profitability.',
  target: 95,
  actual: 90,
  weight: 25
};

const KPI_PIPELINE_UPDATES_CURRENT = {
  name: 'Pipeline Updates Current',
  description: 'Percentage of pipeline projects with up-to-date status and follow-ups scheduled at various data checkpoints. Maintaining current pipeline data improves forecasting accuracy, resource planning and improves closing rates.',
  target: 100,
  actual: 90,
  weight: 25,
  successFactors: [
    "Proposal Requests provided by due date",
    "Follow-ups scheduled for all opportunities",
    "Opportunities in proper status",
    "Client portals updated on-time with proper status (ex: Prologis)",
    "Proposing effort from budgets on time and for all budgeted effort"
  ]
};

const KPI_FLEET_UPTIME_RATE = {
  name: 'Fleet Uptime Rate',
  description: 'Percentage of time equipment is operational vs. down for Maintenance or repairs. Higher uptime indicates better Maintenance practices and equipment reliability.',
  target: 95,
  actual: 93,
  weight: 25
};

const KPI_PREVENTATIVE_VS_REACTIVE = {
  name: 'Preventative vs. Reactive Maintenance Ratio',
  description: 'Cost comparison of scheduled Maintenance versus emergency repairs, calculated as (Maintenance Costs) / (Repair Costs) as a percentage. Higher ratios indicate more proactive Maintenance approaches.',
  target: 80,
  actual: 75,
  weight: 25
};

const KPI_ACCIDENT_INCIDENT_RATE = {
  name: 'Accident/Incident Rate',
  description: 'Number of accidents or safety incidents per miles driven. Measured using Samsara event notifications and reported incidents. Lower rates indicate better safety outcomes.',
  target: 5,
  actual: 7,
  weight: 25,
  isInverse: true
};

const KPI_SAFETY_INCIDENTS_MAGNITUDE = {
  name: 'Safety Incidents Magnitude',
  description: 'Severity and impact of safety incidents, measured on a scale. Lower values indicate less severe safety incidents or better management of incident consequences.',
  target: 10,
  actual: 12,
  weight: 25,
  isInverse: true
};



const KPIDashboard = () => {
  const [activeTab, setActiveTab] = useState('general-manager');

  const [userRoleExpanded, setUserRoleExpanded] = useState(false); // Start collapsed
  
  // Initial positions data using KPI constants
  const initialPositions = {
    'general-manager': {
      title: 'General Manager',
      salary: 150000,
      bonusPercentage: 20,
      kpis: [
        { ...KPI_CLIENT_RETENTION, weight: 20 },
        { ...KPI_VISIT_NOTE_CREATION, weight: 20 },
        { ...KPI_EXTRA_SERVICES, weight: 20 },
        { ...KPI_DIRECT_LABOR_MAINTENANCE, weight: 20 },
        { ...KPI_LV_MAINTENANCE_GROWTH, weight: 20 }
      ]
    },
    'branch-manager': {
      title: 'Branch Manager',
      salary: 50000,
      bonusPercentage: 10,
      kpis: [
        { ...KPI_CLIENT_RETENTION },
        { ...KPI_VISIT_NOTE_CREATION },
        { ...KPI_EXTRA_SERVICES },
        { ...KPI_DIRECT_LABOR_MAINTENANCE }
      ]
    },
    'client-specialist': {
      title: 'Client Specialist',
      salary: 50000,
      bonusPercentage: 10,
      kpis: [
        { ...KPI_CLIENT_RETENTION },
        { ...KPI_VISIT_NOTE_CREATION },
        { ...KPI_EXTRA_SERVICES },
        { ...KPI_PROPERTY_CHECKLIST_ITEM_COMPLETION }
      ]
    },
    'field-supervisor': {
      title: 'Field Supervisor',
      salary: 67250,
      bonusPercentage: 10,
      kpis: [
        { ...KPI_CLIENT_RETENTION },
        { ...KPI_VISIT_NOTE_CREATION },
        { ...KPI_EXTRA_SERVICES },
        { ...KPI_PROPERTY_CHECKLIST_ITEM_COMPLETION }
      ]
    },
    'specialist': {
      title: 'Sales Specialist',
      salary: 77750,
      bonusPercentage: 8,
      kpis: [
        { ...KPI_SALES_GOAL_MET },
        { ...KPI_TOTAL_GROSS_MARGIN },
        { ...KPI_ARBOR_ENHANCEMENT_PROCESS },
        { ...KPI_PIPELINE_UPDATES_CURRENT }
      ]
    },
    'asset-risk-manager': {
      title: 'Placeholder Manager',
      salary: 30000,
      bonusPercentage: 10,
      kpis: [
        { ...KPI_FLEET_UPTIME_RATE },
        { ...KPI_PREVENTATIVE_VS_REACTIVE },
        { ...KPI_ACCIDENT_INCIDENT_RATE },
        { ...KPI_SAFETY_INCIDENTS_MAGNITUDE }
      ]
    }
  };

  // State to track positions data including slider values
  const [positions, setPositions] = useState(initialPositions);
  
  // State for bonus multiplier (global adjustment to all bonuses)
  const [bonusMultiplier, setBonusMultiplier] = useState(100);
  
  // State for headcount with company default values
  const [headcount, setHeadcount] = useState({
    'general-manager': 1,
    'branch-manager': 4,
    'client-specialist': 7,
    'field-supervisor': 10,
    'specialist': 7,
    'asset-risk-manager': 1
  });

  // User authentication and role management (placeholder for future implementation)
  // In a real application, this would come from your authentication system
  const [currentUser, setCurrentUser] = useState({
    email: 'admin@example.com',
    role: 'admin', // 'admin', 'general-manager', 'branch-manager', 'client-specialist', 'field-supervisor', 'specialist', 'asset-risk-manager'
    allowedTabs: ['general-manager', 'branch-manager', 'client-specialist', 'field-supervisor', 'specialist', 'asset-risk-manager', 'headcount']
  });

  // Calculate the total potential bonus
  const calculateTotalBonus = (position) => {
    return position.salary * (position.bonusPercentage / 100);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };
  
  // Make custom slider styles for better cross-browser appearance with colored tracks
  const sliderStyles = `
    /* Basic slider reset and styling */
    input[type=range] {
      -webkit-appearance: none;
      width: 100%;
      height: 8px;
      border-radius: 4px;
      margin: 10px 0;
      background: transparent;
    }
    
    /* Remove default focus outline */
    input[type=range]:focus {
      outline: none;
    }
    
    /* Thumb styling - the draggable handle */
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 22px;
      width: 22px;
      border-radius: 50%;
      background: white;
      border: 2px solid #ddd;
      cursor: pointer;
      margin-top: -7px; /* offset for proper vertical centering */
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      z-index: 3;
      transition: border-color 0.2s ease;
    }
    
    input[type=range]::-moz-range-thumb {
      height: 22px;
      width: 22px;
      border-radius: 50%;
      background: white;
      border: 2px solid #ddd;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      z-index: 3;
      transition: border-color 0.2s ease;
    }
    
    /* Hover states for the thumb */
    input[type=range]:active::-webkit-slider-thumb,
    input[type=range]:hover::-webkit-slider-thumb {
      border-color: #aaa;
    }
    
    input[type=range]:active::-moz-range-thumb,
    input[type=range]:hover::-moz-range-thumb {
      border-color: #aaa;
    }
    
    /* Track styling - the background bar */
    input[type=range]::-webkit-slider-runnable-track {
      width: 100%;
      height: 8px;
      cursor: pointer;
      background: #f0f0f0;
      border-radius: 4px;
    }
    
    input[type=range]::-moz-range-track {
      width: 100%;
      height: 8px;
      cursor: pointer;
      background: #f0f0f0;
      border-radius: 4px;
    }
    
    /* Green sliders */
    input.slider-green::-webkit-slider-runnable-track {
      background: linear-gradient(to right, #34d399 var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    input.slider-green::-moz-range-track {
      background: linear-gradient(to right, #34d399 var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    /* Yellow sliders */
    input.slider-yellow::-webkit-slider-runnable-track {
      background: linear-gradient(to right, #fbbf24 var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    input.slider-yellow::-moz-range-track {
      background: linear-gradient(to right, #fbbf24 var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    /* Orange sliders */
    input.slider-orange::-webkit-slider-runnable-track {
      background: linear-gradient(to right, #fb923c var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    input.slider-orange::-moz-range-track {
      background: linear-gradient(to right, #fb923c var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    /* Red sliders */
    input.slider-red::-webkit-slider-runnable-track {
      background: linear-gradient(to right, #f87171 var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    input.slider-red::-moz-range-track {
      background: linear-gradient(to right, #f87171 var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    /* Blue sliders */
    input.slider-blue::-webkit-slider-runnable-track {
      background: linear-gradient(to right, #4a90e2 var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    input.slider-blue::-moz-range-track {
      background: linear-gradient(to right, #4a90e2 var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    /* Inverse sliders - green */
    input.slider-green-inverse::-webkit-slider-runnable-track {
      background: linear-gradient(to left, #34d399 var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    input.slider-green-inverse::-moz-range-track {
      background: linear-gradient(to left, #34d399 var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    /* Inverse sliders - yellow */
    input.slider-yellow-inverse::-webkit-slider-runnable-track {
      background: linear-gradient(to left, #fbbf24 var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    input.slider-yellow-inverse::-moz-range-track {
      background: linear-gradient(to left, #fbbf24 var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    /* Inverse sliders - orange */
    input.slider-orange-inverse::-webkit-slider-runnable-track {
      background: linear-gradient(to left, #fb923c var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    input.slider-orange-inverse::-moz-range-track {
      background: linear-gradient(to left, #fb923c var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    /* Inverse sliders - red */
    input.slider-red-inverse::-webkit-slider-runnable-track {
      background: linear-gradient(to left, #f87171 var(--track-fill), #f0f0f0 var(--track-fill));
    }
    
    input.slider-red-inverse::-moz-range-track {
      background: linear-gradient(to left, #f87171 var(--track-fill), #f0f0f0 var(--track-fill));
    }
  `;
  
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
      case 'client-specialist':
        return 'bg-purple-50';
      case 'field-supervisor':
        return 'bg-amber-50';
      case 'specialist':
        return 'bg-cyan-50';
      case 'asset-risk-manager':
        return 'bg-red-50';
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
      case 'client-specialist':
        return 'bg-purple-100';
      case 'field-supervisor':
        return 'bg-amber-100';
      case 'specialist':
        return 'bg-cyan-100';
      case 'asset-risk-manager':
        return 'bg-red-100';
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
    const totalBonus = calculateTotalBonus(position);
    const kpi = position.kpis[kpiIndex];
    const kpiWeight = 1 / position.kpis.length; // Equal weight for each KPI
    const kpiTotalAvailable = totalBonus * kpiWeight; // Equal distribution of total bonus for each KPI
    
    // Special calculation for Retention % and Visit Note Creation (both use same logic)
    if (kpi.name === 'Client Retention %' || kpi.name === 'Visit Note Creation') {
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
    // Special calculation for Extra Services
    else if (kpi.name === 'Extra Services') {
      // Below target (100%) - 0% bonus
      if (kpi.actual < 100) {
        return 0;
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
      // Below minimum threshold (3%)
      if (kpi.actual < 3) {
        return 0; // 0% bonus
      }
      // At target exactly (3%)
      else if (kpi.actual === 3) {
        return kpiTotalAvailable * 0.5; // 50% of KPI bonus
      }
      // Between 3% and 6%
      else if (kpi.actual > 3 && kpi.actual < 6) {
        // Base 50% for hitting target
        const baseAmount = kpiTotalAvailable * 0.5;
        // Calculate progress from 3% to 6% (0-50%)
        const progressAboveTarget = (kpi.actual - 3) / 3;
        // Remaining 50% is prorated based on progress
        const additionalAmount = (kpiTotalAvailable * 0.5) * progressAboveTarget;
        
        return baseAmount + additionalAmount;
      }
      // At or above 6%
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
    // Special calculation for Fleet Uptime Rate
    else if (kpi.name === 'Fleet Uptime Rate') {
      // Below 90%
      if (kpi.actual < 90) {
        return 0;
      }
      // At 90% exactly
      else if (kpi.actual === 90) {
        return kpiTotalAvailable * 0.25; // 25% of KPI bonus
      }
      // Between 90% and target (95%)
      else if (kpi.actual > 90 && kpi.actual < 95) {
        // Base 25% for hitting 90%
        const baseAmount = kpiTotalAvailable * 0.25;
        // Calculate progress from 90% to 95% (0-75%)
        const progressToTarget = (kpi.actual - 90) / 5;
        // Remaining 50% is prorated based on progress
        const additionalAmount = (kpiTotalAvailable * 0.5) * progressToTarget;
        
        return baseAmount + additionalAmount;
      }
      // At target exactly (95%)
      else if (kpi.actual === 95) {
        return kpiTotalAvailable * 0.75; // 75% of KPI bonus
      }
      // Between target (95%) and 98%
      else if (kpi.actual > 95 && kpi.actual < 98) {
        // Base 75% for hitting target
        const baseAmount = kpiTotalAvailable * 0.75;
        // Calculate progress from 95% to 98% (0-25%)
        const progressAboveTarget = (kpi.actual - 95) / 3;
        // Remaining 25% is prorated based on progress
        const additionalAmount = (kpiTotalAvailable * 0.25) * progressAboveTarget;
        
        return baseAmount + additionalAmount;
      }
      // At or above 98%
      else {
        return kpiTotalAvailable; // 100% of KPI bonus
      }
    }
    // Special calculation for Preventative vs. Reactive Maintenance Ratio
    else if (kpi.name === 'Preventative vs. Reactive Maintenance Ratio') {
      // Below 70%
      if (kpi.actual < 70) {
        return 0;
      }
      // Between 70% and target (80%)
      else if (kpi.actual >= 70 && kpi.actual < 80) {
        // Linear progression from 0 to 75% of bonus as we approach 80%
        return kpiTotalAvailable * 0.75 * ((kpi.actual - 70) / 10);
      }
      // At target exactly (80%)
      else if (kpi.actual === 80) {
        return kpiTotalAvailable * 0.75; // 75% of KPI bonus
      }
      // Between 80% and 90%
      else if (kpi.actual > 80 && kpi.actual < 90) {
        // Base 75% for hitting target
        const baseAmount = kpiTotalAvailable * 0.75;
        // Calculate progress from 80% to 90% (0-25%)
        const progressAboveTarget = (kpi.actual - 80) / 10;
        // Remaining 25% is prorated based on progress
        const additionalAmount = (kpiTotalAvailable * 0.25) * progressAboveTarget;
        
        return baseAmount + additionalAmount;
      }
      // At or above 90%
      else {
        return kpiTotalAvailable; // 100% of KPI bonus
      }
    }
    // Special calculation for Accident/Incident Rate (inverse - lower is better)
    else if (kpi.name === 'Accident/Incident Rate') {
      // Above 10 (worse performance)
      if (kpi.actual > 10) {
        return 0;
      }
      // Between 10 and 7
      else if (kpi.actual > 7 && kpi.actual <= 10) {
        // Linear progression from 0 to 50% of bonus as we approach 7
        return kpiTotalAvailable * 0.5 * ((10 - kpi.actual) / 3);
      }
      // At 7 exactly
      else if (kpi.actual === 7) {
        return kpiTotalAvailable * 0.5; // 50% of KPI bonus
      }
      // Between target (5) and 7
      else if (kpi.actual > 5 && kpi.actual < 7) {
        // Base 50% for hitting 7
        const baseAmount = kpiTotalAvailable * 0.5;
        // Calculate progress from 7 to 5 (0-50%)
        const progressToTarget = (7 - kpi.actual) / 2;
        // Remaining 50% is prorated based on progress
        const additionalAmount = (kpiTotalAvailable * 0.5) * progressToTarget;
        
        return baseAmount + additionalAmount;
      }
      // At or below target (5) - best performance
      else {
        return kpiTotalAvailable; // 100% of KPI bonus
      }
    }
    // Special calculation for Safety Incidents Magnitude (inverse - lower is better)
    else if (kpi.name === 'Safety Incidents Magnitude') {
      // Above 15 (worse performance)
      if (kpi.actual > 15) {
        return 0;
      }
      // Between 15 and 12
      else if (kpi.actual > 12 && kpi.actual <= 15) {
        // Linear progression from 0 to 50% of bonus as we approach 12
        return kpiTotalAvailable * 0.5 * ((15 - kpi.actual) / 3);
      }
      // At 12 exactly
      else if (kpi.actual === 12) {
        return kpiTotalAvailable * 0.5; // 50% of KPI bonus
      }
      // Between target (10) and 12
      else if (kpi.actual > 10 && kpi.actual < 12) {
        // Base 50% for hitting 12
        const baseAmount = kpiTotalAvailable * 0.5;
        // Calculate progress from 12 to 10 (0-50%)
        const progressToTarget = (12 - kpi.actual) / 2;
        // Remaining 50% is prorated based on progress
        const additionalAmount = (kpiTotalAvailable * 0.5) * progressToTarget;
        
        return baseAmount + additionalAmount;
      }
      // At or below target (10) - best performance
      else {
        return kpiTotalAvailable; // 100% of KPI bonus
      }
    }
    // Special calculation for Pipeline Updates Current
    else if (kpi.name === 'Pipeline Updates Current') {
      // Below minimum threshold (90%)
      if (kpi.actual < 90) {
        return 0; // 0% bonus
      }
      // At exactly 90%
      else if (kpi.actual === 90) {
        return kpiTotalAvailable * 0.5; // 50% of KPI bonus
      }
      // Between 90% and 100%
      else if (kpi.actual > 90 && kpi.actual < 100) {
        // Base 50% for hitting 90% threshold
        const baseAmount = kpiTotalAvailable * 0.5;
        // Calculate progress from 90% to 100% (0-100%)
        const progressAboveThreshold = (kpi.actual - 90) / 10;
        // Remaining 50% is prorated based on progress
        const additionalAmount = (kpiTotalAvailable * 0.5) * progressAboveThreshold;
        
        return baseAmount + additionalAmount;
      }
      // At or above 100%
      else {
        return kpiTotalAvailable; // 100% of KPI bonus
      }
    }
    // Special calculation for Arbor/Enhancement Process Followed
    else if (kpi.name === 'Arbor/Enhancement Process Followed') {
      // Below minimum threshold (90%)
      if (kpi.actual < 90) {
        return 0; // 0% bonus
      }
      // At exactly 90%
      else if (kpi.actual === 90) {
        return kpiTotalAvailable * 0.5; // 50% of KPI bonus
      }
      // Between 90% and 95% (target)
      else if (kpi.actual > 90 && kpi.actual < 95) {
        // Base 50% for hitting 90% threshold
        const baseAmount = kpiTotalAvailable * 0.5;
        // Calculate progress from 90% to 95% (0-100%)
        const progressAboveThreshold = (kpi.actual - 90) / 5;
        // Remaining 50% is prorated based on progress
        const additionalAmount = (kpiTotalAvailable * 0.5) * progressAboveThreshold;
        
        return baseAmount + additionalAmount;
      }
      // At or above target (95%)
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
  
  // Helper function to get performance status color for KPI summary
  const getPerformanceStatusColor = (percent) => {
    if (percent === 100) return 'text-green-600';
    if (percent >= 75) return 'text-green-500';
    if (percent >= 50) return 'text-yellow-600';
    if (percent >= 25) return 'text-orange-500';
    return 'text-red-500';
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

  // Helper function to get min value for sliders based on KPI type
  const getMinValueForKPI = (kpiName) => {
    switch(kpiName) {
      case 'Direct Labor Maintenance %':
        return 25;
      case 'Client Retention %':
      case 'Visit Note Creation':
      case 'Extra Services':
        return 50;
      case 'Total Gross Margin % on Completed Jobs':
        return 40;
      case 'Property Checklist Item Completion':
        return 50;
      case 'Fleet Uptime Rate':
        return 85;
      case 'Preventative vs. Reactive Maintenance Ratio':
        return 50;
      case 'Accident/Incident Rate':
      case 'Safety Incidents Magnitude':
        return 0;
      default:
        return 0;
    }
  };
  
  // Helper function to determine if a KPI is on target or better
  const isKpiOnTarget = (kpi) => {
    if (kpi.isInverse) {
      // For inverse KPIs (lower is better), on target means actual <= target
      return kpi.actual <= kpi.target;
    } else {
      // For normal KPIs (higher is better), on target means actual >= target
      return kpi.actual >= kpi.target;
    }
  };
  
  // Helper function to determine progress status text for KPIs
  const getProgressStatusText = (kpi) => {
    // For Client Retention % or Visit Note Creation
    if (kpi.name === 'Client Retention %' || kpi.name === 'Visit Note Creation') {
      if (kpi.actual < 90) {
        return { text: "Below 90% target", color: "text-red-600" };
      } else if (kpi.actual === 90) {
        return { text: "At target (50% bonus)", color: "text-green-600" };
      } else if (kpi.actual > 100) {
        return { text: "Maximum bonus reached", color: "text-green-600" };
      } else {
        return { 
          text: `${Math.round(((kpi.actual - 90) / 10) * 100)}% progress above target`, 
          color: "text-green-600" 
        };
      }
    }
    
    // For Extra Services
    else if (kpi.name === 'Extra Services') {
      if (kpi.actual < 100) {
        return { text: "Below 100% target (0% bonus)", color: "text-red-600" };
      } else if (kpi.actual === 100) {
        return { text: "At target (50% bonus)", color: "text-green-600" };
      } else if (kpi.actual >= 110) {
        return { text: "Maximum bonus reached", color: "text-green-600" };
      } else {
        return { 
          text: `${50 + Math.round(((kpi.actual - 100) / 10) * 50)}% of bonus`, 
          color: "text-green-600" 
        };
      }
    }
    
    // For other KPIs, return a default
    return { text: "", color: "text-gray-500" };
  };
  
  // Helper function to get slider color classes for KPI
  const getSliderColorClass = (kpi) => {
    const isOnTarget = isKpiOnTarget(kpi);
    const baseClass = kpi.isInverse ? '-inverse' : '';
    
    if (isOnTarget) {
      return `slider-green${baseClass}`;
    }
    
    // If we're close to target (within 10%), show yellow
    const percentOfTarget = kpi.isInverse 
      ? (kpi.target / kpi.actual) * 100
      : (kpi.actual / kpi.target) * 100;
    
    if (percentOfTarget >= 90) {
      return `slider-yellow${baseClass}`;
    } else if (percentOfTarget >= 75) {
      return `slider-orange${baseClass}`;
    } else {
      return `slider-red${baseClass}`;
    }
  };
  
  // Function to update handle position when slider changes
  // No longer needed with our new approach
  const updateHandlePositions = () => {
    // This function is kept as a placeholder in case we need
    // to add any specific slider functionality in the future
  };

  // Calculate KPI summary data for a position
  const getKpiSummary = (position) => {
    const totalKpis = position.kpis.length;
    const onTargetKpis = position.kpis.filter(kpi => isKpiOnTarget(kpi)).length;
    const percentOnTarget = Math.round((onTargetKpis / totalKpis) * 100);
    
    return {
      total: totalKpis,
      onTarget: onTargetKpis,
      percent: percentOnTarget
    };
  };

  // Helper function to get max value for sliders based on KPI type
  const getMaxValueForKPI = (kpiName) => {
    switch(kpiName) {
      case 'Direct Labor Maintenance %':
        return 45;
      case 'Extra Services':
        return 110;
      case 'Total Gross Margin % on Completed Jobs':
        return 80;
      case 'LV Maintenance Growth':
        return 10;
      case 'Fleet Uptime Rate':
        return 100;
      case 'Preventative vs. Reactive Maintenance Ratio':
        return 100;
      case 'Accident/Incident Rate':
        return 15;
      case 'Safety Incidents Magnitude':
        return 20;
      default:
        return 100;
    }
  };

  // Render KPI cards with sliders and increment/decrement buttons
  const renderKPICards = (position, positionKey) => {
    return position.kpis.map((kpi, index) => {
      const kpiBonus = calculateKpiBonus(position, index);
      
      return (
        <div key={index} className="bg-white p-4 rounded-lg shadow-md mb-4">
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
                {kpi.name === 'Client Retention %' || kpi.name === 'Visit Note Creation' ? (
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
    });
  };

  // Render the headcount tab content
  const renderHeadcountTab = () => {
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
{userRoleExpanded ? (
  <div className="mb-4 bg-white p-3 rounded-lg shadow-sm">
    <div 
      className="flex items-center justify-between cursor-pointer"
      onClick={() => setUserRoleExpanded(!userRoleExpanded)}
    >
      <h3 className="text-sm font-medium text-gray-700">Demo: Select User Role</h3>
      <div className="text-blue-500 flex items-center">
        <span className="text-xs mr-1 text-blue-600">Hide</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
    
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {['admin', 'general-manager', 'branch-manager', 'client-specialist', 'field-supervisor', 'specialist', 'asset-risk-manager'].map(role => (
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
  </div>
) : (
  // Small floating button when collapsed
  <button
    onClick={() => setUserRoleExpanded(true)}
    className="fixed top-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-xs shadow-lg hover:bg-gray-700 z-20"
    title="Show User Role Selector"
  >
    Show Demo Panel
  </button>
)}
      
      {/* Tabs - only render tabs that the user has access to */}
      <div className="flex flex-wrap border-b border-gray-200 mb-6 overflow-x-auto">
        {['general-manager', 'branch-manager', 'client-specialist', 'specialist', 'field-supervisor', 'asset-risk-manager', 'headcount']
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
  renderHeadcountTab()
) : (
  <div className={`p-6 rounded-lg ${getTabColor(activeTab)}`}>
    {/* Beta/Under Construction Banner - Only for Branch Manager tab */}
    {activeTab === 'branch-manager' && (
      <div className="mb-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 text-center">
        <h3 className="text-lg font-bold text-yellow-800">
          🚧 BETA VERSION - UNDER CONSTRUCTION 🚧
        </h3>
        <p className="text-sm text-yellow-700 mt-1">
          Test values only. Not for actual performance evaluation.
        </p>
      </div>
    )}
    
    {/* Salary and Bonus Info with KPI Summary - Sticky Header */}
          <div className={`p-4 rounded-lg shadow-md mb-6 sticky top-0 z-10 ${getHeaderColor(activeTab)}`}>            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <h3 className="text-xs md:text-lg font-semibold text-gray-800">Annual Salary</h3>
                <div className="flex items-center mt-2">
                  <span className="text-gray-500 mr-1">$</span>
                  <input
                    type="text"
                    value={formatSalaryForDisplay(positions[activeTab].salary)}
                    onChange={(e) => handleSalaryChange(activeTab, e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-base md:text-xl font-bold text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-xs md:text-lg font-semibold text-gray-800">Bonus %</h3>
                <div className="flex items-center mt-2">
                  <input
                    type="number"
                    value={positions[activeTab].bonusPercentage}
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
                  {formatCurrency(calculateActualTotalBonus(positions[activeTab]))}
                </p>
              </div>
              <div>
                <h3 className="text-xs md:text-lg font-semibold text-gray-800">Available Bonus</h3>
                <p className="text-lg md:text-2xl font-bold text-blue-600 mt-2">
                  {formatCurrency(calculateTotalBonus(positions[activeTab]))}
                </p>
              </div>
            </div>
            
            {/* KPI Summary - Compact Version */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              {(() => {
                const summary = getKpiSummary(positions[activeTab]);
                return (
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
                );
              })()}
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
                  {positions[activeTab].kpis.map((kpi, index) => {
                    const kpiBonus = calculateKpiBonus(positions[activeTab], index);
                    const maxKpiBonus = calculateTotalBonus(positions[activeTab]) / positions[activeTab].kpis.length;
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
          
          {/* KPI Section Header */}
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Key Performance Indicators</h2>
          
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