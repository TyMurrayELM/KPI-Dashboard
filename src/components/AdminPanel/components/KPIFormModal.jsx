"use client"

import React, { useState, useEffect, useCallback } from 'react';
import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
});

const KPIFormModal = ({ kpi, allKpis, assignToRole, existingAssignment, onSave, onCancel }) => {
  const isAssignMode = !!assignToRole;
  const isEditAssignment = !!existingAssignment;

  // KPI definition fields
  const [kpiForm, setKpiForm] = useState({
    name: '',
    description: '',
    type: 'percentage',
    is_inverse: false,
    display_order: 0,
    success_factors: [],
    success_guide: ''
  });

  // Assignment fields (only used in assign mode)
  const [assignForm, setAssignForm] = useState({
    kpi_id: '',
    target_value: '',
    weight: 25,
    display_order: 1,
    scope: 'individual'
  });

  const [selectedExistingKpi, setSelectedExistingKpi] = useState(null);
  const [createNewKpi, setCreateNewKpi] = useState(false);
  const [newFactor, setNewFactor] = useState('');

  useEffect(() => {
    if (kpi) {
      setKpiForm({
        name: kpi.name,
        description: kpi.description || '',
        type: kpi.type,
        is_inverse: kpi.is_inverse,
        display_order: kpi.display_order || 0,
        success_factors: kpi.success_factors || [],
        success_guide: kpi.success_guide || ''
      });
    }
    if (existingAssignment) {
      setAssignForm({
        kpi_id: existingAssignment.kpi_id,
        target_value: existingAssignment.target_value,
        weight: existingAssignment.weight,
        display_order: existingAssignment.display_order,
        scope: existingAssignment.scope || 'individual'
      });
      if (existingAssignment.kpi) {
        setSelectedExistingKpi(existingAssignment.kpi);
      }
    }
  }, [kpi, existingAssignment]);

  const handleKpiChange = (e) => {
    const { name, value, type, checked } = e.target;
    setKpiForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAssignChange = (field, value) => {
    setAssignForm(prev => ({ ...prev, [field]: value }));
  };

  // Success factor management
  const addSuccessFactor = () => {
    if (newFactor.trim()) {
      setKpiForm(prev => ({
        ...prev,
        success_factors: [...prev.success_factors, newFactor.trim()]
      }));
      setNewFactor('');
    }
  };

  const removeSuccessFactor = (index) => {
    setKpiForm(prev => ({
      ...prev,
      success_factors: prev.success_factors.filter((_, i) => i !== index)
    }));
  };

  const updateSuccessFactor = (index, value) => {
    setKpiForm(prev => ({
      ...prev,
      success_factors: prev.success_factors.map((f, i) => i === index ? value : f)
    }));
  };

  const moveSuccessFactor = (index, direction) => {
    const newFactors = [...kpiForm.success_factors];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newFactors.length) {
      [newFactors[index], newFactors[newIndex]] = [newFactors[newIndex], newFactors[index]];
      setKpiForm(prev => ({ ...prev, success_factors: newFactors }));
    }
  };

  const handleKpiDropdownChange = (e) => {
    const val = e.target.value;
    if (val === '__new__') {
      setCreateNewKpi(true);
      setSelectedExistingKpi(null);
      setAssignForm(prev => ({ ...prev, kpi_id: '' }));
    } else if (val) {
      setCreateNewKpi(false);
      const found = allKpis.find(k => k.id === val);
      setSelectedExistingKpi(found);
      setAssignForm(prev => ({ ...prev, kpi_id: val }));
    } else {
      setCreateNewKpi(false);
      setSelectedExistingKpi(null);
      setAssignForm(prev => ({ ...prev, kpi_id: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isAssignMode) {
      // Assign mode: returns both kpi definition (if creating new) and assignment data
      const result = {
        assignment: {
          ...assignForm,
          target_value: parseFloat(assignForm.target_value),
          weight: parseFloat(assignForm.weight),
          display_order: parseInt(assignForm.display_order)
        }
      };
      if (createNewKpi) {
        result.newKpi = { ...kpiForm, display_order: parseInt(kpiForm.display_order) };
      }
      if (isEditAssignment) {
        result.assignmentId = existingAssignment.id;
      }
      onSave(result);
    } else {
      // Edit KPI definition mode
      onSave({
        kpiDefinition: { ...kpiForm, display_order: parseInt(kpiForm.display_order) },
        kpiId: kpi?.id
      });
    }
  };

  const renderKpiDefinitionForm = () => (
    <>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
          KPI Name *
        </label>
        <input
          type="text"
          name="name"
          value={kpiForm.name}
          onChange={handleKpiChange}
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
          value={kpiForm.description}
          onChange={handleKpiChange}
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

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
          Success Guide
        </label>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
          Paste from Word/Google Docs to preserve bold &amp; bullet points, or type Markdown directly.
        </p>
        <textarea
          name="success_guide"
          value={kpiForm.success_guide}
          onChange={handleKpiChange}
          onPaste={(e) => {
            const html = e.clipboardData.getData('text/html');
            if (html) {
              e.preventDefault();
              const md = turndown.turndown(html);
              const textarea = e.target;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const current = kpiForm.success_guide;
              const newValue = current.substring(0, start) + md + current.substring(end);
              setKpiForm(prev => ({ ...prev, success_guide: newValue }));
            }
          }}
          rows={12}
          placeholder="Paste from Word or type Markdown: **bold**, - bullet points, ## headings..."
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'monospace',
            background: 'white',
            lineHeight: '1.5'
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
            value={kpiForm.type}
            onChange={handleKpiChange}
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
            value={kpiForm.display_order}
            onChange={handleKpiChange}
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
            checked={kpiForm.is_inverse}
            onChange={handleKpiChange}
            style={{ marginRight: '8px' }}
          />
          <span style={{ fontWeight: '500' }}>
            Inverse KPI (lower values are better)
          </span>
        </label>
      </div>

      {/* Success Factors */}
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500' }}>
          Success Factors
        </label>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
          Add bullet points that describe what it takes to succeed at this KPI.
        </p>

        {kpiForm.success_factors.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            {kpiForm.success_factors.map((factor, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  padding: '8px',
                  background: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <span style={{ color: '#3b82f6', fontWeight: '600' }}>&#8226;</span>
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
                  disabled={index === kpiForm.success_factors.length - 1}
                  style={{
                    padding: '4px 8px',
                    background: index === kpiForm.success_factors.length - 1 ? '#f3f4f6' : '#e5e7eb',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: index === kpiForm.success_factors.length - 1 ? 'not-allowed' : 'pointer',
                    color: index === kpiForm.success_factors.length - 1 ? '#9ca3af' : '#374151'
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
                  &#10005;
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newFactor}
            onChange={(e) => setNewFactor(e.target.value)}
            onKeyDown={(e) => {
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
    </>
  );

  const renderAssignmentFields = () => (
    <div style={{
      padding: '16px',
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#0369a1' }}>
        Assignment to {assignToRole.name}
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
            Target *
          </label>
          <input
            type="number"
            value={assignForm.target_value}
            onChange={(e) => handleAssignChange('target_value', e.target.value)}
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
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
            Weight
          </label>
          <input
            type="number"
            value={assignForm.weight}
            onChange={(e) => handleAssignChange('weight', e.target.value)}
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
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
            Scope
          </label>
          <select
            value={assignForm.scope}
            onChange={(e) => handleAssignChange('scope', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="individual">Individual</option>
            <option value="region-phoenix">Region - Phoenix</option>
            <option value="region-lasvegas">Region - Las Vegas</option>
            <option value="company">Company</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
            Order
          </label>
          <input
            type="number"
            value={assignForm.display_order}
            onChange={(e) => handleAssignChange('display_order', e.target.value)}
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
    </div>
  );

  const renderExistingKpiSummary = () => {
    if (!selectedExistingKpi) return null;
    return (
      <div style={{
        padding: '12px 16px',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
          {selectedExistingKpi.name}
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          Type: {selectedExistingKpi.type}
          {selectedExistingKpi.is_inverse && ' (inverse)'}
          {selectedExistingKpi.description && ` — ${selectedExistingKpi.description}`}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '700px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
          {isAssignMode
            ? (isEditAssignment ? 'Edit KPI Assignment' : 'Assign KPI to ' + assignToRole.name)
            : (kpi ? 'Edit KPI Definition' : 'Create New KPI')}
        </h3>

        <form onSubmit={handleSubmit}>
          {isAssignMode && !isEditAssignment && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                Select KPI *
              </label>
              <select
                value={createNewKpi ? '__new__' : (assignForm.kpi_id || '')}
                onChange={handleKpiDropdownChange}
                required={!createNewKpi}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">Select KPI...</option>
                {allKpis.map(k => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
                <option value="__new__">+ Create New KPI...</option>
              </select>
            </div>
          )}

          {/* Show existing KPI summary when one is selected */}
          {isAssignMode && selectedExistingKpi && !createNewKpi && renderExistingKpiSummary()}

          {/* Show full KPI form when creating new or editing definition */}
          {(createNewKpi || !isAssignMode) && renderKpiDefinitionForm()}

          {/* Assignment fields */}
          {isAssignMode && (selectedExistingKpi || createNewKpi || isEditAssignment) && renderAssignmentFields()}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
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
              {isAssignMode
                ? (isEditAssignment ? 'Update Assignment' : (createNewKpi ? 'Create & Assign KPI' : 'Assign KPI'))
                : (kpi ? 'Update KPI' : 'Create KPI')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KPIFormModal;
