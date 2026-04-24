import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usersAPI } from "../services/api";

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await usersAPI.getMe();
      setUserData(response.data);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen fade-in"
        style={{
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
        }}
      >
        Chargement...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen fade-in"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <nav
        className="shadow-sm"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--gold-primary)" }}
          >
            Mon Profil
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/calendar")}
              className="px-4 py-2 rounded-lg btn-chrome"
            >
              Calendrier
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg"
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

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="rounded-lg shadow-md p-6 card-gold">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: "var(--gold-primary)" }}
          >
            Informations personnelles
          </h2>

          <div className="space-y-4">
            <div>
              <label
                className="block font-semibold mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Nom
              </label>
              <p style={{ color: "var(--text-primary)" }}>{userData?.name}</p>
            </div>
            <div>
              <label
                className="block font-semibold mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Email
              </label>
              <p style={{ color: "var(--text-primary)" }}>{userData?.email}</p>
            </div>
            <div>
              <label
                className="block font-semibold mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Téléphone
              </label>
              <p style={{ color: "var(--text-primary)" }}>
                {userData?.phone || "Non renseigné"}
              </p>
            </div>
            <div>
              <label
                className="block font-semibold mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Rôle
              </label>
              <p style={{ color: "var(--text-primary)" }}>
                {userData?.role === "ADMIN" ? "Administrateur" : "Élève"}
              </p>
            </div>
            <div>
              <label
                className="block font-semibold mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Membre du groupe
              </label>
              <p style={{ color: "var(--text-primary)" }}>
                {userData?.is_group_member ? "Oui" : "Non"}
              </p>
            </div>
            <div>
              <label
                className="block font-semibold mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Membre depuis
              </label>
              <p style={{ color: "var(--text-primary)" }}>
                {userData?.created_at
                  ? new Date(userData.created_at).toLocaleDateString("fr-FR")
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
