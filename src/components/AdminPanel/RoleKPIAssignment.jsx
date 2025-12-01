"use client"

// src/components/AdminPanel/RoleKPIAssignment.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

const RoleKPIAssignment = () => {
  const [roles, setRoles] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleKpis, setRoleKpis] = useState([]);
  const [availableKpis, setAvailableKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    kpi_id: '',
    target_value: '',
    weight: 25,
    display_order: 1
  });

  // Fetch roles and KPIs
  useEffect(() => {
    fetchRolesAndKpis();
  }, []);

  // Fetch role KPIs when role is selected
  useEffect(() => {
    if (selectedRole) {
      fetchRoleKpis();
    }
  }, [selectedRole]);

  const fetchRolesAndKpis = async () => {
    try {
      setLoading(true);
      const [rolesResult, kpisResult] = await Promise.all([
        supabase.from('roles').select('*').order('display_order'),
        supabase.from('kpis').select('*').order('display_order')
      ]);

      if (rolesResult.error) throw rolesResult.error;
      if (kpisResult.error) throw kpisResult.error;

      setRoles(rolesResult.data || []);
      setKpis(kpisResult.data || []);
      
      if (rolesResult.data?.length > 0) {
        setSelectedRole(rolesResult.data[0]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleKpis = async () => {
    try {
      const { data, error } = await supabase
        .from('role_kpis')
        .select(`
          *,
          kpi:kpis(*)
        `)
        .eq('role_id', selectedRole.id)
        .order('display_order');

      if (error) throw error;

      setRoleKpis(data || []);
      
      // Calculate available KPIs (not yet assigned)
      const assignedKpiIds = data?.map(rk => rk.kpi_id) || [];
      const available = kpis.filter(k => !assignedKpiIds.includes(k.id));
      setAvailableKpis(available);
    } catch (err) {
      console.error('Error fetching role KPIs:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddKpi = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('role_kpis')
        .insert([{
          role_id: selectedRole.id,
          kpi_id: formData.kpi_id,
          target_value: parseFloat(formData.target_value),
          weight: parseFloat(formData.weight),
          display_order: parseInt(formData.display_order),
          is_active: true
        }]);

      if (error) throw error;

      alert('KPI assigned successfully!');
      setShowAddForm(false);
      resetForm();
      fetchRoleKpis();
    } catch (err) {
      alert(`Error assigning KPI: ${err.message}`);
      console.error('Error:', err);
    }
  };

  const handleRemoveKpi = async (roleKpiId, kpiName) => {
    if (!window.confirm(`Remove "${kpiName}" from this role?`)) return;

    try {
      const { error } = await supabase
        .from('role_kpis')
        .delete()
        .eq('id', roleKpiId);

      if (error) throw error;

      alert('KPI removed successfully!');
      fetchRoleKpis();
    } catch (err) {
      alert(`Error removing KPI: ${err.message}`);
      console.error('Error:', err);
    }
  };

  const handleUpdateRoleKpi = async (roleKpiId, field, value) => {
    try {
      const updateData = {};
      updateData[field] = field === 'is_active' ? value : parseFloat(value);

      const { error } = await supabase
        .from('role_kpis')
        .update(updateData)
        .eq('id', roleKpiId);

      if (error) throw error;

      fetchRoleKpis();
    } catch (err) {
      alert(`Error updating: ${err.message}`);
      console.error('Error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      kpi_id: '',
      target_value: '',
      weight: 25,
      display_order: (roleKpis.length + 1)
    });
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
        Assign KPIs to Roles
      </h2>

      {/* Role Selector */}
      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '15px' }}>
          Select Role:
        </label>
        <select
          value={selectedRole?.id || ''}
          onChange={(e) => {
            const role = roles.find(r => r.id === e.target.value);
            setSelectedRole(role);
          }}
          style={{
            padding: '10px 16px',
            fontSize: '15px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            minWidth: '300px',
            background: 'white'
          }}
        >
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {selectedRole && (
        <>
          {/* Add KPI Button */}
          <div style={{ marginBottom: '24px' }}>
            {!showAddForm && availableKpis.length > 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                + Assign KPI to {selectedRole.name}
              </button>
            )}
          </div>

          {/* Add KPI Form */}
          {showAddForm && (
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                Assign New KPI
              </h3>
              
              <form onSubmit={handleAddKpi}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      KPI *
                    </label>
                    <select
                      value={formData.kpi_id}
                      onChange={(e) => setFormData({...formData, kpi_id: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Select KPI...</option>
                      {availableKpis.map(kpi => (
                        <option key={kpi.id} value={kpi.id}>{kpi.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Target *
                    </label>
                    <input
                      type="number"
                      value={formData.target_value}
                      onChange={(e) => setFormData({...formData, target_value: e.target.value})}
                      required
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Weight
                    </label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Order
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({...formData, display_order: e.target.value})}
                      min="1"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 24px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Assign KPI
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    style={{
                      padding: '10px 24px',
                      background: '#e5e7eb',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Assigned KPIs Table */}
          <div style={{ 
            background: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '16px 20px', 
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              fontWeight: '600',
              fontSize: '15px'
            }}>
              Assigned KPIs for {selectedRole.name}
            </div>

            {roleKpis.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                No KPIs assigned to this role yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                      Order
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                      KPI Name
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                      Target
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                      Weight
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                      Active
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roleKpis.map((rk) => (
                    <tr key={rk.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <input
                          type="number"
                          value={rk.display_order}
                          onChange={(e) => handleUpdateRoleKpi(rk.id, 'display_order', e.target.value)}
                          min="1"
                          style={{
                            width: '60px',
                            padding: '4px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                        {rk.kpi?.name}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <input
                          type="number"
                          value={rk.target_value}
                          onChange={(e) => handleUpdateRoleKpi(rk.id, 'target_value', e.target.value)}
                          step="0.01"
                          style={{
                            width: '80px',
                            padding: '4px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <input
                          type="number"
                          value={rk.weight}
                          onChange={(e) => handleUpdateRoleKpi(rk.id, 'weight', e.target.value)}
                          step="0.01"
                          style={{
                            width: '70px',
                            padding: '4px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <input
                          type="checkbox"
                          checked={rk.is_active}
                          onChange={(e) => handleUpdateRoleKpi(rk.id, 'is_active', e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleRemoveKpi(rk.id, rk.kpi?.name)}
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
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RoleKPIAssignment;