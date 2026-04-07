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
      return 30;
    case 'Client Retention %':
    case 'Punchlist Creation':  // Updated from Visit Note Creation
    case 'Extra Services Revenue':
      return 80;
    case 'Total Gross Margin % on Completed Jobs':
      return 50;
    case 'Net Controllable Income Goal':
      return 80;
    case 'Property Checklist Item Completion':
      return 50;
    case 'Fleet Uptime Rate':
      return 85;
    case 'Preventative vs. Reactive Maintenance Ratio':
      return 50;
    case 'Accident/Incident Rate':
    case 'Safety Incidents Magnitude':
      return 0;
    case 'Irrigation Billable Time':
      return 30;
    default:
      return 0;
  }
};

/**
 * Get the floor value for quarterly sliders — the value below which
 * the slider cannot go. Only non-zero for KPIs whose bar range starts above 0.
 * @param {string} kpiName
 * @returns {number}
 */
export const getQuarterFloorForKPI = (kpiName) => {
  switch(kpiName) {
    case 'Extra Services Revenue':
      return 80;
    case 'Direct Labor Maintenance %':
      return 30;
    case 'Total Gross Margin % on Completed Jobs':
      return 50;
    case 'Net Controllable Income Goal':
      return 80;
    case 'Client Retention %':
      return 80;
    case 'Net Maintenance Growth':
      return -15;
    default:
      return 0;
  }
};

/**
 * Get minimum value for KPI annual slider. Falls back to getMinValueForKPI.
 * @param {string} kpiName
 * @returns {number}
 */
export const getAnnualMinValueForKPI = (kpiName) => {
  switch(kpiName) {
    case 'Net Maintenance Growth':
      return 10;
    default:
      return getMinValueForKPI(kpiName);
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
      return 50;
    case 'Extra Services Revenue':
      return 140;
    case 'Total Gross Margin % on Completed Jobs':
      return 70;
    case 'Net Controllable Income Goal':
      return 130;
    case 'LV Maintenance Growth':
      return 10;
    case 'Net Maintenance Growth':
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
 * Get maximum value for KPI annual slider. Falls back to getMaxValueForKPI.
 * @param {string} kpiName
 * @returns {number}
 */
export const getAnnualMaxValueForKPI = (kpiName) => {
  switch(kpiName) {
    case 'Net Maintenance Growth':
      return 30;
    case 'Net Controllable Income Goal':
      return 130;
    default:
      return getMaxValueForKPI(kpiName);
  }
};

/**
 * Determine if a KPI is on target or better
 * @param {Object} kpi - The KPI object
 * @returns {boolean} True if KPI meets or exceeds target
 */
export const isKpiOnTarget = (kpi) => {
  // When KPI has period data, check annual actual vs annual target
  if (kpi.hasPeriods && kpi.annual) {
    if (kpi.isInverse) {
      return kpi.annual.actual <= kpi.annual.target;
    }
    return kpi.annual.actual >= kpi.annual.target;
  }

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
  // For Client Retention % or Punchlist Creation
  if (kpi.name === 'Client Retention %' || kpi.name === 'Punchlist Creation') {
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
  else if (kpi.name === 'Extra Services Revenue') {
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