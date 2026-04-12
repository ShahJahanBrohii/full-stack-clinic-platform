import { useState, useId } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "../context/ToastContext";
import api from "../services/api";

export default function ResetPassword() {
  const { success, error: showError } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const id = useId();

  const [step, setStep] = useState(token ? "reset" : "request"); // "request" or "reset"
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // ── Request Reset ──────────────────────────────────────────
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    try {
      const response = await api.post("/auth/forgot-password", { email });
      success("If an account exists, a reset link has been sent to your email.");
      setEmail("");
      // In production, guide user to check their email
    } catch (err) {
      const message = err.response?.data?.message || "Failed to request password reset";
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Reset Password ─────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!form.newPassword) errors.newPassword = "Password is required";
    else if (form.newPassword.length < 8)
      errors.newPassword = "Password must be at least 8 characters";

    if (!form.confirmPassword) errors.confirmPassword = "Confirmation is required";
    else if (form.newPassword !== form.confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      success(response.data.message);
      // Redirect to login after success
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to reset password";
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <NavLink
            to="/login"
            className="flex items-center justify-center w-9 h-9 rounded border border-slate-600 hover:border-primary text-slate-400 hover:text-primary transition-colors"
            aria-label="Back to login"
          >
            <ArrowLeft size={16} />
          </NavLink>
          <div>
            <h1 className="text-2xl font-black text-white">Reset Password</h1>
            <p className="text-xs text-slate-500 mt-1">Secure your account</p>
          </div>
        </div>

        {step === "request" ? (
          // ── REQUEST FORM ──────────────────────────────────
          <form onSubmit={handleRequestReset} className="space-y-5">
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-300">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor={`${id}-email`} className="text-xs font-bold uppercase text-slate-500 block mb-2">
                Email Address
              </label>
              <input
                id={`${id}-email`}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors({});
                }}
                placeholder="Your email"
                className="w-full bg-white/[0.03] border border-white/10 rounded px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-primary outline-none transition-colors"
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-gradient-primary text-white font-bold py-3 rounded-lg hover:shadow-glow-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Send Reset Link
            </button>

            {/* Back to Login */}
            <NavLink
              to="/login"
              className="block text-center text-sm text-slate-400 hover:text-accent transition-colors"
            >
              Back to Login
            </NavLink>
          </form>
        ) : (
          // ── RESET FORM ────────────────────────────────────
          <form onSubmit={handleResetPassword} className="space-y-5">
            {!token && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
                <AlertCircle size={18} className="text-red-400 shrink-0" />
                <p className="text-sm text-red-300">
                  Invalid or expired reset link. Please request a new one.
                </p>
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor={`${id}-password`} className="text-xs font-bold uppercase text-slate-500 block mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id={`${id}-password`}
                  type={showPassword ? "text" : "password"}
                  value={form.newPassword}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, newPassword: e.target.value }));
                    setFieldErrors((prev) => ({ ...prev, newPassword: "" }));
                  }}
                  placeholder="••••••••"
                  className={`w-full bg-white/[0.03] border rounded px-4 py-3 pr-11 text-sm text-white placeholder-slate-600 outline-none focus:border-primary transition-colors ${
                    fieldErrors.newPassword ? "border-red-500/60" : "border-white/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.newPassword}</p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Minimum 8 characters. Include uppercase, lowercase, number, and special character.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor={`${id}-confirm`} className="text-xs font-bold uppercase text-slate-500 block mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id={`${id}-confirm`}
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                  placeholder="••••••••"
                  className={`w-full bg-white/[0.03] border rounded px-4 py-3 pr-11 text-sm text-white placeholder-slate-600 outline-none focus:border-primary transition-colors ${
                    fieldErrors.confirmPassword ? "border-red-500/60" : "border-white/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-gradient-primary text-white font-bold py-3 rounded-lg hover:shadow-glow-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Reset Password
            </button>

            {/* Back to Login */}
            <NavLink
              to="/login"
              className="block text-center text-sm text-slate-400 hover:text-accent transition-colors"
            >
              Back to Login
            </NavLink>
          </form>
        )}
      </div>
    </div>
  );
}
