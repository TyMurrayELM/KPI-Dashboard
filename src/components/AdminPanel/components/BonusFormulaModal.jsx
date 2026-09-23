"use client"

import React from 'react';
import BonusFormulaConfig from '../BonusFormulaConfig';
import AdminModal from './AdminModal';

const BonusFormulaModal = ({ roleId, roleKpi, onClose }) => (
  <AdminModal
    title={`Bonus Formula: ${roleKpi.kpi?.name || ''}`}
    onClose={onClose}
    width={900}
  >
    <BonusFormulaConfig
      embedded={{ roleId, roleKpi }}
      onClose={onClose}
    />
  </AdminModal>
);

export default BonusFormulaModal;
