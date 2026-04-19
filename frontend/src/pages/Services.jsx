import { useState, useId, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  Zap,
  Activity,
  Shield,
  Users,
  Microscope,
  CheckCircle2,
  ArrowUpRight,
  CalendarCheck,
  Clock,
  Tag,
  Search,
  X,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { servicesAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useClinicSettings } from "../context/ClinicSettingsContext";

// ── Services data ─────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Therapy", "Conditions", "Rehabilitation", "Assessment", "Group"];

const SERVICES = [
  {
    id: 1,
    icon: Zap,
    category: "Therapy",
    title: "Dry Needling Therapy",
    tagline: "Relieve muscle pain and restore movement",
    desc: "Focused dry needling treatment to release trigger points, reduce stiffness, and improve mobility with safe clinical technique.",
    duration: "45 – 60 min",
    price: "PKR 3,000",
    tag: "Most Popular",
    features: ["Targeted trigger point release", "Pain reduction support", "Range-of-motion restoration", "Progress-based follow-ups"],
    rating: 4.8,
    reviewCount: 24,
  },
  {
    id: 2,
    icon: Activity,
    category: "Therapy",
    title: "Massage Therapy",
    tagline: "Soft tissue recovery for pain and tension",
    desc: "Hands-on therapeutic massage to improve blood flow, relax tight tissue, and accelerate healing for sports and daily-life strain.",
    duration: "45 – 60 min",
    price: "PKR 2,500",
    tag: null,
    features: ["Soft tissue mobilization", "Muscle tension release", "Improved flexibility", "Recovery-focused care"],
    rating: 4.8,
    reviewCount: 20,
  },
  {
    id: 3,
    icon: Shield,
    category: "Conditions",
    title: "Back Pain Rehabilitation",
    tagline: "Move comfortably with less pain",
    desc: "Clinical rehabilitation for acute and chronic back pain with posture correction, manual therapy, and guided strengthening.",
    duration: "45 min",
    price: "PKR 3,500",
    tag: null,
    features: ["Posture and load assessment", "Pain management techniques", "Core stabilization exercises", "Home plan guidance"],
    rating: 4.7,
    reviewCount: 19,
  },
  {
    id: 4,
    icon: Activity,
    category: "Conditions",
    title: "Neck Pain Rehabilitation",
    tagline: "Restore neck function and comfort",
    desc: "Specialized treatment for cervical pain and stiffness using manual therapy, mobility work, and progressive strengthening.",
    duration: "45 min",
    price: "PKR 3,200",
    tag: null,
    features: ["Cervical mobility improvement", "Muscle spasm management", "Postural correction", "Recurrence prevention plan"],
    rating: 4.8,
    reviewCount: 16,
  },
  {
    id: 5,
    icon: Shield,
    category: "Conditions",
    title: "Sciatica Management",
    tagline: "Reduce radiating pain and numbness",
    desc: "Evidence-based sciatica treatment focused on nerve irritation relief, pain reduction, and safer movement patterns.",
    duration: "45 min",
    price: "PKR 3,500",
    tag: null,
    features: ["Nerve glide protocols", "Lumbar decompression work", "Pain and numbness control", "Functional movement retraining"],
    rating: 4.8,
    reviewCount: 14,
  },
  {
    id: 6,
    icon: Zap,
    category: "Rehabilitation",
    title: "Post Surgical Conditions",
    tagline: "Guided recovery after surgery",
    desc: "Structured rehabilitation to restore strength, mobility, and confidence after orthopedic and soft tissue surgical procedures.",
    duration: "60 min",
    price: "PKR 4,000",
    tag: "New",
    features: ["Post-op protocol alignment", "Joint mobility restoration", "Strength rebuilding", "Functional return planning"],
    rating: 4.8,
    reviewCount: 13,
  },
  {
    id: 7,
    icon: Users,
    category: "Rehabilitation",
    title: "Old Age Rehabilitation",
    tagline: "Safer movement and stronger independence",
    desc: "Gentle and progressive rehabilitation for older adults to improve balance, mobility, and everyday confidence.",
    duration: "45 min",
    price: "PKR 2,800",
    tag: null,
    features: ["Balance and fall-risk support", "Functional strength training", "Mobility enhancement", "Individualized pace of care"],
    rating: 4.7,
    reviewCount: 11,
  },
];

// ── Service card ──────────────────────────────────────────────────────────────
function ServiceCard({ service, isAdmin }) {
  const { icon: Icon, category, title, tagline, desc, duration, price, tag, features, rating, reviewCount } = service;

  return (
    <article className="group relative flex flex-col bg-white/2 border border-white/8 hover:border-accent/40 hover:bg-accent/2 transition-all duration-300">
      {/* Tag badge */}
      {tag && (
        <span className="absolute top-4 right-4 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-gradient-primary text-text-primary z-10">
          {tag}
        </span>
      )}

      <div className="p-7 flex flex-col gap-5 flex-1">
        {/* Icon + category */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-accent/10 border border-accent/20 group-hover:bg-accent group-hover:border-accent transition-all duration-300">
            <Icon
              size={18}
              className="text-accent group-hover:text-text-primary transition-colors duration-300"
              aria-hidden="true"
            />
          </div>
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-600">
            {category}
          </span>
        </div>

        {/* Title + Rating */}
        <div>
          <h3
            className="text-xl font-black text-white leading-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {title}
          </h3>
          <p className="text-accent text-xs font-semibold mt-1 tracking-wide">{tagline}</p>
          
          {/* Rating display */}
          <div className="flex items-center gap-2 mt-2.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-slate-600"}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">
              <span className="font-semibold text-white">{rating}</span> ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>

        {/* Features list */}
        <ul className="flex flex-col gap-2" aria-label={`What's included in ${title}`}>
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-slate-400">
              <CheckCircle2 size={13} className="text-accent shrink-0" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="px-7 py-5 border-t border-white/5 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <Clock size={11} aria-hidden="true" /> {duration}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-bold text-white">
            <Tag size={11} className="text-accent" aria-hidden="true" /> {price}
          </span>
        </div>
        <NavLink
          to={isAdmin ? "/admin/services" : "/book"}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-primary text-text-primary text-xs font-bold tracking-widest uppercase hover:shadow-glow-primary transition-all duration-200 shrink-0"
          aria-label={isAdmin ? `Manage ${title}` : `Book ${title}`}
        >
          {isAdmin ? "Manage" : "Book"}
          <ArrowUpRight size={13} strokeWidth={2.5} aria-hidden="true" />
        </NavLink>
      </div>
    </article>
  );
}

function toTitleCase(value) {
  if (!value) return "Other";
  return String(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function mapServiceForView(service) {
  const fallbackIcon = Activity;
  const category = toTitleCase(service.category);
  const categoryKey = String(category).toLowerCase();

  let icon = fallbackIcon;
  if (categoryKey.includes("rehab")) icon = Zap;
  else if (categoryKey.includes("therap")) icon = Activity;
  else if (categoryKey.includes("condition")) icon = Shield;
  else if (categoryKey.includes("assess")) icon = Microscope;
  else if (categoryKey.includes("prevent")) icon = Shield;
  else if (categoryKey.includes("group") || categoryKey.includes("team")) icon = Users;

  const duration = service.duration
    ? `${service.duration} min`
    : "Flexible";

  const numericPrice = Number(service.price);
  const price = Number.isFinite(numericPrice)
    ? `PKR ${numericPrice.toLocaleString("en-PK")}`
    : String(service.price || "Contact for quote");

  return {
    id: service._id,
    icon,
    category,
    title: service.title || service.name || "Service",
    tagline: service.tagline || "Specialist treatment designed around your goals",
    desc: service.description || "",
    duration,
    price,
    tag: null,
    features: Array.isArray(service.features) && service.features.length
      ? service.features
      : ["Personalised care plan"],
    rating: 4.8,
    reviewCount: 0,
  };
}

// ── Page component ────────────────────────────────────────────────────────────
export default function Services() {
  const { user } = useAuth();
  const { settings } = useClinicSettings();
  const isAdmin = user?.role === "admin";
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiServices, setApiServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const filterId = useId();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await servicesAPI.getAll();
        if (cancelled) return;
        const items = (res.data.services || []).map(mapServiceForView);
        setApiServices(items);
      } catch {
        if (cancelled) return;
        setApiServices([]);
        setLoadError("Live services are temporarily unavailable. Showing clinic catalog.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const sourceServices = apiServices.length > 0 ? apiServices : SERVICES;

  const availableCategories = useMemo(() => {
    const dynamic = Array.from(new Set(sourceServices.map((s) => s.category))).filter(Boolean);
    const ordered = CATEGORIES.filter((cat) => cat !== "All" && dynamic.includes(cat));
    const extra = dynamic.filter((cat) => !ordered.includes(cat));
    return ["All", ...ordered, ...extra];
  }, [sourceServices]);

  useEffect(() => {
    if (!availableCategories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [availableCategories, activeCategory]);

  // Filter by category first, then by search query
  let filtered = activeCategory === "All"
    ? sourceServices
    : sourceServices.filter((s) => s.category === activeCategory);

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((s) =>
      s.title.toLowerCase().includes(query) ||
      s.tagline.toLowerCase().includes(query) ||
      s.desc.toLowerCase().includes(query) ||
      s.features.some((f) => f.toLowerCase().includes(query))
    );
  }

  return (
    <div className="bg-surface-dark min-h-screen">

        <div className="relative overflow-hidden border-b border-white/5 bg-bg-secondary">
        <div
          className="absolute inset-0 opacity-[0.035]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-accent) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-accent">
            What We Offer
          </span>
          <h1
            className="mt-4 text-5xl lg:text-7xl font-black text-slate-900 leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            REHABILITATION SERVICES
          </h1>
          <p className="mt-5 text-slate-600 text-lg max-w-xl leading-relaxed">
            At {settings.clinicName}, every treatment plan is personalized for pain relief, mobility,
            strength, and long-term recovery confidence.
          </p>

          {/* Inline CTA */}
          <div className="mt-8 flex flex-wrap gap-4 items-center">
            {!isAdmin ? (
              <NavLink
                to="/book"
                className="flex items-center gap-2 px-7 py-3 bg-gradient-primary text-text-primary font-bold text-sm tracking-widest uppercase hover:shadow-glow-primary transition-all duration-200"
              >
                <CalendarCheck size={15} strokeWidth={2.5} aria-hidden="true" />
                Book a Service
              </NavLink>
            ) : (
              <NavLink
                to="/admin/services"
                className="flex items-center gap-2 px-7 py-3 bg-gradient-primary text-text-primary font-bold text-sm tracking-widest uppercase hover:shadow-glow-primary transition-all duration-200"
              >
                Manage Services
              </NavLink>
            )}
            <p className="text-sm text-slate-600">Need guidance? Call {settings.phone}</p>
          </div>
        </div>
      </div>

      {/* ── Search box ───────────────────────────────────────────── */}
      <div className="bg-surface-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search services by name, feature, or condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/3 border border-white/10 rounded px-4 pl-10 pr-10 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-accent transition-colors duration-200"
              aria-label="Search services"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────── */}
      <div className="sticky top-16.75 z-30 bg-surface-dark/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-none"
            role="tablist"
            aria-label="Filter services by category"
          >
            {availableCategories.map((cat) => {
              const count = cat === "All" ? sourceServices.length : sourceServices.filter((s) => s.category === cat).length;
              const tabId = `${filterId}-tab-${cat}`;
              const panelId = `${filterId}-panel`;
              return (
                <button
                  key={cat}
                  id={tabId}
                  role="tab"
                  aria-selected={activeCategory === cat}
                  aria-controls={panelId}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 text-xs font-bold tracking-widest uppercase whitespace-nowrap transition-all duration-200 border ${
                    activeCategory === cat
                      ? "bg-gradient-primary text-text-primary border-primary-600"
                      : "border-white/10 text-slate-500 hover:text-white hover:border-white/30"
                  }`}
                >
                  {cat}
                  {cat !== "All" && (
                    <span className="ml-2 opacity-60" aria-hidden="true">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
            <span className="ml-auto text-xs text-slate-600 whitespace-nowrap pl-4 shrink-0" aria-live="polite">
              {filtered.length} service{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── Services grid ────────────────────────────────────────── */}
      <div
        id={`${filterId}-panel`}
        role="tabpanel"
        aria-label={`${activeCategory} services`}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20"
      >
        {loading ? (
          <div className="flex items-center justify-center py-24" aria-label="Loading services">
            <Loader2 size={24} className="text-accent animate-spin" />
          </div>
        ) : (
          <>
            {loadError && (
              <div className="mb-6 flex items-center gap-3 p-4 border border-yellow-500/20 bg-yellow-500/5 text-yellow-300 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                {loadError}
              </div>
            )}
            {filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-600" role="status">
            No services in this category.
          </div>
            ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((service) => (
              <ServiceCard key={service.id} service={service} isAdmin={isAdmin} />
            ))}
          </div>
            )}
          </>
        )}
      </div>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <div className="border-t border-white/5 bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3
              className="text-2xl font-black text-slate-900"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {isAdmin ? "NEED TO UPDATE THE CATALOG?" : "CAN'T FIND WHAT YOU NEED?"}
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              {isAdmin
                ? "Adjust services from the admin panel or contact the team for rollout support."
                : "Contact us and we'll build a programme around your specific situation."}
            </p>
          </div>
          <a
            href={`mailto:${settings.clinicEmail}`}
            className="flex items-center gap-2 px-7 py-3 border border-accent/40 text-accent text-sm font-bold tracking-widest uppercase hover:bg-accent hover:text-text-primary transition-all duration-200 shrink-0"
          >
            Get in Touch
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
