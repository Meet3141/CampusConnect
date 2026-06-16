import axios from "axios";

/**
 * Axios instance for all API calls.
 *
 * Uses a relative baseURL ("/api") so requests always go to the same host
 * that served the page — Vite's dev proxy then forwards them to port 5000.
 * This means the app works from any device on the network (desktop, mobile)
 * without requiring a .env file or hardcoded IP address.
 *
 * In production: the reverse proxy (nginx, etc.) handles the /api forwarding.
 * withCredentials: true — instructs the browser to send/receive HttpOnly cookies
 * automatically with every request.  No manual token handling needed.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : "/api",
  withCredentials: true,    // send cookies cross-origin
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 responses; skip credential endpoints to avoid loops.
    // /auth/verify IS allowed to retry — it's the session-check call.
    const SKIP_REFRESH_URLS = ["/auth/login", "/auth/register", "/auth/logout", "/auth/refresh-token"];
    const isSkipped = SKIP_REFRESH_URLS.some((u) => originalRequest.url?.includes(u));
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isSkipped
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token is sent automatically via the HttpOnly cookie
        await api.post("/auth/refresh-token", {});

        // New access token cookie is now set — retry the original request
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Let the rejected promise bubble up — ProtectedRoute handles the UI redirect
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
