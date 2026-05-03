import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { CheckCircle2, Lock, Loader2, Mail, ShieldCheck, User, UserCog } from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";
import { authAPI } from "../services/api";

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="bg-white border border-slate-200 p-6 sm:p-7 flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 flex items-center justify-center bg-primary/10 border border-primary/20 shrink-0">
          <Icon size={18} className="text-primary" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function PatientSettings() {
  const { user, updateUser } = useAuth();
  const { success, error: showError } = useToast();

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
    });
  }, [user]);

  const hasProfileChanges = useMemo(() => {
    if (!user) return false;
    return ["name", "email", "phone", "bio"].some((key) => String(profileForm[key] || "") !== String(user[key] || ""));
  }, [profileForm, user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSaving(true);

    const payload = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
      bio: profileForm.bio,
    };

    try {
      const response = await authAPI.updateProfile(payload);
      const updatedUser = response.data.user;
      updateUser(updatedUser);
      setProfileForm({
        name: updatedUser?.name || "",
        email: updatedUser?.email || "",
        phone: updatedUser?.phone || "",
        bio: updatedUser?.bio || "",
      });
      success("Profile updated successfully.");
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Failed to update profile.";
      setProfileError(message);
      showError(message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);

    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      success("Password changed successfully.");
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Failed to change password.";
      setPasswordError(message);
      showError(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="bg-bg-dark min-h-screen">
      <div className="bg-bg-secondary border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-primary text-[11px] font-bold tracking-[0.3em] uppercase">
              <UserCog size={14} aria-hidden="true" /> Patient Settings
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Manage your profile
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed">
              Keep your contact details current and update your password without leaving the patient portal.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 flex flex-col gap-6">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <SectionCard
            icon={User}
            title="Profile details"
            description="Update the information the clinic uses to contact you and keep your patient record accurate."
          >
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
              {profileError && (
                <div className="flex items-center gap-3 p-4 border border-red-500/30 bg-red-500/10 text-red-400 text-sm" role="alert">
                  <ShieldCheck size={16} aria-hidden="true" />
                  {profileError}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-slate-500" htmlFor="patient-name">
                    Full Name
                  </label>
                  <Input
                    id="patient-name"
                    value={profileForm.name}
                    onChange={(value) => setProfileForm((prev) => ({ ...prev, name: value }))}
                    placeholder="Your name"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-slate-500" htmlFor="patient-email">
                    Email Address
                  </label>
                  <Input
                    id="patient-email"
                    type="email"
                    value={profileForm.email}
                    onChange={(value) => setProfileForm((prev) => ({ ...prev, email: value }))}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-slate-500" htmlFor="patient-phone">
                    Phone Number
                  </label>
                  <Input
                    id="patient-phone"
                    value={profileForm.phone}
                    onChange={(value) => setProfileForm((prev) => ({ ...prev, phone: value }))}
                    placeholder="03xx-xxxxxxx"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-slate-500" htmlFor="patient-bio">
                    Short Bio
                  </label>
                  <textarea
                    id="patient-bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell the clinic a bit about your recovery goals"
                    rows={4}
                    className="w-full bg-white/60 border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-500 outline-none focus:border-accent transition-colors duration-150 resize-y min-h-27.5"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <Button type="submit" loading={profileSaving} disabled={!hasProfileChanges}>
                  {profileSaving ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}
                  Save Profile
                </Button>
                <NavLink to="/dashboard" className="text-xs font-bold tracking-widest uppercase text-slate-500 hover:text-slate-900 transition-colors duration-150">
                  Back to dashboard
                </NavLink>
              </div>
            </form>
          </SectionCard>

          <div className="flex flex-col gap-6">
            <section className="bg-white border border-slate-200 p-6 sm:p-7 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 flex items-center justify-center bg-primary/10 border border-primary/20 shrink-0">
                  <Mail size={18} className="text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Account summary
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">Your current patient identity shown in the portal.</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-700">
                <p><span className="font-bold text-slate-900">Name:</span> {user?.name || "—"}</p>
                <p><span className="font-bold text-slate-900">Email:</span> {user?.email || "—"}</p>
                <p><span className="font-bold text-slate-900">Phone:</span> {user?.phone || "—"}</p>
                <p><span className="font-bold text-slate-900">Role:</span> {user?.role || "patient"}</p>
              </div>
            </section>

            <SectionCard
              icon={Lock}
              title="Change password"
              description="Keep your account secure by updating your password whenever you need to."
            >
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                {passwordError && (
                  <div className="flex items-center gap-3 p-4 border border-red-500/30 bg-red-500/10 text-red-400 text-sm" role="alert">
                    <ShieldCheck size={16} aria-hidden="true" />
                    {passwordError}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-slate-500" htmlFor="current-password">
                    Current Password
                  </label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(value) => setPasswordForm((prev) => ({ ...prev, currentPassword: value }))}
                    placeholder="Current password"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-slate-500" htmlFor="new-password">
                    New Password
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(value) => setPasswordForm((prev) => ({ ...prev, newPassword: value }))}
                    placeholder="At least 8 characters"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-slate-500" htmlFor="confirm-password">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))}
                    placeholder="Repeat new password"
                  />
                </div>

                <Button type="submit" loading={passwordSaving}>
                  {passwordSaving ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Lock size={14} aria-hidden="true" />}
                  Update Password
                </Button>
              </form>
            </SectionCard>
          </div>
        </div>
      </main>
    </div>
  );
}