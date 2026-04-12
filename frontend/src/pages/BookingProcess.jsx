import { useState, useContext, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Calendar,
  Clock,
  Tag,
  CreditCard,
  Banknote,
  Smartphone,
  Loader2,
  AlertCircle,
  Check,
  CalendarCheck,
  Activity,
  Upload,
} from "lucide-react";
import { BookingContext } from "../context/BookingContext";
import { useToast } from "../context/ToastContext";
import { servicesAPI, bookingAPI } from "../services/api";

// ── Constants ─────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Service" },
  { id: 2, label: "Date & Time" },
  { id: 3, label: "Payment" },
  { id: 4, label: "Confirm" },
];

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard accepted" },
  { id: "cash", label: "Cash at Clinic", icon: Banknote, desc: "Pay on arrival" },
  { id: "jazzcash", label: "JazzCash", icon: Smartphone, desc: "Transfer to clinic wallet and upload screenshot" },
  { id: "easypaisa", label: "Easypaisa", icon: Smartphone, desc: "Transfer to clinic wallet and upload screenshot" },
];

const MANUAL_WALLET_NUMBERS = {
  jazzcash: import.meta.env.VITE_JAZZCASH_WALLET_NUMBER || "0300-1234567",
  easypaisa: import.meta.env.VITE_EASYPAISA_WALLET_NUMBER || "0311-7654321",
};

function isManualPaymentMethod(paymentMethod) {
  return paymentMethod === "jazzcash" || paymentMethod === "easypaisa";
}

// Generate next 14 days (skip Sundays)
function getAvailableDates() {
  const dates = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1); // start from tomorrow
  while (dates.length < 14) {
    if (d.getDay() !== 0) dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
];

function formatTimeSlot(slot) {
  if (!slot) return "—";
  const [hours, minutes] = slot.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return slot;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatDateShort(d) {
  return d.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" });
}
function formatDateFull(d) {
  return d.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = memo(function StepIndicator({ currentStep }) {
  return (
    <nav aria-label="Booking progress" className="flex items-center gap-0">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <li key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 flex items-center justify-center border-2 text-xs font-black transition-all duration-300 ${
                    done
                      ? "bg-[#0EA5E9] border-[#0EA5E9]"
                      : active
                      ? "border-[#0EA5E9] text-[#0EA5E9]"
                        : "border-slate-300 text-slate-500"
                  }`}
                  aria-current={active ? "step" : undefined}
                  aria-label={`Step ${step.id}: ${step.label}${done ? " (completed)" : active ? " (current)" : ""}`}
                >
                  {done
                    ? <Check size={14} strokeWidth={3} className="text-[#0F172A]" aria-hidden="true" />
                    : <span aria-hidden="true">{step.id}</span>}
                </div>
                <span
                  className={`text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${
                    active ? "text-[#0EA5E9]" : done ? "text-slate-400" : "text-slate-700"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-12 sm:w-20 lg:w-28 h-0.5 mb-5 mx-1 transition-colors duration-300 ${
                    done ? "bg-[#0EA5E9]" : "bg-slate-200"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});

// ── Step 1 — Service selection ────────────────────────────────────────────────
const StepService = memo(function StepService({ draft, setDraft }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    servicesAPI.getAll()
      .then((res) => { if (!cancelled) setServices(res.data.services ?? []); })
      .catch(() => { if (!cancelled) setError("Failed to load services. Please refresh."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20" aria-label="Loading services">
      <Loader2 size={24} className="text-[#0EA5E9] animate-spin" aria-hidden="true" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 p-4 border border-red-500/20 bg-red-500/5 text-red-400 text-sm" role="alert">
      <AlertCircle size={15} className="shrink-0" aria-hidden="true" /> {error}
    </div>
  );

  if (services.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 border border-yellow-500/20 bg-yellow-500/5 text-yellow-300 text-sm" role="alert">
        <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
        No active services are available right now. Please contact admin to publish services.
      </div>
    );
  }

  return (
    <fieldset className="grid sm:grid-cols-2 gap-3 border-0 p-0 m-0">
      <legend className="sr-only">Choose a service</legend>
      {services.map((service) => {
        const serviceId = service._id || service.id;
        const serviceTitle = service.title || service.name || "Service";
        const selected = draft.serviceId === serviceId;
        return (
          <button
            key={serviceId}
            type="button"
            onClick={() => setDraft({ serviceId, serviceName: serviceTitle, price: service.price })}
            aria-pressed={selected}
            className={`text-left p-5 border flex flex-col gap-3 transition-all duration-200 group ${
              selected
                ? "border-[#0EA5E9] bg-[#0EA5E9]/5"
                : "border-slate-200 bg-white hover:border-[#0EA5E9]/40"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`w-9 h-9 flex items-center justify-center border transition-all duration-200 ${
                selected
                  ? "bg-[#0EA5E9] border-[#0EA5E9]"
                  : "bg-[#0EA5E9]/10 border-[#0EA5E9]/20 group-hover:bg-[#0EA5E9]/20"
              }`}>
                <Activity size={15} className={selected ? "text-[#0F172A]" : "text-[#0EA5E9]"} aria-hidden="true" />
              </div>
              {selected && <CheckCircle2 size={16} className="text-[#0EA5E9] shrink-0 mt-0.5" aria-hidden="true" />}
            </div>
            <div>
              <p
                className={`text-sm font-black leading-tight ${selected ? "text-[#0EA5E9]" : "text-slate-900"}`}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {serviceTitle}
              </p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">{service.description}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={10} className="text-[#0EA5E9]" aria-hidden="true" />
                {service.duration || "45–60 min"}
              </span>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <Tag size={10} className="text-[#0EA5E9]" aria-hidden="true" />
                {service.price || "—"}
              </span>
            </div>
          </button>
        );
      })}
    </fieldset>
  );
});

// ── Step 2 — Date & time ──────────────────────────────────────────────────────
const StepDateTime = memo(function StepDateTime({ draft, setDraft }) {
  const dates = getAvailableDates();
  const [availableSlots, setAvailableSlots] = useState(TIME_SLOTS); // default: all slots available
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Fetch available slots when date changes — single API call, no double-fetch
  useEffect(() => {
    if (!draft.date || !draft.serviceId) return;
    let cancelled = false;
    setSlotsLoading(true);
    bookingAPI.getAvailableSlots(draft.serviceId, draft.date)
      .then((res) => { if (!cancelled) setAvailableSlots(res.data.availableSlots ?? TIME_SLOTS); })
      .catch(() => { if (!cancelled) setAvailableSlots(TIME_SLOTS); }) // fallback: show all slots
      .finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [draft.date, draft.serviceId]);

  return (
    <div className="flex flex-col gap-8">
      {/* Date picker */}
      <div>
        <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4" id="date-label">
          Select Date
        </h3>
        <div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
          role="group"
          aria-labelledby="date-label"
        >
          {dates.map((d) => {
            const iso = toLocalDateKey(d);
            const selected = draft.date === iso;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setDraft({ date: iso, timeSlot: "" })}
                aria-pressed={selected}
                aria-label={formatDateShort(d)}
                className={`flex flex-col items-center gap-1 px-3 py-3 border transition-all duration-200 min-w-16 ${
                  selected
                    ? "bg-[#0EA5E9] border-[#0EA5E9]"
                    : "border-slate-300 bg-white hover:border-[#0EA5E9]/40"
                }`}
              >
                <span className={`text-[10px] font-bold tracking-widest uppercase ${selected ? "text-[#0F172A]/70" : "text-slate-600"}`}>
                  {d.toLocaleDateString("en", { weekday: "short" })}
                </span>
                <span
                  className={`text-xl font-black leading-none ${selected ? "text-[#0F172A]" : "text-slate-900"}`}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {d.getDate()}
                </span>
                <span className={`text-[10px] font-medium ${selected ? "text-[#0F172A]/60" : "text-slate-600"}`}>
                  {d.toLocaleDateString("en", { month: "short" })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slot picker */}
      {draft.date && (
        <div>
          <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4" id="time-label">
            Select Time Slot
            {slotsLoading && (
              <Loader2 size={11} className="inline ml-2 animate-spin text-[#0EA5E9]" aria-label="Loading available slots" />
            )}
          </h3>
          <div
            className="grid grid-cols-3 sm:grid-cols-4 gap-2"
            role="group"
            aria-labelledby="time-label"
          >
            {TIME_SLOTS.map((slot) => {
              const isAvailable = availableSlots.includes(slot);
              const selected = draft.timeSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => isAvailable && setDraft({ timeSlot: slot })}
                  disabled={!isAvailable}
                  aria-pressed={selected}
                  aria-label={`${slot}${!isAvailable ? " — unavailable" : ""}`}
                  className={`py-2.5 px-2 text-xs font-bold tracking-wide border transition-all duration-150 ${
                    !isAvailable
                      ? "border-slate-200 text-slate-400 cursor-not-allowed line-through bg-transparent"
                      : selected
                      ? "bg-[#0EA5E9] border-[#0EA5E9] text-[#0F172A]"
                      : "border-slate-300 text-slate-700 hover:border-[#0EA5E9]/40 hover:text-slate-900 bg-white"
                  }`}
                >
                  {formatTimeSlot(slot)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

// ── Step 3 — Payment method ───────────────────────────────────────────────────
const StepPayment = memo(function StepPayment({ draft, setDraft }) {
  const [uploadError, setUploadError] = useState("");
  const manualPaymentSelected = isManualPaymentMethod(draft.paymentMethod);

  const handleMethodSelect = (method) => {
    const shouldClearManualFields = !isManualPaymentMethod(method);
    setDraft({
      paymentMethod: method,
      ...(shouldClearManualFields ? { paymentProofImage: "", transactionId: "" } : {}),
    });
    setUploadError("");
  };

  const handleProofFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file (PNG/JPG/WebP).");
      return;
    }

    if (file.size > 1024 * 1024) {
      setUploadError("Image is too large. Keep it under 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraft({ paymentProofImage: String(reader.result || "") });
      setUploadError("");
    };
    reader.onerror = () => {
      setUploadError("Could not read the image. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 leading-relaxed">
        Select how you'd like to pay. JazzCash and Easypaisa bookings stay pending until admin verifies your screenshot.
      </p>
      <fieldset className="flex flex-col gap-4 border-0 p-0 m-0">
        <legend className="sr-only">Payment method</legend>
        {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => {
          const selected = draft.paymentMethod === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleMethodSelect(id)}
              aria-pressed={selected}
              className={`flex items-center gap-4 p-5 border text-left transition-all duration-200 ${
                selected
                  ? "border-[#0EA5E9] bg-[#0EA5E9]/5"
                  : "border-slate-200 bg-white hover:border-[#0EA5E9]/40"
              }`}
            >
              <div className={`w-10 h-10 flex items-center justify-center border transition-all duration-200 ${
                selected ? "bg-[#0EA5E9] border-[#0EA5E9]" : "bg-[#0EA5E9]/10 border-[#0EA5E9]/20"
              }`}>
                <Icon size={17} className={selected ? "text-[#0F172A]" : "text-[#0EA5E9]"} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${selected ? "text-[#0EA5E9]" : "text-slate-900"}`}>{label}</p>
                <p className="text-xs text-slate-600 mt-0.5">{desc}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  selected ? "border-[#0EA5E9]" : "border-white/20"
                }`}
                aria-hidden="true"
              >
                {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9]" />}
              </div>
            </button>
          );
        })}
      </fieldset>

      {manualPaymentSelected && (
        <div className="border border-[#0EA5E9]/30 bg-[#0EA5E9]/5 p-4 flex flex-col gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-[#0EA5E9]">Transfer Details</p>
            <p className="text-sm text-slate-900 mt-2">
              Send payment to <strong>{draft.paymentMethod === "jazzcash" ? "JazzCash" : "Easypaisa"}</strong> number:
              <span className="ml-2 font-black tracking-wider">{MANUAL_WALLET_NUMBERS[draft.paymentMethod]}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="payment-transaction" className="text-xs font-bold tracking-widest uppercase text-slate-500">
              Transaction ID <span className="normal-case tracking-normal font-normal text-slate-700">(optional)</span>
            </label>
            <input
              id="payment-transaction"
              value={draft.transactionId || ""}
              onChange={(e) => setDraft({ transactionId: e.target.value })}
              placeholder="e.g. TID-123456"
              className="w-full bg-white border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#0EA5E9] transition-colors duration-200"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="payment-proof" className="text-xs font-bold tracking-widest uppercase text-slate-500">
              Payment Screenshot <span className="text-red-400">*</span>
            </label>
            <label htmlFor="payment-proof" className="cursor-pointer w-full border border-dashed border-slate-300 hover:border-[#0EA5E9] px-4 py-4 text-sm text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center gap-3">
              <Upload size={15} className="text-[#0EA5E9]" aria-hidden="true" />
              {draft.paymentProofImage ? "Change uploaded screenshot" : "Upload transfer screenshot"}
            </label>
            <input
              id="payment-proof"
              type="file"
              accept="image/*"
              onChange={handleProofFile}
              className="hidden"
            />
            {draft.paymentProofImage && (
              <img src={draft.paymentProofImage} alt="Payment proof preview" className="w-full max-w-xs border border-slate-300" />
            )}
            {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="flex flex-col gap-2 mt-2">
        <label htmlFor="booking-notes" className="text-xs font-bold tracking-widest uppercase text-slate-500">
          Additional Notes{" "}
          <span className="text-slate-700 normal-case tracking-normal font-normal">(optional)</span>
        </label>
        <textarea
          id="booking-notes"
          value={draft.notes}
          onChange={(e) => setDraft({ notes: e.target.value })}
          placeholder="Any specific concerns, injury history, or requests for the specialist…"
          rows={3}
          className="w-full bg-white border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#0EA5E9] transition-colors duration-200 resize-none"
        />
      </div>
    </div>
  );
});

// ── Step 4 — Confirm & summary ────────────────────────────────────────────────
const StepConfirm = memo(function StepConfirm({ draft }) {
  const payMethod = PAYMENT_METHODS.find((p) => p.id === draft.paymentMethod);
  const PayIcon = payMethod?.icon || CreditCard;
  const manualPaymentSelected = isManualPaymentMethod(draft.paymentMethod);
  const rows = [
    { label: "Service", value: draft.serviceName, icon: Activity },
    { label: "Date", value: draft.date ? formatDateFull(new Date(draft.date)) : "—", icon: Calendar },
    { label: "Time", value: draft.timeSlot || "—", icon: Clock },
    { label: "Price", value: draft.price || "—", icon: Tag },
    { label: "Payment", value: payMethod?.label || "—", icon: PayIcon },
    ...(manualPaymentSelected
      ? [{ label: "Payment Status", value: "Awaiting Admin Verification", icon: AlertCircle }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-slate-500">
        Please review your booking details before confirming.
      </p>
      <dl className="border border-slate-200 divide-y divide-slate-100">
        {rows.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-4 px-5 py-4">
            <Icon size={14} className="text-[#0EA5E9] shrink-0" aria-hidden="true" />
            <dt className="text-xs font-bold tracking-widest uppercase text-slate-600 w-20 shrink-0">{label}</dt>
            <dd className="text-sm text-slate-900 font-semibold">{label === "Time" ? formatTimeSlot(value) : value}</dd>
          </div>
        ))}
      </dl>
      {draft.notes && (
        <div className="p-4 bg-white border border-slate-200">
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-600 mb-2">Notes</p>
          <p className="text-sm text-slate-700 leading-relaxed">{draft.notes}</p>
        </div>
      )}
      <p className="text-xs text-slate-600 leading-relaxed">
        By confirming, you agree to our cancellation policy. Cancellations must be made 24 hours in advance for a full refund.
      </p>
    </div>
  );
});

// ── Main BookingProcess ───────────────────────────────────────────────────────
export default function BookingProcess() {
  const navigate = useNavigate();
  const { draft, setDraft, clearDraft, createBooking } = useContext(BookingContext);
  const { success: showSuccessToast, error: showErrorToast, info: showInfoToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  // Validation per step
  const canProceed = useCallback(() => {
    if (currentStep === 1) return !!draft.serviceId;
    if (currentStep === 2) return !!draft.date && !!draft.timeSlot;
    if (currentStep === 3) {
      if (!draft.paymentMethod) return false;
      if (isManualPaymentMethod(draft.paymentMethod)) return Boolean(draft.paymentProofImage);
      return true;
    }
    return true;
  }, [currentStep, draft.serviceId, draft.date, draft.timeSlot, draft.paymentMethod, draft.paymentProofImage]);

  const goNext = useCallback(() => {
    if (canProceed() && currentStep < 4) setCurrentStep((s) => s + 1);
  }, [canProceed, currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  // Keyboard navigation: Enter to advance, Backspace/Escape to go back
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === "Enter") goNext();
      if (e.key === "ArrowLeft" || e.key === "Backspace") goBack();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goBack]);

  // Keep hook order stable across renders; only run body when success flips true.
  useEffect(() => {
    if (!success) return;
    showSuccessToast(`Booking confirmed for ${draft.serviceName}! 🎉`);
    showInfoToast("Confirmation email has been sent to your registered email address");
  }, [success, draft.serviceName, showSuccessToast, showInfoToast]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await createBooking(draft);
      if (result.success) {
        setSuccess(true);
      } else {
        const errorMsg = result.error || "Booking failed. Please try again.";
        setSubmitError(errorMsg);
        showErrorToast(errorMsg);
      }
    } catch (error) {
      const errorMsg = "An unexpected error occurred. Please try again.";
      setSubmitError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_TITLES = {
    1: "CHOOSE A SERVICE",
    2: "SELECT DATE & TIME",
    3: "PAYMENT DETAILS",
    4: "REVIEW & CONFIRM",
  };

  // ── Success screen ─────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-[80vh] bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="text-center flex flex-col items-center gap-6 max-w-md" role="status" aria-live="polite">
          <div className="w-20 h-20 flex items-center justify-center bg-[#0EA5E9]">
            <CalendarCheck size={36} className="text-[#0F172A]" strokeWidth={2} aria-hidden="true" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#0EA5E9]">
              Booking Confirmed
            </span>
            <h2
              className="mt-2 text-4xl font-black text-slate-900"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              YOU'RE ALL SET!
            </h2>
            <p className="mt-3 text-slate-500 text-sm leading-relaxed">
              Your appointment for <strong className="text-slate-900">{draft.serviceName}</strong> on{" "}
              <strong className="text-slate-900">{draft.date ? formatDateFull(new Date(draft.date)) : "—"}</strong> at{" "}
              <strong className="text-slate-900">{formatTimeSlot(draft.timeSlot)}</strong>{" "}
              {isManualPaymentMethod(draft.paymentMethod)
                ? "has been submitted and is now pending payment verification by admin."
                : "has been confirmed."}
              A confirmation email is on its way.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-[#0EA5E9] text-[#0F172A] font-bold text-sm tracking-widest uppercase hover:bg-white transition-colors duration-200"
            >
              View Dashboard
            </button>
            <button
              onClick={() => { clearDraft(); setCurrentStep(1); setSuccess(false); }}
              className="px-6 py-3 border border-slate-300 text-slate-700 font-bold text-sm tracking-widest uppercase hover:text-slate-900 hover:border-slate-400 transition-all duration-200"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="bg-[#F1F5F9] border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#0EA5E9]">
            Online Booking
          </span>
          <h1
            className="mt-2 text-4xl font-black text-slate-900"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            BOOK YOUR SESSION
          </h1>
          <p className="mt-2 text-slate-500 text-sm">
            Complete the steps below to secure your appointment.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">

        {/* Step indicator */}
        <div className="flex justify-center">
          <StepIndicator currentStep={currentStep} />
        </div>

        {/* Step content card */}
        <div className="border border-slate-200 bg-white" role="region" aria-label={STEP_TITLES[currentStep]}>
          <div className="px-6 py-5 border-b border-slate-200">
            <h2
              className="text-xl font-black text-slate-900"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {STEP_TITLES[currentStep]}
            </h2>
          </div>
          <div className="p-6">
            {currentStep === 1 && <StepService draft={draft} setDraft={setDraft} />}
            {currentStep === 2 && <StepDateTime draft={draft} setDraft={setDraft} />}
            {currentStep === 3 && <StepPayment draft={draft} setDraft={setDraft} />}
            {currentStep === 4 && <StepConfirm draft={draft} />}
          </div>
        </div>

        {/* Submit error */}
        {submitError && (
          <div
            className="flex items-center gap-3 p-4 border border-red-500/20 bg-red-500/5 text-red-400 text-sm"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
            {submitError}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-5 py-3 border border-slate-300 text-slate-700 text-sm font-bold tracking-widest uppercase hover:text-slate-900 hover:border-slate-400 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Go to previous step"
          >
            <ChevronLeft size={15} aria-hidden="true" /> Back
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-2" role="presentation" aria-hidden="true">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-1.5 transition-all duration-300 ${
                  s.id === currentStep
                    ? "w-6 bg-[#0EA5E9]"
                    : s.id < currentStep
                    ? "w-3 bg-[#0EA5E9]/50"
                    : "w-3 bg-slate-300"
                }`}
              />
            ))}
          </div>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              aria-label={`Proceed to step ${currentStep + 1}: ${STEPS[currentStep]?.label}`}
              className="flex items-center gap-2 px-6 py-3 bg-[#0EA5E9] text-[#0F172A] text-sm font-bold tracking-widest uppercase hover:bg-white transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={15} strokeWidth={2.5} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              aria-busy={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-[#0EA5E9] text-[#0F172A] text-sm font-bold tracking-widest uppercase hover:bg-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Confirming…</>
              ) : (
                <><Check size={15} strokeWidth={3} aria-hidden="true" /> Confirm Booking</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
