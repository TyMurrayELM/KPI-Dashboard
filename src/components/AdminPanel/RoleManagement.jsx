"use client"

// src/components/AdminPanel/RoleManagement.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    base_salary: '',
    bonus_percentage: '',
    default_headcount: 1,
    display_order: 0,
    color: '#dbeafe'
  });

  // Predefined color options
  const colorOptions = [
    { name: 'Blue', value: '#dbeafe' },
    { name: 'Yellow', value: '#fef3c7' },
    { name: 'Green', value: '#d1fae5' },
    { name: 'Pink', value: '#fce7f3' },
    { name: 'Indigo', value: '#e0e7ff' },
    { name: 'Orange', value: '#fed7aa' },
    { name: 'Purple', value: '#e9d5ff' },
    { name: 'Red', value: '#fee2e2' },
    { name: 'Gray', value: '#f3f4f6' },
    { name: 'Cyan', value: '#cffafe' }
  ];

  // Fetch all roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create new role
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('roles')
        .insert([{
          ...formData,
          base_salary: parseFloat(formData.base_salary),
          bonus_percentage: parseFloat(formData.bonus_percentage),
          default_headcount: parseInt(formData.default_headcount)
        }]);

      if (error) throw error;

      alert('Role created successfully!');
      setShowForm(false);
      resetForm();
      fetchRoles();
    } catch (err) {
      alert(`Error creating role: ${err.message}`);
      console.error('Error creating role:', err);
    }
  };

  // Update existing role
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('roles')
        .update({
          name: formData.name,
          base_salary: parseFloat(formData.base_salary),
          bonus_percentage: parseFloat(formData.bonus_percentage),
          default_headcount: parseInt(formData.default_headcount),
          display_order: parseInt(formData.display_order),
          color: formData.color
        })
        .eq('id', editingRole.id);

      if (error) throw error;

      alert('Role updated successfully!');
      setShowForm(false);
      setEditingRole(null);
      resetForm();
      fetchRoles();
    } catch (err) {
      alert(`Error updating role: ${err.message}`);
      console.error('Error updating role:', err);
    }
  };

  // Delete role
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will also remove all KPI assignments for this role.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Role deleted successfully!');
      fetchRoles();
    } catch (err) {
      alert(`Error deleting role: ${err.message}`);
      console.error('Error deleting role:', err);
    }
  };

  // Start editing a role
  const startEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      key: role.key,
      base_salary: role.base_salary.toString(),
      bonus_percentage: role.bonus_percentage.toString(),
      default_headcount: role.default_headcount,
      display_order: role.display_order || 0,
      color: role.color || '#dbeafe'
    });
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      key: '',
      base_salary: '',
      bonus_percentage: '',
      default_headcount: 1,
      display_order: 0,
      color: '#dbeafe'
    });
    setEditingRole(null);
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading roles...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div>
      {/* Header with Create Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>
          Role Management
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
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
            + Create New Role
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            {editingRole ? 'Edit Role' : 'Create New Role'}
          </h3>
          
          <form onSubmit={editingRole ? handleUpdate : handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                  Role Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
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
                  Role Key * {editingRole && <span style={{ fontSize: '12px', color: '#6b7280' }}>(cannot be changed)</span>}
                </label>
                <input
                  type="text"
                  name="key"
                  value={formData.key}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingRole}
                  placeholder="e.g., general-manager"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    background: editingRole ? '#f3f4f6' : 'white'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                  Base Salary *
                </label>
                <input
                  type="number"
                  name="base_salary"
                  value={formData.base_salary}
                  onChange={handleInputChange}
                  required
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
                  Bonus % *
                </label>
                <input
                  type="number"
                  name="bonus_percentage"
                  value={formData.bonus_percentage}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max="100"
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
                  Default Headcount
                </label>
                <input
                  type="number"
                  name="default_headcount"
                  value={formData.default_headcount}
                  onChange={handleInputChange}
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

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                  Display Order
                </label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleInputChange}
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
                  Theme Color
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      flex: 1
                    }}
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: formData.color,
                    border: '2px solid #d1d5db',
                    borderRadius: '6px'
                  }} />
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    style={{
                      width: '50px',
                      height: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
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
                {editingRole ? 'Update Role' : 'Create Role'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
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

      {/* Roles Table */}
      <div style={{ 
        background: 'white', 
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Order
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Role Name
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Key
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Base Salary
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Bonus %
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Headcount
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Color
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                  No roles found. Create your first role to get started.
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {role.display_order}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                    {role.name}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>
                    {role.key}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {formatCurrency(role.base_salary)}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {role.bonus_percentage}%
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {role.default_headcount}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '24px',
                      background: role.color || '#dbeafe',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }} />
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => startEdit(role)}
                      style={{
                        padding: '6px 12px',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        marginRight: '8px'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(role.id, role.name)}
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleManagement;