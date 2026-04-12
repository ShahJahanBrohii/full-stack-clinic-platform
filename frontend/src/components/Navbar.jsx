import { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Activity,
  ChevronRight,
  User,
  LogOut,
  LayoutDashboard,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Services", to: "/services" },
  { label: "Videos", to: "/videos" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Backdrop shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = useCallback(() => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  }, [logout, navigate]);

  const isAdmin = user?.role === "admin";

  return (
    <>
      {/* ─── Top accent line ─────────────────────────────────────── */}
      <div className="h-0.75 w-full bg-linear-to-r from-primary via-accent to-transparent" />

      {/* ─── Main navbar ─────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#F8FAFC]/95 backdrop-blur-md border-b border-slate-200 shadow-sm"
            : "bg-[#F8FAFC]"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" role="navigation" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* ── Logo ───────────────────────────────────────────── */}
            <NavLink
              to="/"
              className="flex items-center gap-3 group select-none"
              aria-label="Ali's Clinic — Home"
            >
              <div className="w-9 h-9 flex items-center justify-center bg-gradient-primary group-hover:bg-accent transition-colors duration-200">
                <Activity size={18} strokeWidth={2.5} className="text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span
                  className="text-slate-900 font-black text-lg tracking-tight"
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, letterSpacing: "-0.02em" }}
                >
                  Ali's<span className="text-accent">Clinic</span>
                </span>
                <span className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-medium">
                  Sports Medicine
                </span>
              </div>
            </NavLink>

            {/* ── Desktop nav links ───────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-1" role="list">
              {NAV_LINKS.map(({ label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  role="listitem"
                  className={({ isActive }) =>
                    `relative px-4 py-2 text-sm font-semibold tracking-widest uppercase transition-colors duration-200 group ${
                      isActive ? "text-accent" : "text-slate-600 hover:text-slate-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {label}
                      <span
                        className={`absolute bottom-0 left-4 right-4 h-0.5 bg-accent transition-transform duration-200 origin-left ${
                          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                        }`}
                        aria-hidden="true"
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* ── Desktop right section ───────────────────────────── */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <>
                  {/* Admin shortcut — only visible to admins */}
                  {isAdmin && (
                    <NavLink
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-2 border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase hover:bg-primary/10 transition-colors duration-200"
                    >
                      <ShieldCheck size={13} strokeWidth={2.5} />
                      Admin
                    </NavLink>
                  )}

                  {/* Book CTA (patients only) */}
                  {!isAdmin && (
                    <NavLink
                      to="/book"
                      className="flex items-center gap-2 px-5 py-2 bg-gradient-primary text-white text-sm font-bold tracking-widest uppercase hover:shadow-glow-primary transition-all duration-200 rounded-lg"
                    >
                      <CalendarCheck size={15} strokeWidth={2.5} />
                      Book Now
                    </NavLink>
                  )}

                  {/* User menu */}
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className="flex items-center gap-2 pl-2 pr-3 py-1.5 border border-slate-200 hover:border-primary/50 transition-colors duration-200 group"
                      aria-haspopup="menu"
                      aria-expanded={userMenuOpen}
                      aria-label="User menu"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <User size={14} className="text-primary" aria-hidden="true" />
                      </div>
                      <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors duration-200 font-medium">
                        {user.name?.split(" ")[0] || "Patient"}
                      </span>
                      <ChevronRight
                        size={13}
                        className={`text-slate-500 transition-transform duration-200 ${userMenuOpen ? "rotate-90" : ""}`}
                        aria-hidden="true"
                      />
                    </button>

                    {/* Dropdown */}
                    {userMenuOpen && (
                      <div
                        className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-xl py-1 z-50"
                        role="menu"
                        aria-label="User options"
                      >
                        <NavLink
                          to="/dashboard"
                          role="menuitem"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors duration-150"
                        >
                          <LayoutDashboard size={14} className="text-[#0EA5E9]" aria-hidden="true" />
                          My Dashboard
                        </NavLink>
                        <div className="my-1 border-t border-slate-100" role="separator" />
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-red-600 hover:bg-slate-50 transition-colors duration-150"
                        >
                          <LogOut size={14} aria-hidden="true" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold tracking-widest uppercase text-slate-700 hover:text-slate-900 transition-colors duration-200"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="flex items-center gap-2 px-5 py-2 bg-[#0EA5E9] text-[#0F172A] text-sm font-bold tracking-widest uppercase hover:bg-[#0284C7] transition-all duration-200 rounded-lg"
                  >
                    Create Account
                    <ChevronRight size={14} strokeWidth={2.5} aria-hidden="true" />
                  </NavLink>
                </>
              )}
            </div>

            {/* ── Mobile hamburger ────────────────────────────────── */}
            <button
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors duration-200"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </nav>

        {/* ─── Mobile drawer ──────────────────────────────────────── */}
        <div
          id="mobile-menu"
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileOpen ? "max-h-150 opacity-100" : "max-h-0 opacity-0"
          }`}
          aria-hidden={!mobileOpen}
        >
          <div className="border-t border-slate-200 bg-[#F8FAFC] px-4 pt-4 pb-6 flex flex-col gap-1">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 text-sm font-bold tracking-widest uppercase border-l-2 transition-all duration-150 ${
                    isActive
                      ? "border-accent text-accent bg-accent/5"
                      : "border-transparent text-slate-700 hover:text-slate-900 hover:border-slate-300"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    <ChevronRight
                      size={14}
                      className={isActive ? "text-accent" : "text-slate-600"}
                      aria-hidden="true"
                    />
                  </>
                )}
              </NavLink>
            ))}

            <div className="my-3 border-t border-slate-200" />

            {user ? (
              <>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    className="flex items-center justify-between px-4 py-3 text-sm text-primary hover:bg-primary/5 transition-colors duration-150 border border-primary/20"
                  >
                    <span className="flex items-center gap-3 font-bold tracking-widest uppercase text-xs">
                      <ShieldCheck size={15} aria-hidden="true" />
                      Admin Panel
                    </span>
                    <ChevronRight size={14} className="text-primary/50" aria-hidden="true" />
                  </NavLink>
                )}

                {!isAdmin && (
                  <NavLink
                    to="/book"
                    className="flex items-center justify-center gap-2 py-3 bg-gradient-primary text-white text-sm font-bold tracking-widest uppercase hover:shadow-glow-primary transition-all duration-200"
                  >
                    <CalendarCheck size={15} strokeWidth={2.5} aria-hidden="true" />
                    Book Appointment
                  </NavLink>
                )}

                <NavLink
                  to="/dashboard"
                  className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 hover:text-slate-900 transition-colors duration-150"
                >
                  <span className="flex items-center gap-3">
                    <LayoutDashboard size={15} className="text-accent" aria-hidden="true" />
                    My Dashboard
                  </span>
                  <ChevronRight size={14} className="text-slate-600" aria-hidden="true" />
                </NavLink>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:text-red-600 transition-colors duration-150"
                >
                  <LogOut size={15} aria-hidden="true" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 mt-1">
                <NavLink
                  to="/login"
                  className="flex-1 text-center py-3 border border-slate-300 text-sm font-bold tracking-widest uppercase text-slate-700 hover:text-slate-900 hover:border-slate-400 transition-all duration-150"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="flex-1 text-center py-3 bg-[#0EA5E9] text-[#0F172A] text-sm font-bold tracking-widest uppercase hover:bg-[#0284C7] transition-all duration-200"
                >
                  Create Account
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}