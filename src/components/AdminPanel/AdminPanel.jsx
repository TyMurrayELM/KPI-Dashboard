// src/components/AdminPanel/AdminPanel.jsx

"use client"

import React, { useEffect, useState } from 'react';
import UserManagement from './UserManagement';
import UserKpiValues from './UserKpiValues';
import HeadcountManagement from './HeadcountManagement';
import RolesAndKPIs from './RolesAndKPIs';
import IncentiveSummary from './IncentiveSummary';

const TAB_STORAGE_KEY = 'kpi-admin-tab';
const NAV_HEIGHT = 64; // sticky top nav in app/admin/page.jsx

const tabs = [
  { id: 'users', label: 'Users', component: UserManagement },
  { id: 'user-kpi-values', label: 'User KPI Values', component: UserKpiValues },
  { id: 'headcount', label: 'Headcount & Planning', component: HeadcountManagement },
  { id: 'roles-kpis', label: 'Roles & KPIs', component: RolesAndKPIs },
  { id: 'incentive-summary', label: 'Incentive Summary', component: IncentiveSummary },
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('roles-kpis');

  // Reopen the tab you were last on (per browser). Read after mount so the
  // server render and first client render agree.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(TAB_STORAGE_KEY);
      if (saved && tabs.some(t => t.id === saved)) setActiveTab(saved);
    } catch { /* storage blocked - keep default */ }
  }, []);

  const selectTab = (id) => {
    setActiveTab(id);
    try { window.localStorage.setItem(TAB_STORAGE_KEY, id); } catch { /* ignore */ }
    window.scrollTo({ top: 0 });
  };

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div style={{ padding: '0 24px 40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Tab bar - pinned under the top nav so it's reachable from anywhere on a long tab */}
      <div style={{
        position: 'sticky',
        top: `${NAV_HEIGHT}px`,
        zIndex: 40,
        background: '#f8fafc',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '16px',
        paddingTop: '12px',
        display: 'flex',
        gap: '4px',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
                color: active ? '#1d4ed8' : '#6b7280',
                fontWeight: active ? '600' : '500',
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginBottom: '-1px'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default AdminPanel;
