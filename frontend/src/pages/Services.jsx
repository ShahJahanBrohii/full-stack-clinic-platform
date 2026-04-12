import { useState, useId, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  Zap,
  Activity,
  Shield,
  Users,
  Brain,
  Dumbbell,
  Waves,
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

// ── Services data ─────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Rehabilitation", "Assessment", "Prevention", "Group"];

const SERVICES = [
  {
    id: 1,
    icon: Zap,
    category: "Rehabilitation",
    title: "Sports Injury Rehabilitation",
    tagline: "From acute injury to full return-to-sport",
    desc: "Structured recovery programs covering everything from sprains and strains to post-surgical rehab. We use evidence-based manual therapy, electrotherapy, and progressive exercise to get you back faster.",
    duration: "45 – 60 min",
    price: "PKR 3,500",
    tag: "Most Popular",
    features: ["Personalised rehab plan", "Progress tracking dashboard", "Home exercise videos", "Return-to-sport testing"],
    rating: 4.8,
    reviewCount: 24,
  },
  {
    id: 2,
    icon: Activity,
    category: "Assessment",
    title: "Biomechanical Performance Analysis",
    tagline: "Understand how your body moves",
    desc: "In-depth movement screening using video analysis to identify compensations, asymmetries, and inefficiencies that limit performance or increase injury risk.",
    duration: "60 – 75 min",
    price: "PKR 4,500",
    tag: null,
    features: ["Video movement analysis", "Written findings report", "Corrective exercise plan", "Follow-up consultation"],
    rating: 4.9,
    reviewCount: 18,
  },
  {
    id: 3,
    icon: Shield,
    category: "Prevention",
    title: "Injury Prevention Programme",
    tagline: "Stay on the field, not the treatment table",
    desc: "A 6–8 week structured conditioning programme built around your sport, position, and individual risk factors. Reduce re-injury rates and build durable athleticism.",
    duration: "50 min / session",
    price: "PKR 8,000 / month",
    tag: null,
    features: ["Sport-specific conditioning", "Neuromuscular training", "Load management guidance", "Monthly re-assessment"],
    rating: 4.7,
    reviewCount: 12,
  },
  {
    id: 4,
    icon: Brain,
    category: "Rehabilitation",
    title: "Concussion & Return-to-Sport",
    tagline: "Safe, phased return after head injuries",
    desc: "Evidence-based concussion management following current protocols. Cognitive and vestibular rehabilitation with a clear, staged return-to-sport pathway.",
    duration: "45 min",
    price: "PKR 4,000",
    tag: null,
    features: ["Cognitive baseline testing", "Vestibular rehab", "Graded exposure protocol", "Clearance documentation"],
    rating: 4.9,
    reviewCount: 9,
  },
  {
    id: 5,
    icon: Dumbbell,
    category: "Rehabilitation",
    title: "Strength & Reconditioning",
    tagline: "Rebuild stronger after injury",
    desc: "Post-rehab strength training supervised by our sports scientist. Bridges the gap between clinical discharge and return to full training loads.",
    duration: "60 min",
    price: "PKR 3,000",
    tag: null,
    features: ["Supervised gym sessions", "Progressive overload planning", "Sports-specific loading", "Nutrition guidance"],
    rating: 4.6,
    reviewCount: 15,
  },
  {
    id: 6,
    icon: Waves,
    category: "Assessment",
    title: "Running Gait Analysis",
    tagline: "Run faster. Run pain-free.",
    desc: "Detailed treadmill-based running analysis with slow-motion video review. Ideal for runners with recurring knee, hip, or foot issues — or those wanting to improve economy.",
    duration: "60 min",
    price: "PKR 5,000",
    tag: "New",
    features: ["Slow-motion video review", "Step rate & cadence analysis", "Footwear recommendations", "Corrective drill programme"],
    rating: 4.8,
    reviewCount: 21,
  },
  {
    id: 7,
    icon: Microscope,
    category: "Assessment",
    title: "Functional Movement Screening",
    tagline: "A full-body movement MOT",
    desc: "The Functional Movement Screen (FMS) identifies movement dysfunctions and asymmetries through seven standardised tests. A 20-minute screen can prevent months on the sidelines.",
    duration: "30 min",
    price: "PKR 2,500",
    tag: null,
    features: ["7-point FMS protocol", "Mobility & stability scoring", "Priority corrective exercises", "Instant results report"],
    rating: 4.7,
    reviewCount: 10,
  },
  {
    id: 8,
    icon: Users,
    category: "Group",
    title: "Team & Academy Packages",
    tagline: "Whole-squad injury care and screening",
    desc: "Tailored packages for sports clubs, school teams, and academies. Includes pre-season screening, in-season management, and post-season recovery planning.",
    duration: "Flexible",
    price: "Contact for quote",
    tag: "For Teams",
    features: ["Pre-season FMS screening", "Match-day injury coverage", "Rehab for squad players", "Coach education session"],
    rating: 4.9,
    reviewCount: 6,
  },
];

// ── Service card ──────────────────────────────────────────────────────────────
function ServiceCard({ service, isAdmin }) {
  const { icon: Icon, category, title, tagline, desc, duration, price, tag, features, rating, reviewCount } = service;

  return (
    <article className="group relative flex flex-col bg-white/2 border border-white/8 hover:border-accent/40 hover:bg-accent/2 transition-all duration-300">
      {/* Tag badge */}
      {tag && (
        <span className="absolute top-4 right-4 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-gradient-primary text-[#0F172A] z-10">
          {tag}
        </span>
      )}

      <div className="p-7 flex flex-col gap-5 flex-1">
        {/* Icon + category */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-accent/10 border border-accent/20 group-hover:bg-accent group-hover:border-accent transition-all duration-300">
            <Icon
              size={18}
              className="text-accent group-hover:text-[#0F172A] transition-colors duration-300"
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
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-primary text-[#0F172A] text-xs font-bold tracking-widest uppercase hover:shadow-glow-primary transition-all duration-200 shrink-0"
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
    <div className="bg-[#0F172A] min-h-screen">

        <div className="relative overflow-hidden border-b border-white/5 bg-[#F1F5F9]">
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
            CLINICAL SERVICES
          </h1>
          <p className="mt-5 text-slate-600 text-lg max-w-xl leading-relaxed">
            From acute injury rehab to performance screening — every service is
            grounded in Sports Sciences evidence and built around your goals.
          </p>

          {/* Inline CTA */}
          <div className="mt-8 flex flex-wrap gap-4 items-center">
            {!isAdmin ? (
              <NavLink
                to="/book"
                className="flex items-center gap-2 px-7 py-3 bg-gradient-primary text-[#0F172A] font-bold text-sm tracking-widest uppercase hover:shadow-glow-primary transition-all duration-200"
              >
                <CalendarCheck size={15} strokeWidth={2.5} aria-hidden="true" />
                Book a Service
              </NavLink>
            ) : (
              <NavLink
                to="/admin/services"
                className="flex items-center gap-2 px-7 py-3 bg-gradient-primary text-[#0F172A] font-bold text-sm tracking-widest uppercase hover:shadow-glow-primary transition-all duration-200"
              >
                Manage Services
              </NavLink>
            )}
            <p className="text-sm text-slate-600">
              Not sure which service?&nbsp;
              <a href="mailto:info@apexclinic.pk" className="text-accent hover:underline">
                Email us
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* ── Search box ───────────────────────────────────────────── */}
      <div className="bg-[#0F172A] border-b border-white/5">
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
      <div className="sticky top-16.75 z-30 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/5">
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
                      ? "bg-gradient-primary text-[#0F172A] border-primary-600"
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
      <div className="border-t border-white/5 bg-[#F1F5F9]">
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
            href="mailto:info@apexclinic.pk"
            className="flex items-center gap-2 px-7 py-3 border border-accent/40 text-accent text-sm font-bold tracking-widest uppercase hover:bg-accent hover:text-[#0F172A] transition-all duration-200 shrink-0"
          >
            Get in Touch
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
