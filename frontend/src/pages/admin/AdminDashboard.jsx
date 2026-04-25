import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarCheck, Users, DollarSign, TrendingUp,
  Clock, CheckCircle2, XCircle, AlertCircle,
  ArrowUpRight, ChevronRight, Activity, Loader2,
} from "lucide-react";
import api from "../../services/api";

const EMPTY_STATS = {
  totalBookings: 0,
  bookingsToday: 0,
  pendingBookings: 0,
  totalPatients: 0,
  newPatientsThisMonth: 0,
  totalRevenue: 0,
  revenueThisMonth: 0,
  completedSessions: 0,
  cancelledBookings: 0,
};

const STATUS_CONFIG = {
  confirmed: { label: "Confirmed", color: "text-accent bg-accent/10", dot: "bg-accent" },
  pending: { label: "Pending", color: "text-yellow-400 bg-yellow-400/10", dot: "bg-yellow-400" },
  completed: { label: "Completed", color: "text-slate-400 bg-slate-400/10", dot: "bg-slate-400" },
  cancelled: { label: "Cancelled", color: "text-red-400 bg-red-400/10", dot: "bg-red-400" },
};

function KpiCard({ icon: Icon, label, value, sub, accent, trend }) {
  return (
    <div className={`p-5 border flex flex-col gap-4 ${accent ? "bg-gradient-primary border-primary text-white" : "bg-white border-slate-200"}`}>
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 flex items-center justify-center border ${accent ? "bg-white/10 border-white/20" : "bg-primary/10 border-primary/20"}`}>
          <Icon size={16} className={accent ? "text-white" : "text-primary"} />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-[10px] font-bold ${accent ? "text-white/70" : "text-primary"}`}>
            <TrendingUp size={10} /> {trend}
          </span>
        )}
      </div>
      <div>
        <p className={`text-3xl font-black leading-none ${accent ? "text-white" : "text-slate-900"}`}
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
        <p className={`text-xs font-bold mt-1 ${accent ? "text-white/70" : "text-slate-500"}`}>{label}</p>
        {sub && <p className={`text-[10px] mt-0.5 ${accent ? "text-white/50" : "text-slate-700"}`}>{sub}</p>}
      </div>
    </div>
  );
}

function formatBookingDateTime(booking) {
  const dateValue = booking?.date ? new Date(booking.date) : null;
  const dateLabel = dateValue && !Number.isNaN(dateValue.getTime())
    ? dateValue.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
    : "Date TBC";
  const timeLabel = booking?.timeSlot || "Time TBC";
  return `${dateLabel} · ${timeLabel}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setLoadError("");

      const [statsResult, bookingsResult] = await Promise.allSettled([
        api.get("/admin/stats"),
        api.get("/admin/bookings?limit=5&sort=newest"),
      ]);

      if (cancelled) return;

      const nextStats = statsResult.status === "fulfilled"
        ? (statsResult.value.data.stats ?? EMPTY_STATS)
        : EMPTY_STATS;

      const nextBookings = bookingsResult.status === "fulfilled"
        ? (bookingsResult.value.data.bookings ?? [])
        : [];

      setStats(nextStats);
      setRecentBookings(nextBookings);

      const failures = [];
      if (statsResult.status === "rejected") failures.push("summary metrics");
      if (bookingsResult.status === "rejected") failures.push("recent bookings");
      if (failures.length > 0) {
        setLoadError(`Unable to load ${failures.join(" and ")} right now.`);
      }

      setLastUpdated(new Date());

      setLoading(false);
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const s = stats || EMPTY_STATS;

  const TODAY_SCHEDULE = recentBookings.filter(b => b.status === "confirmed" || b.status === "pending").slice(0, 4);

  const operationalFocus = useMemo(() => {
    const items = [];

    if (s.pendingBookings > 0) {
      items.push({
        key: "pending",
        title: `${s.pendingBookings} bookings need confirmation`,
        description: "Confirm pending requests to reduce no-shows and confusion.",
        to: "/admin/bookings",
        cta: "Review Bookings",
      });
    }

    if (s.cancelledBookings > 0) {
      items.push({
        key: "cancelled",
        title: `${s.cancelledBookings} cancellations this period`,
        description: "Check cancellation trends and follow up with affected patients.",
        to: "/admin/analytics",
        cta: "Open Analytics",
      });
    }

    if (s.newPatientsThisMonth > 0) {
      items.push({
        key: "patients",
        title: `${s.newPatientsThisMonth} new patients this month`,
        description: "Ensure onboarding messages and first-session availability stay smooth.",
        to: "/admin/patients",
        cta: "View Patients",
      });
    }

    if (items.length === 0) {
      items.push({
        key: "clear",
        title: "Operations are stable",
        description: "No urgent admin actions detected right now.",
        to: "/admin/analytics",
        cta: "Check Reports",
      });
    }

    return items.slice(0, 3);
  }, [s.pendingBookings, s.cancelledBookings, s.newPatientsThisMonth]);

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-accent">Admin Overview</span>
          <h1 className="mt-1 text-3xl font-black text-slate-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            DASHBOARD
          </h1>
        </div>
        <div className="flex gap-2">
          <NavLink to="/admin/bookings/new" className="flex items-center gap-2 px-5 py-2.5 bg-accent text-text-primary text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors duration-200">
            <CalendarCheck size={13} strokeWidth={2.5} /> New Booking
          </NavLink>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-3 p-4 border border-amber-500/20 bg-amber-500/5 text-amber-300 text-sm">
          <div className="flex flex-col gap-1">
            <span>{loadError}</span>
            {lastUpdated && (
              <span className="text-[11px] text-amber-200/80">
                Last refresh: {lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <button
            onClick={() => setRefreshKey((v) => v + 1)}
            className="text-xs font-bold tracking-widest uppercase text-primary hover:text-text-primary transition-colors duration-150"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && (
        <div className="grid md:grid-cols-3 gap-3" role="region" aria-label="Operational focus">
          {operationalFocus.map((item) => (
            <div key={item.key} className="p-4 border border-slate-200 bg-white flex flex-col gap-3">
              <p className="text-sm font-bold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-600">{item.description}</p>
              <NavLink
                to={item.to}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-accent hover:text-white transition-colors duration-150"
              >
                {item.cta}
                <ChevronRight size={11} />
              </NavLink>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-white border border-slate-200 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard icon={CalendarCheck} label="Total Bookings" value={s.totalBookings} sub={`${s.bookingsToday} today`} accent />
            <KpiCard icon={Clock} label="Pending" value={s.pendingBookings} sub="Awaiting confirmation" />
            <KpiCard icon={Users} label="Total Patients" value={s.totalPatients} sub={`+${s.newPatientsThisMonth} this month`} />
            <KpiCard icon={CheckCircle2} label="Completed" value={s.completedSessions} sub="Sessions done" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard icon={DollarSign} label="Total Revenue" value={`PKR ${(s.totalRevenue / 1000).toFixed(0)}k`} sub="All time" />
            <KpiCard icon={TrendingUp} label="This Month" value={`PKR ${(s.revenueThisMonth / 1000).toFixed(0)}k`} sub="Current month" />
            <KpiCard icon={XCircle} label="Cancelled" value={s.cancelledBookings} sub="This period" />
            <KpiCard icon={Activity} label="Active Services" value={s.totalServices} sub="Listed publicly" />
          </div>
        </>
      )}

      {/* Content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent bookings table */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>RECENT BOOKINGS</h2>
            <NavLink to="/admin/bookings" className="flex items-center gap-1 text-xs text-accent hover:text-white font-bold tracking-widest uppercase transition-colors duration-150">
              View All <ArrowUpRight size={12} />
            </NavLink>
          </div>
          <div className="border border-slate-200 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Patient", "Service", "Date / Time", "Status", "Price"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black tracking-widest uppercase text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-600">
                      No recent bookings found. New bookings will appear here.
                    </td>
                  </tr>
                ) : recentBookings.map((b) => {
                  const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={b._id} className="hover:bg-slate-50 transition-colors duration-100 group">
                      <td className="px-4 py-3 font-semibold text-slate-900 text-xs">{b.patientName}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-35">{b.serviceName}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {formatBookingDateTime(b)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 w-fit text-[10px] font-bold px-2 py-0.5 ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs font-semibold">{b.price}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          {/* Today's schedule */}
          <div className="border border-slate-200 bg-white p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>TODAY'S SCHEDULE</h3>
              <span className="text-[10px] text-slate-600">{new Date().toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" })}</span>
            </div>
            <div className="flex flex-col gap-2">
              {TODAY_SCHEDULE.length === 0 ? (
                <p className="text-xs text-slate-600 py-4 text-center">No appointments today.</p>
              ) : TODAY_SCHEDULE.map((b) => {
                const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                return (
                  <div key={b._id} className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200">
                    <div className={`w-1.5 h-8 ${sc.dot} shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{b.patientName}</p>
                      <p className="text-[10px] text-slate-600 truncate">{b.timeSlot} · {b.serviceName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick links */}
          <div className="border border-slate-200 bg-white p-4 flex flex-col gap-2">
            <h3 className="text-sm font-black text-slate-900 mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>QUICK ACTIONS</h3>
            {[
              { label: "Manage Bookings", to: "/admin/bookings" },
              { label: "Add New Service", to: "/admin/services" },
              { label: "Upload Video", to: "/admin/videos" },
              { label: "View All Patients", to: "/admin/patients" },
              { label: "Analytics Report", to: "/admin/analytics" },
              { label: "Clinic Settings", to: "/admin/settings" },
            ].map(({ label, to }) => (
              <NavLink key={to} to={to}
                className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 hover:text-accent hover:bg-accent/5 border border-transparent hover:border-accent/20 transition-all duration-150">
                {label} <ChevronRight size={11} />
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
