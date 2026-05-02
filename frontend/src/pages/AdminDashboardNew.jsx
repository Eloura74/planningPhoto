import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AdminStats from "../components/AdminStats";
import GroupSlotManager from "../components/GroupSlotManager";
import BookingsTable from "../components/BookingsTable";
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg glow-gold"
                style={{ background: "var(--chrome-gradient)" }}
              >
                <svg
                  className="w-6 h-6"
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
                className="text-2xl font-bold"
                style={{
                  background: "var(--chrome-gradient)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Dashboard Admin
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin/users")}
                className="px-4 py-2 rounded-lg font-semibold text-sm btn-gold"
              >
                Utilisateurs
              </button>
              <button
                onClick={() => navigate("/calendar")}
                className="px-4 py-2 rounded-lg font-semibold text-sm btn-chrome"
              >
                Calendrier
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg font-semibold text-sm"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Statistics Cards */}
        <AdminStats />

        {/* Group Slots Management */}
        <GroupSlotManager />

        {/* Bookings Table */}
        <BookingsTable />

        {/* Unavailability Manager */}
        <UnavailabilityManager />
      </div>
    </div>
  );
}

export default AdminDashboardNew;
