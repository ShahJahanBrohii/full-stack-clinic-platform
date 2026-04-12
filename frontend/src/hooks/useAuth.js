import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * useAuth
 * Convenience hook — import and call this instead of useContext(AuthContext)
 * directly in any component.
 *
 * Returns: { user, loading, login, register, logout, updateUser }
 *
 * Throws if used outside of <AuthProvider> so problems surface immediately
 * during development rather than failing silently.
 *
 * Usage:
 *   const { user, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error(
      "useAuth() must be used inside an <AuthProvider>. " +
        "Make sure your component tree is wrapped with <AuthProvider> in App.jsx."
    );
  }

  return context;
}
