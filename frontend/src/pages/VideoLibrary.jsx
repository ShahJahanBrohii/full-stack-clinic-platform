import { useState, useEffect, useCallback, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  PlayCircle,
  CheckCircle2,
  Search,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Filter,
  BookOpen,
  Dumbbell,
  Activity,
  Brain,
  Waves,
  Zap,
  ChevronRight,
} from "lucide-react";
import { videosAPI, videoProgressAPI } from "../services/api";

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",            label: "All Videos",     icon: PlayCircle },
  { id: "mobility",       label: "Mobility",        icon: Waves },
  { id: "strength",       label: "Strength",        icon: Dumbbell },
  { id: "rehabilitation", label: "Rehabilitation",  icon: Activity },
  { id: "conditioning",   label: "Conditioning",    icon: Zap },
  { id: "recovery",       label: "Recovery",        icon: Brain },
  { id: "education",      label: "Education",       icon: BookOpen },
];

const DIFFICULTIES = ["all", "beginner", "intermediate", "advanced"];

// ── Difficulty badge config — all static class strings ────────────────────────
const DIFFICULTY_CONFIG = {
  beginner:     { label: "Beginner",     color: "text-info bg-info/10 border-info/20" },
  intermediate: { label: "Intermediate", color: "text-warning bg-warning/10 border-warning/20" },
  advanced:     { label: "Advanced",     color: "text-error bg-error/10 border-error/20" },
};

// ── Video thumbnail placeholder ────────────────────────────────────────────────
function VideoThumbnail({ category }) {
  const catConfig = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
  const Icon = catConfig.icon;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary">
      <div
        className="absolute inset-0 opacity-[0.06]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="relative flex flex-col items-center gap-2 opacity-30" aria-hidden="true">
        <Icon size={32} className="text-primary" strokeWidth={1.5} />
      </div>
    </div>
  );
}

function parseDurationToSeconds(duration) {
  if (typeof duration === "number" && Number.isFinite(duration)) return duration;
  const value = String(duration || "").toLowerCase().trim();
  if (!value) return 0;

  const minMatch = value.match(/(\d+(?:\.\d+)?)\s*min/);
  if (minMatch) return Math.round(Number(minMatch[1]) * 60);

  const secMatch = value.match(/(\d+(?:\.\d+)?)\s*sec/);
  if (secMatch) return Math.round(Number(secMatch[1]));

  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : 0;
}

function getEmbedUrl(video) {
  const source = String(video?.videoUrl || video?.youtubeUrl || "").trim();
  if (!source) return "";

  const youtubeIdFromShort = source.match(/youtu\.be\/([^?&/]+)/i)?.[1];
  const youtubeIdFromWatch = source.match(/[?&]v=([^?&/]+)/i)?.[1];
  const youtubeIdFromEmbed = source.match(/youtube\.com\/embed\/([^?&/]+)/i)?.[1];
  const youtubeId = youtubeIdFromShort || youtubeIdFromWatch || youtubeIdFromEmbed;

  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=1`;
  }

  return source;
}

// ── Video card ────────────────────────────────────────────────────────────────
function VideoCard({ video, onPlay, progress }) {
  const { title, category, difficulty, duration, description, views, thumbnail } = video;
  const diffCfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.beginner;
  const progressValue = Math.max(0, Math.min(100, Number(progress?.progress || 0)));
  const completed = Boolean(progress?.isCompleted);

  return (
    <article className="group flex flex-col bg-white border border-slate-200 hover:border-primary/40 transition-all duration-300 overflow-hidden">
      {/* Thumbnail */}
      <div
        className="relative w-full pt-[56.25%] cursor-pointer overflow-hidden"
        onClick={() => onPlay(video)}
        role="button"
        tabIndex={0}
        aria-label={`Play ${title}`}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPlay(video); } }}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <VideoThumbnail category={category} />
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-surface-dark/0 group-hover:bg-surface-dark/40 transition-all duration-300">
          <div className="w-14 h-14 flex items-center justify-center bg-primary opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
            <PlayCircle size={26} className="text-text-primary" fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
          </div>
        </div>
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/80 text-[10px] font-bold text-white">
          <Clock size={9} aria-hidden="true" /> {duration}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-600">
            {category}
          </span>
          <div className="flex items-center gap-1.5">
            {completed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border text-emerald-400 bg-emerald-400/10 border-emerald-400/20">
                <CheckCircle2 size={10} /> Done
              </span>
            )}
            <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border ${diffCfg.color}`}>
              {diffCfg.label}
            </span>
          </div>
        </div>

        <h3
          className="text-sm font-black text-text-primary leading-tight group-hover:text-primary transition-colors duration-200 cursor-pointer"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          onClick={() => onPlay(video)}
        >
          {title}
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 flex-1">{description}</p>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] text-slate-600">
            <span>Progress</span>
            <span className={completed ? "text-emerald-400 font-bold" : "text-slate-500"}>{progressValue}%</span>
          </div>
          <div className="h-1.5 bg-white/5 overflow-hidden">
            <div
              className={completed ? "h-full bg-emerald-400" : "h-full bg-primary"}
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-[10px] text-slate-700">
            {views?.toLocaleString()} views
          </span>
          <button
            onClick={() => onPlay(video)}
            className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-primary hover:text-text-primary transition-colors duration-150"
            aria-label={`Watch ${title}`}
          >
            Watch <ChevronRight size={10} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Video modal ───────────────────────────────────────────────────────────────
function VideoModal({ video, onClose }) {
  const closeRef = useRef(null);
  const openedAtRef = useRef(Date.now());

  const handleClose = useCallback(() => {
    const watchedSeconds = Math.max(1, Math.round((Date.now() - openedAtRef.current) / 1000));
    const totalSeconds = parseDurationToSeconds(video?.duration);
    const watchedPercentage = totalSeconds > 0
      ? Math.min(100, Math.round((watchedSeconds / totalSeconds) * 100))
      : Math.min(100, watchedSeconds * 10);

    onClose({
      watchedSeconds,
      watchedPercentage,
      completed: watchedPercentage >= 85,
    });
  }, [onClose, video]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!video) return null;
  const diffCfg = DIFFICULTY_CONFIG[video.difficulty] || DIFFICULTY_CONFIG.beginner;
  const embedUrl = getEmbedUrl(video);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay-dark/90 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div
        className="relative w-full max-w-3xl bg-surface-dark border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video area */}
        <div className="relative w-full pt-[56.25%] bg-surface-alt">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <>
              <VideoThumbnail category={video.category} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-center px-4">
                  <div className="w-16 h-16 flex items-center justify-center bg-primary">
                    <PlayCircle size={30} className="text-text-primary" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <p className="text-xs text-slate-500">
                    This video source is unavailable right now.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Details */}
        <div className="p-6 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border ${diffCfg.color}`}>
                  {diffCfg.label}
                </span>
                <span className="text-[10px] text-slate-600 flex items-center gap-1">
                  <Clock size={10} aria-hidden="true" /> {video.duration}
                </span>
              </div>
              <h2
                className="text-2xl font-black text-white leading-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {video.title}
              </h2>
            </div>
            <button
              ref={closeRef}
              onClick={handleClose}
              className="p-2 text-slate-600 hover:text-white hover:bg-white/5 transition-colors duration-150 shrink-0"
              aria-label="Close video"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{video.description}</p>
        </div>
      </div>
    </div>
  );
}

// ── Search debounce hook ──────────────────────────────────────────────────────
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Main VideoLibrary ─────────────────────────────────────────────────────────
export default function VideoLibrary() {
  const [allVideos, setAllVideos] = useState([]); // full dataset — never mutated by filters
  const [progressByVideoId, setProgressByVideoId] = useState({});
  const [progressSummary, setProgressSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressError, setProgressError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDifficulty, setActiveDifficulty] = useState("all");
  const [activeVideo, setActiveVideo] = useState(null);
  const debouncedSearch = useDebounce(searchQuery, 250);
  const hasAuthToken = Boolean(localStorage.getItem("apex_token"));

  // Single fetch on mount — no re-fetch on filter change (filters run client-side)
  const loadVideos = useCallback(() => {
    setLoading(true);
    setError("");
    videosAPI.getAll()
      .then((res) => setAllVideos(res.data.videos ?? []))
      .catch(() => {
        setAllVideos([]);
        setError("Unable to load videos right now. Please retry in a moment.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  useEffect(() => {
    if (!localStorage.getItem("apex_token")) return;

    let cancelled = false;
    videoProgressAPI.getAll()
      .then((res) => {
        if (cancelled) return;
        const items = res?.data?.progress || [];
        const mapped = items.reduce((acc, item) => {
          const videoId = item.videoId?._id || item.videoId;
          if (videoId) acc[videoId] = item;
          return acc;
        }, {});
        setProgressByVideoId(mapped);
      })
      .catch(() => {
        if (!cancelled) setProgressByVideoId({});
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hasAuthToken) {
      setProgressSummary(null);
      return;
    }

    let cancelled = false;
    setProgressError("");
    videoProgressAPI.getSummary()
      .then((res) => {
        if (cancelled) return;
        setProgressSummary(res?.data?.stats || {
          totalVideos: 0,
          completedVideos: 0,
          totalWatchTime: 0,
          avgProgress: 0,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setProgressSummary({
          totalVideos: 0,
          completedVideos: 0,
          totalWatchTime: 0,
          avgProgress: 0,
        });
        setProgressError("Your video progress summary is temporarily unavailable.");
      });

    return () => { cancelled = true; };
  }, [hasAuthToken]);

  // All filtering is done client-side — no extra API calls
  const filtered = allVideos.filter((v) => {
    const matchesCategory = activeCategory === "all" || v.category === activeCategory;
    const matchesDifficulty = activeDifficulty === "all" || v.difficulty === activeDifficulty;
    const q = debouncedSearch.toLowerCase();
    const matchesSearch =
      !q ||
      v.title.toLowerCase().includes(q) ||
      v.description?.toLowerCase().includes(q);
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const hasActiveFilters = searchQuery || activeDifficulty !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setActiveCategory("all");
    setActiveDifficulty("all");
  };

  const handleVideoClose = useCallback(async (watchMeta) => {
    const closingVideo = activeVideo;
    setActiveVideo(null);

    if (!closingVideo?._id || !watchMeta || !localStorage.getItem("apex_token")) return;

    try {
      await videoProgressAPI.updateProgress({
        videoId: closingVideo._id,
        watchedDuration: watchMeta.watchedSeconds,
        watchedPercentage: watchMeta.watchedPercentage,
        completed: watchMeta.completed,
      });

      setProgressByVideoId((prev) => {
        const existing = prev[closingVideo._id] || {};
        const mergedProgress = Math.max(
          Number(existing.progress || 0),
          Number(watchMeta.watchedPercentage || 0)
        );
        const mergedCompleted = Boolean(existing.isCompleted) || Boolean(watchMeta.completed);
        return {
          ...prev,
          [closingVideo._id]: {
            ...existing,
            progress: mergedProgress,
            isCompleted: mergedCompleted,
          },
        };
      });
    } catch {
      // Progress tracking is best-effort and should never block playback.
    }
  }, [activeVideo]);

  return (
    <div className="bg-bg-dark min-h-screen">
      {/* Modal */}
      {activeVideo && (
        <VideoModal video={activeVideo} onClose={handleVideoClose} />
      )}

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="bg-bg-secondary border-b border-slate-200 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-primary">
            Exercise Library
          </span>
          <h1
            className="mt-3 text-5xl lg:text-6xl font-black text-primary leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            VIDEO LIBRARY
          </h1>
          <p className="mt-4 text-text-secondary text-base max-w-xl leading-relaxed">
            Clinician-approved exercise videos for rehab, mobility, strength, and recovery. Access your personalised programme or explore the full library.
          </p>

          {/* Search bar */}
          <div className="mt-7 relative max-w-lg">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" aria-hidden="true" />
            <label htmlFor="video-search" className="sr-only">Search exercise videos</label>
            <input
              id="video-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises, body parts, conditions…"
              className="w-full bg-white border border-slate-300 pl-11 pr-10 py-3 text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary transition-colors duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-text-primary transition-colors duration-150"
                aria-label="Clear search"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Progress summary ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {hasAuthToken ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 p-4 border border-slate-200 bg-white">
            <div className="p-4 border border-slate-200 bg-slate-50">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Videos tracked</p>
              <p className="mt-1 text-3xl font-black text-slate-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {progressSummary?.totalVideos ?? 0}
              </p>
            </div>
            <div className="p-4 border border-slate-200 bg-slate-50">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Completed</p>
              <p className="mt-1 text-3xl font-black text-slate-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {progressSummary?.completedVideos ?? 0}
              </p>
            </div>
            <div className="p-4 border border-slate-200 bg-slate-50">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Average progress</p>
              <p className="mt-1 text-3xl font-black text-slate-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {Math.round(progressSummary?.avgProgress || 0)}%
              </p>
            </div>
            <div className="p-4 border border-slate-200 bg-slate-50">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Watch time</p>
              <p className="mt-1 text-3xl font-black text-slate-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {Math.round((progressSummary?.totalWatchTime || 0) / 60)} min
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 p-4 border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Sign in to track progress</p>
              <p className="text-xs text-slate-600 mt-1">Your watched videos and completion summary will appear here after login.</p>
            </div>
            <NavLink
              to="/login"
              className="px-4 py-2 text-xs font-bold tracking-widest uppercase bg-primary text-text-primary hover:bg-white transition-colors duration-150 shrink-0"
            >
              Sign in
            </NavLink>
          </div>
        )}
        {hasAuthToken && progressError && (
          <div className="mt-3 flex items-center gap-2 p-3 border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs">
            <AlertCircle size={13} className="shrink-0" />
            {progressError}
          </div>
        )}
      </div>

      {/* ── Sticky filter bar ────────────────────────────────── */}
      <div className="sticky top-16.75 z-30 bg-bg-dark/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-none">
            {/* Category filters */}
            <div role="group" aria-label="Filter by category" className="flex items-center gap-1">
              {CATEGORIES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveCategory(id)}
                  aria-pressed={activeCategory === id}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest uppercase whitespace-nowrap border transition-all duration-200 ${
                    activeCategory === id
                      ? "bg-primary text-text-primary border-primary"
                      : "border-slate-300 text-text-muted hover:text-text-primary hover:border-slate-400"
                  }`}
                >
                  <Icon size={11} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            {/* Difficulty filter — separated */}
            <div className="ml-auto flex items-center gap-2 pl-4 border-l border-white/5 shrink-0" role="group" aria-label="Filter by difficulty">
              <Filter size={11} className="text-slate-600" aria-hidden="true" />
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDifficulty(d)}
                  aria-pressed={activeDifficulty === d}
                  className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap border transition-all duration-150 ${
                    activeDifficulty === d
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "border-transparent text-slate-600 hover:text-slate-400"
                  }`}
                >
                  {d === "all" ? "All Levels" : d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Results bar ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex items-center justify-between gap-4">
        <p className="text-xs text-slate-600" aria-live="polite" aria-atomic="true">
          {loading ? "Loading…" : (
            <>
              <span className="text-text-primary font-semibold">{filtered.length}</span>{" "}
              video{filtered.length !== 1 ? "s" : ""}
              {debouncedSearch && (
                <> matching <span className="text-primary">"{debouncedSearch}"</span></>
              )}
            </>
          )}
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-slate-600 hover:text-primary transition-colors duration-150 flex items-center gap-1.5 font-semibold"
            aria-label="Clear all active filters"
          >
            <X size={11} aria-hidden="true" /> Clear filters
          </button>
        )}
      </div>

      {/* ── Video grid ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {loading ? (
          <div
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            aria-label="Loading videos"
            aria-busy="true"
          >
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-0 border border-white/5 overflow-hidden animate-pulse">
                <div className="w-full pt-[56.25%] bg-white/3" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-3 bg-white/3 w-1/3" />
                  <div className="h-4 bg-white/4 w-4/5" />
                  <div className="h-3 bg-white/2 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            className="flex flex-col items-start gap-3 p-5 border border-red-500/20 bg-red-500/5 text-red-400 text-sm"
            role="alert"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={16} className="shrink-0" aria-hidden="true" /> {error}
            </div>
            <button
              onClick={loadVideos}
              className="text-xs font-bold tracking-widest uppercase text-primary hover:text-text-primary transition-colors duration-150"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed border-white/8"
            role="status"
          >
            <PlayCircle size={32} className="text-slate-700" strokeWidth={1} aria-hidden="true" />
            <div className="text-center">
              <p className="text-sm font-bold text-white">No videos found</p>
              <p className="text-xs text-slate-600 mt-1">
                Try a different category or clear your search filters.
              </p>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-xs font-bold tracking-widest uppercase text-primary hover:text-text-primary transition-colors duration-150"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((video) => (
              <VideoCard
                key={video._id}
                video={video}
                onPlay={setActiveVideo}
                progress={progressByVideoId[video._id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
