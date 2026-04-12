import { createContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

/**
 * AuthContext
 * Provides: { user, loading, login, register, logout, updateUser }
 *
 * Token is stored in localStorage under "apex_token".
 * On mount, the context tries to re-hydrate the session by calling
 * GET /auth/me with the stored token — so a page refresh keeps the
 * user logged in without them having to sign in again.
 */
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while re-hydrating

  // ── Re-hydrate session on mount ──────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("apex_token");

    if (!token) {
      setLoading(false);
      return;
    }

    // Verify token is still valid and fetch fresh user data
    authAPI
      .getMe()
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem("apex_token");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ── Login ────────────────────────────────────────────────────
  /**
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const login = useCallback(async (credentials) => {
    try {
      const res = await authAPI.login(credentials);
      const { token, user: userData } = res.data;

      localStorage.setItem("apex_token", token);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const message =
        err.response?.data?.message || "Login failed. Please try again.";
      return { success: false, error: message };
    }
  }, []);

  // ── Register ─────────────────────────────────────────────────
  /**
   * @param {{ name: string, email: string, password: string, phone?: string }} data
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const register = useCallback(async (data) => {
    try {
      const res = await authAPI.register(data);
      const { token, user: userData } = res.data;

      localStorage.setItem("apex_token", token);
      setUser(userData);

      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed. Please try again.";
      return { success: false, error: message };
    }
  }, []);

  // ── Logout ───────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("apex_token");
    setUser(null);
  }, []);

  // ── Update user (e.g., after profile edit) ───────────────────
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
