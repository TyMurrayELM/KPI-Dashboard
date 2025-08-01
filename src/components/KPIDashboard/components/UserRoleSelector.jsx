// src/components/KPIDashboard/components/UserRoleSelector.jsx

import React from 'react';

/**
 * Demo User Role Selector Component
 * Allows switching between different user roles for testing
 */
const UserRoleSelector = ({ 
  userRoleExpanded, 
  setUserRoleExpanded, 
  currentUser, 
  handleUserChange, 
  positions 
}) => {
  if (!userRoleExpanded) {
    // Small floating button when collapsed
    return (
      <button
        onClick={() => setUserRoleExpanded(true)}
        className="fixed top-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-xs shadow-lg hover:bg-gray-700 z-20"
        title="Show User Role Selector"
      >
        Show Demo Panel
      </button>
    );
  }

  // Expanded panel
  return (
    <div className="mb-4 bg-white p-3 rounded-lg shadow-sm">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setUserRoleExpanded(!userRoleExpanded)}
      >
        <h3 className="text-sm font-medium text-gray-700">Demo: Select User Role</h3>
        <div className="text-blue-500 flex items-center">
          <span className="text-xs mr-1 text-blue-600">Hide</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="flex flex-wrap gap-2">
          {['admin', 'general-manager', 'branch-manager', 'client-specialist', 'field-supervisor', 'specialist', 'asset-risk-manager'].map(role => (
            <button
              key={role}
              onClick={() => handleUserChange(role)}
              className={`px-3 py-1 text-xs rounded ${
                currentUser.role === role 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {role === 'admin' ? 'Admin (All Access)' : positions[role].title}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Current user: {currentUser.email} ({currentUser.role})
        </p>
      </div>
    </div>
  );
};

export default UserRoleSelector;