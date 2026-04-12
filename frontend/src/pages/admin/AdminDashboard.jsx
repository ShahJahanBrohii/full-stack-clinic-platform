import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarCheck, Users, DollarSign, TrendingUp,
  Clock, CheckCircle2, XCircle, AlertCircle,
  ArrowUpRight, ChevronRight, Activity, Loader2,
} from "lucide-react";
import api from "../../services/api";

// ── Mock fallback data ────────────────────────────────────────────────────────
const MOCK_STATS = {
  totalBookings: 142, bookingsToday: 8, pendingBookings: 14,
  totalPatients: 238, newPatientsThisMonth: 19,
  totalRevenue: 487500, revenueThisMonth: 52000,
  completedSessions: 118, cancelledBookings: 10,
};

const MOCK_RECENT_BOOKINGS = [
  { _id: "b1", patientName: "Ali Hassan", serviceName: "Sports Injury Rehab", date: "2026-02-21", timeSlot: "10:30 AM", status: "confirmed", price: "PKR 3,500" },
  { _id: "b2", patientName: "Sana Mirza", serviceName: "Running Gait Analysis", date: "2026-02-21", timeSlot: "12:00 PM", status: "pending", price: "PKR 5,000" },
  { _id: "b3", patientName: "Bilal Rauf", serviceName: "Biomechanical Assessment", date: "2026-02-20", timeSlot: "03:30 PM", status: "completed", price: "PKR 4,500" },
  { _id: "b4", patientName: "Nadia Farooq", serviceName: "Strength & Reconditioning", date: "2026-02-20", timeSlot: "09:00 AM", status: "cancelled", price: "PKR 3,000" },
  { _id: "b5", patientName: "Kamran Akbar", serviceName: "FMS Screening", date: "2026-02-22", timeSlot: "11:15 AM", status: "confirmed", price: "PKR 2,500" },
];

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

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/admin/stats").catch(() => ({ data: { stats: MOCK_STATS } })),
      api.get("/admin/bookings?limit=5&sort=newest").catch(() => ({ data: { bookings: MOCK_RECENT_BOOKINGS } })),
    ]).then(([statsRes, bookingsRes]) => {
      setStats(statsRes.data.stats ?? MOCK_STATS);
      setRecentBookings(bookingsRes.data.bookings ?? MOCK_RECENT_BOOKINGS);
    }).finally(() => setLoading(false));
  }, []);

  const s = stats || MOCK_STATS;

  const TODAY_SCHEDULE = recentBookings.filter(b => b.status === "confirmed" || b.status === "pending").slice(0, 4);

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
          <NavLink to="/admin/bookings/new" className="flex items-center gap-2 px-5 py-2.5 bg-accent text-[#0F172A] text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors duration-200">
            <CalendarCheck size={13} strokeWidth={2.5} /> New Booking
          </NavLink>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-white border border-slate-200 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard icon={CalendarCheck} label="Total Bookings" value={s.totalBookings} sub={`${s.bookingsToday} today`} trend="+12%" accent />
            <KpiCard icon={Clock} label="Pending" value={s.pendingBookings} sub="Awaiting confirmation" />
            <KpiCard icon={Users} label="Total Patients" value={s.totalPatients} sub={`+${s.newPatientsThisMonth} this month`} trend="+8%" />
            <KpiCard icon={CheckCircle2} label="Completed" value={s.completedSessions} sub="Sessions done" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard icon={DollarSign} label="Total Revenue" value={`PKR ${(s.totalRevenue / 1000).toFixed(0)}k`} sub="All time" />
            <KpiCard icon={TrendingUp} label="This Month" value={`PKR ${(s.revenueThisMonth / 1000).toFixed(0)}k`} trend="+15%" />
            <KpiCard icon={XCircle} label="Cancelled" value={s.cancelledBookings} sub="This period" />
            <KpiCard icon={Activity} label="Active Services" value="8" sub="Listed publicly" />
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
                {(loading ? MOCK_RECENT_BOOKINGS : recentBookings).map((b) => {
                  const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={b._id} className="hover:bg-slate-50 transition-colors duration-100 group">
                      <td className="px-4 py-3 font-semibold text-slate-900 text-xs">{b.patientName}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-35">{b.serviceName}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {b.date} · {b.timeSlot}
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
