import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gh_token') || localStorage.getItem('gh_user');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('📡 API Request with Token:', config.url);
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gh_token');
      localStorage.removeItem('gh_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
