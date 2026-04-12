import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  CalendarCheck,
  ArrowUpRight,
  Activity,
  Loader2,
} from "lucide-react";
import api from "../../services/api";

function parseMoney(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const match = String(value).replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatMonthLabel(year, month) {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en", { month: "short" });
}

function BarChart({ data, labelKey, valueKey, color = "#0EA5E9", height = 160 }) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const value = Number(d[valueKey]) || 0;
        const pct = (value / max) * 100;
        return (
          <div key={`${d[labelKey]}-${i}`} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
              {value.toLocaleString()}
            </span>
            <div className="w-full relative flex flex-col justify-end" style={{ height: height - 24 }}>
              <div
                className="w-full transition-all duration-500 ease-out"
                style={{ height: `${pct}%`, backgroundColor: color, opacity: 0.9 }}
              />
            </div>
            <span className="text-[9px] text-slate-600 whitespace-nowrap">{d[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

function Sparkline({ data, color = "#0EA5E9", width = 80, height = 30 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function MetricCard({ icon: Icon, label, value, hint, sparkData }) {
  return (
    <div className="p-5 border border-white/8 bg-white/2 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 flex items-center justify-center bg-[accent]/10 border border-[accent]/20">
          <Icon size={16} className="text-[accent]" />
        </div>
        <Sparkline data={sparkData} />
      </div>
      <div>
        <p className="text-3xl font-black text-white leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {value}
        </p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </div>
      {hint && (
        <div className="flex items-center gap-1 text-xs font-bold text-[accent]">
          <ArrowUpRight size={13} /> {hint}
        </div>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState("6m");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    api
      .get(`/admin/analytics?period=${period}`)
      .then((response) => {
        if (!cancelled) setAnalytics(response.data || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setAnalytics(null);
        setError(err.response?.data?.message || "Failed to load analytics.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  const derived = useMemo(() => {
    const summary = analytics?.summary || {};
    const monthlyTrendRaw = Array.isArray(analytics?.monthlyTrend) ? analytics.monthlyTrend : [];
    const bookingsByStatusRaw = Array.isArray(analytics?.bookingsByStatus) ? analytics.bookingsByStatus : [];
    const topServicesRaw = Array.isArray(analytics?.topServices) ? analytics.topServices : [];

    const monthlyBookings = monthlyTrendRaw
      .map((row) => ({
        month: formatMonthLabel(row?._id?.year, row?._id?.month),
        bookings: Number(row?.count || 0),
      }))
      .slice(-6);

    const avgSessionValue =
      Number(summary.totalBookings) > 0
        ? Math.round(Number(summary.totalRevenue || 0) / Number(summary.totalBookings || 1))
        : 0;

    const monthlyRevenueRaw = Array.isArray(analytics?.monthlyRevenueTrend)
      ? analytics.monthlyRevenueTrend
      : [];

    const monthlyRevenue = monthlyRevenueRaw
      .map((row) => ({
        month: formatMonthLabel(row?._id?.year, row?._id?.month),
        revenue: Math.round((Number(row?.revenue || 0)) / 1000),
      }))
      .slice(-6);

    const statusLookup = bookingsByStatusRaw.reduce((acc, row) => {
      acc[String(row?._id || "unknown")] = Number(row?.count || 0);
      return acc;
    }, {});

    const totalStatus = Object.values(statusLookup).reduce((sum, value) => sum + value, 0) || 1;

    const statusDistribution = [
      { label: "Confirmed", value: statusLookup.confirmed || 0, color: "#0EA5E9" },
      { label: "Completed", value: statusLookup.completed || 0, color: "#64748b" },
      { label: "Pending", value: statusLookup.pending || 0, color: "#facc15" },
      { label: "Cancelled", value: statusLookup.cancelled || 0, color: "#f87171" },
    ].map((item) => ({
      ...item,
      pct: Math.round((item.value / totalStatus) * 100),
    }));

    const topServices = topServicesRaw.map((entry) => {
      const service = entry?.service || {};
      const servicePrice = parseMoney(service.price);
      const bookedCount = Number(entry?.bookedCount || 0);
      const revenue = Math.round(servicePrice * bookedCount);
      return {
        name: service.title || service.name || "Service",
        bookings: bookedCount,
        revenue,
      };
    });

    const totalTopBookings = topServices.reduce((sum, item) => sum + item.bookings, 0) || 1;

    const topServiceRows = topServices.map((item) => ({
      ...item,
      pct: Math.round((item.bookings / totalTopBookings) * 100),
    }));

    return {
      summary,
      monthlyBookings,
      monthlyRevenue,
      statusDistribution,
      topServiceRows,
      avgSessionValue,
    };
  }, [analytics]);

  const s = derived.summary;

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[accent]">Reporting</span>
          <h1 className="mt-1 text-3xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            ANALYTICS
          </h1>
        </div>
        <div className="flex gap-1">
          {["1m", "3m", "6m", "1y"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase border transition-all duration-150 ${
                period === p ? "bg-[accent] border-[accent] text-[#0F172A]" : "border-white/10 text-slate-500 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-[accent]" />
        </div>
      ) : error ? (
        <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-400 text-sm">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              icon={CalendarCheck}
              label="Total Bookings"
              value={Number(s.totalBookings || 0).toLocaleString()}
              hint={`${Number(s.bookingsToday || 0).toLocaleString()} today`}
              sparkData={derived.monthlyBookings.map((d) => d.bookings)}
            />
            <MetricCard
              icon={DollarSign}
              label="Total Revenue"
              value={`PKR ${Number(s.totalRevenue || 0).toLocaleString("en-PK")}`}
              hint={`PKR ${Number(s.revenueThisMonth || 0).toLocaleString("en-PK")} this month`}
              sparkData={derived.monthlyRevenue.map((d) => d.revenue)}
            />
            <MetricCard
              icon={Users}
              label="Total Patients"
              value={Number(s.totalPatients || 0).toLocaleString()}
              hint={`+${Number(s.newPatientsThisMonth || 0).toLocaleString()} this month`}
              sparkData={derived.monthlyBookings.map((d) => d.bookings)}
            />
            <MetricCard
              icon={Activity}
              label="Avg Session Value"
              value={`PKR ${Number(derived.avgSessionValue || 0).toLocaleString("en-PK")}`}
              hint={`${Number(s.completedSessions || 0).toLocaleString()} completed sessions`}
              sparkData={derived.monthlyRevenue.map((d) => d.revenue)}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="border border-white/8 bg-white/1 p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  MONTHLY BOOKINGS
                </h2>
                <span className="text-xs text-slate-600">Recent trend</span>
              </div>
              <BarChart data={derived.monthlyBookings} labelKey="month" valueKey="bookings" color="#0EA5E9" height={180} />
            </div>

            <div className="border border-white/8 bg-white/1 p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  MONTHLY REVENUE (PKR)
                </h2>
                <span className="text-xs text-slate-600">Paid bookings only</span>
              </div>
              <BarChart data={derived.monthlyRevenue} labelKey="month" valueKey="revenue" color="#4ade80" height={180} />
              <p className="text-[10px] text-slate-700">Values shown in thousands (K)</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="border border-white/8 bg-white/1 p-6 flex flex-col gap-4">
              <h2 className="text-base font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                TOP SERVICES
              </h2>
              <div className="flex flex-col gap-3">
                {derived.topServiceRows.length === 0 ? (
                  <p className="text-xs text-slate-600">No service booking data available.</p>
                ) : (
                  derived.topServiceRows.map(({ name, bookings, revenue, pct }) => (
                    <div key={name} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold truncate max-w-44">{name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-slate-600">{bookings} bookings</span>
                          <span className="text-white font-bold">PKR {Number(revenue).toLocaleString("en-PK")}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/5 w-full overflow-hidden">
                        <div className="h-full bg-[accent] transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-700">{pct}% of top-service bookings</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border border-white/8 bg-white/1 p-6 flex flex-col gap-4">
              <h2 className="text-base font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                BOOKING STATUS DISTRIBUTION
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {derived.statusDistribution.map(({ label, value, pct, color }) => (
                  <div key={label} className="flex flex-col gap-3 p-4 border border-white/5 bg-white/1">
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {pct}%
                      </span>
                      <span className="text-xs text-slate-600 pb-0.5">{value} bookings</span>
                    </div>
                    <div className="h-1 bg-white/5 overflow-hidden">
                      <div style={{ width: `${pct}%`, backgroundColor: color }} className="h-full transition-all duration-700" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
