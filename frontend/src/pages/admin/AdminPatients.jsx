import { useState, useEffect, useCallback } from "react";
import {
  Search, X, Edit2, Trash2, Eye, Loader2,
  User, Mail, Phone, Calendar, Activity,
  AlertCircle, ChevronDown, ChevronUp, Save, Plus,
} from "lucide-react";
import api from "../../services/api";
import { BulkActionsBar } from "../../components/BulkActionsBar";

function PatientModal({ patient, onClose, onSave }) {
  const [form, setForm] = useState({ ...patient });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("profile");
  const [patientBookings, setPatientBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");

  useEffect(() => {
    if (tab === "history") {
      setBookingsLoading(true);
      setBookingsError("");
      api.get(`/admin/patients/${patient._id}/bookings`)
        .then((r) => setPatientBookings(r.data.bookings ?? []))
        .catch((err) => {
          setPatientBookings([]);
          setBookingsError(err.response?.data?.message || "Failed to load booking history.");
        })
        .finally(() => setBookingsLoading(false));
    }
  }, [tab, patient._id]);

  const handleSave = async () => {
    setSaving(true);
    await api.put(`/admin/patients/${form._id}`, form).catch(() => {});
    onSave(form);
    onClose();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-[#0F172A] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center bg-accent/10 border border-accent/20">
              <User size={15} className="text-accent" />
            </div>
            <div>
              <h2 className="text-base font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{patient.name}</h2>
              <p className="text-[10px] text-slate-600">{patient.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white p-1"><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 shrink-0">
          {["profile", "history"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-xs font-bold tracking-widest uppercase border-b-2 transition-all duration-150 ${
                tab === t ? "border-accent text-accent" : "border-transparent text-slate-600 hover:text-slate-400"
              }`}>
              {t === "profile" ? "Profile & Edit" : "Booking History"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "profile" ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Full Name", key: "name" },
                  { label: "Email", key: "email" },
                  { label: "Phone", key: "phone" },
                  { label: "Condition / Reason", key: "condition" },
                ].map(({ label, key }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">{label}</label>
                    <input value={form[key] || ""} onChange={(e) => setForm(p => ({ ...p, [key]: e.target.value }))}
                      className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-accent transition-colors" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">Status</label>
                <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
                  className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-accent transition-colors appearance-none">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                {[
                  { label: "Total Bookings", value: patient.totalBookings },
                  { label: "Completed", value: patient.completedSessions },
                  { label: "Member Since", value: new Date(patient.joinDate).getFullYear() },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-white/2 border border-white/5 text-center">
                    <p className="text-xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {bookingsLoading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white/2 animate-pulse border border-white/5" />)
              ) : bookingsError ? (
                <p className="text-sm text-red-400 text-center py-8">{bookingsError}</p>
              ) : patientBookings.length === 0 ? (
                <p className="text-sm text-slate-600 text-center py-8">No bookings found for this patient.</p>
              ) : patientBookings.map((b) => {
                const statusColors = { confirmed: "text-[#0EA5E9]", pending: "text-yellow-400", completed: "text-slate-400", cancelled: "text-red-400" };
                return (
                  <div key={b._id} className="flex items-center justify-between p-3 border border-white/8 bg-white/1">
                    <div>
                      <p className="text-sm font-bold text-white">{b.serviceName}</p>
                      <p className="text-xs text-slate-600">{b.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold capitalize ${statusColors[b.status] || "text-slate-400"}`}>{b.status}</p>
                      <p className="text-xs text-slate-500">{b.price}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {tab === "profile" && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/5 shrink-0">
            <button onClick={onClose} className="px-4 py-2 border border-white/10 text-slate-400 text-xs font-bold tracking-widest uppercase hover:text-white transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-accent text-[#0F172A] text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api.get("/admin/patients")
      .then((r) => setPatients(r.data.patients ?? []))
      .catch((err) => {
        setPatients([]);
        setError(err.response?.data?.message || "Failed to load patients.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = (updated) => setPatients((prev) => prev.map((p) => p._id === updated._id ? updated : p));
  const handleDelete = async (id) => {
    await api.delete(`/admin/patients/${id}`).catch(() => {});
    setPatients((prev) => prev.filter((p) => p._id !== id));
    setDeleteTarget(null);
  };
  const toggleSort = (field) => { if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc"); else { setSortField(field); setSortDir("asc"); } };

  const filtered = patients
    .filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.condition?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const aV = a[sortField] ?? ""; const bV = b[sortField] ?? "";
      return sortDir === "asc" ? String(aV).localeCompare(String(bV)) : String(bV).localeCompare(String(aV));
    });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={10} className="text-slate-700" />;
    return sortDir === "asc" ? <ChevronUp size={10} className="text-accent" /> : <ChevronDown size={10} className="text-accent" />;
  };

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      {viewTarget && <PatientModal patient={viewTarget} onClose={() => setViewTarget(null)} onSave={handleSave} />}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm bg-[#0F172A] border border-red-500/20 p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black text-white">Delete Patient Account</h3>
            <p className="text-sm text-slate-400">This will permanently delete <strong className="text-white">{deleteTarget.name}</strong> and all their data.</p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteTarget._id)} className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold tracking-widest uppercase hover:bg-red-500/30">Delete</button>
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-white/10 text-slate-500 text-xs font-bold tracking-widest uppercase">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="border border-red-500/20 bg-red-500/5 text-red-400 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-accent">Management</span>
          <h1 className="mt-1 text-3xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            PATIENTS <span className="text-slate-600">({filtered.length})</span>
          </h1>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Patients", value: patients.length, accent: true },
          { label: "Active", value: patients.filter((p) => p.status === "active").length },
          { label: "Inactive", value: patients.filter((p) => p.status === "inactive").length },
        ].map(({ label, value, accent }) => (
          <div key={label} className={`p-4 border flex flex-col gap-1 ${accent ? "bg-accent border-accent" : "bg-white/2 border-white/8"}`}>
            <p className={`text-2xl font-black ${accent ? "text-[#0F172A]" : "text-white"}`} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
            <p className={`text-xs font-bold ${accent ? "text-[#0F172A]/70" : "text-slate-500"}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-50 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, condition…"
            className="w-full bg-white/3 border border-white/10 pl-9 pr-8 py-2.5 text-xs text-white placeholder-slate-700 outline-none focus:border-accent transition-colors" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white"><X size={12} /></button>}
        </div>
        {["all", "active", "inactive"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 text-[10px] font-bold tracking-widest border transition-all duration-150 capitalize ${
              statusFilter === s ? "bg-[#0EA5E9] border-[#0EA5E9] text-[#0F172A]" : "border-white/10 text-slate-500 hover:text-white hover:border-white/25"
            }`}>{s === "all" ? "All Patients" : s}</button>
        ))}
      </div>

      <BulkActionsBar
        exportType="patients"
        exportData={filtered}
        itemType="patients"
      />

      {/* Table */}
      <div className="border border-white/8 overflow-x-auto">
        <table className="w-full text-xs min-w-187.5">
          <thead>
            <tr className="border-b border-white/5 bg-white/2">
              {[
                { label: "Patient", field: "name" },
                { label: "Contact", field: "email" },
                { label: "Condition", field: "condition" },
                { label: "Bookings", field: "totalBookings" },
                { label: "Sessions Done", field: "completedSessions" },
                { label: "Joined", field: "joinDate" },
                { label: "Status", field: "status" },
              ].map(({ label, field }) => (
                <th key={field} onClick={() => toggleSort(field)}
                  className="px-4 py-3 text-left font-black tracking-widest uppercase text-slate-600 cursor-pointer hover:text-slate-400 select-none whitespace-nowrap">
                  <span className="flex items-center gap-1">{label} <SortIcon field={field} /></span>
                </th>
              ))}
              <th className="px-4 py-3 text-left font-black tracking-widest uppercase text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [...Array(5)].map((_, i) => <tr key={i}><td colSpan={8} className="px-4 py-4"><div className="h-4 bg-white/3 animate-pulse" /></td></tr>)
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-600">No patients found.</td></tr>
            ) : filtered.map((p) => (
              <tr key={p._id} className="hover:bg-white/2 transition-colors duration-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 flex items-center justify-center bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 shrink-0">
                      <User size={11} className="text-[#0EA5E9]" />
                    </div>
                    <span className="font-bold text-white">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-400">{p.email}</p>
                  <p className="text-slate-600 text-[10px]">{p.phone}</p>
                </td>
                <td className="px-4 py-3 text-slate-500 max-w-37.5 truncate">{p.condition || "—"}</td>
                <td className="px-4 py-3 text-white font-bold text-center">{p.totalBookings}</td>
                <td className="px-4 py-3 text-slate-400 text-center">{p.completedSessions}</td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(p.joinDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 capitalize ${p.status === "active" ? "text-[#0EA5E9] bg-[#0EA5E9]/10" : "text-slate-500 bg-slate-500/10"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewTarget(p)} className="p-1.5 text-slate-600 hover:text-[#0EA5E9] transition-colors" title="View & Edit"><Eye size={13} /></button>
                    <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
