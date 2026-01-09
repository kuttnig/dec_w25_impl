import axios from 'axios';

// Default API client: same origin, routed by nginx (https) or vite proxy (dev)
export const api = axios.create({
  baseURL: '/api',
});

export function createAdminApi(adminKey) {
  return axios.create({
    baseURL: '/api',
    headers: {
      'x-admin-key': adminKey,
    },
  });
}
