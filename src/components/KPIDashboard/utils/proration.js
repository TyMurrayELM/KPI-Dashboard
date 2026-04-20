// src/components/KPIDashboard/utils/proration.js

export const PERFORMANCE_YEAR = 2026;

// [startMonth, endMonth] inclusive, 0-indexed
export const QUARTER_MONTHS = {
  Q1: [0, 2],
  Q2: [3, 5],
  Q3: [6, 8],
  Q4: [9, 11],
};
export const YEAR_MONTHS = [0, 11];

export const parseEligibilityDate = (iso) => {
  if (!iso) return null;
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

// Whole-month counts for a period given an eligibility date.
// Eligibility month counts as eligible (e.g. Feb 15 start → Feb is eligible).
export const getProrationMonths = (eligibilityDate, startMonth, endMonth) => {
  const totalMonths = endMonth - startMonth + 1;
  if (!eligibilityDate) return { eligibleMonths: totalMonths, totalMonths };
  const eligYear = eligibilityDate.getFullYear();
  const eligMonth = eligibilityDate.getMonth();
  if (eligYear < PERFORMANCE_YEAR) return { eligibleMonths: totalMonths, totalMonths };
  if (eligYear > PERFORMANCE_YEAR) return { eligibleMonths: 0, totalMonths };
  if (eligMonth <= startMonth) return { eligibleMonths: totalMonths, totalMonths };
  if (eligMonth > endMonth) return { eligibleMonths: 0, totalMonths };
  return { eligibleMonths: endMonth - eligMonth + 1, totalMonths };
};

export const getProrationFactor = (eligibilityDate, startMonth, endMonth) => {
  const { eligibleMonths, totalMonths } = getProrationMonths(eligibilityDate, startMonth, endMonth);
  return eligibleMonths / totalMonths;
};
