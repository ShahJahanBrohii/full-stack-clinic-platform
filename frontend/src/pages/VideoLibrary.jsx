import { useState, useEffect, useCallback, useRef } from "react";
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
  beginner:     { label: "Beginner",     color: "text-[#0EA5E9] bg-[#0EA5E9]/10 border-[#0EA5E9]/20" },
  intermediate: { label: "Intermediate", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  advanced:     { label: "Advanced",     color: "text-red-400 bg-red-400/10 border-red-400/20" },
};

// ── Mock video data (replaced by API when backend is ready) ───────────────────
const MOCK_VIDEOS = [
  { _id: "1",  title: "Hip Flexor Mobility Flow",                     category: "mobility",       difficulty: "beginner",     duration: "12 min", thumbnail: null, description: "A progressive hip flexor stretching sequence to restore range of motion and reduce anterior hip pain.",                                                      views: 1240 },
  { _id: "2",  title: "Knee Rehab Phase 1 — Range of Motion",         category: "rehabilitation", difficulty: "beginner",     duration: "18 min", thumbnail: null, description: "Post-operative or post-injury knee rehab exercises for early-stage recovery. Focus on gentle ROM restoration.",                                                views: 2100 },
  { _id: "3",  title: "Rotator Cuff Strengthening",                   category: "strength",       difficulty: "intermediate", duration: "22 min", thumbnail: null, description: "Targeted shoulder strengthening program for rotator cuff injuries and impingement syndrome.",                                                                     views: 876  },
  { _id: "4",  title: "Hamstring Eccentric Loading",                  category: "strength",       difficulty: "intermediate", duration: "15 min", thumbnail: null, description: "Nordic hamstring curls and eccentric loading protocols for hamstring strain prevention and rehab.",                                                                 views: 1450 },
  { _id: "5",  title: "Thoracic Spine Mobility",                      category: "mobility",       difficulty: "beginner",     duration: "10 min", thumbnail: null, description: "Open up thoracic extension and rotation to reduce neck and shoulder tension in desk workers and athletes.",                                                       views: 3200 },
  { _id: "6",  title: "ACL Rehab Phase 3 — Plyometrics",              category: "rehabilitation", difficulty: "advanced",     duration: "30 min", thumbnail: null, description: "Return-to-sport plyometric exercises for late-stage ACL rehabilitation. Includes hop tests and landing mechanics.",                                                views: 540  },
  { _id: "7",  title: "Breathing & Recovery Techniques",              category: "recovery",       difficulty: "beginner",     duration: "8 min",  thumbnail: null, description: "Diaphragmatic breathing and parasympathetic activation exercises to speed up recovery between sessions.",                                                          views: 960  },
  { _id: "8",  title: "Ankle Stability Drills",                       category: "conditioning",   difficulty: "intermediate", duration: "14 min", thumbnail: null, description: "Proprioception and balance exercises for ankle sprain prevention and rehabilitation.",                                                                             views: 1100 },
  { _id: "9",  title: "Understanding Tendon Load Management",         category: "education",      difficulty: "beginner",     duration: "11 min", thumbnail: null, description: "Learn how tendons respond to load and how to manage training volume to avoid tendinopathy.",                                                                       views: 780  },
  { _id: "10", title: "Calf Raise Progression for Achilles",          category: "rehabilitation", difficulty: "intermediate", duration: "16 min", thumbnail: null, description: "Graduated calf raise program for Achilles tendinopathy from double-leg to single-leg eccentric loading.",                                                         views: 2300 },
  { _id: "11", title: "Core Anti-Rotation Series",                    category: "conditioning",   difficulty: "intermediate", duration: "20 min", thumbnail: null, description: "Pallof press variations and anti-rotation drills for athletic core stability and injury prevention.",                                                                views: 670  },
  { _id: "12", title: "Concussion Recovery — Vestibular Exercises",   category: "rehabilitation", difficulty: "beginner",     duration: "13 min", thumbnail: null, description: "Gentle vestibular rehabilitation exercises for post-concussion syndrome recovery. Gaze stabilisation and head movements.",                                        views: 430  },
];

// ── Video thumbnail placeholder ────────────────────────────────────────────────
function VideoThumbnail({ category }) {
  const catConfig = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
  const Icon = catConfig.icon;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a1628]">
      <div
        className="absolute inset-0 opacity-[0.06]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(#0EA5E9 1px, transparent 1px), linear-gradient(90deg, #0EA5E9 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="relative flex flex-col items-center gap-2 opacity-30" aria-hidden="true">
        <Icon size={32} className="text-[#0EA5E9]" strokeWidth={1.5} />
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
    <article className="group flex flex-col bg-white/2 border border-white/8 hover:border-[#0EA5E9]/40 transition-all duration-300 overflow-hidden">
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
        <div className="absolute inset-0 flex items-center justify-center bg-[#0F172A]/0 group-hover:bg-[#0F172A]/40 transition-all duration-300">
          <div className="w-14 h-14 flex items-center justify-center bg-[#0EA5E9] opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
            <PlayCircle size={26} className="text-[#0F172A]" fill="#0F172A" strokeWidth={1.5} aria-hidden="true" />
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
          className="text-sm font-black text-white leading-tight group-hover:text-[#0EA5E9] transition-colors duration-200 cursor-pointer"
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
              className={completed ? "h-full bg-emerald-400" : "h-full bg-[#0EA5E9]"}
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
            className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-[#0EA5E9] hover:text-white transition-colors duration-150"
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010810]/90 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div
        className="relative w-full max-w-3xl bg-[#0F172A] border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video area */}
        <div className="relative w-full pt-[56.25%] bg-[#0a1628]">
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
                  <div className="w-16 h-16 flex items-center justify-center bg-[#0EA5E9]">
                    <PlayCircle size={30} className="text-[#0F172A]" strokeWidth={1.5} aria-hidden="true" />
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDifficulty, setActiveDifficulty] = useState("all");
  const [activeVideo, setActiveVideo] = useState(null);
  const debouncedSearch = useDebounce(searchQuery, 250);

  // Single fetch on mount — no re-fetch on filter change (filters run client-side)
  const loadVideos = useCallback(() => {
    setLoading(true);
    setError("");
    videosAPI.getAll()
      .then((res) => setAllVideos(res.data.videos ?? []))
      .catch(() => setAllVideos(MOCK_VIDEOS))
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
    <div className="bg-[#0F172A] min-h-screen">
      {/* Modal */}
      {activeVideo && (
        <VideoModal video={activeVideo} onClose={handleVideoClose} />
      )}

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="bg-[#F1F5F9] border-b border-white/5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(#0EA5E9 1px, transparent 1px), linear-gradient(90deg, #0EA5E9 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#0EA5E9]">
            Exercise Library
          </span>
          <h1
            className="mt-3 text-5xl lg:text-6xl font-black text-[#0EA5E9] leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            VIDEO LIBRARY
          </h1>
          <p className="mt-4 text-slate-400 text-base max-w-xl leading-relaxed">
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
              className="w-full bg-white/4 border border-white/10 pl-11 pr-10 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-[#0EA5E9] transition-colors duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors duration-150"
                aria-label="Clear search"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky filter bar ────────────────────────────────── */}
      <div className="sticky top-16.75 z-30 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/5">
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
                      ? "bg-[#0EA5E9] text-[#0F172A] border-[#0EA5E9]"
                      : "border-white/10 text-slate-500 hover:text-white hover:border-white/30"
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
                      ? "bg-[#0EA5E9]/20 border-[#0EA5E9]/40 text-[#0EA5E9]"
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
              <span className="text-white font-semibold">{filtered.length}</span>{" "}
              video{filtered.length !== 1 ? "s" : ""}
              {debouncedSearch && (
                <> matching <span className="text-[#0EA5E9]">"{debouncedSearch}"</span></>
              )}
            </>
          )}
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-slate-600 hover:text-[#0EA5E9] transition-colors duration-150 flex items-center gap-1.5 font-semibold"
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
            className="flex items-center gap-3 p-5 border border-red-500/20 bg-red-500/5 text-red-400 text-sm"
            role="alert"
          >
            <AlertCircle size={16} className="shrink-0" aria-hidden="true" /> {error}
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
              className="text-xs font-bold tracking-widest uppercase text-[#0EA5E9] hover:text-white transition-colors duration-150"
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
