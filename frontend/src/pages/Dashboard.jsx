import { useEffect, useState, useContext, useMemo, useCallback } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarCheck,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  ChevronRight,
  PlayCircle,
  LayoutDashboard,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { BookingContext } from "../context/BookingContext";
import { useToast } from "../context/ToastContext";
import BookingCard from "../components/BookingCard";

// ── Greeting based on time of day ─────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatTimeSlot(slot) {
  if (!slot) return "—";
  const [hours, minutes] = String(slot).split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return slot;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({ icon: Icon, label, value, accent = false }) {
  return (
    <div
      className={`p-5 border flex flex-col gap-3 ${
        accent ? "bg-[#0EA5E9] border-[#0EA5E9]" : "bg-white border-slate-200"
      }`}
      aria-label={`${label}: ${value}`}
    >
      <Icon size={18} className={accent ? "text-[#0F172A]" : "text-[#0EA5E9]"} strokeWidth={2} aria-hidden="true" />
      <div>
        <p
          className={`text-2xl font-black leading-none ${accent ? "text-[#0F172A]" : "text-slate-900"}`}
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {value}
        </p>
        <p className={`text-xs mt-1 font-medium tracking-wide ${accent ? "text-[#0F172A]/60" : "text-slate-600"}`}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ── Quick action button ───────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, to, desc }) {
  return (
    <NavLink
      to={to}
      className="group flex items-center gap-4 p-4 border border-slate-200 hover:border-[#0EA5E9]/40 bg-white hover:bg-[#0EA5E9]/3 transition-all duration-200"
    >
      <div className="w-10 h-10 flex items-center justify-center bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 group-hover:bg-[#0EA5E9] group-hover:border-[#0EA5E9] transition-all duration-200 shrink-0">
        <Icon size={16} className="text-[#0EA5E9] group-hover:text-[#0F172A] transition-colors duration-200" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-xs text-slate-600 truncate">{desc}</p>
      </div>
      <ChevronRight size={14} className="text-slate-700 group-hover:text-[#0EA5E9] ml-auto shrink-0 transition-colors duration-200" aria-hidden="true" />
    </NavLink>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyBookings() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-4 border border-dashed border-slate-300 bg-white">
      <div className="w-12 h-12 flex items-center justify-center bg-[#0EA5E9]/10 border border-[#0EA5E9]/20">
        <CalendarCheck size={20} className="text-[#0EA5E9]" aria-hidden="true" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-900">No bookings yet</p>
        <p className="text-xs text-slate-600 mt-1">Start with your first session to get going.</p>
      </div>
      <NavLink
        to="/book"
        className="flex items-center gap-2 px-5 py-2.5 bg-[#0EA5E9] text-[#0F172A] text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors duration-200"
      >
        Book Now <ChevronRight size={13} aria-hidden="true" />
      </NavLink>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function BookingSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-label="Loading bookings" aria-busy="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-white border border-slate-200 animate-pulse" />
      ))}
    </div>
  );
}

const TAB_KEYS = ["upcoming", "completed", "cancelled", "all"];

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const {
    bookings,
    bookingsLoading,
    bookingError,
    fetchBookings,
    cancelBooking,
    rescheduleBooking,
  } = useContext(BookingContext);

  const [activeTab, setActiveTab] = useState("upcoming");

  // Stable fetch — won't cause infinite loop if fetchBookings is not memoized in context
  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run only on mount

  const handleRefresh = useCallback(() => fetchBookings(), [fetchBookings]);

  const handleCancelBooking = useCallback(async (bookingId) => {
    const result = await cancelBooking(bookingId);
    if (result?.success) {
      showSuccessToast("Appointment cancelled successfully.");
    } else {
      showErrorToast(result?.error || "Could not cancel appointment.");
    }
    return result;
  }, [cancelBooking, showSuccessToast, showErrorToast]);

  const handleRescheduleBooking = useCallback(async (bookingId, payload) => {
    const result = await rescheduleBooking(bookingId, payload);
    if (result?.success) {
      showSuccessToast("Appointment rescheduled successfully.");
    } else {
      showErrorToast(result?.error || "Could not reschedule appointment.");
    }
    return result;
  }, [rescheduleBooking, showSuccessToast, showErrorToast]);

  // Derive stats — memoized to avoid recomputing on every render
  const stats = useMemo(() => ({
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending:   bookings.filter((b) => b.status === "pending").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  }), [bookings]);

  // Tab filters — memoized
  const tabFilters = useMemo(() => ({
    upcoming:  bookings.filter((b) => b.status === "confirmed" || b.status === "pending"),
    completed: bookings.filter((b) => b.status === "completed"),
    cancelled: bookings.filter((b) => b.status === "cancelled"),
    all:       bookings,
  }), [bookings]);

  const TAB_LABELS = [
    { key: "upcoming",  label: "Upcoming",  count: tabFilters.upcoming.length },
    { key: "completed", label: "Completed", count: tabFilters.completed.length },
    { key: "cancelled", label: "Cancelled", count: tabFilters.cancelled.length },
    { key: "all",       label: "All",       count: bookings.length },
  ];

  const visibleBookings = tabFilters[activeTab] ?? [];
  const nextAppointment = tabFilters.upcoming[0];

  return (
    <div className="bg-[#F8FAFC] min-h-screen">

      {/* ── Dashboard header ─────────────────────────────────── */}
      <div className="bg-[#F1F5F9] border-b border-slate-200 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(#0EA5E9 1px, transparent 1px), linear-gradient(90deg, #0EA5E9 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <LayoutDashboard size={14} className="text-[#0EA5E9]" aria-hidden="true" />
                <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#0EA5E9]">
                  Patient Portal
                </span>
              </div>
              <h1
                className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {getGreeting()},
                <br />
                <span className="text-[#0EA5E9]">
                  {user?.name?.split(" ")[0]?.toUpperCase() || "PATIENT"}.
                </span>
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Manage your appointments, track progress, and access your exercises.
              </p>
            </div>

            {/* Book CTA */}
            <NavLink
              to="/book"
              className="flex items-center gap-2 px-6 py-3 bg-[#0EA5E9] text-[#0F172A] font-bold text-sm tracking-widest uppercase hover:bg-white transition-colors duration-200 self-start sm:self-center shrink-0"
            >
              <CalendarCheck size={15} strokeWidth={2.5} aria-hidden="true" />
              New Booking
            </NavLink>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">

        {/* ── Stats row ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="region" aria-label="Booking statistics">
          <StatTile icon={CalendarCheck} label="Upcoming"        value={stats.confirmed + stats.pending} accent />
          <StatTile icon={TrendingUp}    label="Completed"       value={stats.completed} />
          <StatTile icon={Clock}         label="Pending Payment" value={stats.pending} />
          <StatTile icon={XCircle}       label="Cancelled"       value={stats.cancelled} />
        </div>

        {/* ── Main content grid ────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── Left: Bookings ──────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Section header */}
            <div className="flex items-center justify-between">
              <h2
                className="text-2xl font-black text-slate-900"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                MY APPOINTMENTS
              </h2>
              <button
                onClick={handleRefresh}
                disabled={bookingsLoading}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#0EA5E9] transition-colors duration-150 font-semibold disabled:opacity-50"
                aria-label="Refresh bookings"
              >
                {bookingsLoading
                  ? <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                  : <RefreshCw size={13} aria-hidden="true" />}
                Refresh
              </button>
            </div>

            {/* Tabs */}
            <div
              className="flex gap-1 border-b border-slate-200 overflow-x-auto"
              role="tablist"
              aria-label="Filter appointments by status"
            >
              {TAB_LABELS.map(({ key, label, count }) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={activeTab === key}
                  aria-controls={`tab-panel-${key}`}
                  id={`tab-${key}`}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-2.5 text-xs font-bold tracking-widest uppercase whitespace-nowrap border-b-2 transition-all duration-150 ${
                    activeTab === key
                      ? "border-[#0EA5E9] text-[#0EA5E9]"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className={`ml-2 text-[10px] ${activeTab === key ? "text-[#0EA5E9]" : "text-slate-700"}`} aria-label={`${count} bookings`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab panel */}
            <div
              role="tabpanel"
              id={`tab-panel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
            >
              {/* Error state */}
              {bookingError && (
                <div
                  className="flex items-center gap-3 p-4 border border-red-500/20 bg-red-500/5 text-red-400 text-sm mb-3"
                  role="alert"
                >
                  <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
                  {bookingError}
                </div>
              )}

              {bookingsLoading && bookings.length === 0 ? (
                <BookingSkeleton />
              ) : visibleBookings.length === 0 ? (
                <EmptyBookings />
              ) : (
                <div className="flex flex-col gap-3">
                  {visibleBookings.map((booking) => (
                    <BookingCard
                      key={booking._id}
                      booking={booking}
                      onCancel={handleCancelBooking}
                      onReschedule={handleRescheduleBooking}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Sidebar ──────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Profile card */}
            <div className="p-5 border border-slate-200 bg-white flex flex-col gap-4">
              <h3
                className="text-sm font-black text-slate-900 tracking-wider uppercase"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                My Profile
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 shrink-0">
                  <User size={20} className="text-[#0EA5E9]" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{user?.name || "—"}</p>
                  <p className="text-xs text-slate-600">{user?.email || "—"}</p>
                  {user?.phone && <p className="text-xs text-slate-600">{user.phone}</p>}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-xs font-bold text-slate-500 tracking-wide">Total Bookings</span>
                  <span
                    className="text-lg font-black text-slate-900"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {bookings.length}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-500 tracking-wide">Sessions Done</span>
                  <span
                    className="text-lg font-black text-slate-900"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {stats.completed}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-col gap-2">
              <h3
                className="text-sm font-black text-slate-900 tracking-wider uppercase mb-1"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Quick Actions
              </h3>
              <QuickAction icon={CalendarCheck} label="Book Appointment" to="/book"     desc="Schedule a new session" />
              <QuickAction icon={PlayCircle}    label="Exercise Videos"  to="/videos"   desc="Access your rehab library" />
              <QuickAction icon={Activity}      label="View Services"    to="/services" desc="Browse all clinic offerings" />
            </div>

            {/* Next appointment callout */}
            {nextAppointment && (
              <div
                className="p-5 bg-[#0EA5E9]/5 border border-[#0EA5E9]/20 flex flex-col gap-3"
                aria-label="Your next appointment"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#0EA5E9]" aria-hidden="true" />
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#0EA5E9]">
                    Next Appointment
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{nextAppointment.serviceName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {nextAppointment.date
                      ? new Date(nextAppointment.date).toLocaleDateString("en-PK", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })
                      : "Date TBC"}
                    {nextAppointment.timeSlot && ` · ${formatTimeSlot(nextAppointment.timeSlot)}`}
                  </p>
                </div>
                {nextAppointment.consultationType === "online" && nextAppointment.sessionLink && (
                  <a
                    href={nextAppointment.sessionLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center px-3 py-2 bg-[#0EA5E9] text-[#0F172A] text-[10px] font-bold tracking-widest uppercase hover:bg-white transition-colors duration-150"
                  >
                    Join Online Session
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
