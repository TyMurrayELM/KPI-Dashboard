// src/components/AdminPanel/AdminPanel.jsx

"use client"

import React, { useState } from 'react';
import KPIManagement from './KPIManagement';
import RoleManagement from './RoleManagement';
import RoleKPIAssignment from './RoleKPIAssignment';
import BonusFormulaConfig from './BonusFormulaConfig';
import UserManagement from './UserManagement';
import HeadcountManagement from './HeadcountManagement';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: 'Manage Users', component: UserManagement },
    { id: 'headcount', label: 'Headcount & Planning', component: HeadcountManagement },
    { id: 'kpis', label: 'Manage KPIs', component: KPIManagement },
    { id: 'roles', label: 'Manage Roles', component: RoleManagement },
    { id: 'assignments', label: 'Assign KPIs to Roles', component: RoleKPIAssignment },
    { id: 'formulas', label: 'Bonus Formulas', component: BonusFormulaConfig }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
          Admin Panel
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Manage users, headcount planning, KPIs, roles, assignments, and bonus formulas
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '32px',
        display: 'flex',
        gap: '8px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
              color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === tab.id ? '600' : '500',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default AdminPanel;