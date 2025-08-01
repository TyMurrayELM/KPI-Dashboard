// src/components/KPIDashboard/data/initialPositions.js

import {
  KPI_CLIENT_RETENTION,
  KPI_PUNCH_LIST_CREATION,
  KPI_EXTRA_SERVICES,
  KPI_DIRECT_LABOR_MAINTENANCE,
  KPI_LV_MAINTENANCE_GROWTH,
  KPI_PROPERTY_CHECKLIST_ITEM_COMPLETION,
  KPI_SALES_GOAL_MET,
  KPI_TOTAL_GROSS_MARGIN,
  KPI_ARBOR_ENHANCEMENT_PROCESS,
  KPI_PIPELINE_UPDATES_CURRENT,
  KPI_FLEET_UPTIME_RATE,
  KPI_PREVENTATIVE_VS_REACTIVE,
  KPI_ACCIDENT_INCIDENT_RATE,
  KPI_SAFETY_INCIDENTS_MAGNITUDE
} from '../utils/kpiConstants';

/**
 * Initial positions data with KPIs for each role
 */
export const initialPositions = {
  'general-manager': {
    title: 'General Manager',
    salary: 150000,
    bonusPercentage: 20,
    kpis: [
      { ...KPI_CLIENT_RETENTION, weight: 20 },
      { ...KPI_PUNCH_LIST_CREATION, weight: 20 },
      { ...KPI_EXTRA_SERVICES, weight: 20 },
      { ...KPI_DIRECT_LABOR_MAINTENANCE, weight: 20 },
      { ...KPI_LV_MAINTENANCE_GROWTH, weight: 20 }
    ]
  },
  'branch-manager': {
    title: 'Example Manager',
    salary: 50000,
    bonusPercentage: 10,
    kpis: [
      { ...KPI_CLIENT_RETENTION },
      { ...KPI_PUNCH_LIST_CREATION },
      { ...KPI_EXTRA_SERVICES },
      { ...KPI_DIRECT_LABOR_MAINTENANCE }
    ]
  },
  'client-specialist': {
    title: 'Client Specialist',
    salary: 50000,
    bonusPercentage: 10,
    kpis: [
      { ...KPI_CLIENT_RETENTION },
      { ...KPI_PUNCH_LIST_CREATION },
      { ...KPI_EXTRA_SERVICES },
      { ...KPI_PROPERTY_CHECKLIST_ITEM_COMPLETION }
    ]
  },
  'field-supervisor': {
    title: 'Field Supervisor',
    salary: 67250,
    bonusPercentage: 10,
    kpis: [
      { ...KPI_CLIENT_RETENTION },
      { ...KPI_PUNCH_LIST_CREATION },
      { ...KPI_EXTRA_SERVICES },
      { ...KPI_PROPERTY_CHECKLIST_ITEM_COMPLETION }
    ]
  },
  'specialist': {
    title: 'Sales Specialist',
    salary: 77750,
    bonusPercentage: 8,
    kpis: [
      { ...KPI_SALES_GOAL_MET },
      { ...KPI_TOTAL_GROSS_MARGIN },
      { ...KPI_ARBOR_ENHANCEMENT_PROCESS },
      { ...KPI_PIPELINE_UPDATES_CURRENT }
    ]
  },
  'asset-risk-manager': {
    title: 'Placeholder Manager',
    salary: 30000,
    bonusPercentage: 10,
    kpis: [
      { ...KPI_FLEET_UPTIME_RATE },
      { ...KPI_PREVENTATIVE_VS_REACTIVE },
      { ...KPI_ACCIDENT_INCIDENT_RATE },
      { ...KPI_SAFETY_INCIDENTS_MAGNITUDE }
    ]
  }
};

/**
 * Default headcount values for each position
 */
export const defaultHeadcount = {
  'general-manager': 1,
  'branch-manager': 4,
  'client-specialist': 7,
  'field-supervisor': 10,
  'specialist': 7,
  'asset-risk-manager': 1
};