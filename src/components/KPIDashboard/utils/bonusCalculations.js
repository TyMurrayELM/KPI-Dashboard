// src/components/KPIDashboard/utils/bonusCalculations.js

/**
 * Calculate the total potential bonus for a position
 * @param {Object} position - The position object with salary and bonusPercentage
 * @returns {number} Total potential bonus amount
 */
export const calculateTotalBonus = (position) => {
  return position.salary * (position.bonusPercentage / 100);
};

/**
 * Calculate the bonus amount per KPI based on performance
 * @param {Object} position - The position object
 * @param {number} kpiIndex - Index of the KPI in the position's KPI array
 * @returns {number} Calculated bonus amount for the KPI
 */
export const calculateKpiBonus = (position, kpiIndex) => {
  const totalBonus = calculateTotalBonus(position);
  const kpi = position.kpis[kpiIndex];
  const kpiWeight = 1 / position.kpis.length; // Equal weight for each KPI
  const kpiTotalAvailable = totalBonus * kpiWeight; // Equal distribution of total bonus for each KPI
  
  // Special calculation for Retention % and Punch List Creation (both use same logic)
  if (kpi.name === 'Client Retention %' || kpi.name === 'Punch List Creation') {
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

/**
 * Calculate total actual bonus based on all KPIs
 * @param {Object} position - The position object
 * @returns {number} Total actual bonus amount
 */
export const calculateActualTotalBonus = (position) => {
  let totalActualBonus = 0;
  
  position.kpis.forEach((kpi, index) => {
    totalActualBonus += calculateKpiBonus(position, index);
  });
  
  return totalActualBonus;
};