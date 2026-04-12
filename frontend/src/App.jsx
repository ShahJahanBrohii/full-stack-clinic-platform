import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import Home from "./pages/Home";
import Services from "./pages/Services";
import VideoLibrary from "./pages/VideoLibrary";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";

// Patient pages (protected)
import Dashboard from "./pages/Dashboard";
import BookingProcess from "./pages/BookingProcess";

// Admin pages (protected + role-gated)
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminPatients from "./pages/admin/AdminPatients";
import AdminServices from "./pages/admin/AdminServices";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";

import { useAuth } from "./hooks/useAuth";

// Admin guard — user must be authenticated AND have role === "admin"
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Admin routes — full-screen layout, no Navbar/Footer */}
        <Route
          path="/admin"
          element={<AdminRoute><AdminLayout /></AdminRoute>}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="patients" element={<AdminPatients />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="videos" element={<AdminVideos />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Public + patient routes — shared Navbar/Footer shell */}
        <Route path="/*" element={
          <div className="flex flex-col min-h-screen bg-gradient-dark text-white">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/videos" element={<VideoLibrary />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute requiredRole="patient" roleFallback="/admin">
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/book"
                  element={
                    <ProtectedRoute requiredRole="patient" roleFallback="/admin">
                      <BookingProcess />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={
                  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <span className="text-accent font-mono text-sm tracking-widest uppercase">Error 404</span>
                    <h1 className="text-6xl font-black text-white">Page Not Found</h1>
                    <a href="/" className="mt-4 px-6 py-3 bg-gradient-primary hover:shadow-glow-primary text-white font-bold text-sm tracking-widest uppercase transition-all duration-200 rounded-lg">Return Home</a>
                  </div>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
        } />
      </Routes>
    </Router>
  );
}
