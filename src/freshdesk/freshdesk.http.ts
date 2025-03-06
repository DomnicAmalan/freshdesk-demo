import axios from 'axios';
import { FRESHWORKS } from '../freshdesk/freshdesk.constants';

export const createFreshdeskClient = (baseUrl: string, apiKey: string) => {
  return axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      Authorization: FRESHWORKS.AUTH_HEADER(apiKey),
    },
  });
};
