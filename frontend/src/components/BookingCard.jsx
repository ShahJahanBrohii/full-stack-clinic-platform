import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Clock,
  Tag,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  AlertTriangle,
  Banknote,
  Activity,
  Bell,
  Video,
} from "lucide-react";
import { bookingAPI } from "../services/api";

// ── Status config ─────────────────────────────────────────────────────────────
// All Tailwind classes are complete static strings — never built dynamically.
const STATUS_CONFIG = {
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    badgeClass: "text-accent bg-accent/10 border-accent/20",
    iconClass: "text-accent",
    dot: "bg-accent",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    badgeClass: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    iconClass: "text-yellow-400",
    dot: "bg-yellow-400",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    badgeClass: "text-red-400 bg-red-400/10 border-red-400/20",
    iconClass: "text-red-400",
    dot: "bg-red-400",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    badgeClass: "text-slate-400 bg-slate-400/10 border-slate-400/20",
    iconClass: "text-slate-400",
    dot: "bg-slate-400",
  },
};

// ── Format helpers ────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeSlot(slot) {
  if (!slot) return "—";
  const [hours, minutes] = String(slot).split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return slot;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
];

// ── Animated expand panel ─────────────────────────────────────────────────────
// Uses CSS grid trick instead of max-height so content is never clipped.
function ExpandPanel({ open, children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 300ms ease",
      }}
    >
      <div style={{ overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

// ── Cancel confirmation dialog ────────────────────────────────────────────────
function CancelDialog({ onConfirm, onDismiss, loading }) {
  return (
    <div
      className="mt-4 p-4 border border-red-500/20 bg-red-500/5 flex flex-col gap-3"
      role="alertdialog"
      aria-modal="false"
      aria-label="Cancel appointment confirmation"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-red-300 leading-relaxed">
          Cancel this appointment? This action cannot be undone and you may need to rebook.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold tracking-widest uppercase hover:bg-red-500/30 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-busy={loading}
        >
          {loading && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
          Yes, Cancel
        </button>
        <button
          onClick={onDismiss}
          disabled={loading}
          className="px-4 py-2 border border-white/10 text-slate-500 text-xs font-bold tracking-widest uppercase hover:text-white hover:border-white/30 transition-colors duration-150 disabled:opacity-50"
        >
          Keep It
        </button>
      </div>
    </div>
  );
}

// ── Main BookingCard component ────────────────────────────────────────────────
/**
 * Props:
 *   booking  {object}   — booking data object from API
 *   onCancel {function} — async (bookingId) => { success, error }
 *   compact  {boolean}  — condensed layout for dashboard overview
 */
export default function BookingCard({ booking, onCancel, onReschedule, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  const [availableSlots, setAvailableSlots] = useState(TIME_SLOTS);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const headerId = useRef(`booking-header-${Math.random().toString(36).slice(2)}`).current;

  const {
    _id,
    serviceName = "Appointment",
    serviceCategory = "",
    date,
    timeSlot,
    status = "pending",
    price,
    paymentMethod,
    paymentConfirmed,
    notes,
    specialistName,
    consultationType,
    sessionLink,
    serviceId,
  } = booking || {};

  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const canCancel = status === "confirmed" || status === "pending";
  const canReschedule = status === "confirmed" || status === "pending";

  const openCancelDialog = (e) => {
    e.stopPropagation();
    setCancelError(""); // clear any stale error from previous attempt
    setShowCancelDialog(true);
  };

  const dismissCancelDialog = () => {
    setShowCancelDialog(false);
    setCancelError("");
  };

  const startReschedule = () => {
    const currentDate = date ? new Date(date).toISOString().split("T")[0] : "";
    setRescheduleDate(currentDate);
    setRescheduleTimeSlot(timeSlot || "");
    setRescheduleError("");
    setAvailableSlots(TIME_SLOTS);
    setShowReschedule(true);
  };

  useEffect(() => {
    if (!showReschedule || !rescheduleDate) return;

    const resolvedServiceId =
      typeof serviceId === "string" ? serviceId : serviceId?._id;

    if (!resolvedServiceId) {
      setAvailableSlots(TIME_SLOTS);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);

    bookingAPI
      .getAvailableSlots(resolvedServiceId, rescheduleDate)
      .then((res) => {
        if (cancelled) return;
        setAvailableSlots(res?.data?.availableSlots || TIME_SLOTS);
      })
      .catch(() => {
        if (cancelled) return;
        setAvailableSlots(TIME_SLOTS);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showReschedule, rescheduleDate, serviceId]);

  const handleReschedule = async () => {
    if (typeof onReschedule !== "function") {
      setRescheduleError("Reschedule is not available right now.");
      return;
    }

    if (!rescheduleDate || !rescheduleTimeSlot) {
      setRescheduleError("Please select both date and time.");
      return;
    }

    setRescheduleLoading(true);
    setRescheduleError("");
    try {
      const result = await onReschedule(_id, {
        date: rescheduleDate,
        timeSlot: rescheduleTimeSlot,
      });

      if (!result?.success) {
        setRescheduleError(result?.error || "Reschedule failed. Please try again.");
        return;
      }

      setShowReschedule(false);
    } catch {
      setRescheduleError("Reschedule failed. Please try again.");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) {
      console.warn("BookingCard: onCancel prop is required for cancellation");
      setCancelError("Cancellation is not available right now.");
      return;
    }
    setCancelLoading(true);
    setCancelError("");
    try {
      const result = await onCancel(_id);
      if (result?.success) {
        setShowCancelDialog(false);
      } else {
        setCancelError(result?.error || "Cancellation failed. Please try again.");
      }
    } catch {
      setCancelError("An unexpected error occurred. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  // ── Compact mode ──────────────────────────────────────────────────────────
  if (compact) {
    return (
      <article
        className="flex items-center justify-between gap-4 p-4 bg-white/2 border border-white/8 hover:border-white/15 transition-colors duration-200"
        aria-label={`${serviceName} — ${statusCfg.label}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 flex items-center justify-center bg-accent/10 shrink-0" aria-hidden="true">
            <Activity size={14} className="text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{serviceName}</p>
            <p className="text-xs text-slate-600">{formatDate(date)} · {formatTimeSlot(timeSlot)}</p>
          </div>
        </div>
        <span
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase border shrink-0 ${statusCfg.badgeClass}`}
          aria-label={`Status: ${statusCfg.label}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} aria-hidden="true" />
          {statusCfg.label}
        </span>
      </article>
    );
  }

  // ── Full card mode ────────────────────────────────────────────────────────
  return (
    <article
      className={`bg-white/2 border transition-colors duration-300 ${
        expanded ? "border-accent/30" : "border-white/8 hover:border-white/15"
      }`}
      aria-label={`Booking: ${serviceName}`}
    >
      {/* ── Card header ─────────────────────────────────────── */}
      <div
        id={headerId}
        className="p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${serviceName} booking details — ${expanded ? "collapse" : "expand"}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <div className="flex items-start gap-4 min-w-0">
          {/* Icon */}
          <div
            className="w-10 h-10 flex items-center justify-center bg-accent/10 border border-accent/20 shrink-0"
            aria-hidden="true"
          >
            <Activity size={17} className="text-accent" />
          </div>

          {/* Info */}
          <div className="min-w-0">
            {serviceCategory && (
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-600">
                {serviceCategory}
              </span>
            )}
            <h3
              className="text-base font-black text-white leading-tight truncate"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800 }}
            >
              {serviceName}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar size={11} className="text-accent" aria-hidden="true" />
                <time dateTime={date}>{formatDate(date)}</time>
              </span>
              {timeSlot && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={11} className="text-accent" aria-hidden="true" />
                  {formatTimeSlot(timeSlot)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: status badge + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase border ${statusCfg.badgeClass}`}
            aria-label={`Status: ${statusCfg.label}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} aria-hidden="true" />
            {statusCfg.label}
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-600 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* ── Expandable detail panel ──────────────────────────── */}
      <ExpandPanel open={expanded}>
        <div className="px-5 pb-5 border-t border-white/5 pt-4 flex flex-col gap-4">

          {/* Status row (mobile — hidden on sm+) */}
          <div className="sm:hidden flex items-center gap-2" aria-label={`Status: ${statusCfg.label}`}>
            <StatusIcon size={14} className={statusCfg.iconClass} aria-hidden="true" />
            <span className="text-sm font-semibold text-white">{statusCfg.label}</span>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {price && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Price</span>
                <span className="flex items-center gap-1.5 text-sm text-white font-semibold">
                  <Tag size={11} className="text-accent" aria-hidden="true" />
                  {price}
                </span>
              </div>
            )}

            {paymentMethod && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Payment</span>
                <span className="flex items-center gap-1.5 text-sm text-white font-semibold">
                  <Banknote size={11} className="text-accent" aria-hidden="true" />
                  {paymentMethod}
                  {paymentConfirmed && (
                    <CheckCircle2
                      size={11}
                      className="text-accent"
                      aria-label="Payment confirmed"
                    />
                  )}
                </span>
              </div>
            )}

            {specialistName && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Specialist</span>
                <span className="text-sm text-white font-semibold">{specialistName}</span>
              </div>
            )}

            {/* Reminder status — show for confirmed upcoming appointments */}
            {status === "confirmed" && new Date(date) > new Date() && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Reminder</span>
                <span className="flex items-center gap-1.5 text-sm text-amber-400 font-semibold">
                  <Bell size={11} className="text-amber-400" aria-hidden="true" />
                  24h before
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {notes && (
            <div className="p-3 bg-white/2 border border-white/5">
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-1.5">Notes</p>
              <p className="text-sm text-slate-400 leading-relaxed">{notes}</p>
            </div>
          )}

          {consultationType === "online" && sessionLink && status !== "cancelled" && (
            <div className="flex items-center justify-between gap-3 p-3 border border-accent/20 bg-accent/6">
              <div className="flex items-center gap-2 text-sm text-white font-semibold">
                <Video size={14} className="text-accent" aria-hidden="true" />
                Online consultation link is ready
              </div>
              <a
                href={sessionLink}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-accent text-[#0F172A] text-[10px] font-bold tracking-widest uppercase hover:bg-white transition-colors duration-150"
              >
                Join Session
              </a>
            </div>
          )}

          {/* Booking ID */}
          {_id && (
            <p className="text-[10px] text-slate-700 font-mono" aria-label={`Booking ID: ${_id}`}>
              Booking ID: {_id}
            </p>
          )}

          {/* Cancel flow */}
          {(canCancel || canReschedule) && (
            <div>
              {!showCancelDialog && !showReschedule ? (
                <div className="flex items-center gap-4">
                  {canReschedule && (
                    <button
                      onClick={startReschedule}
                      className="text-xs text-slate-600 hover:text-accent transition-colors duration-150 font-semibold tracking-wide underline underline-offset-2"
                    >
                      Reschedule appointment
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={openCancelDialog}
                      className="text-xs text-slate-600 hover:text-red-400 transition-colors duration-150 font-semibold tracking-wide underline underline-offset-2"
                    >
                      Cancel appointment
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {showCancelDialog && (
                    <CancelDialog
                      onConfirm={handleCancel}
                      onDismiss={dismissCancelDialog}
                      loading={cancelLoading}
                    />
                  )}
                  {showReschedule && (
                    <div className="mt-4 p-4 border border-accent/20 bg-accent/6 flex flex-col gap-3">
                      <p className="text-sm text-white font-semibold">Choose a new date and time</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-accent"
                        />
                        <select
                          value={rescheduleTimeSlot}
                          onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                          className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-accent"
                        >
                          <option value="">Select time slot</option>
                          {TIME_SLOTS.map((slot) => {
                            const isAvailable = availableSlots.includes(slot) || slot === timeSlot;
                            return (
                              <option key={slot} value={slot} disabled={!isAvailable}>
                                {formatTimeSlot(slot)}{!isAvailable ? " (unavailable)" : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      {slotsLoading && (
                        <p className="text-[10px] text-slate-500">Checking slot availability...</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleReschedule}
                          disabled={rescheduleLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-accent text-[#0F172A] text-xs font-bold tracking-widest uppercase hover:bg-white disabled:opacity-50"
                        >
                          {rescheduleLoading && <Loader2 size={12} className="animate-spin" />}
                          Save schedule
                        </button>
                        <button
                          onClick={() => { setShowReschedule(false); setRescheduleError(""); }}
                          className="px-4 py-2 border border-white/10 text-slate-500 text-xs font-bold tracking-widest uppercase hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {cancelError && (
                <p className="mt-2 text-xs text-red-400" role="alert">
                  {cancelError}
                </p>
              )}
              {rescheduleError && (
                <p className="mt-2 text-xs text-red-400" role="alert">
                  {rescheduleError}
                </p>
              )}
            </div>
          )}
        </div>
      </ExpandPanel>
    </article>
  );
}