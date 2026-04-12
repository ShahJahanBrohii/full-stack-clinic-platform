import { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, Trash2, X, Save, Loader2,
  Eye, EyeOff, Search, AlertCircle, Dumbbell,
} from "lucide-react";
import api from "../../services/api";
import { BulkActionsBar } from "../../components/BulkActionsBar";

const CATEGORIES = ["Rehabilitation", "Assessment", "Prevention", "Group", "Other"];
const EMPTY_SERVICE = { title: "", tagline: "", description: "", category: "Rehabilitation", duration: "", price: "", features: ["", "", "", ""], published: true };

async function requestServiceEndpoint({ method, path = "", data }) {
  try {
    return await api({ method, url: `/admin/services${path}`, data });
  } catch (err) {
    // Backward compatibility for environments that expose singular admin service routes.
    if (err?.response?.status === 404) {
      return api({ method, url: `/admin/service${path}`, data });
    }
    throw err;
  }
}

function ServiceModal({ service, onClose, onSave }) {
  const isNew = !service._id;
  const [form, setForm] = useState({ ...EMPTY_SERVICE, ...service });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleFeatureChange = (i, val) => {
    const f = [...form.features];
    f[i] = val;
    setForm((p) => ({ ...p, features: f }));
  };
  const addFeature = () => setForm((p) => ({ ...p, features: [...p.features, ""] }));
  const removeFeature = (i) => setForm((p) => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true); setError("");
    try {
      if (isNew) {
        const res = await requestServiceEndpoint({ method: "post", data: form });
        onSave(res.data.service, true);
      } else {
        const res = await requestServiceEndpoint({ method: "put", path: `/${form._id}`, data: form });
        onSave(res.data.service || form, false);
      }
      onClose();
    } catch (err) { setError(err.response?.data?.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0F172A] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <h2 className="text-lg font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {isNew ? "ADD NEW SERVICE" : "EDIT SERVICE"}
          </h2>
          <button onClick={onClose} className="text-slate-600 hover:text-white p-1"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {error && <div className="flex items-center gap-2 p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-xs"><AlertCircle size={13} />{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Service Title *", key: "title", span: 2 },
              { label: "Tagline", key: "tagline", span: 2 },
              { label: "Duration", key: "duration" },
              { label: "Price", key: "price" },
            ].map(({ label, key, span }) => (
              <div key={key} className={`flex flex-col gap-1.5 ${span === 2 ? "col-span-2" : ""}`}>
                <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">{label}</label>
                <input value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-accent transition-colors" />
              </div>
            ))}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">Category</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-accent transition-colors appearance-none">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 justify-end">
              <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">Visibility</label>
              <button onClick={() => setForm((p) => ({ ...p, published: !p.published }))}
                className={`flex items-center gap-2 px-3 py-2.5 border text-xs font-bold tracking-widest uppercase transition-all duration-150 ${
                  form.published ? "bg-accent/10 border-accent/30 text-accent" : "border-white/10 text-slate-500"
                }`}>
                {form.published ? <><Eye size={12} /> Published</> : <><EyeOff size={12} /> Draft</>}
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="bg-white/3 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-accent transition-colors resize-none" />
          </div>

          {/* Features */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black tracking-widest uppercase text-slate-600">Feature Checklist</label>
              <button onClick={addFeature} className="text-[10px] text-accent hover:text-white transition-colors font-bold flex items-center gap-1">
                <Plus size={10} /> Add
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {form.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={f} onChange={(e) => handleFeatureChange(i, e.target.value)} placeholder={`Feature ${i + 1}`}
                    className="flex-1 bg-white/3 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-accent transition-colors" />
                  <button onClick={() => removeFeature(i)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors shrink-0"><X size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/5 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-white/10 text-slate-400 text-xs font-bold tracking-widest uppercase hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-accent text-[#0F172A] text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {isNew ? "Create Service" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modalService, setModalService] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setPageError("");
    requestServiceEndpoint({ method: "get" })
      .then((r) => setServices(r.data.services ?? []))
      .catch((err) => {
        setServices([]);
        setPageError(err.response?.data?.message || "Failed to load services from server.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTogglePublish = async (id, current) => {
    setPageError("");
    try {
      const res = await requestServiceEndpoint({ method: "patch", path: `/${id}/publish`, data: { published: !current } });
      const updated = res.data?.service;
      setServices((prev) => prev.map((s) => s._id === id ? (updated || { ...s, published: !current }) : s));
    } catch (err) {
      setPageError(err.response?.data?.message || "Failed to update publish state.");
    }
  };

  const handleSave = (updated, isNew) => {
    if (isNew) setServices((prev) => [updated, ...prev]);
    else setServices((prev) => prev.map((s) => s._id === updated._id ? updated : s));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setPageError("");
    try {
      await requestServiceEndpoint({ method: "delete", path: `/${deleteTarget._id}` });
      setServices((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setPageError(err.response?.data?.message || "Failed to delete service.");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.title?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q);
    const matchCat = categoryFilter === "all" || s.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      {modalService !== null && (
        <ServiceModal service={modalService} onClose={() => setModalService(null)} onSave={handleSave} />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm bg-[#0F172A] border border-red-500/20 p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black text-white">Delete Service</h3>
            <p className="text-sm text-slate-400">Permanently delete <strong className="text-white">"{deleteTarget.title}"</strong>? Existing bookings for this service will be unaffected.</p>
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold tracking-widest uppercase hover:bg-red-500/30 disabled:opacity-50">
                {deleting && <Loader2 size={11} className="animate-spin" />} Delete
              </button>
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-white/10 text-slate-500 text-xs font-bold tracking-widest uppercase">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-accent">Management</span>
          <h1 className="mt-1 text-3xl font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            SERVICES <span className="text-slate-600">({filtered.length})</span>
          </h1>
        </div>
        <button onClick={() => setModalService(EMPTY_SERVICE)}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-[#0F172A] text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors self-start sm:self-auto">
          <Plus size={13} /> Add Service
        </button>
      </div>

      {pageError && (
        <div className="flex items-center gap-2 p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={13} />
          {pageError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-50 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services…"
            className="w-full bg-white/3 border border-white/10 pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-700 outline-none focus:border-accent transition-colors" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={`px-3 py-2 text-[10px] font-bold tracking-widest uppercase border transition-all duration-150 ${
                categoryFilter === c ? "bg-accent border-accent text-[#0F172A]" : "border-white/10 text-slate-500 hover:text-white hover:border-white/25"
              }`}>{c === "all" ? "All" : c}</button>
          ))}
        </div>
      </div>

      <BulkActionsBar
        exportType="services"
        exportData={filtered}
        itemType="services"
      />

      {/* Services grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-white/2 border border-white/5 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-600 border border-dashed border-white/10">No services found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((service) => (
            <div key={service._id} className={`group flex flex-col border p-5 gap-4 transition-all duration-200 ${service.published ? "bg-white/2 border-white/8 hover:border-accent/30" : "bg-white/1 border-white/5 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 flex items-center justify-center bg-accent/10 border border-accent/20 shrink-0">
                    <Dumbbell size={14} className="text-accent" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black tracking-widest uppercase text-slate-600">{service.category}</span>
                    <h3 className="text-sm font-black text-white leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{service.title}</h3>
                  </div>
                </div>
                <button onClick={() => handleTogglePublish(service._id, service.published)}
                  className={`p-1.5 shrink-0 transition-colors ${service.published ? "text-accent hover:text-slate-400" : "text-slate-600 hover:text-accent"}`} title={service.published ? "Unpublish" : "Publish"}>
                  {service.published ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 flex-1">{service.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{service.duration}</span>
                <span className="text-white font-bold">{service.price}</span>
              </div>
              <div className="flex gap-2 border-t border-white/5 pt-3">
                <button onClick={() => setModalService(service)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 text-slate-400 text-[10px] font-bold tracking-widest uppercase hover:text-accent hover:border-accent/30 transition-all duration-150">
                  <Edit2 size={11} /> Edit
                </button>
                <button onClick={() => setDeleteTarget(service)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 text-slate-600 text-[10px] font-bold tracking-widest uppercase hover:text-red-400 hover:border-red-400/30 transition-all duration-150">
                  <Trash2 size={11} /> Delete
                </button>
                <span className={`ml-auto self-center text-[10px] font-bold px-2 py-0.5 ${service.published ? "text-accent bg-accent/10" : "text-slate-500 bg-slate-500/10"}`}>
                  {service.published ? "Live" : "Draft"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
