// Dummy Jira API responses — no real Jira data

export const DUMMY_JIRA_WORKLOG_1 = {
  id: 'jira-wl-new-001',
  issueId: 'issue-001',
  author: {
    accountId: 'test-account-1',
    displayName: 'Test Dev One',
    emailAddress: 'test.dev1@example.com',
  },
  started: '2026-01-05T09:00:00.000+0000',
  timeSpentSeconds: 28800, // 8 hours
};

export const DUMMY_JIRA_WORKLOG_2 = {
  id: 'jira-wl-new-002',
  issueId: 'issue-001',
  author: {
    accountId: 'test-account-2',
    displayName: 'Test Dev Two',
    emailAddress: 'test.dev2@example.com',
  },
  started: '2026-01-05T09:00:00.000+0000',
  timeSpentSeconds: 14400, // 4 hours
};

export const DUMMY_JIRA_SEARCH_RESPONSE = {
  issues: [
    {
      id: 'issue-001',
      key: 'TEST-10',
      fields: {
        components: [{ name: 'Test Component Alpha' }],
        worklog: {
          total: 2,
          maxResults: 50,
          worklogs: [DUMMY_JIRA_WORKLOG_1, DUMMY_JIRA_WORKLOG_2],
        },
      },
    },
  ],
  nextPageToken: undefined,
};
