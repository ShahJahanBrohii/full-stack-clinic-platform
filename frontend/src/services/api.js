import axios from "axios";

function normalizeService(service) {
  if (!service) return service;

  return {
    ...service,
    title: service.title ?? service.name ?? "",
    name: service.name ?? service.title ?? "",
    published: service.published ?? service.isActive ?? true,
    isActive: service.isActive ?? service.published ?? true,
  };
}

function normalizeVideo(video) {
  if (!video) return video;

  const durationMinutes =
    typeof video.duration === "number"
      ? Math.max(1, Math.round(video.duration / 60))
      : video.duration;

  return {
    ...video,
    youtubeUrl: video.youtubeUrl ?? video.videoUrl ?? "",
    videoUrl: video.videoUrl ?? video.youtubeUrl ?? "",
    published: video.published ?? video.isActive ?? true,
    isActive: video.isActive ?? video.published ?? true,
    duration:
      typeof durationMinutes === "number"
        ? `${durationMinutes} min`
        : durationMinutes,
  };
}

function normalizeBooking(booking) {
  if (!booking) return booking;

  const service = booking.serviceId || booking.service || {};
  const patient = booking.patientId || booking.patient || {};
  const numericPrice =
    typeof service.price === "number" ? service.price : booking.price;

  return {
    ...booking,
    patientName: booking.patientName ?? patient.name ?? "",
    patientEmail: booking.patientEmail ?? patient.email ?? "",
    serviceName: booking.serviceName ?? service.name ?? service.title ?? "Appointment",
    serviceCategory: booking.serviceCategory ?? service.category ?? "",
    price:
      booking.price ??
      (typeof numericPrice === "number"
        ? `PKR ${numericPrice.toLocaleString("en-PK")}`
        : numericPrice ?? ""),
    paymentConfirmed:
      booking.paymentConfirmed ?? booking.paymentStatus === "completed",
  };
}

function wrapArray(key, value, mapItem) {
  const items = Array.isArray(value) ? value : [];
  return {
    data: {
      [key]: mapItem ? items.map(mapItem) : items,
    },
  };
}

function toIsoDateString(value) {
  if (!value) return value;
  // Preserve date-only values to avoid timezone day shifts in booking flows.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
}

// ── Base instance ─────────────────────────────────────────────────────────────
// VITE: set VITE_API_URL in your .env file, e.g. VITE_API_URL=http://localhost:5000/api
// CRA:  set REACT_APP_API_URL instead and update the line below.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10_000, // 10 seconds
});

// ── Request interceptor — attach JWT token ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("apex_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle global errors ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expired or invalid — force logout
    if (error.response?.status === 401) {
      localStorage.removeItem("apex_token");
      // Redirect to login page (works outside React components)
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH API
// ─────────────────────────────────────────────────────────────────────────────
export const authAPI = {
  /** POST /auth/register */
  register: (data) => api.post("/auth/register", data),

  /** POST /auth/login */
  login: (credentials) => api.post("/auth/login", credentials),

  /** GET /auth/me  — returns the authenticated user's profile */
  getMe: () => api.get("/auth/me"),

  /** PUT /auth/profile  — update name, phone, etc. */
  updateProfile: (data) => api.put("/auth/profile", data),

  /** PUT /auth/password  — change password */
  changePassword: (data) =>
    api.put("/auth/password", {
      ...data,
      oldPassword: data.oldPassword ?? data.currentPassword,
      currentPassword: data.currentPassword ?? data.oldPassword,
    }),

  /** GET /auth/patient-stories  — public patient stories sourced from real patient profiles */
  getPatientStories: (params) => api.get("/auth/patient-stories", { params }),
};

export const clinicSettingsAPI = {
  getPublic: () => api.get("/public/clinic-settings"),
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES API
// ─────────────────────────────────────────────────────────────────────────────
export const servicesAPI = {
  /** GET /services  — list all available clinic services */
  getAll: async () => {
    const response = await api.get("/services");
    const services = Array.isArray(response.data)
      ? response.data
      : response.data.services ?? [];

    return wrapArray("services", services, normalizeService);
  },

  /** GET /services/:id  — single service details */
  getById: async (id) => {
    const response = await api.get(`/services/${id}`);
    const service = Array.isArray(response.data)
      ? response.data[0]
      : response.data.service ?? response.data;

    return { data: { service: normalizeService(service) } };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS API
// ─────────────────────────────────────────────────────────────────────────────
export const bookingAPI = {
  /** GET /bookings/my  — current user's booking history */
  getMyBookings: async () => {
    const response = await api.get("/bookings/my");
    const bookings = Array.isArray(response.data)
      ? response.data
      : response.data.bookings ?? [];

    return wrapArray("bookings", bookings, normalizeBooking);
  },

  /** GET /bookings/:id  — single booking details */
  getById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    const booking = response.data.booking ?? response.data;
    return { data: { booking: normalizeBooking(booking) } };
  },

  /**
   * POST /bookings  — create a new booking
   * Body: { serviceId, date, timeSlot, notes, paymentMethod }
   */
  create: async (data) => {
    const response = await api.post("/bookings", {
      ...data,
      date: toIsoDateString(data.date),
    });
    return {
      ...response,
      data: {
        ...response.data,
        booking: normalizeBooking(response.data.booking),
      },
    };
  },

  /**
   * GET /bookings/slots  — fetch available time slots for a given date + service
   * Params: { serviceId, date }
   */
  getAvailableSlots: (serviceId, date) =>
    api.get("/bookings/slots", {
      params: {
        serviceId,
        date: toIsoDateString(date),
      },
    }),

  /** PATCH /bookings/:id/cancel  — cancel a booking */
  cancel: async (id) => {
    const response = await api.patch(`/bookings/${id}/cancel`);
    return {
      ...response,
      data: {
        ...response.data,
        booking: normalizeBooking(response.data.booking),
      },
    };
  },

  /** PATCH /bookings/:id/reschedule  — reschedule booking date/time */
  reschedule: async (id, payload) => {
    const response = await api.patch(`/bookings/${id}/reschedule`, {
      ...payload,
      date: toIsoDateString(payload.date),
    });
    return {
      ...response,
      data: {
        ...response.data,
        booking: normalizeBooking(response.data.booking),
      },
    };
  },

  /**
   * POST /bookings/:id/payment  — confirm payment for a booking
   * Body: { paymentMethod, transactionId? }
   */
  confirmPayment: async (id, paymentData) => {
    const response = await api.post(`/bookings/${id}/payment`, paymentData);
    return {
      ...response,
      data: {
        ...response.data,
        booking: normalizeBooking(response.data.booking),
      },
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// VIDEOS API
// ─────────────────────────────────────────────────────────────────────────────
export const videosAPI = {
  /** GET /videos  — list all exercise videos (supports ?category=, ?search=) */
  getAll: async (params) => {
    const response = await api.get("/videos", { params });
    const videos = Array.isArray(response.data)
      ? response.data
      : response.data.videos ?? [];

    return wrapArray("videos", videos, normalizeVideo);
  },

  /** GET /videos/:id  — single video details */
  getById: async (id) => {
    const response = await api.get(`/videos/${id}`);
    const video = response.data.video ?? response.data;
    return { data: { video: normalizeVideo(video) } };
  },

  /** GET /videos/categories  — list of video categories */
  getCategories: () => api.get("/videos/categories"),
};

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO PROGRESS API
// ─────────────────────────────────────────────────────────────────────────────
export const videoProgressAPI = {
  /** GET /video-progress  — list all progress records for the current user */
  getAll: () => api.get("/video-progress"),

  /** GET /video-progress/stats/summary  — summary metrics for the current user */
  getSummary: () => api.get("/video-progress/stats/summary"),

  /** GET /video-progress/:videoId  — get progress for a specific video */
  getByVideoId: (videoId) => api.get(`/video-progress/${videoId}`),

  /**
   * POST /video-progress  — create or update video progress
   * Body: { videoId, watchedDuration, watchedPercentage, completed }
   */
  updateProgress: (data) =>
    api.post(`/video-progress/${data.videoId}/track`, {
      progress: data.watchedPercentage ?? data.progress ?? 0,
      watchTime: data.watchedDuration ?? data.watchTime ?? 0,
      completed: data.completed ?? false,
    }),

  /** PATCH /video-progress/:videoId  — mark video as completed */
  markCompleted: (videoId) => api.post(`/video-progress/${videoId}/complete`),

  /** DELETE /video-progress/:videoId  — delete progress for a video */
  deleteProgress: (videoId) => api.delete(`/video-progress/${videoId}`),
};

// Export the base instance too in case a component needs direct access
export default api;
