import axios from "axios";
import { clearSession, getToken } from "./auth";

/**
 * WHAT IT DOES:
 *   Configures a centralized Axios HTTP client instance pointing to the backend API base URL (`http://localhost:5000/api`).
 * 
 * WHY WE ADDED IT:
 *   - Avoids hardcoding base URLs and headers across multiple React components.
 *   - Automatic Authentication: Automatically attaches the JWT bearer token to every outgoing request.
 *   - Seamless Session Handling: Intercepts 401 Unauthorized errors (e.g. expired tokens), clears session
 *     data from localStorage, and immediately redirects the user to the login screen.
 * 
 * HOW IT WORKS:
 *   1. Creates axios instance with predefined baseURL.
 *   2. Request Interceptor: Reads token via `getToken()`; if present, injects `Authorization: Bearer <token>`.
 *   3. Response Interceptor: Checks if status is 401. If so, calls `clearSession()` and redirects to `/`.
 *   4. Exports configured `api` instance.
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api"
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response Interceptor: Auto-logout on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
