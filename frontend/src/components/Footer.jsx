import { NavLink } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  Twitter,
  Youtube,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useClinicSettings } from "../context/ClinicSettingsContext";

const CLINIC_LINKS = [
  { label: "Home", to: "/" },
  { label: "Services", to: "/services" },
  { label: "Video Library", to: "/videos" },
];

// Auth-gated links: shown only when user is logged in
const PATIENT_LINKS_AUTHED = [
  { label: "Book Appointment", to: "/book" },
  { label: "My Dashboard", to: "/dashboard" },
];

// Links shown to guests
const PATIENT_LINKS_GUEST = [
  { label: "Register", to: "/register" },
  { label: "Login", to: "/login" },
];

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Twitter, label: "Twitter / X", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
];

function parsePhoneNumbers(rawPhone) {
  if (!rawPhone) return [];
  return String(rawPhone)
    .split(/[|,/\\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toTelHref(phoneNumber) {
  return `tel:${String(phoneNumber || "").replace(/[^\d+]/g, "")}`;
}

function NavLinkList({ links }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {links.map(({ label, to }) => (
        <li key={to}>
          <NavLink
            to={to}
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors duration-150 flex items-center gap-1.5 group"
          >
            <span
              className="w-0 group-hover:w-3 h-px bg-primary transition-all duration-200 inline-block"
              aria-hidden="true"
            />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  const { user } = useAuth();
  const { settings } = useClinicSettings();
  const year = new Date().getFullYear();
  const isAdmin = user?.role === "admin";
  const phoneNumbers = parsePhoneNumbers(settings.phone);
  const patientLinks = user
    ? (isAdmin ? [{ label: "Admin Dashboard", to: "/admin" }] : PATIENT_LINKS_AUTHED)
    : PATIENT_LINKS_GUEST;

  return (
    <footer className="bg-bg-secondary border-t border-slate-200">

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <div className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[11px] text-primary tracking-[0.25em] uppercase font-semibold mb-1">
              {isAdmin ? "Admin Workspace" : "Ready to recover faster?"}
            </p>
            <h3
              className="text-2xl lg:text-3xl font-black text-slate-900 leading-tight"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800 }}
            >
              {isAdmin ? "MANAGE CLINIC OPERATIONS" : "BOOK YOUR SESSION TODAY"}
            </h3>
          </div>
          <NavLink
            to={user ? (isAdmin ? "/admin" : "/book") : "/register"}
            className="flex items-center gap-2 px-7 py-3 bg-primary text-bg-dark font-bold text-sm tracking-widest uppercase hover:bg-primary-dark transition-colors duration-200 shrink-0"
          >
            {user ? (isAdmin ? "Open Admin Panel" : "Schedule Now") : "Get Started"}
            <ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" />
          </NavLink>
        </div>
      </div>

      {/* ── Main footer grid ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">

        {/* Brand column */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <NavLink to="/" className="flex items-center gap-3 group select-none w-fit" aria-label={`${settings.clinicName} — Home`}>
            <div className="flex flex-col leading-none">
              <span
                className="text-slate-900 font-black text-lg"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                {settings.clinicName}
              </span>
              <span className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-medium">
                {settings.tagline}
              </span>
            </div>
          </NavLink>

          <p className="text-slate-500 text-sm leading-relaxed">
            Expert care by trained professionals with personalized treatment plans.
            Safe, effective rehabilitation to help you move better, feel better, and live better.
          </p>

          {/* Social links */}
          <div className="flex items-center gap-2 mt-1" aria-label="Social media links">
            {SOCIALS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                onClick={href === "#" ? (e) => e.preventDefault() : undefined}
                className="w-9 h-9 flex items-center justify-center border border-slate-300 text-slate-600 hover:text-primary hover:border-primary/40 transition-all duration-200"
              >
                <Icon size={15} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {/* Clinic links */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary">
            Clinic
          </h4>
          <NavLinkList links={CLINIC_LINKS} />
        </div>

        {/* Patient links — auth-aware */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary">
            {user ? (isAdmin ? "Admin" : "Patient") : "Get Started"}
          </h4>
          <NavLinkList links={patientLinks} />
        </div>

        {/* Contact column */}
        <div className="flex flex-col gap-4">
          <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary">
            Contact
          </h4>
          <ul className="flex flex-col gap-3">
            <li className="flex items-start gap-3 text-sm text-slate-500">
              <MapPin size={15} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <span>{settings.address}</span>
            </li>
            {phoneNumbers.length > 0 ? (
              phoneNumbers.map((phone, index) => (
                <li key={phone}>
                  <a
                    href={toTelHref(phone)}
                    className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 transition-colors duration-150"
                  >
                    {index === 0 ? <Phone size={15} className="text-primary shrink-0" aria-hidden="true" /> : <span className="w-3.75" aria-hidden="true" />}
                    {phone}
                  </a>
                </li>
              ))
            ) : (
              <li>
                <span className="flex items-center gap-3 text-sm text-slate-500">
                  <Phone size={15} className="text-primary shrink-0" aria-hidden="true" />
                  Not available
                </span>
              </li>
            )}
            <li>
              <a
                href={`mailto:${settings.clinicEmail}`}
                className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-900 transition-colors duration-150"
              >
                <Mail size={15} className="text-primary shrink-0" aria-hidden="true" />
                {settings.clinicEmail}
              </a>
            </li>
          </ul>

          {/* Hours badge */}
          <div className="mt-2 p-3 border border-slate-200 bg-white" aria-label="Clinic hours">
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-600 mb-1.5">
              Clinic Hours
            </p>
            <p className="text-sm text-slate-600">Mon – Fri &nbsp;·&nbsp; {settings.availability.Monday.from} - {settings.availability.Friday.to}</p>
            <p className="text-sm text-slate-600">Saturday &nbsp;·&nbsp; {settings.availability.Saturday.from} - {settings.availability.Saturday.to}</p>
            <p className="text-sm text-slate-600 mt-1">Sunday — {settings.availability.Sunday.open ? "Open" : "Closed"}</p>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div className="border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <span>© {year} {settings.clinicName}. All rights reserved.</span>
          <span className="tracking-wide">Your recovery is our priority.</span>
        </div>
      </div>
    </footer>
  );
}