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
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        Chargement...
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <nav className={`${isDark ? "bg-gray-800" : "bg-white"} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1
            className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Mes Réservations
          </h1>
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-lg ${isDark ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
            >
              {isDark ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => navigate("/calendar")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Voir le calendrier
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div
          className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6`}
        >
          <h2
            className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Mes réservations
          </h2>

          {bookings.length === 0 ? (
            <div
              className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Vous n'avez aucune réservation
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`p-4 border rounded-lg flex justify-between items-center ${isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}
                >
                  <div>
                    <p
                      className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {new Date(booking.date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                      {booking.start_time} - {booking.end_time}
                    </p>
                    <p
                      className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                    >
                      Type:{" "}
                      <span className="font-semibold">
                        {booking.type === "SOLO" ? "Solo" : "Groupe"}
                      </span>
                    </p>
                    <p
                      className={`text-sm mt-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}
                    >
                      Statut:{" "}
                      <span
                        className={`font-semibold ${
                          booking.status === "CONFIRMED"
                            ? "text-green-500"
                            : booking.status === "PENDING"
                              ? "text-yellow-500"
                              : "text-red-500"
                        }`}
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
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
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
