import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AdminStats from "../components/AdminStats";
import AdminBookingsManager from "../components/AdminBookingsManager";
import UnavailabilityManager from "../components/UnavailabilityManager";

function AdminDashboardNew() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      className="min-h-screen fade-in"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Header */}
      <nav
        className="shadow-lg border-b"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-primary)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center mb-3 sm:mb-0">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg glow-gold"
                style={{ background: "var(--chrome-gradient)" }}
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={{ color: "var(--text-dark)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h1
                className="text-base sm:text-2xl font-bold"
                style={{
                  background: "var(--chrome-gradient)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Dashboard Admin
              </h1>
            </div>
          </div>

          {/* Navigation Buttons - Responsive grid */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <button
              onClick={() => navigate("/admin/users")}
              className="px-3 py-2 rounded-lg text-xs sm:text-sm btn-gold whitespace-nowrap"
            >
              👥 Utilisateurs
            </button>
            <button
              onClick={() => navigate("/admin/events")}
              className="px-3 py-2 rounded-lg text-xs sm:text-sm btn-gold whitespace-nowrap"
            >
              🎉 Événements
            </button>
            <button
              onClick={() => navigate("/calendar")}
              className="px-3 py-2 rounded-lg text-xs sm:text-sm btn-chrome whitespace-nowrap"
            >
              📅 Calendrier
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Statistics Cards */}
        <AdminStats />

        {/* Admin Bookings Management */}
        <AdminBookingsManager />

        {/* Unavailability Manager */}
        <UnavailabilityManager />
      </div>
    </div>
  );
}

export default AdminDashboardNew;
