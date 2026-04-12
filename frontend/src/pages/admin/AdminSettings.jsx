import { useState } from "react";
import {
  Save, Loader2, CheckCircle2, AlertCircle,
  User, Clock, Bell, Lock, Globe, Building,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TABS = [
  { id: "clinic", label: "Clinic Info", icon: Building },
  { id: "availability", label: "Availability", icon: Clock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "profile", label: "My Profile", icon: User },
  { id: "password", label: "Password", icon: Lock },
];

function SettingRow({ label, desc, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 py-5 border-b border-white/5">
      <div className="max-w-xs">
        <p className="text-sm font-bold text-white">{label}</p>
        {desc && <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{desc}</p>}
      </div>
      <div className="sm:min-w-65">{children}</div>
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-slate-700 outline-none focus:border-[accent] transition-colors duration-150" />
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} aria-checked={checked} role="switch"
      className={`relative w-10 h-5 shrink-0 transition-colors duration-200 ${checked ? "bg-[accent]" : "bg-white/10"}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[#0F172A] transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function SaveBar({ onSave, saving, saved, error }) {
  return (
    <div className="flex items-center justify-between pt-4 mt-2">
      <div>
        {saved && <p className="text-xs text-[accent] flex items-center gap-1.5"><CheckCircle2 size={12} /> Changes saved</p>}
        {error && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle size={12} /> {error}</p>}
      </div>
      <button onClick={onSave} disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-[accent] text-[#0F172A] text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50">
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Changes
      </button>
    </div>
  );
}

// ── Section: Clinic Info ───────────────────────────────────────────────────────
function ClinicInfo() {
  const [form, setForm] = useState({
    clinicName: "Ali's Clinic", tagline: "Sports Medicine & Rehabilitation",
    address: "123 Recovery Road, Sports District, Karachi",
    phone: "+92 300 123 4567", email: "info@apexclinic.pk",
    website: "https://apexclinic.pk", currency: "PKR",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const f = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true); setSaved(false); setError("");
    await api.put("/admin/settings/clinic", form).catch(() => {});
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <SettingRow label="Clinic Name" desc="Displayed across the website and booking confirmations.">
        <Input value={form.clinicName} onChange={f("clinicName")} />
      </SettingRow>
      <SettingRow label="Tagline" desc="Short descriptor shown in the site header.">
        <Input value={form.tagline} onChange={f("tagline")} />
      </SettingRow>
      <SettingRow label="Physical Address" desc="Shown in the footer and contact section.">
        <textarea value={form.address} onChange={(e) => f("address")(e.target.value)} rows={2}
          className="w-full bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors resize-none" />
      </SettingRow>
      <SettingRow label="Contact Phone" desc="Clickable phone link in the footer.">
        <Input value={form.phone} onChange={f("phone")} placeholder="+92 300 000 0000" />
      </SettingRow>
      <SettingRow label="Contact Email" desc="Used for enquiries and reply-to in booking emails.">
        <Input value={form.email} onChange={f("email")} type="email" />
      </SettingRow>
      <SettingRow label="Website URL">
        <Input value={form.website} onChange={f("website")} />
      </SettingRow>
      <SettingRow label="Currency" desc="Used for displaying prices throughout the site.">
        <select value={form.currency} onChange={(e) => f("currency")(e.target.value)}
          className="w-full bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors appearance-none">
          <option value="PKR">PKR — Pakistani Rupee</option>
          <option value="USD">USD — US Dollar</option>
          <option value="GBP">GBP — British Pound</option>
        </select>
      </SettingRow>
      <SaveBar onSave={save} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Section: Availability ──────────────────────────────────────────────────────
function Availability() {
  const [schedule, setSchedule] = useState({
    Monday: { open: true, from: "09:00", to: "19:00" },
    Tuesday: { open: true, from: "09:00", to: "19:00" },
    Wednesday: { open: true, from: "09:00", to: "19:00" },
    Thursday: { open: true, from: "09:00", to: "19:00" },
    Friday: { open: true, from: "09:00", to: "19:00" },
    Saturday: { open: true, from: "10:00", to: "16:00" },
    Sunday: { open: false, from: "", to: "" },
  });
  const [slotDuration, setSlotDuration] = useState("45");
  const [bufferTime, setBufferTime] = useState("15");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleDay = (day) => setSchedule((p) => ({ ...p, [day]: { ...p[day], open: !p[day].open } }));
  const updateTime = (day, key, val) => setSchedule((p) => ({ ...p, [day]: { ...p[day], [key]: val } }));

  const save = async () => {
    setSaving(true);
    await api.put("/admin/settings/availability", { schedule, slotDuration, bufferTime }).catch(() => {});
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      {/* Day schedule */}
      <div className="flex flex-col gap-2 mb-6">
        <p className="text-xs font-black tracking-widest uppercase text-slate-600 mb-2">Weekly Schedule</p>
        {DAYS.map((day) => {
          const d = schedule[day];
          return (
            <div key={day} className={`flex items-center gap-4 p-3 border transition-all duration-150 ${d.open ? "border-white/8 bg-white/2" : "border-white/5 opacity-50"}`}>
              <Toggle checked={d.open} onChange={() => toggleDay(day)} />
              <span className="text-sm font-bold text-white w-24 shrink-0">{day}</span>
              {d.open ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="time" value={d.from} onChange={(e) => updateTime(day, "from", e.target.value)}
                    className="bg-white/3 border border-white/10 px-2 py-1.5 text-xs text-white outline-none focus:border-[accent] transition-colors" />
                  <span className="text-slate-600 text-xs">to</span>
                  <input type="time" value={d.to} onChange={(e) => updateTime(day, "to", e.target.value)}
                    className="bg-white/3 border border-white/10 px-2 py-1.5 text-xs text-white outline-none focus:border-[accent] transition-colors" />
                </div>
              ) : (
                <span className="text-xs text-slate-700 italic">Closed</span>
              )}
            </div>
          );
        })}
      </div>

      <SettingRow label="Appointment Slot Duration" desc="How long each booking slot lasts (minutes).">
        <select value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)}
          className="w-full bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors appearance-none">
          {["30", "45", "60", "75", "90"].map((v) => <option key={v} value={v}>{v} minutes</option>)}
        </select>
      </SettingRow>
      <SettingRow label="Buffer Between Appointments" desc="Gap between sessions (minutes).">
        <select value={bufferTime} onChange={(e) => setBufferTime(e.target.value)}
          className="w-full bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors appearance-none">
          {["0", "10", "15", "20", "30"].map((v) => <option key={v} value={v}>{v} minutes</option>)}
        </select>
      </SettingRow>
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── Section: Notifications ─────────────────────────────────────────────────────
function Notifications() {
  const [settings, setSettings] = useState({
    bookingConfirmation: true, bookingReminder: true, reminderHours: "24",
    cancellationAlert: true, newPatientAlert: true, paymentReceipt: true,
    adminDailyDigest: false, smsEnabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const f = (key) => (val) => setSettings((p) => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true);
    await api.put("/admin/settings/notifications", settings).catch(() => {});
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const items = [
    { key: "bookingConfirmation", label: "Booking Confirmation Emails", desc: "Send confirmation to patient when booking is made." },
    { key: "bookingReminder", label: "Appointment Reminders", desc: "Remind patient before their appointment." },
    { key: "cancellationAlert", label: "Cancellation Alerts", desc: "Notify admin when a patient cancels." },
    { key: "newPatientAlert", label: "New Patient Registration", desc: "Alert admin when a new patient registers." },
    { key: "paymentReceipt", label: "Payment Receipts", desc: "Send payment confirmation to patients." },
    { key: "adminDailyDigest", label: "Daily Summary Digest", desc: "Receive a daily email summary of clinic activity." },
    { key: "smsEnabled", label: "SMS Notifications", desc: "Enable SMS reminders (requires SMS provider config)." },
  ];

  return (
    <div>
      {items.map(({ key, label, desc }) => (
        <SettingRow key={key} label={label} desc={desc}>
          <Toggle checked={settings[key]} onChange={f(key)} />
        </SettingRow>
      ))}
      <SettingRow label="Reminder Lead Time" desc="How many hours before appointment to send reminder.">
        <select value={settings.reminderHours} onChange={(e) => f("reminderHours")(e.target.value)}
          className="w-full bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors appearance-none">
          {["2", "6", "12", "24", "48"].map((v) => <option key={v} value={v}>{v} hours before</option>)}
        </select>
      </SettingRow>
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── Section: Admin Profile ─────────────────────────────────────────────────────
function AdminProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "", bio: user?.bio || "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const f = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true);
    await api.put("/auth/profile", form).catch(() => {});
    updateUser(form);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <SettingRow label="Full Name"><Input value={form.name} onChange={f("name")} /></SettingRow>
      <SettingRow label="Email Address"><Input value={form.email} onChange={f("email")} type="email" /></SettingRow>
      <SettingRow label="Phone Number"><Input value={form.phone} onChange={f("phone")} placeholder="+92 300 000 0000" /></SettingRow>
      <SettingRow label="Bio / Credentials" desc="Displayed on the about/team page.">
        <textarea value={form.bio} onChange={(e) => f("bio")(e.target.value)} rows={3}
          className="w-full bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors resize-none placeholder-slate-700"
          placeholder="e.g. BSc Physical Education & Sports Sciences, Chartered Physiotherapist…" />
      </SettingRow>
      <SaveBar onSave={save} saving={saving} saved={saved} />
    </div>
  );
}

// ── Section: Password ──────────────────────────────────────────────────────────
function PasswordChange() {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const f = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  const save = async () => {
    setError("");
    if (form.newPass.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (form.newPass !== form.confirm) { setError("Passwords do not match."); return; }
    setSaving(true);
    const result = await api.put("/auth/password", { currentPassword: form.current, newPassword: form.newPass }).catch((e) => ({ error: e.response?.data?.message || "Failed." }));
    setSaving(false);
    if (result?.error) { setError(result.error); return; }
    setSaved(true); setForm({ current: "", newPass: "", confirm: "" });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <SettingRow label="Current Password"><Input value={form.current} onChange={f("current")} type="password" placeholder="••••••••" /></SettingRow>
      <SettingRow label="New Password"><Input value={form.newPass} onChange={f("newPass")} type="password" placeholder="Min. 8 characters" /></SettingRow>
      <SettingRow label="Confirm New Password"><Input value={form.confirm} onChange={f("confirm")} type="password" placeholder="Repeat new password" /></SettingRow>
      <SaveBar onSave={save} saving={saving} saved={saved} error={error} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("clinic");

  const SECTIONS = { clinic: ClinicInfo, availability: Availability, notifications: Notifications, profile: AdminProfile, password: PasswordChange };
  const ActiveSection = SECTIONS[activeTab];

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div>
        <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[accent]">Configuration</span>
        <h1 className="mt-1 text-3xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>SETTINGS</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab sidebar */}
        <aside className="lg:w-48 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold tracking-widest uppercase whitespace-nowrap transition-all duration-150 border-b-2 lg:border-b-0 lg:border-l-2 ${
                activeTab === id ? "border-[accent] text-[accent] bg-[accent]/5" : "border-transparent text-slate-500 hover:text-white"
              }`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="flex-1 border border-white/8 bg-white/1 p-6 lg:p-8">
          <ActiveSection />
        </div>
      </div>
    </div>
  );
}

