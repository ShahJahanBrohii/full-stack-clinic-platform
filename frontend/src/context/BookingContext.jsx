import { createContext, useState, useCallback, useContext } from "react";
import { bookingAPI } from "../services/api";
import { AuthContext } from "./AuthContext";

/**
 * BookingContext
 * Provides: {
 *   bookings,           // array of the current user's bookings
 *   bookingsLoading,    // fetching state
 *   bookingError,       // error string or null
 *   draft,              // in-progress booking form state
 *   setDraft,           // update draft fields
 *   clearDraft,         // reset draft
 *   fetchBookings,      // load bookings from API
 *   createBooking,      // submit a new booking
 *   cancelBooking,      // cancel an existing booking
 *   rescheduleBooking,  // reschedule existing booking
 * }
 */
export const BookingContext = createContext(null);

// Default shape of the booking draft (step-by-step form state)
const INITIAL_DRAFT = {
  serviceId: null,
  serviceName: "",
  date: "",
  timeSlot: "",
  notes: "",
  paymentMethod: "",
  transactionId: "",
  paymentProofImage: "",
  paymentConfirmed: false,
};

export function BookingProvider({ children }) {
  const { user } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [draft, setDraftState] = useState(INITIAL_DRAFT);

  // ── Draft helpers ────────────────────────────────────────────
  /** Merge partial updates into the draft */
  const setDraft = useCallback((fields) => {
    setDraftState((prev) => ({ ...prev, ...fields }));
  }, []);

  /** Reset draft back to its initial shape */
  const clearDraft = useCallback(() => {
    setDraftState(INITIAL_DRAFT);
  }, []);

  // ── Fetch bookings for the logged-in user ────────────────────
  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setBookingsLoading(true);
    setBookingError(null);

    try {
      const res = await bookingAPI.getMyBookings();
      setBookings(res.data.bookings ?? []);
    } catch (err) {
      setBookingError(
        err.response?.data?.message || "Failed to load bookings."
      );
    } finally {
      setBookingsLoading(false);
    }
  }, [user]);

  // ── Create a new booking ─────────────────────────────────────
  /**
   * @param {typeof INITIAL_DRAFT} bookingData
   * @returns {Promise<{ success: boolean, booking?: object, error?: string }>}
   */
  const createBooking = useCallback(async (bookingData) => {
    setBookingError(null);
    try {
      const res = await bookingAPI.create(bookingData);
      const newBooking = res.data.booking;

      // Optimistically prepend to local list
      setBookings((prev) => [newBooking, ...prev]);
      clearDraft();

      return { success: true, booking: newBooking };
    } catch (err) {
      const message =
        err.response?.data?.message || "Booking failed. Please try again.";
      setBookingError(message);
      return { success: false, error: message };
    }
  }, [clearDraft]);

  // ── Cancel an existing booking ───────────────────────────────
  /**
   * @param {string} bookingId
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const cancelBooking = useCallback(async (bookingId) => {
    setBookingError(null);
    try {
      await bookingAPI.cancel(bookingId);

      // Update status in local state without a full refetch
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: "cancelled" } : b
        )
      );

      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || "Could not cancel booking.";
      setBookingError(message);
      return { success: false, error: message };
    }
  }, []);

  // ── Reschedule an existing booking ─────────────────────────
  /**
   * @param {string} bookingId
   * @param {{ date: string, timeSlot: string }} payload
   * @returns {Promise<{ success: boolean, booking?: object, error?: string }>}
   */
  const rescheduleBooking = useCallback(async (bookingId, payload) => {
    setBookingError(null);
    try {
      const res = await bookingAPI.reschedule(bookingId, payload);
      const updatedBooking = res.data.booking;

      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? updatedBooking : b))
      );

      return { success: true, booking: updatedBooking };
    } catch (err) {
      const message =
        err.response?.data?.message || "Could not reschedule booking.";
      setBookingError(message);
      return { success: false, error: message };
    }
  }, []);

  return (
    <BookingContext.Provider
      value={{
        bookings,
        bookingsLoading,
        bookingError,
        draft,
        setDraft,
        clearDraft,
        fetchBookings,
        createBooking,
        cancelBooking,
        rescheduleBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}
