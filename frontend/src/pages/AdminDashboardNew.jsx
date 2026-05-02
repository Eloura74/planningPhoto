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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-7 h-7 text-white"
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
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Dashboard Admin
                </h1>
                <p className="text-sm text-gray-600">
                  Gestion des réservations photo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin/users")}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm"
              >
                👥 Utilisateurs
              </button>
              <button
                onClick={() => navigate("/calendar")}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm"
              >
                📅 Calendrier
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm"
              >
                🚪 Déconnexion
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
