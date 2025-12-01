"use client"

// src/components/AdminPanel/KPIManagement.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

const KPIManagement = () => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingKpiId, setEditingKpiId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage',
    is_inverse: false,
    display_order: 0,
    success_factors: []
  });
  const [newFactor, setNewFactor] = useState('');

  // Fetch all KPIs with their associated roles
  const fetchKpis = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kpis')
        .select(`
          *,
          role_kpis (
            role:roles (
              id,
              name,
              color
            )
          )
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      // Transform data to flatten roles
      const kpisWithRoles = (data || []).map(kpi => ({
        ...kpi,
        roles: kpi.role_kpis?.map(rk => rk.role).filter(Boolean) || []
      }));
      
      setKpis(kpisWithRoles);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Success factor management
  const addSuccessFactor = () => {
    if (newFactor.trim()) {
      setFormData(prev => ({
        ...prev,
        success_factors: [...prev.success_factors, newFactor.trim()]
      }));
      setNewFactor('');
    }
  };

  const removeSuccessFactor = (index) => {
    setFormData(prev => ({
      ...prev,
      success_factors: prev.success_factors.filter((_, i) => i !== index)
    }));
  };

  const updateSuccessFactor = (index, value) => {
    setFormData(prev => ({
      ...prev,
      success_factors: prev.success_factors.map((factor, i) => 
        i === index ? value : factor
      )
    }));
  };

  const moveSuccessFactor = (index, direction) => {
    const newFactors = [...formData.success_factors];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newFactors.length) {
      [newFactors[index], newFactors[newIndex]] = [newFactors[newIndex], newFactors[index]];
      setFormData(prev => ({
        ...prev,
        success_factors: newFactors
      }));
    }
  };

  // Create new KPI
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating KPI with data:', formData);
      
      const { data, error } = await supabase
        .from('kpis')
        .insert([formData])
        .select();

      console.log('Create response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        throw new Error(error.message || error.details || JSON.stringify(error));
      }

      alert('KPI created successfully!');
      setShowCreateForm(false);
      resetForm();
      fetchKpis();
    } catch (err) {
      const errorMessage = err.message || JSON.stringify(err);
      alert(`Error creating KPI: ${errorMessage}`);
      console.error('Error creating KPI:', err);
    }
  };

  // Update existing KPI
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      console.log('Updating KPI with data:', formData);
      console.log('success_factors:', formData.success_factors);
      
      const { data, error } = await supabase
        .from('kpis')
        .update(formData)
        .eq('id', editingKpiId)
        .select();

      console.log('Update response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        throw new Error(error.message || error.details || JSON.stringify(error));
      }

      alert('KPI updated successfully!');
      setEditingKpiId(null);
      resetForm();
      fetchKpis();
    } catch (err) {
      const errorMessage = err.message || JSON.stringify(err);
      alert(`Error updating KPI: ${errorMessage}`);
      console.error('Error updating KPI:', err);
    }
  };

  // Delete KPI
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will also remove all role assignments and bonus formulas for this KPI.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('kpis')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('KPI deleted successfully!');
      fetchKpis();
    } catch (err) {
      alert(`Error deleting KPI: ${err.message}`);
      console.error('Error deleting KPI:', err);
    }
  };

  // Start editing a KPI
  const startEdit = (kpi) => {
    setEditingKpiId(kpi.id);
    setFormData({
      name: kpi.name,
      description: kpi.description || '',
      type: kpi.type,
      is_inverse: kpi.is_inverse,
      display_order: kpi.display_order || 0,
      success_factors: kpi.success_factors || []
    });
    setShowCreateForm(false);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'percentage',
      is_inverse: false,
      display_order: 0,
      success_factors: []
    });
    setNewFactor('');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingKpiId(null);
    resetForm();
  };

  // Cancel create
  const handleCancelCreate = () => {
    setShowCreateForm(false);
    resetForm();
  };

  // Render the edit/create form
  const renderForm = (isCreate = false) => (
    <div style={{
      background: isCreate ? '#f9fafb' : 'white',
      border: isCreate ? '1px solid #e5e7eb' : 'none',
      borderRadius: '8px',
      padding: '24px'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
        {isCreate ? 'Create New KPI' : 'Edit KPI'}
      </h3>
      
      <form onSubmit={isCreate ? handleCreate : handleUpdate}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
            KPI Name *
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
              fontSize: '14px',
              background: 'white'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
              background: 'white'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="percentage">Percentage</option>
              <option value="currency">Currency</option>
              <option value="count">Count</option>
              <option value="ratio">Ratio</option>
            </select>
          </div>

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
                fontSize: '14px',
                background: 'white'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="is_inverse"
              checked={formData.is_inverse}
              onChange={handleInputChange}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontWeight: '500' }}>
              Inverse KPI (lower values are better)
            </span>
          </label>
        </div>

        {/* Success Factors Section */}
        <div style={{ 
          marginBottom: '20px',
          padding: '16px',
          background: isCreate ? 'white' : '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500' }}>
            Success Factors
          </label>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
            Add bullet points that describe what it takes to succeed at this KPI.
          </p>
          
          {/* Existing factors */}
          {formData.success_factors.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              {formData.success_factors.map((factor, index) => (
                <div 
                  key={index} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '8px',
                    padding: '8px',
                    background: isCreate ? '#f9fafb' : 'white',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <span style={{ color: '#3b82f6', fontWeight: '600' }}>•</span>
                  <input
                    type="text"
                    value={factor}
                    onChange={(e) => updateSuccessFactor(index, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => moveSuccessFactor(index, -1)}
                    disabled={index === 0}
                    style={{
                      padding: '4px 8px',
                      background: index === 0 ? '#f3f4f6' : '#e5e7eb',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      color: index === 0 ? '#9ca3af' : '#374151'
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSuccessFactor(index, 1)}
                    disabled={index === formData.success_factors.length - 1}
                    style={{
                      padding: '4px 8px',
                      background: index === formData.success_factors.length - 1 ? '#f3f4f6' : '#e5e7eb',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: index === formData.success_factors.length - 1 ? 'not-allowed' : 'pointer',
                      color: index === formData.success_factors.length - 1 ? '#9ca3af' : '#374151'
                    }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSuccessFactor(index)}
                    style={{
                      padding: '4px 8px',
                      background: '#fee2e2',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Add new factor */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newFactor}
              onChange={(e) => setNewFactor(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSuccessFactor();
                }
              }}
              placeholder="Add a success factor..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                background: 'white'
              }}
            />
            <button
              type="button"
              onClick={addSuccessFactor}
              style={{
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              + Add
            </button>
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
            {isCreate ? 'Create KPI' : 'Update KPI'}
          </button>
          <button
            type="button"
            onClick={isCreate ? handleCancelCreate : handleCancelEdit}
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
  );

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading KPIs...</div>;
  };

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
          KPI Management
        </h2>
        {!showCreateForm && !editingKpiId && (
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingKpiId(null);
              resetForm();
            }}
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
            + Create New KPI
          </button>
        )}
      </div>

      {/* Create Form (at top) */}
      {showCreateForm && (
        <div style={{ marginBottom: '24px' }}>
          {renderForm(true)}
        </div>
      )}

      {/* KPI Table */}
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
                Name
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Type
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Inverse
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Assigned Roles
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Success Factors
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {kpis.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                  No KPIs found. Create your first KPI to get started.
                </td>
              </tr>
            ) : (
              kpis.map((kpi) => (
                <React.Fragment key={kpi.id}>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {kpi.display_order}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                      {kpi.name}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        background: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {kpi.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {kpi.is_inverse ? '✓' : '—'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {kpi.roles && kpi.roles.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {kpi.roles.map((role) => (
                            <span
                              key={role.id}
                              style={{
                                padding: '2px 8px',
                                background: role.color || '#e5e7eb',
                                color: '#1e293b',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '500',
                                border: '1px solid rgba(0,0,0,0.1)'
                              }}
                            >
                              {role.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>
                      {kpi.success_factors && kpi.success_factors.length > 0 ? (
                        <span style={{
                          padding: '2px 8px',
                          background: '#d1fae5',
                          color: '#065f46',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {kpi.success_factors.length} factor{kpi.success_factors.length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {editingKpiId === kpi.id ? (
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>Editing...</span>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(kpi)}
                            disabled={editingKpiId !== null || showCreateForm}
                            style={{
                              padding: '6px 12px',
                              background: editingKpiId !== null || showCreateForm ? '#e5e7eb' : '#f3f4f6',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '13px',
                              cursor: editingKpiId !== null || showCreateForm ? 'not-allowed' : 'pointer',
                              marginRight: '8px',
                              opacity: editingKpiId !== null || showCreateForm ? 0.5 : 1
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(kpi.id, kpi.name)}
                            disabled={editingKpiId !== null || showCreateForm}
                            style={{
                              padding: '6px 12px',
                              background: '#fee2e2',
                              border: '1px solid #fca5a5',
                              color: '#991b1b',
                              borderRadius: '4px',
                              fontSize: '13px',
                              cursor: editingKpiId !== null || showCreateForm ? 'not-allowed' : 'pointer',
                              opacity: editingKpiId !== null || showCreateForm ? 0.5 : 1
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                  {/* Inline Edit Form - appears below the row */}
                  {editingKpiId === kpi.id && (
                    <tr>
                      <td colSpan={7} style={{ padding: '0', background: '#f9fafb' }}>
                        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
                          {renderForm(false)}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KPIManagement;