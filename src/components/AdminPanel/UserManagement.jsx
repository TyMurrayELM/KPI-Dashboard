"use client"

// src/components/AdminPanel/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    is_admin: false,
    is_active: true,
    assigned_roles: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users with their assigned roles
      const { data: usersData, error: usersError } = await supabase
        .from('allowed_users')
        .select(`
          *,
          user_roles (
            role_key
          )
        `)
        .order('name');

      if (usersError) throw usersError;

      // Fetch all roles for the assignment dropdown
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('key, name')
        .order('display_order');

      if (rolesError) throw rolesError;

      setUsers(usersData || []);
      setRoles(rolesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRoleToggle = (roleKey) => {
    setFormData(prev => {
      const currentRoles = prev.assigned_roles;
      if (currentRoles.includes(roleKey)) {
        return { ...prev, assigned_roles: currentRoles.filter(r => r !== roleKey) };
      } else {
        return { ...prev, assigned_roles: [...currentRoles, roleKey] };
      }
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // 1. Create the user
      const { data: newUser, error: userError } = await supabase
        .from('allowed_users')
        .insert([{
          email: formData.email.toLowerCase().trim(),
          name: formData.name,
          is_admin: formData.is_admin,
          is_active: formData.is_active
        }])
        .select()
        .single();

      if (userError) throw userError;

      // 2. Assign roles if any selected
      if (formData.assigned_roles.length > 0) {
        const roleInserts = formData.assigned_roles.map(roleKey => ({
          user_email: formData.email.toLowerCase().trim(),
          role_key: roleKey
        }));

        const { error: rolesError } = await supabase
          .from('user_roles')
          .insert(roleInserts);

        if (rolesError) throw rolesError;
      }

      alert('User created successfully!');
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert(`Error creating user: ${err.message}`);
      console.error('Error:', err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // 1. Update user info
      const { error: userError } = await supabase
        .from('allowed_users')
        .update({
          name: formData.name,
          is_admin: formData.is_admin,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (userError) throw userError;

      // 2. Delete existing role assignments
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_email', editingUser.email);

      if (deleteError) throw deleteError;

      // 3. Insert new role assignments
      if (formData.assigned_roles.length > 0) {
        const roleInserts = formData.assigned_roles.map(roleKey => ({
          user_email: editingUser.email,
          role_key: roleKey
        }));

        const { error: rolesError } = await supabase
          .from('user_roles')
          .insert(roleInserts);

        if (rolesError) throw rolesError;
      }

      alert('User updated successfully!');
      setShowForm(false);
      setEditingUser(null);
      resetForm();
      fetchData();
    } catch (err) {
      alert(`Error updating user: ${err.message}`);
      console.error('Error:', err);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to remove "${user.name || user.email}" from the system?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('allowed_users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      alert('User removed successfully!');
      fetchData();
    } catch (err) {
      alert(`Error removing user: ${err.message}`);
      console.error('Error:', err);
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name || '',
      is_admin: user.is_admin,
      is_active: user.is_active,
      assigned_roles: user.user_roles?.map(r => r.role_key) || []
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      is_admin: false,
      is_active: true,
      assigned_roles: []
    });
    setEditingUser(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading users...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>
          User Management
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
            + Add New User
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
            {editingUser ? 'Edit User' : 'Add New User'}
          </h3>
          
          <form onSubmit={editingUser ? handleUpdate : handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingUser}
                  placeholder="user@example.com"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    background: editingUser ? '#f3f4f6' : 'white'
                  }}
                />
                {editingUser && (
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Email cannot be changed
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Smith"
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

            <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_admin"
                  checked={formData.is_admin}
                  onChange={handleInputChange}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontWeight: '500' }}>Administrator</span>
                <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                  (Can access Admin Panel & see all tabs)
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontWeight: '500' }}>Active</span>
                <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                  (Can log in)
                </span>
              </label>
            </div>

            {/* Role Assignment */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Assigned Dashboard Roles
              </label>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                Select which dashboard tabs this user can access. Admins can see all tabs regardless of assignment.
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px',
                padding: '12px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px'
              }}>
                {roles.map(role => (
                  <label 
                    key={role.key}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '4px',
                      background: formData.assigned_roles.includes(role.key) ? '#dbeafe' : 'transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.assigned_roles.includes(role.key)}
                      onChange={() => handleRoleToggle(role.key)}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '14px' }}>{role.name}</span>
                  </label>
                ))}
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
                {editingUser ? 'Update User' : 'Add User'}
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

      {/* Users Table */}
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
                Name
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Email
              </th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Admin
              </th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Active
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Assigned Roles
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#6b7280' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                  No users found. Add your first user to get started.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                    {user.name || '—'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {user.is_admin ? (
                      <span style={{
                        padding: '2px 8px',
                        background: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Admin
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {user.is_active ? (
                      <span style={{ color: '#059669' }}>✓</span>
                    ) : (
                      <span style={{ color: '#dc2626' }}>✗</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>
                    {user.user_roles && user.user_roles.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {user.user_roles.map(ur => {
                          const role = roles.find(r => r.key === ur.role_key);
                          return (
                            <span 
                              key={ur.role_key}
                              style={{
                                padding: '2px 8px',
                                background: '#f3f4f6',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}
                            >
                              {role?.name || ur.role_key}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                        {user.is_admin ? 'All (Admin)' : 'None assigned'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => startEdit(user)}
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
                      onClick={() => handleDelete(user)}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;