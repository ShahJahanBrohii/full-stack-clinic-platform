import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * ProtectedRoute
 * Wraps any route that requires authentication.
 *
 * Props:
 *   children      {ReactNode}  — the protected page to render
 *   requiredRole  {string}     — optional role gate (e.g. "admin").
 *                                If provided, authenticated users without
 *                                this role are redirected to `roleFallback`.
 *   roleFallback  {string}     — where to redirect if role check fails.
 *                                Defaults to "/dashboard".
 *   spinnerHeight {string}     — CSS min-height for the loading state.
 *                                Defaults to "60vh".
 *
 * Behaviour:
 *   loading             → full-screen spinner (no flash of redirect)
 *   not authenticated   → /login, preserving intended destination in state
 *   wrong role          → roleFallback
 *   authenticated + ok  → renders children
 */
export default function ProtectedRoute({
  children,
  requiredRole,
  roleFallback = "/dashboard",
  spinnerHeight = "60vh",
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Auth check in progress — avoid flash of redirect
  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4"
        style={{ minHeight: spinnerHeight }}
        role="status"
        aria-live="polite"
        aria-label="Verifying session"
      >
        <Loader2
          size={32}
          className="text-[#0EA5E9] animate-spin"
          strokeWidth={2}
          aria-hidden="true"
        />
        <p className="text-sm text-slate-500 tracking-widest uppercase">
          Verifying session…
        </p>
      </div>
    );
  }

  // Not authenticated — redirect to login, save intended destination
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Role check — authenticated but wrong role
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={roleFallback} replace />;
  }

  // Authenticated (and role matches if required) — render the page
  return children;
}