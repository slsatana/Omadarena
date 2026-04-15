import axios from 'axios';

// Используем текущий hostname устройства:3000
const API_URL = `http://${window.location.hostname}:3000/api/v1`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор: Добавляем JWT Токен во все запросы автоматически
// Интерцептор: Добавляем JWT Токен во все запросы автоматически
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('arena_token') || localStorage.getItem('arena_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерцептор ответов: Обработка 401 (Unauthorized) для мультивайтинг сессий
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isVerifyRoute = error.config?.url?.includes('/auth/verify');
      if (!isVerifyRoute) {
        sessionStorage.removeItem('arena_token');
        localStorage.removeItem('arena_token');
        window.dispatchEvent(new CustomEvent('arena_unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);
