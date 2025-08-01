// src/components/KPIDashboard/utils/kpiConstants.js

/**
 * KPI Constants - All KPI definitions used across the dashboard
 */

export const KPI_CLIENT_RETENTION = {
  name: 'Client Retention %',
  description: 'Percentage of properties still under a Maintenance contract when compared to January active Maintenance contracts. The year-end calculation is January 2026 active contracts compared to January 2025 active contracts.  Build and maintain world class client relationships.',
  target: 90,
  actual: 90,
  weight: 25,
  successFactors: [
    "Ensure Maintenance quality meets Encore standards",
    "Clear direction is consistently provided to Maintenance Crews to drive quality",
    "Monitor responsiveness, consistentency and proactiveness of all communication with Clients (draft)",
    "Maximize offering of extra services for properties in line with budgets and as needed (draft)",
    "Utilize internal systems to capture accurate status of issues so items can be addressed effeciently and effectively "
  ]
};

export const KPI_PUNCH_LIST_CREATION = {
  name: 'Punchlist Creation',
  description: 'Percentage of weekly Maintenance visits with proper punchlists provided for crew instruction. Thorough documentation ensures consistent service quality and helps address client concerns proactively.',
  target: 90,
  actual: 90,
  weight: 25,
  successFactors: [
    "Make sure all visits have proper instruction created via punchlists ahead of crew visits",
    "Inspect properties weekly to ensure client satisfaction and achieve high Maintenance quality (draft)",
    "Coordinate with team members to ensure all visits have proper punchlists"
  ]
};

export const KPI_EXTRA_SERVICES = {
  name: 'Extra Services',
  description: 'Additional Arbor, Enhancement and Spray services sold as a percentage of the Maintenance book of business (BOB). Collaborative work with Specialists to ensure client proposals meet client needs and results in high service satisfaction.',
  target: 100,
  actual: 100,
  weight: 25,
  successFactors: [
    "Ensure all budgeted proposals for properties are proactively provided to clients",
    "Capture all client proposal requests and/or identify property needs for specialists, for creation and delivery of proposals in a timely manner"
  ]
};

export const KPI_DIRECT_LABOR_MAINTENANCE = {
  name: 'Direct Labor Maintenance %',
  description: 'Direct Maintenance labor cost as a percentage of Maintenance revenue. Lower percentages indicate efficient labor utilization and increase profitability.',
  target: 40,
  actual: 40,
  weight: 25,
  isInverse: true,
  successFactors: [
    "Ensure accuracy of On-Property hours required to complete directed work",
    "Regularly review Direct Labor Dashboard and Crew Schedules to ensure we're meeting the desired Direct Labor goals",
    "Identify opportunities to maximize crew effeciency and productivity ",
    "Provide actionable and clear visit notes so crews are making the best use of hours spent on property"
  ]
};

export const KPI_LV_MAINTENANCE_GROWTH = {
  name: 'LV Maintenance Growth',
  description: 'Grow Maintenance book of business for LV market. Measured as percentage increase in maintenance contract value compared to previous year.',
  target: 3,
  actual: 1,
  weight: 20,
  successFactors: [
    "Collaborate with Business Development team to maximize market opportunities",
    "Participation in local networking groups and events to drive brand recognition",
    "Nurture existing client relationships to become our client's preferrred service provider"
  ]
};

export const KPI_PROPERTY_CHECKLIST_ITEM_COMPLETION = {
  name: 'Property Checklist Item Completion',
  description: 'Ensure all items on visit note checklists are completed, and completed satisfactorily, on a daily basis to keep properties in great condition and improve retention.',
  target: 100,
  actual: 80,
  weight: 25,
  successFactors: [
    "Create actionable and applicable checklist items for crews",
    "Ensure crew completes the checklists in CRM",
    "Validate completion via crew photos and property visits"
  ]
};

export const KPI_SALES_GOAL_MET = {
  name: 'Sales Goal Met',
  description: 'Percentage of sales targets achieved across all service lines. Meeting or exceeding sales goals ensures business growth and sustainability.',
  target: 100,
  actual: 90,
  weight: 25,
  successFactors: [
    "Meeting Proposal Goals",
    "Managing Pipeline and Follow-ups",
    "Communicating and Coordinating with Account Managers",
    "Reviewing Budgets and Proposing all budgeted work"
  ]
};

export const KPI_TOTAL_GROSS_MARGIN = {
  name: 'Total Gross Margin % on Completed Jobs',
  description: 'Total gross margin percentage across all completed enhancement and arbor jobs. Higher margins indicate effective pricing and cost management.',
  target: 60,
  actual: 60,
  weight: 25,
  successFactors: [
    "Jobs properly bid",
    "Coordinating and communicating expectations for jobs with operations",
    "Reviewing completed work to ensure no warranty work needs to occur"
  ]
};

export const KPI_ARBOR_ENHANCEMENT_PROCESS = {
  name: 'Arbor/Enhancement Process Followed',
  description: 'Percentage of jobs that strictly followed the prescribed process from estimate to completion. Proper process adherence ensures quality, safety, and profitability.',
  target: 95,
  actual: 90,
  weight: 25
};

export const KPI_PIPELINE_UPDATES_CURRENT = {
  name: 'Pipeline Updates Current',
  description: 'Percentage of pipeline projects with up-to-date status and follow-ups scheduled at various data checkpoints. Maintaining current pipeline data improves forecasting accuracy, resource planning and improves closing rates.',
  target: 100,
  actual: 90,
  weight: 25,
  successFactors: [
    "Proposal Requests provided by due date",
    "Follow-ups scheduled for all opportunities",
    "Opportunities in proper status",
    "Client portals updated on-time with proper status (ex: Prologis)",
    "Proposing effort from budgets on time and for all budgeted effort"
  ]
};

export const KPI_FLEET_UPTIME_RATE = {
  name: 'Fleet Uptime Rate',
  description: 'Percentage of time equipment is operational vs. down for Maintenance or repairs. Higher uptime indicates better Maintenance practices and equipment reliability.',
  target: 95,
  actual: 93,
  weight: 25
};

export const KPI_PREVENTATIVE_VS_REACTIVE = {
  name: 'Preventative vs. Reactive Maintenance Ratio',
  description: 'Cost comparison of scheduled Maintenance versus emergency repairs, calculated as (Maintenance Costs) / (Repair Costs) as a percentage. Higher ratios indicate more proactive Maintenance approaches.',
  target: 80,
  actual: 75,
  weight: 25
};

export const KPI_ACCIDENT_INCIDENT_RATE = {
  name: 'Accident/Incident Rate',
  description: 'Number of accidents or safety incidents per miles driven. Measured using Samsara event notifications and reported incidents. Lower rates indicate better safety outcomes.',
  target: 5,
  actual: 7,
  weight: 25,
  isInverse: true
};

export const KPI_SAFETY_INCIDENTS_MAGNITUDE = {
  name: 'Safety Incidents Magnitude',
  description: 'Severity and impact of safety incidents, measured on a scale. Lower values indicate less severe safety incidents or better management of incident consequences.',
  target: 10,
  actual: 12,
  weight: 25,
  isInverse: true
};