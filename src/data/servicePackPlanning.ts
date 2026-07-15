export type PlanningStatus = 'done' | 'in-progress' | 'pending';

export interface PlanningColumn {
  key: string;
  label: string;
}

export interface PlanningRow {
  product: string;
  statuses: Record<string, PlanningStatus>;
}

export const planningColumns: PlanningColumn[] = [
  { key: 'scopeFinalized', label: 'Scope Finalized' },
  { key: 'development', label: 'Development' },
  { key: 'integration', label: 'Integration' },
  { key: 'verification', label: 'Verification' },
  { key: 'validation', label: 'Validation' },
  { key: 'inCenterRelease', label: 'InCenter release' },
];

export const planningRows: PlanningRow[] = [
  {
    product: 'LTSC 1607',
    statuses: {
      scopeFinalized: 'done',
      development: 'done',
      integration: 'in-progress',
      verification: 'pending',
      validation: 'pending',
      inCenterRelease: 'pending',
    },
  },
  {
    product: 'LTSC 1809',
    statuses: {
      scopeFinalized: 'done',
      development: 'done',
      integration: 'done',
      verification: 'in-progress',
      validation: 'pending',
      inCenterRelease: 'pending',
    },
  },
  {
    product: 'LTSC 2021',
    statuses: {
      scopeFinalized: 'done',
      development: 'done',
      integration: 'done',
      verification: 'done',
      validation: 'in-progress',
      inCenterRelease: 'pending',
    },
  },
];
