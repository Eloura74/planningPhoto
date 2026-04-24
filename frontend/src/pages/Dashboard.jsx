import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { bookingsAPI } from "../services/api";

function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await bookingsAPI.getMyBookings();
      setBookings(response.data);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) {
      return;
    }
    try {
      await bookingsAPI.cancel(bookingId);
      loadBookings();
    } catch (error) {
      alert(error.response?.data?.error || "Erreur lors de l'annulation");
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
            Mes Réservations
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/calendar")}
              className="px-4 py-2 rounded-lg btn-gold"
            >
              Voir le calendrier
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-lg shadow-md p-6 card-dark">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: "var(--gold-primary)" }}
          >
            Mes réservations
          </h2>

          {bookings.length === 0 ? (
            <div
              className="text-center py-8"
              style={{ color: "var(--text-muted)" }}
            >
              Vous n'avez aucune réservation
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 rounded-lg flex justify-between items-center card-dark"
                  style={{ border: "1px solid var(--border-secondary)" }}
                >
                  <div>
                    <p
                      className="font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {new Date(booking.date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p style={{ color: "var(--text-secondary)" }}>
                      {booking.start_time} - {booking.end_time}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Type:{" "}
                      <span
                        className="font-semibold"
                        style={{ color: "var(--gold-primary)" }}
                      >
                        {booking.type === "SOLO" ? "Solo" : "Groupe"}
                      </span>
                    </p>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Statut:{" "}
                      <span
                        className="font-semibold"
                        style={{
                          color:
                            booking.status === "CONFIRMED"
                              ? "#00ff00"
                              : booking.status === "PENDING"
                                ? "var(--gold-primary)"
                                : "#ff6b6b",
                        }}
                      >
                        {booking.status === "CONFIRMED"
                          ? "Confirmée"
                          : booking.status === "PENDING"
                            ? "En attente"
                            : "Annulée"}
                      </span>
                    </p>
                  </div>
                  {booking.status !== "CANCELLED" && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: "rgba(239, 68, 68, 0.2)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                      }}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
