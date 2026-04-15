import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://localhost:3000/api/v1');

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('arena_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const isVerifyRoute = error.config?.url?.includes('/auth/verify');
      if (!isVerifyRoute) {
        await AsyncStorage.removeItem('arena_token');
        DeviceEventEmitter.emit('arena_unauthorized');
      }
    }
    return Promise.reject(error);
  }
);
