"use client"

// src/components/AdminPanel/IncentiveSummary.jsx
//
// Aggregate view of projected incentive payouts across all active users.
// Pulls the same role -> position transformation used on the dashboard via
// buildPositions(), runs it per user with their personal context (salary,
// branch, eligibility date), then sums up pro-rated bonuses by period and
// by KPI for exec reporting.

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { buildPositions } from '../KPIDashboard/utils/buildPositions';
import {
  computePeriodBonusMax,
  calculateQuarterBonus,
  calculateAnnualBonus,
} from '../KPIDashboard/utils/bonusCalculations';
import { formatCurrency } from '../KPIDashboard/utils/formatters';
import {
  QUARTER_MONTHS,
  YEAR_MONTHS,
  parseEligibilityDate,
  getProrationFactor,
} from '../KPIDashboard/utils/proration';

const PERIODS = ['Q1', 'Q2', 'Q3', 'Q4', 'YE'];

const IncentiveSummary = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]); // [{ user, roleTitle, kpiName, full: {Q1,...,YE,Total}, prorated: {...} }]

  useEffect(() => {
    fetchAndCompute();
  }, []);

  const fetchAndCompute = async () => {
    try {
      setLoading(true);

      const [
        { data: rolesData, error: rolesErr },
        { data: formulasData, error: formulasErr },
        { data: usersData, error: usersErr },
        { data: userRolesData, error: urErr },
        { data: actualsData, error: actualsErr },
      ] = await Promise.all([
        supabase.from('roles').select('*, role_kpis(*, kpi:kpis(*))').order('display_order'),
        supabase.from('bonus_formulas').select('*'),
        supabase.from('allowed_users').select('*').eq('is_active', true).order('name'),
        supabase.from('user_roles').select('user_email, role_key'),
        supabase.from('user_kpi_actuals').select('user_email, kpi_name, period, actual, locked'),
      ]);

      const firstErr = rolesErr || formulasErr || usersErr || urErr || actualsErr;
      if (firstErr) throw firstErr;

      const userActualsByKpi = {};
      for (const row of actualsData || []) {
        if (!userActualsByKpi[row.kpi_name]) userActualsByKpi[row.kpi_name] = {};
        if (!userActualsByKpi[row.kpi_name][row.user_email]) {
          userActualsByKpi[row.kpi_name][row.user_email] = { email: row.user_email };
        }
        userActualsByKpi[row.kpi_name][row.user_email][row.period] = {
          actual: row.actual, locked: row.locked,
        };
      }

      const rolesByUser = new Map();
      for (const ur of userRolesData || []) {
        if (!rolesByUser.has(ur.user_email)) rolesByUser.set(ur.user_email, []);
        rolesByUser.get(ur.user_email).push(ur.role_key);
      }

      const computed = [];
      for (const user of usersData || []) {
        const userRoleKeys = rolesByUser.get(user.email) || [];
        if (userRoleKeys.length === 0) continue;

        const { transformedPositions } = buildPositions({
          rolesData,
          formulasData,
          userActualsByKpi,
          userContext: {
            isAdmin: false,
            userEmail: user.email,
            userSalary: user.salary,
            userBranch: user.branch,
            userDepartment: user.department,
          },
        });

        const eligibility = parseEligibilityDate(user.eligibility_date);
        const factors = {
          Q1: getProrationFactor(eligibility, QUARTER_MONTHS.Q1[0], QUARTER_MONTHS.Q1[1]),
          Q2: getProrationFactor(eligibility, QUARTER_MONTHS.Q2[0], QUARTER_MONTHS.Q2[1]),
          Q3: getProrationFactor(eligibility, QUARTER_MONTHS.Q3[0], QUARTER_MONTHS.Q3[1]),
          Q4: getProrationFactor(eligibility, QUARTER_MONTHS.Q4[0], QUARTER_MONTHS.Q4[1]),
          YE: getProrationFactor(eligibility, YEAR_MONTHS[0], YEAR_MONTHS[1]),
        };

        for (const roleKey of userRoleKeys) {
          const position = transformedPositions[roleKey];
          if (!position) continue;

          for (const kpi of position.kpis) {
            if (!kpi.hasPeriods) continue;
            const { perQuarter, annual: annualMax } = computePeriodBonusMax(
              position, kpi.weight, kpi.bonusSplit
            );
            const formulaKey = kpi.formulaKey || kpi.name;

            const full = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, YE: 0, Total: 0 };
            const prorated = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, YE: 0, Total: 0 };

            for (const q of kpi.quarters || []) {
              const qBonus = calculateQuarterBonus(q, kpi.isInverse, perQuarter, formulaKey);
              full[q.id] = qBonus;
              prorated[q.id] = qBonus * (factors[q.id] ?? 1);
            }
            const yeBonus = calculateAnnualBonus(kpi.annual, kpi.isInverse, annualMax, formulaKey);
            full.YE = yeBonus;
            prorated.YE = yeBonus * factors.YE;

            full.Total = full.Q1 + full.Q2 + full.Q3 + full.Q4 + full.YE;
            prorated.Total = prorated.Q1 + prorated.Q2 + prorated.Q3 + prorated.Q4 + prorated.YE;

            computed.push({
              userName: user.name || user.email,
              userEmail: user.email,
              eligibilityDate: user.eligibility_date,
              roleTitle: position.title,
              kpiName: kpi.name,
              kpiScope: kpi.scope,
              full,
              prorated,
            });
          }
        }
      }

      setRows(computed);
      setLoading(false);
    } catch (err) {
      console.error('Error computing incentive summary:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const { periodTotals, kpiRows, userRows, grandTotal } = useMemo(() => {
    const periodTotals = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, YE: 0, Total: 0 };
    const kpiMap = new Map();
    const userMap = new Map();
    for (const r of rows) {
      for (const p of PERIODS) periodTotals[p] += r.prorated[p];
      periodTotals.Total += r.prorated.Total;

      if (!kpiMap.has(r.kpiName)) {
        kpiMap.set(r.kpiName, { Q1: 0, Q2: 0, Q3: 0, Q4: 0, YE: 0, Total: 0 });
      }
      const kpiAgg = kpiMap.get(r.kpiName);
      for (const p of PERIODS) kpiAgg[p] += r.prorated[p];
      kpiAgg.Total += r.prorated.Total;

      if (!userMap.has(r.userEmail)) {
        userMap.set(r.userEmail, {
          userName: r.userName,
          userEmail: r.userEmail,
          roleTitles: new Set(),
          eligibilityDate: r.eligibilityDate,
          isProrated: false,
          Q1: 0, Q2: 0, Q3: 0, Q4: 0, YE: 0, Total: 0,
        });
      }
      const uAgg = userMap.get(r.userEmail);
      uAgg.roleTitles.add(r.roleTitle);
      if (r.eligibilityDate && r.full.Total !== r.prorated.Total) uAgg.isProrated = true;
      for (const p of PERIODS) uAgg[p] += r.prorated[p];
      uAgg.Total += r.prorated.Total;
    }
    const kpiRows = [...kpiMap.entries()].map(([kpiName, v]) => ({ kpiName, ...v }));
    const userRows = [...userMap.values()].map(u => ({ ...u, roleTitles: [...u.roleTitles].join(', ') }));
    return { periodTotals, kpiRows, userRows, grandTotal: periodTotals.Total };
  }, [rows]);

  // Sort state per table: { column, dir: 'asc' | 'desc' }
  const [kpiSort, setKpiSort] = useState({ column: 'Total', dir: 'desc' });
  const [userSort, setUserSort] = useState({ column: 'userName', dir: 'asc' });

  const toggleSort = (setter, col, defaultDir = 'desc') => () => {
    setter(prev => prev.column === col
      ? { column: col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { column: col, dir: defaultDir }
    );
  };

  const sortBy = (arr, { column, dir }) => {
    const mult = dir === 'asc' ? 1 : -1;
    return [...arr].sort((a, b) => {
      const av = a[column], bv = b[column];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mult;
      return String(av ?? '').localeCompare(String(bv ?? ''), undefined, { sensitivity: 'base' }) * mult;
    });
  };

  const kpiTotals = useMemo(() => sortBy(kpiRows, kpiSort), [kpiRows, kpiSort]);
  const userTotals = useMemo(() => sortBy(userRows, userSort), [userRows, userSort]);

  const arrow = (state, col) => state.column === col ? (state.dir === 'asc' ? ' ▲' : ' ▼') : '';
  const sortableTh = (label, col, align, state, setter, defaultDir = 'desc') => (
    <th
      key={col}
      onClick={toggleSort(setter, col, defaultDir)}
      style={{ ...thStyle, textAlign: align, cursor: 'pointer', userSelect: 'none' }}
      title="Click to sort"
    >
      {label}{arrow(state, col)}
    </th>
  );

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Computing incentive summary...</div>;
  if (error)   return <div style={{ padding: '20px', color: '#dc2626' }}>Error: {error}</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Incentive Summary</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          Projected incentive payouts across all active users, pro-rated by eligibility date.
          Grand total: <strong style={{ color: '#059669' }}>{formatCurrency(grandTotal)}</strong>
          {' '}· {rows.length} user × KPI rows
        </p>
      </div>

      {/* Totals by Period */}
      <div style={{
        background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
        overflow: 'hidden', marginBottom: '24px',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Totals by Period</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#1e3a5f' }}>
            <tr>
              {PERIODS.map(p => (
                <th key={p} style={thStyle}>{p}</th>
              ))}
              <th style={thStyle}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {PERIODS.map(p => (
                <td key={p} style={tdMoney}>{formatCurrency(periodTotals[p])}</td>
              ))}
              <td style={{ ...tdMoney, fontWeight: 700, color: '#059669' }}>{formatCurrency(periodTotals.Total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals by KPI */}
      <div style={{
        background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
        overflow: 'hidden', marginBottom: '24px',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Totals by KPI</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#1e3a5f' }}>
            <tr>
              {sortableTh('KPI', 'kpiName', 'left', kpiSort, setKpiSort, 'asc')}
              {PERIODS.map(p => sortableTh(p, p, 'right', kpiSort, setKpiSort))}
              {sortableTh('Total', 'Total', 'right', kpiSort, setKpiSort)}
            </tr>
          </thead>
          <tbody>
            {kpiTotals.map(row => (
              <tr key={row.kpiName} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 12px', fontSize: '13px', color: '#374151' }}>{row.kpiName}</td>
                {PERIODS.map(p => (
                  <td key={p} style={tdMoney}>{formatCurrency(row[p])}</td>
                ))}
                <td style={{ ...tdMoney, fontWeight: 600, color: '#059669' }}>{formatCurrency(row.Total)}</td>
              </tr>
            ))}
            {kpiTotals.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals by User */}
      <div style={{
        background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Totals by User</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#1e3a5f' }}>
            <tr>
              {sortableTh('User', 'userName', 'left', userSort, setUserSort, 'asc')}
              {sortableTh('Role', 'roleTitles', 'left', userSort, setUserSort, 'asc')}
              {PERIODS.map(p => sortableTh(p, p, 'right', userSort, setUserSort))}
              {sortableTh('Total', 'Total', 'right', userSort, setUserSort)}
            </tr>
          </thead>
          <tbody>
            {userTotals.map(u => (
              <tr key={u.userEmail} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 12px', fontSize: '13px', color: '#374151' }}>
                  <div>{u.userName}</div>
                  {u.isProrated && (
                    <div style={{ color: '#d97706', fontSize: '11px' }}>
                      eligible {u.eligibilityDate}
                    </div>
                  )}
                </td>
                <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280' }}>{u.roleTitles}</td>
                {PERIODS.map(p => (
                  <td key={p} style={tdMoney}>{formatCurrency(u[p])}</td>
                ))}
                <td style={{ ...tdMoney, fontWeight: 600, color: '#059669' }}>{formatCurrency(u.Total)}</td>
              </tr>
            ))}
            {userTotals.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const thStyle = {
  padding: '10px 12px', textAlign: 'right', fontWeight: 600, fontSize: '12px', color: 'white',
};
const tdMoney = {
  padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: '#374151',
  fontVariantNumeric: 'tabular-nums',
};

export default IncentiveSummary;
