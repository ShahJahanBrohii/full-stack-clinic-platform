import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Edit2, Trash2, X, Save, Loader2, Search,
  Eye, EyeOff, Upload, PlayCircle, AlertCircle, Film,
} from "lucide-react";
import api from "../../services/api";

const CATEGORIES = ["mobility", "strength", "rehabilitation", "conditioning", "recovery", "education"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const EMPTY_VIDEO = { title: "", description: "", category: "rehabilitation", difficulty: "beginner", duration: "", youtubeUrl: "", published: true, tags: "" };

const DIFF_COLORS = { beginner: "text-[accent] bg-[accent]/10", intermediate: "text-yellow-400 bg-yellow-400/10", advanced: "text-red-400 bg-red-400/10" };

function VideoModal({ video, onClose, onSave }) {
  const isNew = !video._id;
  const [form, setForm] = useState({ ...EMPTY_VIDEO, ...video });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true); setError("");
    try {
      if (isNew) {
        const res = await api.post("/admin/videos", form);
        onSave(res.data.video, true);
      } else {
        await api.put(`/admin/videos/${form._id}`, form);
        onSave(form, false);
      }
      onClose();
    } catch { setError("Failed to save."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-[#0F172A] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <h2 className="text-lg font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {isNew ? "ADD VIDEO" : "EDIT VIDEO"}
          </h2>
          <button onClick={onClose} className="text-slate-600 hover:text-white p-1"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {error && <div className="flex items-center gap-2 p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-xs"><AlertCircle size={13} />{error}</div>}

          {[
            { label: "Title *", key: "title" },
            { label: "YouTube / Video URL", key: "youtubeUrl" },
            { label: "Duration (e.g. 15 min)", key: "duration" },
            { label: "Tags (comma separated)", key: "tags" },
          ].map(({ label, key }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">{label}</label>
              <input value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors" />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">Category</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors appearance-none">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
                className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors appearance-none">
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[accent] transition-colors resize-none" />
          </div>

          <button onClick={() => setForm((p) => ({ ...p, published: !p.published }))}
            className={`flex items-center gap-2 px-3 py-2.5 border text-xs font-bold tracking-widest uppercase transition-all duration-150 w-fit ${
              form.published ? "bg-[accent]/10 border-[accent]/30 text-[accent]" : "border-white/10 text-slate-500"
            }`}>
            {form.published ? <><Eye size={12} /> Published — Visible to patients</> : <><EyeOff size={12} /> Draft — Hidden from patients</>}
          </button>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/5 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-white/10 text-slate-400 text-xs font-bold tracking-widest uppercase hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-[accent] text-[#0F172A] text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {isNew ? "Add Video" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [diffFilter, setDiffFilter] = useState("all");
  const [modalVideo, setModalVideo] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/videos")
      .then((r) => setVideos(r.data.videos ?? []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id, current) => {
    await api.patch(`/admin/videos/${id}/publish`, { published: !current }).catch(() => {});
    setVideos((prev) => prev.map((v) => v._id === id ? { ...v, published: !current } : v));
  };

  const handleSave = (updated, isNew) => {
    if (isNew) setVideos((prev) => [updated, ...prev]);
    else setVideos((prev) => prev.map((v) => v._id === updated._id ? updated : v));
  };

  const handleDelete = async () => {
    setDeleting(true);
    await api.delete(`/admin/videos/${deleteTarget._id}`).catch(() => {});
    setVideos((prev) => prev.filter((v) => v._id !== deleteTarget._id));
    setDeleteTarget(null); setDeleting(false);
  };

  const filtered = videos.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.title?.toLowerCase().includes(q) || v.tags?.toLowerCase().includes(q) || v.category?.toLowerCase().includes(q);
    const matchCat = catFilter === "all" || v.category === catFilter;
    const matchDiff = diffFilter === "all" || v.difficulty === diffFilter;
    return matchSearch && matchCat && matchDiff;
  });

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      {modalVideo !== null && <VideoModal video={modalVideo} onClose={() => setModalVideo(null)} onSave={handleSave} />}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm bg-[#0F172A] border border-red-500/20 p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black text-white">Delete Video</h3>
            <p className="text-sm text-slate-400">Permanently delete <strong className="text-white">"{deleteTarget.title}"</strong>?</p>
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold tracking-widest uppercase disabled:opacity-50">
                {deleting && <Loader2 size={11} className="animate-spin" />} Delete
              </button>
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-white/10 text-slate-500 text-xs font-bold tracking-widest uppercase">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[accent]">Management</span>
          <h1 className="mt-1 text-3xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            VIDEO LIBRARY <span className="text-slate-600">({filtered.length})</span>
          </h1>
        </div>
        <button onClick={() => setModalVideo(EMPTY_VIDEO)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[accent] text-[#0F172A] text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors self-start sm:self-auto">
          <Plus size={13} /> Add Video
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-50 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, tags…"
            className="w-full bg-white/3 border border-white/10 pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-700 outline-none focus:border-[accent] transition-colors" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-2 text-[10px] font-bold tracking-widest uppercase border transition-all duration-150 ${
                catFilter === c ? "bg-[accent] border-[accent] text-[#0F172A]" : "border-white/10 text-slate-500 hover:text-white hover:border-white/25"
              }`}>{c === "all" ? "All" : c}</button>
          ))}
        </div>
        <div className="flex gap-1">
          {["all", ...DIFFICULTIES].map((d) => (
            <button key={d} onClick={() => setDiffFilter(d)}
              className={`px-3 py-2 text-[10px] font-bold tracking-widest uppercase border transition-all duration-150 ${
                diffFilter === d ? "bg-[accent]/20 border-[accent]/40 text-[accent]" : "border-transparent text-slate-600 hover:text-slate-400"
              }`}>{d === "all" ? "All Levels" : d}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-44 bg-white/2 border border-white/5 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-600 border border-dashed border-white/10">No videos found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((video) => (
            <div key={video._id} className={`group flex flex-col border transition-all duration-200 overflow-hidden ${video.published ? "bg-white/2 border-white/8 hover:border-[accent]/30" : "bg-white/1 border-white/5 opacity-60"}`}>
              {/* Thumbnail area */}
              <div className="relative w-full pt-[56.25%] bg-[#0a1628]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle size={28} className="text-[accent]/30" strokeWidth={1} />
                </div>
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 uppercase ${DIFF_COLORS[video.difficulty] || DIFF_COLORS.beginner}`}>
                    {video.difficulty}
                  </span>
                  {!video.published && <span className="text-[9px] font-bold px-1.5 py-0.5 text-slate-400 bg-slate-400/10">Draft</span>}
                </div>
              </div>

              <div className="p-4 flex flex-col gap-2 flex-1">
                <span className="text-[9px] font-bold tracking-widest uppercase text-slate-600">{video.category}</span>
                <h3 className="text-sm font-black text-white leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{video.title}</h3>
                <div className="flex items-center justify-between text-[10px] text-slate-600 mt-auto">
                  <span>{video.duration}</span>
                  <span>{video.views?.toLocaleString()} views</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 px-4 pb-4">
                <button onClick={() => setModalVideo(video)} className="flex items-center gap-1 px-2.5 py-1.5 border border-white/10 text-[10px] font-bold text-slate-500 hover:text-[accent] hover:border-[accent]/30 transition-all uppercase tracking-widest">
                  <Edit2 size={10} /> Edit
                </button>
                <button onClick={() => handleToggle(video._id, video.published)} className="flex items-center gap-1 px-2.5 py-1.5 border border-white/10 text-[10px] font-bold text-slate-500 hover:text-[accent] hover:border-[accent]/30 transition-all uppercase tracking-widest">
                  {video.published ? <><EyeOff size={10} /> Hide</> : <><Eye size={10} /> Publish</>}
                </button>
                <button onClick={() => setDeleteTarget(video)} className="ml-auto p-1.5 text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

