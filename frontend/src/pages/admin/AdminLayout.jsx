import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarCheck, Users, Dumbbell,
  PlayCircle, BarChart2, Settings, LogOut, Activity,
  Menu, ChevronRight, Bell, Shield,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { AdminNotificationProvider } from "../../context/AdminNotificationContext";
import { AdminNotificationCenter } from "../../components/AdminNotificationCenter";

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart2 },
    ],
  },
  {
    title: "Management",
    items: [
      { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
      { to: "/admin/patients", label: "Patients", icon: Users },
      { to: "/admin/services", label: "Services", icon: Dumbbell },
      { to: "/admin/videos", label: "Video Library", icon: PlayCircle },
    ],
  },
  {
    title: "System",
    items: [
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-all duration-150 group relative ${
          isActive
            ? "bg-[accent]/10 text-[accent] border-l-2 border-[accent]"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-l-2 border-transparent"
        }`
      }
    >
      <Icon size={15} strokeWidth={2} />
      {label}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-[#F1F5F9] border-r border-slate-200 w-60 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200">
        <div className="w-8 h-8 flex items-center justify-center bg-[accent] shrink-0">
          <Activity size={16} strokeWidth={2.5} className="text-[#0F172A]" />
        </div>
        <div className="flex flex-col leading-none">
            <span className="text-slate-900 font-black text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Ali's<span className="text-[accent]">Clinic</span>
          </span>
          <span className="text-[9px] text-slate-600 tracking-[0.2em] uppercase font-medium flex items-center gap-1">
            <Shield size={8} className="text-[accent]" /> Admin Panel
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-5">
        {NAV_SECTIONS.map(({ title, items }) => (
          <div key={title}>
            <p className="px-4 mb-1.5 text-[9px] font-black tracking-[0.25em] uppercase text-slate-400">{title}</p>
            {items.map((item) => <NavItem key={item.to} {...item} />)}
          </div>
        ))}
      </nav>

      {/* Admin profile + logout */}
      <div className="border-t border-slate-200 p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 flex items-center justify-center bg-[accent]/10 border border-[accent]/20 shrink-0">
            <Shield size={12} className="text-[accent]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "Admin"}</p>
            <p className="text-[10px] text-slate-600 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all duration-150 font-semibold"
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <AdminNotificationProvider>
      <div className="flex h-screen bg-linear-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#F8FAFC] text-slate-900 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 flex">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-[#F1F5F9] border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
            <Shield size={11} className="text-[accent]" />
            Admin Portal
            <ChevronRight size={11} />
            <span className="text-slate-500">Ali's Clinic</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors duration-150">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[accent] rounded-full" />
            </button>
            <div className="w-7 h-7 flex items-center justify-center bg-[accent]/10 border border-[accent]/20">
              <Shield size={13} className="text-[accent]" />
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      </div>
      <AdminNotificationCenter />
    </AdminNotificationProvider>
  );
}

