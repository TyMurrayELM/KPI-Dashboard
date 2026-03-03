"use client"

import React, { useState, useEffect } from 'react';

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

const RoleForm = ({ role, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    base_salary: '',
    bonus_percentage: '',
    default_headcount: 1,
    display_order: 0,
    color: '#dbeafe'
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        key: role.key,
        base_salary: role.base_salary.toString(),
        bonus_percentage: role.bonus_percentage.toString(),
        default_headcount: role.default_headcount,
        display_order: role.display_order || 0,
        color: role.color || '#dbeafe'
      });
    }
  }, [role]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      base_salary: parseFloat(formData.base_salary),
      bonus_percentage: parseFloat(formData.bonus_percentage),
      default_headcount: parseInt(formData.default_headcount),
      display_order: parseInt(formData.display_order)
    });
  };

  const isEditing = !!role;

  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
        {isEditing ? 'Edit Role' : 'Create New Role'}
      </h3>

      <form onSubmit={handleSubmit}>
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
              Role Key * {isEditing && <span style={{ fontSize: '12px', color: '#6b7280' }}>(cannot be changed)</span>}
            </label>
            <input
              type="text"
              name="key"
              value={formData.key}
              onChange={handleInputChange}
              required
              disabled={isEditing}
              placeholder="e.g., general-manager"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                background: isEditing ? '#f3f4f6' : 'white'
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
            {isEditing ? 'Update Role' : 'Create Role'}
          </button>
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
        </div>
      </form>
    </div>
  );
};

export default RoleForm;
