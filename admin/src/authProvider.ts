import type { AuthProvider } from "@refinedev/core";
import { axiosInstance } from "@refinedev/simple-rest";

export { axiosInstance };

// API setup
const API_URL = `http://${window.location.hostname}:3000/api/v1`;
axiosInstance.defaults.baseURL = API_URL;

// Setup the interceptor on the exact axios instance used by the simple-rest provider
axiosInstance.interceptors.request.use((config: any) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    if (!config.headers) {
      config.headers = {};
    }
    // Handle both new AxiosHeaders and plain objects conservatively
    if (config.headers.set) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

export const authProvider: AuthProvider = {
  login: async ({ phone, code }: any) => {
    try {
      if (phone && !code) {
        // Send SMS Phase
        await axiosInstance.post("/auth/send-sms", { phone });
        return {
          success: true,
          redirectTo: "/login?step=verify&phone=" + encodeURIComponent(phone),
        };
      }

      // Verify Phase
      const { data } = await axiosInstance.post("/auth/verify", { phone, code, deviceId: "admin-panel-web" });
      if (data.accessToken) {
        localStorage.setItem("admin_token", data.accessToken);
        localStorage.setItem("admin_user", JSON.stringify(data.user));
        return {
          success: true,
          redirectTo: "/",
        };
      }
      return {
        success: false,
        error: { name: "Ошибка входа", message: "Неверный код" },
      };
    } catch (err: any) {
      return {
        success: false,
        error: { name: "Ошибка", message: err.response?.data?.message || err.message },
      };
    }
  },
  register: async ({ phone, code, displayName }: any) => {
    try {
      if (phone && !code) {
        // Send SMS Phase
        await axiosInstance.post("/auth/send-sms", { phone });
        return {
          success: true,
          redirectTo: `/register?step=verify&phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(displayName || '')}`,
        };
      }

      // Verify Phase
      const { data } = await axiosInstance.post("/auth/verify", { 
        phone, code, deviceId: "admin-panel-web", displayName 
      });
      if (data.accessToken) {
        localStorage.setItem("admin_token", data.accessToken);
        localStorage.setItem("admin_user", JSON.stringify(data.user));
        return {
          success: true,
          redirectTo: "/",
        };
      }
      return {
        success: false,
        error: { name: "Ошибка регистрации", message: "Неверный код" },
      };
    } catch (err: any) {
      return {
        success: false,
        error: { name: "Ошибка", message: err.response?.data?.message || err.message },
      };
    }
  },
  logout: async () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    return { success: true, redirectTo: "/login" };
  },
  check: async () => {
    const token = localStorage.getItem("admin_token");
    if (token) return { authenticated: true };
    return { authenticated: false, logout: true, redirectTo: "/login" };
  },
  getPermissions: async () => null,
  getIdentity: async () => {
    const user = localStorage.getItem("admin_user");
    if (user) return JSON.parse(user);
    return null;
  },
  onError: async (error: any) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return { logout: true };
    }
    return {};
  },
};
