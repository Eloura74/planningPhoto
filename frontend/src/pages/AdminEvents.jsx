import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import EventsManager from "../components/EventsManager";

function AdminEvents() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      <nav
        className="border-b sticky top-0 z-10"
        style={{
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--chrome-medium)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                color: "white",
              }}
            >
              📸
            </div>
            <h1
              className="text-xl sm:text-2xl font-bold"
              style={{ color: "var(--gold-primary)" }}
            >
              Gestion des Événements
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold text-sm btn-chrome"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => navigate("/calendar")}
              className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold text-sm btn-chrome"
            >
              Calendrier
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold text-sm"
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
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <EventsManager />
      </div>
    </div>
  );
}

export default AdminEvents;
