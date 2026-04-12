import { useState, useId } from "react";
import { NavLink, useNavigate, Navigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  Activity,
  Loader2,
  CheckCircle2,
  Check,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";

// ── Password strength checker ─────────────────────────────────────────────────
const STRENGTH_RULES = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Number", test: (p) => /[0-9]/.test(p) },
  { label: "Special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrength({ password, id }) {
  const passed = STRENGTH_RULES.filter((r) => r.test(password)).length;
  const levels = [
    { color: "bg-red-500", label: "Weak" },
    { color: "bg-orange-400", label: "Fair" },
    { color: "bg-yellow-400", label: "Good" },
    { color: "bg-emerald-500", label: "Strong" },
  ];
  const level = levels[Math.max(0, passed - 1)];

  if (!password) return null;

  return (
    <div className="flex flex-col gap-2 mt-1" id={id} aria-live="polite" aria-label={`Password strength: ${level.label}`}>
      {/* Bar */}
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 transition-all duration-300 ${i < passed ? level.color : "bg-white/10"}`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Strength:{" "}
        <span className={`font-semibold ${passed >= 3 ? "text-emerald-400" : "text-slate-400"}`}>
          {level.label}
        </span>
      </p>
      {/* Rule checklist */}
      <ul className="grid grid-cols-2 gap-1 mt-1" aria-label="Password requirements">
        {STRENGTH_RULES.map(({ label, test }) => {
          const met = test(password);
          return (
            <li
              key={label}
              className={`flex items-center gap-1.5 text-xs ${met ? "text-emerald-400" : "text-slate-600"}`}
              aria-label={`${label}: ${met ? "met" : "not met"}`}
            >
              <Check size={11} strokeWidth={3} aria-hidden="true" />
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Register() {
  const { register, user, loading: authLoading } = useAuth();
  const { success: showSuccessToast, info: showInfoToast } = useToast();
  const navigate = useNavigate();
  const id = useId();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreed: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Already authenticated — redirect away from register page
  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (error) setError("");
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Full name is required.";
    else if (form.name.trim().length < 2) errors.name = "Name must be at least 2 characters.";

    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Enter a valid email address.";

    if (form.phone && !/^[0-9+\-\s()]{7,15}$/.test(form.phone))
      errors.phone = "Enter a valid phone number.";

    if (!form.password) errors.password = "Password is required.";
    else if (form.password.length < 8)
      errors.password = "Password must be at least 8 characters.";

    if (!form.confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
      errors.confirmPassword = "Passwords do not match.";

    if (!form.agreed) errors.agreed = "You must accept the terms to continue.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    const result = await register({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || undefined,
      password: form.password,
    });

    setLoading(false);

    if (result.success) {
      showSuccessToast("Registration successful! Welcome to Ali's Clinic 🎉");
      showInfoToast("Confirmation email sent to " + form.email.trim());
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } else {
      setError(result.error || "Registration failed. Please try again.");
    }
  };

  // ── Success state ──────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 flex items-center justify-center bg-[#0EA5E9]">
            <CheckCircle2 size={30} className="text-[#0F172A]" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div>
            <h2
              className="text-3xl font-black text-slate-900"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              ACCOUNT CREATED!
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Redirecting you to your dashboard…
            </p>
          </div>
          <Loader2 size={18} className="text-[#0EA5E9] animate-spin" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Left panel — branding ───────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-[#0F172A] border-r border-primary/30 p-12 relative overflow-hidden">

        <NavLink to="/" className="flex items-center gap-3 group w-fit relative z-10" aria-label="Ali's Clinic — Home">
          <div className="w-9 h-9 flex items-center justify-center bg-[#0EA5E9]">
            <Activity size={18} strokeWidth={2.5} className="text-[#0F172A]" aria-hidden="true" />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className="text-white font-black text-lg"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.02em" }}
            >
              Ali's<span className="text-[#0EA5E9]">Clinic</span>
            </span>
            <span className="text-[10px] text-sky-100/80 tracking-[0.2em] uppercase font-medium">
              Sports Medicine
            </span>
          </div>
        </NavLink>

        <div className="relative z-10">
          <h2
            className="text-5xl font-black text-white leading-[0.9]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            YOUR
            <br />
            RECOVERY
            <br />
            <span className="text-[#0EA5E9]">STARTS HERE.</span>
          </h2>
          <p className="mt-5 text-sky-100/90 text-sm leading-relaxed max-w-xs">
            Create your free patient account to track progress and access personalised exercise videos.
          </p>

          <ul className="mt-7 flex flex-col gap-3" aria-label="Benefits of registering">
            {[
              "Quick onboarding in under 2 minutes",
              "Personal recovery dashboard",
              "Video exercise library access",
              "Appointment reminders via email",
            ].map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-sm text-sky-100/90">
                <CheckCircle2 size={14} className="text-[#0EA5E9] shrink-0" aria-hidden="true" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-sky-100/80 relative z-10">
          Free to register. No credit card required.
        </p>
      </div>

      {/* ── Right panel — form ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12 overflow-y-auto">

        {/* Mobile logo */}
        <NavLink to="/" className="flex lg:hidden items-center gap-3 mb-8 group" aria-label="Ali's Clinic — Home">
          <div className="w-8 h-8 flex items-center justify-center bg-gradient-primary">
            <Activity size={16} strokeWidth={2.5} className="text-[#0F172A]" aria-hidden="true" />
          </div>
          <span
            className="text-white font-black text-base"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Ali's<span className="text-accent">Clinic</span>
          </span>
        </NavLink>

        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="mb-8">
            <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#0EA5E9]">
              New Patient
            </span>
            <h1
              className="mt-2 text-4xl font-black text-slate-900"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              CREATE ACCOUNT
            </h1>
            <p className="mt-2 text-slate-600 text-sm">
              Already have an account?{" "}
              <NavLink
                to="/login"
                className="text-[#0EA5E9] hover:text-[#F97316] transition-colors duration-150 font-semibold"
              >
                Sign in
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

            {/* Full name */}
            <div className="flex flex-col gap-2">
              <label htmlFor={`${id}-name`} className="text-xs font-bold tracking-widest uppercase text-slate-500">
                Full Name <span className="text-[#F97316]" aria-hidden="true">*</span>
              </label>
              <input
                id={`${id}-name`}
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Ali Hassan"
                autoComplete="name"
                required
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? `${id}-name-err` : undefined}
                className={`w-full bg-white border px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#0EA5E9] transition-colors duration-200 ${
                  fieldErrors.name ? "border-red-500/60" : "border-slate-300"
                }`}
              />
              {fieldErrors.name && (
                <p id={`${id}-name-err`} className="text-xs text-red-400" role="alert">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label htmlFor={`${id}-email`} className="text-xs font-bold tracking-widest uppercase text-slate-500">
                Email Address <span className="text-[#F97316]" aria-hidden="true">*</span>
              </label>
              <input
                id={`${id}-email`}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? `${id}-email-err` : undefined}
                className={`w-full bg-white border px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#0EA5E9] transition-colors duration-200 ${
                  fieldErrors.email ? "border-red-500/60" : "border-slate-300"
                }`}
              />
              {fieldErrors.email && (
                <p id={`${id}-email-err`} className="text-xs text-red-400" role="alert">{fieldErrors.email}</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div className="flex flex-col gap-2">
              <label htmlFor={`${id}-phone`} className="text-xs font-bold tracking-widest uppercase text-slate-500">
                Phone Number{" "}
                <span className="text-slate-700 normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <input
                id={`${id}-phone`}
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+92 300 000 0000"
                autoComplete="tel"
                aria-invalid={!!fieldErrors.phone}
                aria-describedby={fieldErrors.phone ? `${id}-phone-err` : undefined}
                className={`w-full bg-white border px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#0EA5E9] transition-colors duration-200 ${
                  fieldErrors.phone ? "border-red-500/60" : "border-slate-300"
                }`}
              />
              {fieldErrors.phone && (
                <p id={`${id}-phone-err`} className="text-xs text-red-400" role="alert">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label htmlFor={`${id}-password`} className="text-xs font-bold tracking-widest uppercase text-slate-500">
                Password <span className="text-[#F97316]" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id={`${id}-password`}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  required
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={`${id}-strength${fieldErrors.password ? ` ${id}-password-err` : ""}`}
                  className={`w-full bg-white border px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#0EA5E9] transition-colors duration-200 ${
                    fieldErrors.password ? "border-red-500/60" : "border-slate-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors duration-150"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              {fieldErrors.password ? (
                <p id={`${id}-password-err`} className="text-xs text-red-400" role="alert">{fieldErrors.password}</p>
              ) : (
                <PasswordStrength password={form.password} id={`${id}-strength`} />
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-2">
              <label htmlFor={`${id}-confirm`} className="text-xs font-bold tracking-widest uppercase text-slate-500">
                Confirm Password <span className="text-[#F97316]" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id={`${id}-confirm`}
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  aria-invalid={!!fieldErrors.confirmPassword}
                  aria-describedby={fieldErrors.confirmPassword ? `${id}-confirm-err` : undefined}
                  className={`w-full bg-white border px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#0EA5E9] transition-colors duration-200 ${
                    fieldErrors.confirmPassword ? "border-red-500/60" : "border-slate-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors duration-150"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p id={`${id}-confirm-err`} className="text-xs text-red-400" role="alert">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="flex flex-col gap-1">
              <label className="flex items-start gap-3 cursor-pointer group" htmlFor={`${id}-agreed`}>
                <div className="relative mt-0.5 shrink-0">
                  <input
                    id={`${id}-agreed`}
                    type="checkbox"
                    name="agreed"
                    checked={form.agreed}
                    onChange={handleChange}
                    aria-invalid={!!fieldErrors.agreed}
                    aria-describedby={fieldErrors.agreed ? `${id}-agreed-err` : undefined}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 border flex items-center justify-center transition-all duration-200 ${
                      form.agreed
                        ? "bg-accent border-accent"
                        : fieldErrors.agreed
                        ? "border-red-500/60 bg-white"
                        : "border-slate-300 bg-white group-hover:border-[#0EA5E9]/50"
                    }`}
                    aria-hidden="true"
                  >
                    {form.agreed && <Check size={10} strokeWidth={3} className="text-[#0F172A]" />}
                  </div>
                </div>
                <span className="text-sm text-slate-600 leading-relaxed">
                  I agree to the{" "}
                  <NavLink to="/terms" className="text-[#0EA5E9] hover:text-[#F97316] transition-colors">
                    Terms of Service
                  </NavLink>{" "}
                  and{" "}
                  <NavLink to="/privacy" className="text-[#0EA5E9] hover:text-[#F97316] transition-colors">
                    Privacy Policy
                  </NavLink>
                </span>
              </label>
              {fieldErrors.agreed && (
                <p id={`${id}-agreed-err`} className="text-xs text-red-400 ml-7" role="alert">{fieldErrors.agreed}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="mt-2 flex items-center justify-center gap-3 w-full py-4 bg-[#0EA5E9] text-[#0F172A] font-bold text-sm tracking-widest uppercase hover:bg-[#22C55E] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus size={16} strokeWidth={2.5} aria-hidden="true" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Already a patient?{" "}
              <NavLink
                to="/login"
                className="text-[#0EA5E9] font-semibold hover:text-[#F97316] transition-colors duration-150"
              >
                Sign in to your account →
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
