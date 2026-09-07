import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

/**
 * Ensures Sanctum CSRF cookie is initialized before state-modifying requests
 */
export const ensureCsrfCookie = async (): Promise<void> => {
  try {
    await axios.get('/sanctum/csrf-cookie', {
      withCredentials: true,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
  } catch (err) {
    console.warn('Could not initialize CSRF cookie:', err);
  }
};

apiClient.interceptors.request.use((config) => {
  // Backward compatibility fallback: attach Bearer token if present
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
