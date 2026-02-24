import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_BASE || 'https://quirky-matsumoto-nuqdlerbk.liara.run';
const client = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });

export function setAuthToken(token?: string) {
  if (token) client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete client.defaults.headers.common['Authorization'];
}

export default client;