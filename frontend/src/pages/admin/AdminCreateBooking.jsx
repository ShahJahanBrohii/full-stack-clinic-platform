import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AlertCircle, ChevronLeft, Loader2, Save } from "lucide-react";
import api from "../../services/api";

const INPUT_CLASS = "w-full bg-white/60 border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[accent] transition-colors";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
];

export default function AdminCreateBooking() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [form, setForm] = useState({
    patientId: "",
    serviceId: "",
    date: "",
    timeSlot: "",
    consultationType: "in_person",
    paymentMethod: "cash",
    paymentStatus: "pending",
    status: "pending",
    sessionLink: "",
    transactionId: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadingLookups(true);

    Promise.all([
      api.get("/admin/patients"),
      api.get("/admin/services"),
    ])
      .then(([patientsRes, servicesRes]) => {
        if (cancelled) return;
        setPatients(patientsRes.data.patients ?? []);
        setServices((servicesRes.data.services ?? []).filter((service) => service.isActive !== false));
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load patients or services.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingLookups(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(() => {
    return Boolean(form.patientId && form.serviceId && form.date && form.timeSlot);
  }, [form.patientId, form.serviceId, form.date, form.timeSlot]);

  const onField = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    setError("");

    if (!canSubmit) {
      setError("Patient, service, date, and time slot are required.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/admin/bookings", form);
      navigate("/admin/bookings", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to create booking.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[accent]">Management</span>
          <h1 className="mt-1 text-3xl font-black text-slate-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            CREATE BOOKING
          </h1>
        </div>
        <NavLink
          to="/admin/bookings"
          className="flex items-center gap-2 px-4 py-2 border border-white/10 text-slate-500 text-xs font-bold tracking-widest uppercase hover:text-slate-900 hover:border-slate-400 transition-colors"
        >
          <ChevronLeft size={12} /> Back to Bookings
        </NavLink>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {loadingLookups ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-[accent]" />
        </div>
      ) : (
        <div className="border border-white/8 bg-white/1 p-5 lg:p-6 flex flex-col gap-5 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Patient">
              <select value={form.patientId} onChange={onField("patientId")} className={INPUT_CLASS}>
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>{patient.name} - {patient.email}</option>
                ))}
              </select>
            </Field>

            <Field label="Service">
              <select value={form.serviceId} onChange={onField("serviceId")} className={INPUT_CLASS}>
                <option value="">Select service</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>{service.title || service.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Date">
              <input type="date" value={form.date} onChange={onField("date")} className={INPUT_CLASS} />
            </Field>

            <Field label="Time Slot">
              <select value={form.timeSlot} onChange={onField("timeSlot")} className={INPUT_CLASS}>
                <option value="">Select time slot</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </Field>

            <Field label="Consultation Type">
              <select value={form.consultationType} onChange={onField("consultationType")} className={INPUT_CLASS}>
                <option value="in_person">In Person</option>
                <option value="online">Online</option>
              </select>
            </Field>

            <Field label="Status">
              <select value={form.status} onChange={onField("status")} className={INPUT_CLASS}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>

            <Field label="Payment Method">
              <select value={form.paymentMethod} onChange={onField("paymentMethod")} className={INPUT_CLASS}>
                <option value="cash">cash</option>
                <option value="card">card</option>
                <option value="jazzcash">jazzcash</option>
                <option value="easypaisa">easypaisa</option>
              </select>
            </Field>

            <Field label="Payment Status">
              <select value={form.paymentStatus} onChange={onField("paymentStatus")} className={INPUT_CLASS}>
                <option value="pending">pending</option>
                <option value="under_review">under_review</option>
                <option value="completed">completed</option>
                <option value="failed">failed</option>
              </select>
            </Field>

            <Field label="Transaction ID">
              <input value={form.transactionId} onChange={onField("transactionId")} className={INPUT_CLASS} placeholder="Optional" />
            </Field>

            <Field label="Session Link">
              <input value={form.sessionLink} onChange={onField("sessionLink")} className={INPUT_CLASS} placeholder="Required for online sessions" />
            </Field>
          </div>

          <Field label="Notes">
            <textarea rows={3} value={form.notes} onChange={onField("notes")} className={`${INPUT_CLASS} resize-none`} placeholder="Optional internal notes" />
          </Field>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={saving || !canSubmit}
              className="flex items-center gap-2 px-5 py-2.5 bg-[accent] text-text-primary text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Create Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">{label}</label>
      {children}
    </div>
  );
}
