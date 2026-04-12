import { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronDown, ChevronUp, X, Plus,
  Edit2, Trash2, CheckCircle2, XCircle, Clock, Eye,
  Loader2, AlertCircle, Save,
} from "lucide-react";
import api from "../../services/api";
import { BulkActionsBar } from "../../components/BulkActionsBar";
import { useAdminNotification } from "../../context/AdminNotificationContext";

const STATUS_CONFIG = {
  confirmed: { label: "Confirmed", color: "text-[accent] bg-[accent]/10 border-[accent]/20", dot: "bg-[accent]" },
  pending: { label: "Pending", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", dot: "bg-yellow-400" },
  completed: { label: "Completed", color: "text-slate-400 bg-slate-400/10 border-slate-400/20", dot: "bg-slate-400" },
  cancelled: { label: "Cancelled", color: "text-red-400 bg-red-400/10 border-red-400/20", dot: "bg-red-400" },
};

const PAYMENT_STATUS_CONFIG = {
  completed: { label: "Paid", color: "text-[accent] bg-[accent]/10 border-[accent]/20" },
  pending: { label: "Pending", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  under_review: { label: "Under Review", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  failed: { label: "Rejected", color: "text-red-400 bg-red-400/10 border-red-400/20" },
};

// ── Edit/View modal ────────────────────────────────────────────────────────────
function BookingModal({ booking, onClose, onSave }) {
  const [form, setForm] = useState({ ...booking });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await api.put(`/admin/bookings/${form._id}`, form);
      onSave(response?.data?.booking || form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0F172A] border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            EDIT BOOKING
          </h2>
          <button onClick={onClose} className="text-slate-600 hover:text-white p-1"><X size={16} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {error && <div className="flex items-center gap-2 p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-xs"><AlertCircle size={13} />{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Patient Name" value={form.patientName} onChange={(v) => setForm(p => ({ ...p, patientName: v }))} />
            <Field label="Patient Email" value={form.patientEmail} onChange={(v) => setForm(p => ({ ...p, patientEmail: v }))} />
            <Field label="Service" value={form.serviceName} onChange={(v) => setForm(p => ({ ...p, serviceName: v }))} />
            <Field label="Price" value={form.price} onChange={(v) => setForm(p => ({ ...p, price: v }))} />
            <Field label="Date" type="date" value={form.date} onChange={(v) => setForm(p => ({ ...p, date: v }))} />
            <Field label="Time Slot" value={form.timeSlot} onChange={(v) => setForm(p => ({ ...p, timeSlot: v }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">Consultation Type</label>
              <select
                value={form.consultationType || "in_person"}
                onChange={(e) => setForm(p => ({ ...p, consultationType: e.target.value }))}
                className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors duration-150 appearance-none"
              >
                <option value="in_person">In Person</option>
                <option value="online">Online</option>
              </select>
            </div>

            <Field
              label="Session Link"
              value={form.sessionLink || ""}
              onChange={(v) => setForm(p => ({ ...p, sessionLink: v }))}
            />
          </div>

          {(form.consultationType || "in_person") === "online" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, sessionLink: "https://meet.google.com/new" }))}
                className="px-3 py-2 border border-white/10 text-slate-400 text-[10px] font-bold tracking-widest uppercase hover:text-white hover:border-[accent]/40 transition-colors duration-150"
              >
                Use Google Meet Auto Link
              </button>
            </div>
          )}

          {/* Status select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
              className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors duration-150 appearance-none"
            >
              {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
          </div>

          {/* Payment method */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">Payment Method</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm(p => ({ ...p, paymentMethod: e.target.value }))}
              className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors duration-150 appearance-none"
            >
              {["card", "cash", "jazzcash", "easypaisa"].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
              className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors duration-150 resize-none placeholder-slate-700"
              placeholder="Internal notes…" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/5">
          <button onClick={onClose} className="px-4 py-2 border border-white/10 text-slate-400 text-xs font-bold tracking-widest uppercase hover:text-white hover:border-white/30 transition-all duration-150">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-[accent] text-[#0F172A] text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors duration-150 disabled:opacity-50">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors duration-150" />
    </div>
  );
}

function PaymentProofModal({ booking, onClose, onReview }) {
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitReview = async (action) => {
    setSubmitting(true);
    setError("");
    const result = await onReview(booking._id, action, reviewNote);
    setSubmitting(false);
    if (result?.success) {
      onClose();
      return;
    }
    setError(result?.error || "Failed to update payment status.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0F172A] border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            PAYMENT PROOF
          </h2>
          <button onClick={onClose} className="text-slate-600 hover:text-white p-1"><X size={16} /></button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="text-xs text-slate-500">
            {booking.patientName} • {booking.serviceName}
          </div>
          <img src={booking.paymentProofImage} alt="Payment proof" className="max-h-105 w-full object-contain border border-white/10 bg-black/20" />

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">Review Note</label>
            <textarea
              rows={2}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Optional note for this payment review..."
              className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors duration-150 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-xs">
              <AlertCircle size={13} />
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/5">
          <button onClick={onClose} className="px-4 py-2 border border-white/10 text-slate-400 text-xs font-bold tracking-widest uppercase hover:text-white hover:border-white/30 transition-all duration-150">Close</button>
          <button
            onClick={() => submitReview("reject")}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold tracking-widest uppercase hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            <XCircle size={12} /> Reject
          </button>
          <button
            onClick={() => submitReview("approve")}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-[accent] text-[#0F172A] text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors duration-150 disabled:opacity-50"
          >
            <CheckCircle2 size={12} /> Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm ─────────────────────────────────────────────────────────────
function DeleteConfirm({ booking, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await api.delete(`/admin/bookings/${booking._id}`);
      onConfirm(booking._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete booking.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#0F172A] border border-red-500/20 p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-red-500/10 border border-red-500/20">
            <Trash2 size={16} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Delete Booking</h3>
            <p className="text-xs text-slate-500">This cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-slate-400">Are you sure you want to permanently delete the booking for <strong className="text-white">{booking.patientName}</strong>?</p>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleDelete} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold tracking-widest uppercase hover:bg-red-500/30 transition-colors disabled:opacity-50">
            {loading && <Loader2 size={11} className="animate-spin" />} Delete
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-white/10 text-slate-500 text-xs font-bold tracking-widest uppercase hover:text-white transition-colors">Keep</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminBookings() {
  const { addNotification } = useAdminNotification();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [proofTarget, setProofTarget] = useState(null);
  const [bulkSelected, setBulkSelected] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const response = await api.get("/admin/bookings");
      setBookings(response.data.bookings ?? []);
      addNotification("Bookings loaded successfully", "success", 2200);
    } catch (err) {
      setBookings([]);
      const message = err.response?.data?.message || "Failed to load bookings from server.";
      setPageError(message);
      addNotification(message, "error");
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, newStatus) => {
    setActionLoadingId(id);
    setPageError("");
    try {
      const response = await api.patch(`/admin/bookings/${id}/status`, { status: newStatus });
      const updatedBooking = response?.data?.booking;
      setBookings((prev) => prev.map((b) => b._id === id ? (updatedBooking || { ...b, status: newStatus }) : b));
      addNotification(`Booking status updated to ${newStatus}`, "success", 2200);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update booking status.";
      setPageError(message);
      addNotification(message, "error");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleSave = (updated) => setBookings((prev) => prev.map((b) => b._id === updated._id ? updated : b));
  const handleDelete = (id) => setBookings((prev) => prev.filter((b) => b._id !== id));
  const handlePaymentReview = async (id, action, note) => {
    setActionLoadingId(id);
    setPageError("");
    try {
      const response = await api.patch(`/admin/bookings/${id}/payment-review`, { action, note });
      const updatedBooking = response?.data?.booking;
      setBookings((prev) => prev.map((b) => (b._id === id ? (updatedBooking || b) : b)));
      addNotification(
        action === "approve" ? "Payment approved successfully" : "Payment rejected",
        action === "approve" ? "success" : "warning"
      );
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update payment status.";
      setPageError(message);
      addNotification(message, "error");
      return { success: false, error: message };
    } finally {
      setActionLoadingId("");
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (bulkSelected.length === 0) return;
    setActionLoadingId("bulk");
    setPageError("");

    try {
      await Promise.all(
        bulkSelected.map((id) => api.patch(`/admin/bookings/${id}/status`, { status }))
      );

      setBookings((prev) => prev.map((b) => (
        bulkSelected.includes(b._id)
          ? { ...b, status }
          : b
      )));
      addNotification(`Updated ${bulkSelected.length} bookings to ${status}`, "success");
      setBulkSelected([]);
    } catch (err) {
      const message = err.response?.data?.message || "Bulk status update failed.";
      setPageError(message);
      addNotification(message, "error");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleBulkDelete = async () => {
    if (bulkSelected.length === 0) return;
    await Promise.all(bulkSelected.map((id) => api.delete(`/admin/bookings/${id}`).catch(() => {})));
    setBookings((prev) => prev.filter((b) => !bulkSelected.includes(b._id)));
    addNotification(`Deleted ${bulkSelected.length} bookings`, "warning");
    setBulkSelected([]);
  };
  const toggleBulk = (id) => setBulkSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleSort = (field) => { if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc"); else { setSortField(field); setSortDir("asc"); } };

  // Filter + sort
  const filtered = bookings
    .filter((b) => {
      const q = search.toLowerCase();
      const matchSearch = !q || b.patientName?.toLowerCase().includes(q) || b.serviceName?.toLowerCase().includes(q) || b.patientEmail?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortField] ?? ""; let bVal = b[sortField] ?? "";
      return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={10} className="text-slate-700" />;
    return sortDir === "asc" ? <ChevronUp size={10} className="text-[accent]" /> : <ChevronDown size={10} className="text-[accent]" />;
  };

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      {/* Modals */}
      {editTarget && <BookingModal booking={editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} />}
      {deleteTarget && <DeleteConfirm booking={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
      {proofTarget && <PaymentProofModal booking={proofTarget} onClose={() => setProofTarget(null)} onReview={handlePaymentReview} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[accent]">Management</span>
          <h1 className="mt-1 text-3xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            BOOKINGS <span className="text-slate-600">({filtered.length})</span>
          </h1>
        </div>
        <div className="flex gap-2">
          {bulkSelected.length > 0 && (
            <button onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold tracking-widest uppercase hover:bg-red-500/30 transition-colors">
              <Trash2 size={12} /> Delete {bulkSelected.length}
            </button>
          )}
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[accent] text-[#0F172A] text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors duration-200">
            <Plus size={13} /> New Booking
          </button>
        </div>
      </div>

      {pageError && (
        <div className="flex items-center gap-2 p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={13} />
          {pageError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-50 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient, service…"
            className="w-full bg-white/3 border border-white/10 pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-700 outline-none focus:border-[accent] transition-colors duration-150" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white"><X size={12} /></button>}
        </div>
        <div className="flex gap-1">
          {["all", ...Object.keys(STATUS_CONFIG)].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-[10px] font-bold tracking-widest uppercase border transition-all duration-150 ${
                statusFilter === s ? "bg-[accent] border-[accent] text-[#0F172A]" : "border-white/10 text-slate-500 hover:text-white hover:border-white/25"
              }`}>
              {s === "all" ? "All" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      <BulkActionsBar
        selectedCount={bulkSelected.length}
        onBulkDelete={handleBulkDelete}
        onBulkStatusChange={handleBulkStatusChange}
        exportType="bookings"
        exportData={filtered}
        itemType="bookings"
        loading={loading || actionLoadingId === "bulk"}
      />

      {/* Table */}
      <div className="border border-white/8 overflow-x-auto">
        <table className="w-full text-xs min-w-225">
          <thead>
            <tr className="border-b border-white/5 bg-white/2">
              <th className="px-4 py-3 w-8">
                <input type="checkbox" checked={bulkSelected.length === filtered.length && filtered.length > 0}
                  onChange={() => setBulkSelected(bulkSelected.length === filtered.length ? [] : filtered.map((b) => b._id))}
                  className="accent-[accent]" />
              </th>
              {[
                { label: "Patient", field: "patientName" },
                { label: "Service", field: "serviceName" },
                { label: "Date", field: "date" },
                { label: "Time", field: "timeSlot" },
                { label: "Status", field: "status" },
                { label: "Payment", field: "paymentMethod" },
                { label: "Payment State", field: "paymentStatus" },
                { label: "Price", field: "price" },
              ].map(({ label, field }) => (
                <th key={field} onClick={() => toggleSort(field)}
                  className="px-4 py-3 text-left font-black tracking-widest uppercase text-slate-600 cursor-pointer hover:text-slate-400 transition-colors duration-100 select-none whitespace-nowrap">
                  <span className="flex items-center gap-1">{label} <SortIcon field={field} /></span>
                </th>
              ))}
              <th className="px-4 py-3 text-left font-black tracking-widest uppercase text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={10} className="px-4 py-4"><div className="h-4 bg-white/3 animate-pulse" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-600">No bookings found.</td></tr>
            ) : filtered.map((b) => {
              const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
              return (
                <tr key={b._id} className={`hover:bg-white/2 transition-colors duration-100 ${bulkSelected.includes(b._id) ? "bg-[accent]/3" : ""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={bulkSelected.includes(b._id)} onChange={() => toggleBulk(b._id)} className="accent-[accent]" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-white">{b.patientName}</p>
                    <p className="text-slate-600 text-[10px]">{b.patientEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-400 max-w-40 truncate">{b.serviceName}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{b.date}</td>
                  <td className="px-4 py-3 text-slate-400">{b.timeSlot}</td>
                  <td className="px-4 py-3">
                    <select value={b.status} onChange={(e) => handleStatusChange(b._id, e.target.value)}
                      disabled={actionLoadingId === b._id}
                      className={`text-[10px] font-bold px-2 py-1 border cursor-pointer outline-none appearance-none ${sc.color}`}>
                      {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{b.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 border ${PAYMENT_STATUS_CONFIG[b.paymentStatus || "pending"]?.color || PAYMENT_STATUS_CONFIG.pending.color}`}>
                      {PAYMENT_STATUS_CONFIG[b.paymentStatus || "pending"]?.label || "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-semibold whitespace-nowrap">{b.price}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {b.paymentProofAvailable && (
                        <button onClick={() => setProofTarget(b)} className="p-1.5 text-slate-600 hover:text-blue-400 transition-colors" title="View Payment Proof">
                          <Eye size={13} />
                        </button>
                      )}
                      {b.paymentStatus === "under_review" && (
                        <button
                          onClick={async () => {
                            const result = await handlePaymentReview(b._id, "approve", "Approved from list");
                            if (!result?.success) return;
                          }}
                          disabled={actionLoadingId === b._id}
                          className="p-1.5 text-slate-600 hover:text-[accent] transition-colors disabled:opacity-40"
                          title="Approve Payment"
                        >
                          {actionLoadingId === b._id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        </button>
                      )}
                      <button onClick={() => setEditTarget(b)} className="p-1.5 text-slate-600 hover:text-[accent] transition-colors" title="Edit"><Edit2 size={13} /></button>
                      <button onClick={() => setDeleteTarget(b)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-700">{filtered.length} booking{filtered.length !== 1 ? "s" : ""} · {bulkSelected.length} selected</p>
    </div>
  );
}

