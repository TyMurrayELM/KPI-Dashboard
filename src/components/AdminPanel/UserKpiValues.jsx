"use client"

// src/components/AdminPanel/UserKpiValues.jsx
//
// Per-user KPI overrides. Currently supports Client Success Specialist
// → "Client Retention %" (Q1–Q4 + Annual). Schema is generic so additional
// per-user KPIs can be added without a migration.
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

// Configuration: which (role name, kpi name) pairs are editable here.
const PER_USER_KPIS = [
  { roleName: 'Client Success Specialist', kpiName: 'Client Retention %', unit: '%' },
];

const PERIODS = ['Q1', 'Q2', 'Q3', 'Q4', 'Annual'];

const UserKpiValues = () => {
  const [users, setUsers] = useState([]);   // [{ email, name, kpiName, values: { Q1: {actual,locked}, ... } }]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Resolve role keys for the configured role names
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('key, name');
      if (rolesError) throw rolesError;

      const targetRoleKeys = rolesData
        .filter(r => PER_USER_KPIS.some(p => p.roleName === r.name))
        .map(r => r.key);
      const roleKeyToName = Object.fromEntries(rolesData.map(r => [r.key, r.name]));

      // 2. Fetch users assigned to one of those roles
      const { data: userRolesData, error: urError } = await supabase
        .from('user_roles')
        .select('user_email, role_key')
        .in('role_key', targetRoleKeys);
      if (urError) throw urError;

      const userEmails = [...new Set(userRolesData.map(ur => ur.user_email))];
      if (userEmails.length === 0) {
        setUsers([]);
        return;
      }

      const { data: usersData, error: usersError } = await supabase
        .from('allowed_users')
        .select('email, name, is_active')
        .in('email', userEmails)
        .order('name');
      if (usersError) throw usersError;

      // 3. Fetch existing actuals for these users + KPI names
      const kpiNames = PER_USER_KPIS.map(p => p.kpiName);
      const { data: actualsData, error: actualsError } = await supabase
        .from('user_kpi_actuals')
        .select('user_email, kpi_name, period, actual, locked')
        .in('user_email', userEmails)
        .in('kpi_name', kpiNames);
      if (actualsError) throw actualsError;

      // 4. Build flat row list: one row per (user, kpi) pair
      const rows = [];
      for (const user of usersData) {
        const userRoleKeys = userRolesData
          .filter(ur => ur.user_email === user.email)
          .map(ur => ur.role_key);
        for (const config of PER_USER_KPIS) {
          const userHasRole = userRoleKeys.some(k => roleKeyToName[k] === config.roleName);
          if (!userHasRole) continue;

          const values = {};
          for (const period of PERIODS) {
            const existing = actualsData.find(
              a => a.user_email === user.email && a.kpi_name === config.kpiName && a.period === period
            );
            values[period] = {
              actual: existing?.actual ?? '',
              locked: existing?.locked ?? false,
            };
          }
          rows.push({
            email: user.email,
            name: user.name || user.email,
            roleName: config.roleName,
            kpiName: config.kpiName,
            unit: config.unit,
            values,
          });
        }
      }
      setUsers(rows);
    } catch (err) {
      console.error('Error fetching user KPI values:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateLocalValue = (rowIndex, period, field, value) => {
    setUsers(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row;
      return {
        ...row,
        values: {
          ...row.values,
          [period]: { ...row.values[period], [field]: value },
        },
      };
    }));
  };

  const persistValue = async (row, period) => {
    const cell = row.values[period];
    const actualNum = cell.actual === '' || cell.actual == null ? null : parseFloat(cell.actual);
    if (actualNum != null && Number.isNaN(actualNum)) return;
    try {
      const { error } = await supabase
        .from('user_kpi_actuals')
        .upsert(
          {
            user_email: row.email,
            kpi_name: row.kpiName,
            period,
            actual: actualNum,
            locked: cell.locked,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_email,kpi_name,period' }
        );
      if (error) throw error;
    } catch (err) {
      alert(`Error saving value: ${err.message}`);
      fetchData();
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading user KPI values...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>User KPI Values</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          Set per-user actuals for KPIs scoped to individual books of business.
          Currently supports Client Success Specialist → Client Retention %.
        </p>
      </div>

      {users.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280',
          background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          No users with per-user KPIs found. Assign the Client Success Specialist role
          to a user in Manage Users to get started.
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #e5e7eb',
          borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#1e3a5f' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600',
                  fontSize: '13px', color: 'white' }}>User</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600',
                  fontSize: '13px', color: 'white' }}>KPI</th>
                {PERIODS.map(p => (
                  <th key={p} style={{ padding: '12px', textAlign: 'center',
                    fontWeight: '600', fontSize: '13px', color: 'white' }}>{p}</th>
                ))}
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600',
                  fontSize: '13px', color: 'white' }}>Q1 Lock</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row, rowIndex) => (
                <tr key={`${row.email}-${row.kpiName}`} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                    <div>{row.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{row.email}</div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#374151' }}>
                    {row.kpiName}
                  </td>
                  {PERIODS.map(period => (
                    <td key={period} style={{ padding: '8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        <input
                          type="number"
                          step="0.1"
                          value={row.values[period].actual}
                          placeholder="—"
                          onChange={(e) => updateLocalValue(rowIndex, period, 'actual', e.target.value)}
                          onBlur={() => persistValue(row, period)}
                          style={{
                            width: '70px',
                            padding: '6px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px',
                            textAlign: 'right',
                            background: 'white',
                          }}
                        />
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{row.unit}</span>
                      </div>
                    </td>
                  ))}
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={row.values.Q1.locked}
                      onChange={(e) => {
                        updateLocalValue(rowIndex, 'Q1', 'locked', e.target.checked);
                        // persist immediately on toggle
                        const updated = {
                          ...row,
                          values: {
                            ...row.values,
                            Q1: { ...row.values.Q1, locked: e.target.checked },
                          },
                        };
                        persistValue(updated, 'Q1');
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserKpiValues;
