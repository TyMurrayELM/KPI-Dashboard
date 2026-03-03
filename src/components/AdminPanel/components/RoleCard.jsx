"use client"

import React from 'react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(value);
};

const RoleCard = ({
  role,
  roleKpis,
  onEditRole,
  onDeleteRole,
  onToggleVisibility,
  onAssignKpi,
  onUpdateRoleKpi,
  onRemoveKpi,
  onEditKpiDefinition,
  onOpenFormula
}) => {
  const totalWeight = (roleKpis || []).reduce((sum, rk) => sum + (rk.weight || 0), 0);

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      marginBottom: '20px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: role.color || '#dbeafe',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '600', margin: 0 }}>
            {role.name}
          </h3>
          <span style={{ fontSize: '13px', color: '#374151' }}>
            {formatCurrency(role.base_salary)} salary
          </span>
          <span style={{ fontSize: '13px', color: '#374151' }}>
            {role.bonus_percentage}% bonus
          </span>
          <span style={{ fontSize: '13px', color: '#374151' }}>
            Headcount: {role.default_headcount}
          </span>
          <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>
            {role.key}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Visibility toggle */}
          <button
            onClick={() => onToggleVisibility(role)}
            title={role.is_visible !== false ? 'Visible on dashboard' : 'Hidden from dashboard'}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
              background: role.is_visible !== false ? '#22c55e' : '#d1d5db',
            }}
          >
            <span style={{
              display: 'block',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'white',
              position: 'absolute',
              top: '3px',
              transition: 'left 0.2s',
              left: role.is_visible !== false ? '23px' : '3px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }} />
          </button>
          <button
            onClick={() => onEditRole(role)}
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Edit
          </button>
          <button
            onClick={() => onDeleteRole(role)}
            style={{
              padding: '6px 12px',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* KPI Assignment Table */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: 0 }}>
            Assigned KPIs
          </h4>
          <button
            onClick={() => onAssignKpi(role)}
            style={{
              padding: '6px 14px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            + Assign KPI
          </button>
        </div>

        {(!roleKpis || roleKpis.length === 0) ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '14px', background: '#f9fafb', borderRadius: '6px' }}>
            No KPIs assigned yet. Click "+ Assign KPI" to add one.
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: '#6b7280' }}>#</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: '#6b7280' }}>KPI Name</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: '#6b7280' }}>Scope</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: '#6b7280' }}>Target</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: '#6b7280' }}>Weight</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', fontSize: '12px', color: '#6b7280' }}>Active</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', fontSize: '12px', color: '#6b7280' }}>Formula</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontWeight: '600', fontSize: '12px', color: '#6b7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roleKpis.map((rk) => (
                  <tr key={rk.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="number"
                        value={rk.display_order}
                        onChange={(e) => onUpdateRoleKpi(rk.id, 'display_order', e.target.value)}
                        min="1"
                        style={{
                          width: '50px',
                          padding: '4px 6px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button
                        onClick={() => onEditKpiDefinition(rk.kpi)}
                        title="Edit KPI definition"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#2563eb',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {rk.kpi?.name}
                      </button>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={rk.scope || 'individual'}
                        onChange={(e) => onUpdateRoleKpi(rk.id, 'scope', e.target.value)}
                        style={{
                          padding: '4px 6px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px',
                          background: 'white'
                        }}
                      >
                        <option value="individual">Individual</option>
                        <option value="region-phoenix">Region - Phoenix</option>
                        <option value="region-lasvegas">Region - Las Vegas</option>
                        <option value="company">Company</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="number"
                        value={rk.target_value}
                        onChange={(e) => onUpdateRoleKpi(rk.id, 'target_value', e.target.value)}
                        step="0.01"
                        style={{
                          width: '80px',
                          padding: '4px 6px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="number"
                        value={rk.weight}
                        onChange={(e) => onUpdateRoleKpi(rk.id, 'weight', e.target.value)}
                        step="0.01"
                        style={{
                          width: '65px',
                          padding: '4px 6px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={rk.is_active}
                        onChange={(e) => onUpdateRoleKpi(rk.id, 'is_active', e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        onClick={() => onOpenFormula(role.id, rk)}
                        title="Configure bonus formula"
                        style={{
                          padding: '4px 10px',
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '4px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          color: '#0369a1'
                        }}
                      >
                        fx
                      </button>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <button
                        onClick={() => onRemoveKpi(rk.id, rk.kpi?.name)}
                        style={{
                          padding: '4px 10px',
                          background: '#fee2e2',
                          border: '1px solid #fca5a5',
                          color: '#991b1b',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Weight total */}
            <div style={{
              padding: '8px 8px',
              textAlign: 'right',
              fontSize: '13px',
              color: Math.abs(totalWeight - 100) < 0.01 ? '#16a34a' : '#dc2626',
              fontWeight: '500'
            }}>
              Total Weight: {totalWeight}%
              {Math.abs(totalWeight - 100) >= 0.01 && ' (should be 100%)'}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RoleCard;
