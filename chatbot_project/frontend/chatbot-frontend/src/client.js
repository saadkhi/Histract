// frontend/src/api/client.js
import axios from 'axios';

const API = axios.create({
  baseURL: '/api',  // ← Now goes through Nginx proxy
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;