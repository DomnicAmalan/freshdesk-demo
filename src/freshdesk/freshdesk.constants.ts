export const FRESHWORKS = {
  FRESHDESK: {
    TICKETS: {
      url: '/api/v2/tickets',
      method: 'GET',
    },
    CREATE_TICKET: {
      url: '/api/v2/tickets',
      method: 'POST',
    },
    GET_TICKET: (ticketId: string) => ({
      url: `/api/v2/tickets/${ticketId}`,
      method: 'GET',
    }),
    UPDATE_TICKET: (ticketId: string) => ({
      url: `/api/v2/tickets/${ticketId}`,
      method: 'PUT',
    }),
    DELETE_TICKET: (ticketId: string) => ({
      url: `/api/v2/tickets/${ticketId}`,
      method: 'DELETE',
    }),
    TICKET_FIELDS: {
      url: '/api/v2/ticket_fields',
      method: 'GET',
    },
    TICKET_REPLY: (ticketId: string) => ({
      url: `/api/v2/tickets/${ticketId}/reply`,
      method: 'POST',
    }),
    CONTACTS: {
      url: '/api/v2/contacts',
      method: 'GET',
    },
    CREATE_CONTACT: {
      url: '/api/v2/contacts',
      method: 'POST',
    },
    GET_CONTACT: (contactId: string) => ({
      url: `/api/v2/contacts/${contactId}`,
      method: 'GET',
    }),
    UPDATE_CONTACT: (contactId: string) => ({
      url: `/api/v2/contacts/${contactId}`,
      method: 'PUT',
    }),
    DELETE_CONTACT: (contactId: string) => ({
      url: `/api/v2/contacts/${contactId}`,
      method: 'DELETE',
    }),
    CREATE_AGENT: {
      url: '/api/v2/agents',
      method: 'POST',
    },
    AGENTS: {
      url: '/api/v2/agents',
      method: 'GET',
    },
  },
  AUTH_HEADER: (apiKey: string) =>
    `Basic ${Buffer.from(`${apiKey}:X`).toString('base64')}`,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
};

export const QUEUE_NAME = 'freshdesk';

export const QUEUE_EVENT_SUFFIX = 'freshdesk';
export const FRESHDESK_EVENTS = {
  CREATE_TICKET: `${QUEUE_EVENT_SUFFIX}-create-ticket`,
  REPLY_TICKET: `${QUEUE_EVENT_SUFFIX}-reply-ticket`,
}

export const FRESHDESK_JOB_OPTIONS = {
  removeOnComplete: true,
  removeOnFail: true,
  attempts: 3,
  backoff: {
    type: 'fixed',
    delay: 1000,
  },
}
