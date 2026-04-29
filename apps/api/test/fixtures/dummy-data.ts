const FIXED_TS = new Date('2026-01-15T10:00:00.000Z');
const JAN_01 = new Date('2026-01-01T00:00:00.000Z');
const JAN_02 = new Date('2026-01-02T00:00:00.000Z');

export const DUMMY_DEVELOPERS = [
  {
    id: 1,
    name: 'Test Dev One',
    email: 'test.dev1@example.com',
    slackId: 'test-dev-1',
    deletedAt: null,
    createdAt: FIXED_TS,
    updatedAt: FIXED_TS,
  },
  {
    id: 2,
    name: 'Test Dev Two',
    email: 'test.dev2@example.com',
    slackId: 'test-dev-2',
    deletedAt: null,
    createdAt: FIXED_TS,
    updatedAt: FIXED_TS,
  },
  {
    id: 3,
    name: 'Test Dev Three',
    email: 'test.dev3@example.com',
    slackId: null,
    deletedAt: null,
    createdAt: FIXED_TS,
    updatedAt: FIXED_TS,
  },
];

export const DUMMY_PROJECTS = [
  {
    id: 1,
    name: 'Test Project Alpha',
    monthlyBudget: 100,
    deletedAt: null,
    createdAt: FIXED_TS,
    updatedAt: FIXED_TS,
  },
  {
    id: 2,
    name: 'Test Project Beta',
    monthlyBudget: 200,
    deletedAt: null,
    createdAt: FIXED_TS,
    updatedAt: FIXED_TS,
  },
];

export const DUMMY_COMPONENTS = [
  {
    id: 1,
    name: 'Test Component Alpha',
    isBillable: true,
    projectId: 1,
    deletedAt: null,
    createdAt: FIXED_TS,
    updatedAt: FIXED_TS,
  },
  {
    id: 2,
    name: 'Test Component Beta',
    isBillable: false,
    projectId: 2,
    deletedAt: null,
    createdAt: FIXED_TS,
    updatedAt: FIXED_TS,
  },
];

export const DUMMY_WORKLOGS = [
  {
    id: 1,
    jiraWorklogId: 'test-wl-001',
    ticketKey: 'TEST-1',
    hours: 8,
    date: JAN_01,
    assigned: 'test.dev1@example.com',
    componentId: 1,
    deletedAt: null,
    createdAt: FIXED_TS,
    updatedAt: FIXED_TS,
  },
  {
    id: 2,
    jiraWorklogId: 'test-wl-002',
    ticketKey: 'TEST-2',
    hours: 4,
    date: JAN_01,
    assigned: 'test.dev2@example.com',
    componentId: 1,
    deletedAt: null,
    createdAt: FIXED_TS,
    updatedAt: FIXED_TS,
  },
  {
    id: 3,
    jiraWorklogId: 'test-wl-003',
    ticketKey: 'TEST-3',
    hours: 6,
    date: JAN_02,
    assigned: 'test.dev1@example.com',
    componentId: 2,
    deletedAt: null,
    createdAt: FIXED_TS,
    updatedAt: FIXED_TS,
  },
  {
    id: 4,
    jiraWorklogId: 'test-wl-004',
    ticketKey: 'TEST-4',
    hours: 2,
    date: JAN_02,
    assigned: 'test.dev3@example.com',
    componentId: 2,
    deletedAt: null,
    createdAt: FIXED_TS,
    updatedAt: FIXED_TS,
  },
];
