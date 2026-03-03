"use client"

import React from 'react';
import BonusFormulaConfig from '../BonusFormulaConfig';

const BonusFormulaModal = ({ roleId, roleKpi, onClose }) => {
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
        maxWidth: '900px',
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600' }}>
            Bonus Formula: {roleKpi.kpi?.name}
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '18px',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &#10005;
          </button>
        </div>
        <BonusFormulaConfig
          embedded={{ roleId, roleKpi }}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default BonusFormulaModal;
