import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  CalendarCheck,
  Clock3,
  Loader2,
  RefreshCw,
  Users,
  Dumbbell,
  PlayCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
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
  totalServices: 0,
  totalVideos: 0,
};

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="p-5 border border-slate-200 bg-white flex flex-col gap-3">
      <div className="w-9 h-9 flex items-center justify-center bg-primary/10 border border-primary/20">
        <Icon size={16} className="text-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="text-3xl font-black text-slate-900 leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {value}
        </p>
        <p className="text-xs font-bold mt-1 text-slate-500 uppercase tracking-widest">{label}</p>
        {sub && <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function getStatusTone(booking) {
  if (booking.paymentStatus === "under_review") return { label: "Payment review", tone: "text-blue-400 bg-blue-400/10 border-blue-400/20" };
  if (booking.status === "pending") return { label: "Needs confirmation", tone: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" };
  if (booking.status === "confirmed") return { label: "Confirmed", tone: "text-[accent] bg-[accent]/10 border-[accent]/20" };
  if (booking.status === "completed") return { label: "Completed", tone: "text-slate-400 bg-slate-400/10 border-slate-400/20" };
  return { label: "Cancelled", tone: "text-red-400 bg-red-400/10 border-red-400/20" };
}

function buildEventLabel(booking) {
  if (booking.paymentStatus === "under_review") {
    return `Payment proof uploaded for ${booking.patientName || "a patient"}`;
  }
  if (booking.status === "pending") {
    return `Pending booking from ${booking.patientName || "a patient"}`;
  }
  if (booking.status === "confirmed") {
    return `Confirmed ${booking.serviceName || "booking"} for ${booking.patientName || "a patient"}`;
  }
  if (booking.status === "completed") {
    return `${booking.patientName || "A patient"} completed a session`;
  }
  return `${booking.patientName || "A patient"} cancelled a booking`;
}

export default function AdminActivity() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      const [statsResult, bookingsResult, servicesResult] = await Promise.allSettled([
        api.get("/admin/stats"),
        api.get("/admin/bookings?limit=25&sort=newest"),
        api.get("/admin/services"),
      ]);

      if (cancelled) return;

      setStats(statsResult.status === "fulfilled" ? (statsResult.value.data.stats ?? EMPTY_STATS) : EMPTY_STATS);
      setBookings(bookingsResult.status === "fulfilled" ? (bookingsResult.value.data.bookings ?? []) : []);
      setServices(servicesResult.status === "fulfilled" ? (servicesResult.value.data.services ?? []) : []);

      const failures = [];
      if (statsResult.status === "rejected") failures.push("admin metrics");
      if (bookingsResult.status === "rejected") failures.push("recent bookings");
      if (servicesResult.status === "rejected") failures.push("services list");

      if (failures.length > 0) {
        setError(`Unable to load ${failures.join(", ")} right now.`);
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const queueItems = useMemo(() => {
    return bookings.filter((booking) => booking.status === "pending" || booking.paymentStatus === "under_review");
  }, [bookings]);

  const eventFeed = useMemo(() => {
    return bookings.slice(0, 10).map((booking) => ({
      id: booking._id,
      title: buildEventLabel(booking),
      meta: `${booking.serviceName || "Booking"} • ${booking.timeSlot || "Time TBC"}`,
      tone: getStatusTone(booking),
    }));
  }, [bookings]);

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-accent">Overview</span>
          <h1 className="mt-1 text-3xl font-black text-slate-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            ACTIVITY
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Live operational signals for the clinic team: pending work, recent booking events, and publishing status.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((value) => value + 1)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-xs font-bold tracking-widest uppercase text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-colors duration-150 self-start sm:self-auto"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 border border-amber-500/20 bg-amber-500/5 text-amber-300 text-sm">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, index) => <div key={index} className="h-32 bg-white border border-slate-200 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={CalendarCheck} label="Pending bookings" value={stats.pendingBookings} sub="Requires staff action" />
            <StatCard icon={Users} label="New patients" value={stats.newPatientsThisMonth} sub="This month" />
            <StatCard icon={CheckCircle2} label="Completed sessions" value={stats.completedSessions} sub="All time" />
            <StatCard icon={Activity} label="Current bookings" value={stats.totalBookings} sub="Operational volume" />
          </div>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
            <section className="border border-slate-200 bg-white p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-black text-slate-900 tracking-widest uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Action Queue
                </h2>
                <span className="text-[11px] text-slate-500">{queueItems.length} items</span>
              </div>

              {queueItems.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-600">No pending bookings or payment reviews right now.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {queueItems.map((booking) => {
                    const status = getStatusTone(booking);
                    return (
                      <div key={booking._id} className="border border-slate-200 p-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{booking.patientName || "Unnamed patient"}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{booking.serviceName || "Booking"} • {booking.date ? new Date(booking.date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "Date TBC"}</p>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${status.tone}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{booking.timeSlot || "Time TBC"} • {booking.paymentMethod || "payment pending"}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="border border-slate-200 bg-white p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-black text-slate-900 tracking-widest uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Recent activity
                </h2>
                <span className="text-[11px] text-slate-500">Latest 10</span>
              </div>

              <div className="flex flex-col gap-3">
                {eventFeed.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 border border-slate-200 bg-slate-50">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${item.tone.tone.includes("red") ? "bg-red-400" : item.tone.tone.includes("yellow") ? "bg-yellow-400" : item.tone.tone.includes("blue") ? "bg-blue-400" : item.tone.tone.includes("slate") ? "bg-slate-400" : "bg-[accent]"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">{item.meta}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border self-start ${item.tone.tone}`}>
                      {item.tone.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="border border-slate-200 bg-white p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black text-slate-900 tracking-widest uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Publishing status
              </h2>
              <span className="text-[11px] text-slate-500">Services and videos live for patients</span>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-4 border border-slate-200 bg-slate-50 flex items-center gap-3">
                <Dumbbell size={16} className="text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Services</p>
                  <p className="text-xs text-slate-600">{services.filter((service) => service.published !== false).length} live of {services.length} total</p>
                </div>
              </div>
              <div className="p-4 border border-slate-200 bg-slate-50 flex items-center gap-3">
                <PlayCircle size={16} className="text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Videos</p>
                  <p className="text-xs text-slate-600">Published content stays visible in the patient library</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <NavLink to="/admin/bookings" className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-text-primary text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors duration-150">
                Open bookings <ArrowRight size={12} />
              </NavLink>
              <NavLink to="/admin/patients" className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 text-xs font-bold tracking-widest uppercase hover:text-slate-900 hover:border-slate-400 transition-colors duration-150">
                Patient list <ArrowRight size={12} />
              </NavLink>
              <NavLink to="/admin/services" className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 text-xs font-bold tracking-widest uppercase hover:text-slate-900 hover:border-slate-400 transition-colors duration-150">
                Services <ArrowRight size={12} />
              </NavLink>
            </div>
          </section>
        </>
      )}
    </div>
  );
}