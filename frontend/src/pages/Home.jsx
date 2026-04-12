import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronRight,
  Activity,
  Shield,
  Zap,
  Users,
  PlayCircle,
  Star,
  CheckCircle2,
  CalendarCheck,
} from "lucide-react";
import { authAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "1,200+", label: "Athletes Treated" },
  { value: "98%",    label: "Recovery Rate" },
  { value: "8+",     label: "Years Experience" },
  { value: "15+",    label: "Specialised Services" },
];

const SERVICES_PREVIEW = [
  {
    icon: Zap,
    title: "Sports Injury Rehabilitation",
    desc: "Targeted recovery programs for acute and chronic sports injuries, from sprains to post-surgical care.",
    tag: "Most Popular",
  },
  {
    icon: Activity,
    title: "Performance Assessment",
    desc: "Biomechanical analysis and functional movement screening to identify and fix performance-limiting patterns.",
    tag: null,
  },
  {
    icon: Shield,
    title: "Injury Prevention",
    desc: "Evidence-based conditioning protocols designed to keep athletes on the field and out of the clinic.",
    tag: null,
  },
  {
    icon: Users,
    title: "Team & Group Sessions",
    desc: "Group rehabilitation and team-wide injury screening packages for clubs and academies.",
    tag: "New",
  },
];

const PROCESS_STEPS = [
  { step: "01", title: "Get Started",        desc: "Choose a service and pick the best next step for your recovery." },
  { step: "02", title: "Initial Assessment", desc: "Our specialist evaluates your injury, history, and goals." },
  { step: "03", title: "Personalised Plan",  desc: "A structured rehab or performance program built around you." },
  { step: "04", title: "Track & Recover",    desc: "Monitor progress through your dashboard and video library." },
];

const HERO_FEATURE_CARDS = [
  { icon: Zap,        title: "Fast Recovery",      desc: "Accelerate healing with targeted protocols.",        accent: true },
  { icon: Activity,   title: "Performance Gains",  desc: "Biomechanical optimisation to elevate your game.",  accent: false },
  { icon: Shield,     title: "Injury Prevention",  desc: "Stay ahead of injuries before they happen.",        accent: false },
  { icon: PlayCircle, title: "Video Library",      desc: "At-home exercise guides from your specialist.",     accent: false },
];

const TRUST_AVATARS = ["AH", "SR", "BK", "NF"];

// ── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState("0");
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (!start) return;
    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion.current) {
      setCount(target);
      return;
    }
    const numeric = parseFloat(target.replace(/[^0-9.]/g, ""));
    const suffix = target.replace(/[0-9.,]/g, "");
    let startTime = null;
    let raf;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * numeric) + suffix);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);

  return count;
}

// ── Stat card with intersection-triggered counter ────────────────────────────
function StatCard({ value, label }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(value, 1600, visible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1 text-center">
      <span
        className="text-4xl lg:text-5xl font-black text-[#0EA5E9] tabular-nums"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        aria-label={`${value} ${label}`}
      >
        {count}
      </span>
      <span className="text-xs text-slate-500 tracking-[0.15em] uppercase font-medium" aria-hidden="true">
        {label}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [patientStories, setPatientStories] = useState([]);

  useEffect(() => {
    let cancelled = false;
    authAPI
      .getPatientStories({ limit: 6 })
      .then((res) => {
        if (cancelled) return;
        setPatientStories(Array.isArray(res?.data?.stories) ? res.data.stories : []);
      })
      .catch(() => {
        if (!cancelled) setPatientStories([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="overflow-x-hidden">

      {/* ═══ HERO ══════════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-[92vh] flex items-center bg-[#F8FAFC] overflow-hidden"
        aria-label="Hero — Sports injury rehabilitation"
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(#0EA5E9 1px, transparent 1px), linear-gradient(90deg, #0EA5E9 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Lime glow blob */}
        <div className="absolute top-20 right-[15%] w-125 h-125 rounded-full bg-[#0EA5E9]/5 blur-[120px] pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-0 grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div className="flex flex-col gap-8">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 w-fit">
              <span className="h-px w-10 bg-[#0EA5E9]" aria-hidden="true" />
              <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#0EA5E9]">
                Sports Medicine &amp; Rehabilitation
              </span>
            </div>

            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[0.95] tracking-tight"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {isAdmin ? (
                <>
                  RUN
                  <br />
                  <span className="text-[#0EA5E9]">CLINIC OPS.</span>
                  <br />
                  TRACK
                  <br />
                  GROWTH.
                </>
              ) : (
                <>
                  RECOVER
                  <br />
                  <span className="text-[#0EA5E9]">STRONGER.</span>
                  <br />
                  PERFORM
                  <br />
                  BETTER.
                </>
              )}
            </h1>

            <p className="text-slate-600 text-lg leading-relaxed max-w-md">
              {isAdmin
                ? "Monitor bookings, patient progress, and service performance from one central control panel."
                : "Evidence-based sports injury rehabilitation and performance optimisation. Led by Physical Education & Sports Sciences specialists who understand athletes."}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              {!isAdmin ? (
                <NavLink
                  to="/book"
                  className="flex items-center gap-2 px-7 py-4 bg-[#0EA5E9] text-[#0F172A] font-bold text-sm tracking-widest uppercase hover:bg-white transition-colors duration-200"
                >
                  <CalendarCheck size={16} strokeWidth={2.5} aria-hidden="true" />
                  Book Appointment
                </NavLink>
              ) : (
                <NavLink
                  to="/admin"
                  className="flex items-center gap-2 px-7 py-4 bg-[#0EA5E9] text-[#0F172A] font-bold text-sm tracking-widest uppercase hover:bg-white transition-colors duration-200"
                >
                  Open Admin Panel
                </NavLink>
              )}
              <NavLink
                to="/services"
                className="flex items-center gap-2 px-7 py-4 border border-slate-300 text-slate-900 text-sm font-bold tracking-widest uppercase hover:border-[#0EA5E9]/50 hover:text-[#0EA5E9] transition-all duration-200"
              >
                Our Services
                <ChevronRight size={15} aria-hidden="true" />
              </NavLink>
            </div>

            {/* Trust/admin signals */}
            {isAdmin ? (
              <div className="flex items-center gap-2 pt-2" aria-label="Admin focus">
                <span className="text-xs text-slate-500 tracking-widest uppercase">Admin Mode Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-6 pt-2" aria-label="Social proof — trusted by over 1,200 athletes">
                <div className="flex -space-x-2" aria-hidden="true">
                  {TRUST_AVATARS.map((initials) => (
                    <div
                      key={initials}
                      className="w-9 h-9 rounded-full bg-linear-to-br from-slate-200 to-slate-300 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-700"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1" aria-hidden="true">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} fill="#0EA5E9" className="text-[#0EA5E9]" />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">
                    Trusted by 1,200+ athletes
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right — feature cards */}
          <div className="hidden lg:grid grid-cols-2 gap-4" aria-hidden="true">
            {HERO_FEATURE_CARDS.map(({ icon: Icon, title, desc, accent }) => (
              <div
                key={title}
                className={`p-6 border flex flex-col gap-3 group transition-all duration-300 hover:-translate-y-1 ${
                  accent
                    ? "bg-[#0EA5E9] border-[#0EA5E9] col-span-2"
                    : "bg-white border-slate-200 hover:border-[#0EA5E9]/30"
                }`}
              >
                <Icon size={22} strokeWidth={2} className={accent ? "text-[#0F172A]" : "text-[#0EA5E9]"} />
                <div>
                  <h3
                    className={`font-black text-lg leading-tight ${accent ? "text-[#0F172A]" : "text-slate-900"}`}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {title}
                  </h3>
                  <p className={`text-sm mt-1 leading-relaxed ${accent ? "text-[#0F172A]/70" : "text-slate-600"}`}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═════════════════════════════════════════════════════════ */}
      <section className="bg-[#F1F5F9] border-y border-slate-200" aria-label="Clinic statistics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* ═══ SERVICES PREVIEW ══════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] py-24 lg:py-32" aria-labelledby="services-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#0EA5E9]">
                What We Treat
              </span>
              <h2
                id="services-heading"
                className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                SPECIALIST SERVICES
                <br />
                <span className="text-slate-500">FOR SERIOUS ATHLETES</span>
              </h2>
            </div>
            <NavLink
              to="/services"
              className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-[#0EA5E9] hover:text-slate-900 transition-colors duration-200 shrink-0"
            >
              All Services
              <ArrowUpRight size={15} aria-hidden="true" />
            </NavLink>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES_PREVIEW.map(({ icon: Icon, title, desc, tag }) => (
              <article
                key={title}
                className="relative p-6 bg-white border border-slate-200 flex flex-col gap-5 group hover:border-[#0EA5E9]/40 hover:bg-[#0EA5E9]/3 transition-all duration-300"
              >
                {tag && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-[#0EA5E9] text-[#0F172A]">
                    {tag}
                  </span>
                )}
                <div className="w-10 h-10 flex items-center justify-center bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 group-hover:bg-[#0EA5E9] group-hover:border-[#0EA5E9] transition-all duration-300">
                  <Icon size={18} className="text-[#0EA5E9] group-hover:text-[#0F172A] transition-colors duration-300" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <h3
                    className="text-lg font-black text-slate-900 leading-tight"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
                </div>
                <NavLink
                  to="/services"
                  className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-slate-600 group-hover:text-[#0EA5E9] transition-colors duration-200"
                  aria-label={`Learn more about ${title}`}
                >
                  Learn More <ChevronRight size={12} aria-hidden="true" />
                </NavLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ══════════════════════════════════════════════════════ */}
      <section className="bg-[#F1F5F9] border-y border-slate-200 py-24 lg:py-32" aria-labelledby="process-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#0EA5E9]">
              Simple Process
            </span>
            <h2
              id="process-heading"
              className="mt-3 text-4xl lg:text-5xl font-black text-slate-900"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              FROM PLAN TO RECOVERY
            </h2>
          </div>

          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative list-none">
            {/* Connector line (desktop only) */}
            <div
              className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-linear-to-r from-transparent via-[#0EA5E9]/30 to-transparent"
              aria-hidden="true"
            />
            {PROCESS_STEPS.map(({ step, title, desc }) => (
              <li key={step} className="flex flex-col gap-4 relative">
                <div
                  className="w-16 h-16 flex items-center justify-center border border-[#0EA5E9]/30 bg-[#0EA5E9]/5 relative z-10"
                  aria-hidden="true"
                >
                  <span
                    className="text-2xl font-black text-[#0EA5E9]"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {step}
                  </span>
                </div>
                <h3
                  className="text-xl font-black text-slate-900"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ══════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] py-24 lg:py-32" aria-labelledby="testimonials-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#0EA5E9]">
              Patient Stories
            </span>
            <h2
              id="testimonials-heading"
              className="mt-3 text-4xl lg:text-5xl font-black text-slate-900"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              RESULTS THAT SPEAK
            </h2>
          </div>

          {patientStories.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {patientStories.map(({ id, name, condition, story }) => (
              <blockquote
                key={id}
                className="p-7 bg-white border border-slate-200 flex flex-col gap-5 hover:border-[#0EA5E9]/30 transition-colors duration-300"
              >
                <p className="text-slate-700 text-sm leading-relaxed flex-1">
                  "{story}"
                </p>
                <footer className="flex flex-col gap-0.5 pt-2 border-t border-slate-200">
                  <cite className="text-sm font-bold text-slate-900 not-italic">{name}</cite>
                  <span className="text-xs text-slate-600 uppercase tracking-widest">{condition || "Patient"}</span>
                </footer>
              </blockquote>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-600">Patient stories will appear here as patients share their recovery experience.</p>
          )}
        </div>
      </section>

      {/* ═══ FINAL CTA ════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] py-20 relative overflow-hidden" aria-label={isAdmin ? "Call to action — admin workflow" : "Call to action — start your recovery"}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <h2
              className="text-4xl lg:text-5xl font-black text-[#0F172A] leading-tight"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {isAdmin ? (
                <>
                  MANAGE CLINIC
                  <br />
                  TODAY.
                </>
              ) : (
                <>
                  START YOUR RECOVERY
                  <br />
                  TODAY.
                </>
              )}
            </h2>
            <p className="mt-3 text-[#0F172A]/60 text-base max-w-md">
              {isAdmin
                ? "Manage appointments, services, and patient operations from your admin workspace."
                : "Don't let an injury define your season. Book a consultation and take the first step back to full performance."}
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            {!isAdmin ? (
              <>
                <NavLink
                  to="/book"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-[#0F172A] text-white font-bold text-sm tracking-widest uppercase hover:bg-[#0a1628] transition-colors duration-200"
                >
                  <CalendarCheck size={16} strokeWidth={2.5} aria-hidden="true" />
                  Book Now
                </NavLink>
                <NavLink
                  to="/register"
                  className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#0F172A]/30 text-[#0F172A] font-bold text-sm tracking-widest uppercase hover:border-[#0F172A] transition-colors duration-200"
                >
                  Create Account
                  <ArrowUpRight size={14} aria-hidden="true" />
                </NavLink>
              </>
            ) : (
              <NavLink
                to="/admin"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-[#0F172A] text-white font-bold text-sm tracking-widest uppercase hover:bg-[#0a1628] transition-colors duration-200"
              >
                Open Admin Panel
                <ArrowUpRight size={14} aria-hidden="true" />
              </NavLink>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
