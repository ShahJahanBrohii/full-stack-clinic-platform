import { useState, useId } from "react";
import { NavLink, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, AlertCircle, Activity, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useClinicSettings } from "../context/ClinicSettingsContext";

export default function Login() {
  const { login, logout, user, loading: authLoading } = useAuth();
  const { settings } = useClinicSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const id = useId();

  // Redirect to intended page, or dashboard by default
  const from = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Already authenticated — allow account switching instead of forced redirect
  if (!authLoading && user) {
    const dashboardPath = user.role === "admin" ? "/admin" : "/dashboard";
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-slate-200 bg-white shadow-sm p-6 flex flex-col gap-4 rounded-xl">
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-primary">
            Session Active
          </span>
          <h1
            className="text-3xl font-black text-slate-900"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            YOU ARE ALREADY LOGGED IN
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Signed in as <strong className="text-slate-900">{user.email}</strong> ({user.role}).
            To log in as admin or another user, switch account below.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <button
              type="button"
              onClick={() => navigate(dashboardPath, { replace: true })}
              className="flex-1 px-4 py-3 bg-primary text-text-primary font-bold text-xs tracking-widest uppercase hover:bg-white transition-colors duration-200"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-bold text-xs tracking-widest uppercase hover:text-slate-900 hover:border-slate-400 transition-colors duration-200"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Field update ───────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (error) setError("");
  };

  // ── Client-side validation ─────────────────────────────────
  const validate = () => {
    const errors = {};
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Enter a valid email address.";
    if (!form.password) errors.password = "Password is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    const result = await login({ email: form.email, password: form.password });

    setLoading(false);

    if (result.success) {
      const role = result.user?.role;
      const isDefaultPatientTarget = from === "/dashboard" || from === "/book";
      if (role === "admin" && isDefaultPatientTarget) {
        navigate("/admin", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setError(result.error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Left panel — branding (desktop only) ───────────────── */}
      <div className="hidden lg:flex flex-col justify-start w-1/2 bg-surface-dark border-r border-primary/30 p-12 relative overflow-hidden">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 group w-fit relative z-10" aria-label={`${settings.clinicName} — Home`}>
          <div className="w-9 h-9 flex items-center justify-center bg-primary">
            <Activity size={18} strokeWidth={2.5} className="text-text-primary" aria-hidden="true" />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className="text-white font-black text-lg"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.02em" }}
            >
              {settings.clinicName}
            </span>
            <span className="text-[10px] text-sky-100/80 tracking-[0.2em] uppercase font-medium">
              {settings.tagline}
            </span>
          </div>
        </NavLink>

        {/* Headline */}
        <div className="relative z-10 mt-16">
          <h2
            className="text-5xl font-black text-white leading-[0.9]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            WELCOME
            <br />
            <span className="text-primary">BACK,</span>
            <br />
            CHAMPION.
          </h2>
          <p className="mt-5 text-sky-100/90 text-base leading-relaxed max-w-xs">
            Access your treatment plan, progress updates, and exercise library — all in one place.
          </p>
        </div>

        {/* Bottom stat */}
        <div className="relative z-10 flex items-center gap-4 p-5 border border-white/30 bg-white/10 mt-auto">
          <span
            className="text-4xl font-black text-primary"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            98%
          </span>
          <div>
            <p className="text-sm font-bold text-white">Recovery Rate</p>
            <p className="text-xs text-sky-100/80">Across all patients in 2024</p>
          </div>
        </div>

      </div>

      {/* ── Right panel — form ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12">

        {/* Mobile logo */}
        <NavLink to="/" className="flex lg:hidden items-center gap-3 mb-10 group" aria-label={`${settings.clinicName} — Home`}>
          <div className="w-8 h-8 flex items-center justify-center bg-primary">
            <Activity size={16} strokeWidth={2.5} className="text-text-primary" aria-hidden="true" />
          </div>
          <span
            className="text-white font-black text-base"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {settings.clinicName}
          </span>
        </NavLink>

        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="mb-8">
            <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-primary">
              Patient Portal
            </span>
            <h1
              className="mt-2 text-4xl font-black text-slate-900"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              SIGN IN
            </h1>
            <p className="mt-2 text-slate-600 text-sm">
              Don't have an account?{" "}
              <NavLink
                to="/register"
                className="text-primary hover:text-accent transition-colors duration-150 font-semibold"
              >
                Create one free
              </NavLink>
            </p>
          </div>

          {/* Global error */}
          {error && (
            <div
              className="mb-6 flex items-center gap-3 p-4 border border-red-500/30 bg-red-500/10 text-red-400 text-sm"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${id}-email`}
                className="text-xs font-bold tracking-widest uppercase text-slate-500"
              >
                Email Address
              </label>
              <input
                id={`${id}-email`}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? `${id}-email-err` : undefined}
                className={`w-full bg-white border px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary transition-colors duration-200 ${
                  fieldErrors.email ? "border-red-500/60" : "border-slate-300"
                }`}
              />
              {fieldErrors.email && (
                <p id={`${id}-email-err`} className="text-xs text-red-400" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`${id}-password`}
                  className="text-xs font-bold tracking-widest uppercase text-slate-500"
                >
                  Password
                </label>
                <NavLink
                  to="/reset-password"
                  className="text-xs text-slate-500 hover:text-accent transition-colors duration-150"
                >
                  Forgot password?
                </NavLink>
              </div>
              <div className="relative">
                <input
                  id={`${id}-password`}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? `${id}-password-err` : undefined}
                  className={`w-full bg-white border px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary transition-colors duration-200 ${
                    fieldErrors.password ? "border-red-500/60" : "border-slate-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors duration-150"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff size={16} aria-hidden="true" />
                    : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id={`${id}-password-err`} className="text-xs text-red-400" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="mt-2 flex items-center justify-center gap-3 w-full py-4 bg-primary text-text-primary font-bold text-sm tracking-widest uppercase hover:bg-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={16} strokeWidth={2.5} aria-hidden="true" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider + register link */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              New patient?{" "}
              <NavLink
                to="/register"
                className="text-primary font-semibold hover:text-accent transition-colors duration-150"
              >
                Register and get started →
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
