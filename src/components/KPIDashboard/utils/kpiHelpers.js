// src/components/KPIDashboard/utils/kpiHelpers.js

/**
 * Helper functions for KPI calculations and display logic
 */

/**
 * Get minimum value for KPI sliders based on KPI type
 * @param {string} kpiName - The name of the KPI
 * @returns {number} Minimum value for the slider
 */
export const getMinValueForKPI = (kpiName) => {
  switch(kpiName) {
    case 'Direct Labor Maintenance %':
      return 25;
    case 'Client Retention %':
    case 'Punch List Creation':  // Updated from Visit Note Creation
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

/**
 * Get maximum value for KPI sliders based on KPI type
 * @param {string} kpiName - The name of the KPI
 * @returns {number} Maximum value for the slider
 */
export const getMaxValueForKPI = (kpiName) => {
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

/**
 * Determine if a KPI is on target or better
 * @param {Object} kpi - The KPI object
 * @returns {boolean} True if KPI meets or exceeds target
 */
export const isKpiOnTarget = (kpi) => {
  if (kpi.isInverse) {
    // For inverse KPIs (lower is better), on target means actual <= target
    return kpi.actual <= kpi.target;
  } else {
    // For normal KPIs (higher is better), on target means actual >= target
    return kpi.actual >= kpi.target;
  }
};

/**
 * Get progress status text for specific KPIs
 * @param {Object} kpi - The KPI object
 * @returns {Object} Object with text and color properties
 */
export const getProgressStatusText = (kpi) => {
  // For Client Retention % or Punch List Creation
  if (kpi.name === 'Client Retention %' || kpi.name === 'Punch List Creation') {
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

/**
 * Get slider color class based on KPI performance
 * @param {Object} kpi - The KPI object
 * @returns {string} CSS class name for the slider color
 */
export const getSliderColorClass = (kpi) => {
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

/**
 * Calculate KPI summary data for a position
 * @param {Object} position - The position object with KPIs
 * @returns {Object} Summary object with total, onTarget, and percent properties
 */
export const getKpiSummary = (position) => {
  const totalKpis = position.kpis.length;
  const onTargetKpis = position.kpis.filter(kpi => isKpiOnTarget(kpi)).length;
  const percentOnTarget = Math.round((onTargetKpis / totalKpis) * 100);
  
  return {
    total: totalKpis,
    onTarget: onTargetKpis,
    percent: percentOnTarget
  };
};