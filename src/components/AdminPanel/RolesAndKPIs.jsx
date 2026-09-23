"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../config/supabaseClient';
import RoleCard from './components/RoleCard';
import RoleForm from './components/RoleForm';
import KPIFormModal from './components/KPIFormModal';
import BonusFormulaModal from './components/BonusFormulaModal';
import { btnPrimary, btnSecondary } from './components/AdminModal';

const RolesAndKPIs = () => {
  const [roles, setRoles] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [roleKpisMap, setRoleKpisMap] = useState({}); // { roleId: [roleKpi, ...] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Card collapse + filter. Cards start collapsed so the list is scannable;
  // a search that matches a role's KPI names also finds the role.
  const [expandedRoles, setExpandedRoles] = useState(() => new Set());
  const [roleSearch, setRoleSearch] = useState('');

  // Role form state
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // KPI modal state
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [editingKpi, setEditingKpi] = useState(null);
  const [assigningToRole, setAssigningToRole] = useState(null);

  // Formula modal state
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [formulaRoleId, setFormulaRoleId] = useState(null);
  const [formulaRoleKpi, setFormulaRoleKpi] = useState(null);

  // -- Data fetching --

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesResult, kpisResult, roleKpisResult] = await Promise.all([
        supabase.from('roles').select('*').order('display_order', { ascending: true }),
        supabase.from('kpis').select('*').order('display_order', { ascending: true }),
        supabase.from('role_kpis').select('*, kpi:kpis(*)').order('display_order', { ascending: true })
      ]);

      if (rolesResult.error) throw rolesResult.error;
      if (kpisResult.error) throw kpisResult.error;
      if (roleKpisResult.error) throw roleKpisResult.error;

      setRoles(rolesResult.data || []);
      setKpis(kpisResult.data || []);

      // Group role_kpis by role_id
      const map = {};
      for (const rk of (roleKpisResult.data || [])) {
        if (!map[rk.role_id]) map[rk.role_id] = [];
        map[rk.role_id].push(rk);
      }
      setRoleKpisMap(map);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // -- Role CRUD --

  const handleSaveRole = async (formData) => {
    try {
      if (editingRole) {
        // Update — exclude key since it can't change
        const { key, ...updateData } = formData;
        const { error } = await supabase
          .from('roles')
          .update(updateData)
          .eq('id', editingRole.id);
        if (error) throw error;
        alert('Role updated successfully!');
      } else {
        const { error } = await supabase
          .from('roles')
          .insert([formData]);
        if (error) throw error;
        alert('Role created successfully!');
      }
      setShowRoleForm(false);
      setEditingRole(null);
      fetchAll();
    } catch (err) {
      alert(`Error saving role: ${err.message}`);
      console.error('Error saving role:', err);
    }
  };

  const handleDeleteRole = async (role) => {
    if (!window.confirm(`Are you sure you want to delete "${role.name}"? This will also remove all KPI assignments for this role.`)) return;
    try {
      const { error } = await supabase.from('roles').delete().eq('id', role.id);
      if (error) throw error;
      alert('Role deleted successfully!');
      fetchAll();
    } catch (err) {
      alert(`Error deleting role: ${err.message}`);
      console.error('Error:', err);
    }
  };

  const handleToggleVisibility = async (role) => {
    try {
      const { error } = await supabase
        .from('roles')
        .update({ is_visible: !role.is_visible })
        .eq('id', role.id);
      if (error) throw error;
      fetchAll();
    } catch (err) {
      alert(`Error toggling visibility: ${err.message}`);
      console.error('Error:', err);
    }
  };

  // -- KPI assignment inline updates --

  const handleUpdateRoleKpi = async (roleKpiId, field, value) => {
    try {
      const updateData = {};
      if (field === 'is_active') {
        updateData[field] = value;
      } else if (field === 'scope') {
        updateData[field] = value;
      } else {
        updateData[field] = parseFloat(value);
      }

      const { error } = await supabase
        .from('role_kpis')
        .update(updateData)
        .eq('id', roleKpiId);

      if (error) throw error;
      fetchAll();
    } catch (err) {
      alert(`Error updating: ${err.message}`);
      console.error('Error:', err);
    }
  };

  const handleRemoveKpi = async (roleKpiId, kpiName) => {
    if (!window.confirm(`Remove "${kpiName}" from this role?`)) return;
    try {
      const { error } = await supabase.from('role_kpis').delete().eq('id', roleKpiId);
      if (error) throw error;
      alert('KPI removed successfully!');
      fetchAll();
    } catch (err) {
      alert(`Error removing KPI: ${err.message}`);
      console.error('Error:', err);
    }
  };

  // -- KPI modal save --

  const handleKpiModalSave = async (result) => {
    try {
      if (result.kpiDefinition) {
        // Edit KPI definition mode
        if (result.kpiId) {
          const { error } = await supabase
            .from('kpis')
            .update(result.kpiDefinition)
            .eq('id', result.kpiId);
          if (error) throw error;
          alert('KPI updated successfully!');
        } else {
          const { error } = await supabase
            .from('kpis')
            .insert([result.kpiDefinition]);
          if (error) throw error;
          alert('KPI created successfully!');
        }
      } else if (result.assignment) {
        // Assign mode
        let kpiId = result.assignment.kpi_id;

        // If creating a new KPI alongside the assignment
        if (result.newKpi) {
          const { data, error } = await supabase
            .from('kpis')
            .insert([result.newKpi])
            .select();
          if (error) throw error;
          kpiId = data[0].id;
        }

        if (result.assignmentId) {
          // Update existing assignment
          const { kpi_id, ...updateFields } = result.assignment;
          const { error } = await supabase
            .from('role_kpis')
            .update(updateFields)
            .eq('id', result.assignmentId);
          if (error) throw error;
          alert('Assignment updated successfully!');
        } else {
          // Create new assignment
          const { error } = await supabase
            .from('role_kpis')
            .insert([{
              role_id: assigningToRole.id,
              kpi_id: kpiId,
              target_value: result.assignment.target_value,
              weight: result.assignment.weight,
              display_order: result.assignment.display_order,
              scope: result.assignment.scope,
              is_active: true
            }]);
          if (error) throw error;
          alert('KPI assigned successfully!');
        }
      }

      setShowKpiModal(false);
      setEditingKpi(null);
      setAssigningToRole(null);
      fetchAll();
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error('Error in KPI modal save:', err);
    }
  };

  // -- KPI definition delete --

  const handleDeleteKpi = async (kpiId, kpiName) => {
    if (!window.confirm(`Are you sure you want to delete "${kpiName}"? This will also remove all role assignments and bonus formulas for this KPI.`)) return;
    try {
      const { error } = await supabase.from('kpis').delete().eq('id', kpiId);
      if (error) throw error;
      alert('KPI deleted successfully!');
      fetchAll();
    } catch (err) {
      alert(`Error deleting KPI: ${err.message}`);
      console.error('Error:', err);
    }
  };

  // -- Event handlers for child components --

  const openEditRole = (role) => {
    setEditingRole(role);
    setShowRoleForm(true);
  };

  const openAssignKpi = (role) => {
    setAssigningToRole(role);
    setEditingKpi(null);
    setShowKpiModal(true);
  };

  const openEditKpiDefinition = (kpi) => {
    setEditingKpi(kpi);
    setAssigningToRole(null);
    setShowKpiModal(true);
  };

  const openCreateKpiDefinition = () => {
    setEditingKpi(null);
    setAssigningToRole(null);
    setShowKpiModal(true);
  };

  const openFormula = (roleId, roleKpi) => {
    setFormulaRoleId(roleId);
    setFormulaRoleKpi(roleKpi);
    setShowFormulaModal(true);
  };

  // -- Render --

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Roles & KPIs...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  const q = roleSearch.trim().toLowerCase();
  const filteredRoles = !q ? roles : roles.filter(role =>
    [role.name, role.key].some(v => (v || '').toLowerCase().includes(q)) ||
    (roleKpisMap[role.id] || []).some(rk => (rk.kpi?.name || '').toLowerCase().includes(q))
  );
  const allExpanded = filteredRoles.length > 0 && filteredRoles.every(r => expandedRoles.has(r.id));
  const toggleRole = (id) => setExpandedRoles(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const setAllExpanded = (open) => setExpandedRoles(prev => {
    const next = new Set(prev);
    filteredRoles.forEach(r => (open ? next.add(r.id) : next.delete(r.id)));
    return next;
  });

  return (
    <div>
      {/* Header + action buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '12px'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
          Roles & KPIs
          <span style={{ fontSize: '13px', fontWeight: '400', color: '#6b7280', marginLeft: '8px' }}>
            {q ? `${filteredRoles.length} of ${roles.length}` : roles.length} roles
          </span>
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="search"
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            placeholder="Search roles or KPIs..."
            style={{
              width: '220px',
              padding: '7px 10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '13px',
              background: 'white'
            }}
          />
          <button
            onClick={() => setAllExpanded(!allExpanded)}
            style={btnSecondary}
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
          <button
            onClick={() => {
              setEditingRole(null);
              setShowRoleForm(true);
            }}
            style={btnPrimary}
          >
            + New Role
          </button>
          <button
            onClick={openCreateKpiDefinition}
            style={{ ...btnPrimary, background: '#10b981' }}
          >
            + New KPI Definition
          </button>
        </div>
      </div>

      {/* Role Create/Edit Form */}
      {showRoleForm && (
        <RoleForm
          role={editingRole}
          onSave={handleSaveRole}
          onCancel={() => {
            setShowRoleForm(false);
            setEditingRole(null);
          }}
        />
      )}

      {/* Role Cards */}
      {roles.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#6b7280',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          No roles found. Create your first role to get started.
        </div>
      ) : filteredRoles.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
          No roles or KPIs match "{roleSearch}".
        </div>
      ) : (
        filteredRoles.map(role => (
          <RoleCard
            key={role.id}
            role={role}
            expanded={expandedRoles.has(role.id)}
            onToggleExpand={() => toggleRole(role.id)}
            roleKpis={roleKpisMap[role.id] || []}
            onEditRole={openEditRole}
            onDeleteRole={handleDeleteRole}
            onToggleVisibility={handleToggleVisibility}
            onAssignKpi={openAssignKpi}
            onUpdateRoleKpi={handleUpdateRoleKpi}
            onRemoveKpi={handleRemoveKpi}
            onEditKpiDefinition={openEditKpiDefinition}
            onOpenFormula={openFormula}
          />
        ))
      )}

      {/* KPI Modal */}
      {showKpiModal && (
        <KPIFormModal
          kpi={editingKpi}
          allKpis={kpis}
          assignToRole={assigningToRole}
          onSave={handleKpiModalSave}
          onCancel={() => {
            setShowKpiModal(false);
            setEditingKpi(null);
            setAssigningToRole(null);
          }}
        />
      )}

      {/* Bonus Formula Modal */}
      {showFormulaModal && formulaRoleKpi && (
        <BonusFormulaModal
          roleId={formulaRoleId}
          roleKpi={formulaRoleKpi}
          onClose={() => {
            setShowFormulaModal(false);
            setFormulaRoleId(null);
            setFormulaRoleKpi(null);
          }}
        />
      )}
    </div>
  );
};

export default RolesAndKPIs;
