import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { bookingsAPI, slotsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

function MyAccount() {
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadMyBookings();
  }, []);

  const loadMyBookings = async () => {
    try {
      // Charger les bookings solo
      const soloResponse = await bookingsAPI.getMyBookings();

      // Charger les pré-réservations groupe
      const now = new Date();
      const startDate = now.toISOString().split("T")[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0)
        .toISOString()
        .split("T")[0];
      const slotsResponse = await slotsAPI.getAll(startDate, endDate);

      // Pour chaque slot groupe, vérifier si l'utilisateur a pré-réservé
      const groupPrebookings = [];
      for (const slot of slotsResponse.data.filter((s) => s.type === "GROUP")) {
        try {
          const participants = await bookingsAPI.getGroupPrebookings(slot.id);
          const myPrebooking = participants.data.find(
            (p) => p.user_id === user.id,
          );
          if (myPrebooking) {
            groupPrebookings.push({
              id: myPrebooking.id,
              slot_date: slot.date,
              slot_start_time: slot.start_time,
              slot_end_time: slot.end_time,
              slot_type: "GROUP",
              status:
                slot.status === "BLOCKED_FOR_GROUP" ? "CONFIRMED" : "PENDING",
              booking_type: "GROUP_PREBOOKING",
            });
          }
        } catch (e) {
          // Slot sans participants
        }
      }

      // Combiner les deux
      const allBookings = [...soloResponse.data, ...groupPrebookings];
      setMyBookings(allBookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      CONFIRMED: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "✓ Confirmé",
        icon: "✓",
      },
      PENDING: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "⏳ En attente",
        icon: "⏳",
      },
      REQUESTED: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "📝 Demandé",
        icon: "📝",
      },
      CANCELLED: {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "✕ Annulé",
        icon: "✕",
      },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span
        className={`px-3 py-1.5 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    try {
      const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
      return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return "Date non disponible";
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: "var(--gold-primary)" }}
          ></div>
          <p style={{ color: "var(--text-primary)" }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/calendar")}
            className="mb-4 px-4 py-2 rounded-lg btn-chrome flex items-center gap-2"
          >
            ← Retour au calendrier
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background: "var(--chrome-gradient)" }}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h1
                className="text-3xl font-bold"
                style={{ color: "var(--gold-primary)" }}
              >
                Mon Compte
              </h1>
              <p style={{ color: "var(--text-muted)" }}>{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${user?.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
            >
              {user?.role === "ADMIN" ? "👑 Administrateur" : "👤 Étudiant"}
            </span>
            {user?.isGroupMember && (
              <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-700">
                👥 Membre du groupe
              </span>
            )}
          </div>
        </div>

        {/* Mes Réservations */}
        <div className="card-dark rounded-xl shadow-lg p-6">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: "var(--gold-primary)" }}
          >
            📅 Mes Réservations ({myBookings.length})
          </h2>

          {myBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p
                className="text-xl font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Aucune réservation
              </p>
              <p style={{ color: "var(--text-muted)" }}>
                Vous n'avez pas encore de réservation. Consultez le calendrier
                pour réserver un créneau.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border rounded-xl p-5 hover:shadow-md transition-shadow"
                  style={{
                    borderColor: "var(--chrome-medium)",
                    backgroundColor: "var(--bg-secondary)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-3xl">
                          {booking.slot_type === "GROUP" ? "👥" : "👤"}
                        </div>
                        <div>
                          <h3
                            className="text-lg font-bold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {formatDate(booking.slot_date)}
                          </h3>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {booking.slot_type === "GROUP"
                              ? "Créneau Groupe"
                              : "Créneau Solo"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p
                            className="text-xs font-semibold mb-1"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Horaire
                          </p>
                          <p
                            className="font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            🕐 {booking.slot_start_time} -{" "}
                            {booking.slot_end_time}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs font-semibold mb-1"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Statut
                          </p>
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>

                      {booking.status === "CONFIRMED" && (
                        <div
                          className="mt-3 p-3 rounded-lg"
                          style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}
                        >
                          <p className="text-sm font-semibold text-green-700">
                            ✓ Votre réservation est confirmée ! Rendez-vous le{" "}
                            {formatDate(booking.slot_date)} à{" "}
                            {booking.slot_start_time}
                          </p>
                        </div>
                      )}

                      {booking.status === "PENDING" && (
                        <div
                          className="mt-3 p-3 rounded-lg"
                          style={{ backgroundColor: "rgba(251, 191, 36, 0.1)" }}
                        >
                          <p className="text-sm font-semibold text-yellow-700">
                            ⏳ En attente de validation par l'administrateur
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyAccount;
