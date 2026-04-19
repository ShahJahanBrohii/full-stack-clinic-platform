import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clinicSettingsAPI } from "../services/api";

const DEFAULT_SETTINGS = {
  clinicName: "Sport Injuries Rehab Center",
  clinicEmail: "contact@sportinjuriesrehabcenter.pk",
  tagline: "Rehab • Recover • Rebuild • Return Stronger",
  address: "Sports District, Karachi",
  phone: "03318348748 | 03703699444",
  website: "https://sportinjuriesrehabcenter.pk",
  currency: "PKR",
  workingHours: { start: "09:00", end: "17:30" },
  slotDuration: 30,
  maxPatientsPerSlot: 1,
  bufferTime: 0,
  availability: {
    Monday: { open: true, from: "09:00", to: "19:00" },
    Tuesday: { open: true, from: "09:00", to: "19:00" },
    Wednesday: { open: true, from: "09:00", to: "19:00" },
    Thursday: { open: true, from: "09:00", to: "19:00" },
    Friday: { open: true, from: "09:00", to: "19:00" },
    Saturday: { open: true, from: "10:00", to: "16:00" },
    Sunday: { open: false, from: "", to: "" },
  },
  notifications: {},
};

function mergeSettings(remoteSettings) {
  const settings = remoteSettings || {};
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    workingHours: { ...DEFAULT_SETTINGS.workingHours, ...(settings.workingHours || {}) },
    availability: { ...DEFAULT_SETTINGS.availability, ...(settings.availability || {}) },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(settings.notifications || {}) },
  };
}

export const ClinicSettingsContext = createContext(null);

export function ClinicSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await clinicSettingsAPI.getPublic();
      setSettings(mergeSettings(response.data?.settings));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load clinic settings.");
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const value = useMemo(() => ({ settings, loading, error, refreshSettings: loadSettings }), [settings, loading, error, loadSettings]);

  return <ClinicSettingsContext.Provider value={value}>{children}</ClinicSettingsContext.Provider>;
}

export function useClinicSettings() {
  const context = useContext(ClinicSettingsContext);
  if (!context) return { settings: DEFAULT_SETTINGS, loading: false, error: "", refreshSettings: async () => {} };
  return context;
}