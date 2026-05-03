import { useState, useEffect } from "react";
import { bookingsAPI, slotsAPI } from "../services/api";
import { useToast } from "../contexts/ToastContext";
import QuickEmailModal from "./QuickEmailModal";

function AdminBookingsManager() {
  const [bookings, setBookings] = useState([]);
  const [expandedSlots, setExpandedSlots] = useState({});
  const [emailModal, setEmailModal] = useState({
    isOpen: false,
    email: "",
    name: "",
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadAllBookings();
  }, []);

  const loadAllBookings = async () => {
    try {
      // Charger toutes les réservations
      const response = await bookingsAPI.getAll();
      console.log("📋 All bookings:", response.data);

      // Regrouper par créneau (date + heure)
      const grouped = {};

      response.data.forEach((booking) => {
        const key = `${booking.slot_date}_${booking.slot_start_time}_${booking.slot_end_time}`;

        if (!grouped[key]) {
          grouped[key] = {
            date: booking.slot_date,
            start_time: booking.slot_start_time,
            end_time: booking.slot_end_time,
            slot_id: booking.slot_id,
            slot_type: booking.slot_type,
            slot_status: booking.slot_status,
            bookings: [],
          };
        }

        grouped[key].bookings.push(booking);
      });

      // Convertir en tableau et trier par date
      const bookingsArray = Object.values(grouped).sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );

      setBookings(bookingsArray);
    } catch (error) {
      console.error("Error loading bookings:", error);
    }
  };

  const toggleSlot = (key) => {
    setExpandedSlots((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      await bookingsAPI.confirm(bookingId);

      // Mettre à jour le statut localement pour un feedback immédiat
      setBookings((prevBookings) =>
        prevBookings.map((slot) => ({
          ...slot,
          bookings: slot.bookings.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: "CONFIRMED" }
              : booking,
          ),
        })),
      );

      showToast("✅ Membre confirmé avec succès !", "success");

      // Recharger depuis l'API pour synchroniser
      loadAllBookings();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la confirmation",
        "error",
      );
    }
  };

  const handleDeleteBooking = async (bookingId, bookingType) => {
    if (!window.confirm("Supprimer cette réservation ?")) return;

    try {
      if (bookingType === "GROUP") {
        await bookingsAPI.deleteGroupPrebookingById(bookingId);
      } else {
        await bookingsAPI.cancel(bookingId);
      }
      showToast("Réservation supprimée", "success");
      loadAllBookings();
    } catch (error) {
      showToast(error.response?.data?.error || "Erreur", "error");
    }
  };

  const handleBlockSlot = async (slotId) => {
    if (
      !window.confirm(
        "Bloquer ce créneau groupe et valider tous les participants ?",
      )
    )
      return;

    try {
      await slotsAPI.blockSlot(slotId);
      showToast("✅ Créneau bloqué et participants validés !", "success");
      loadAllBookings();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors du blocage",
        "error",
      );
    }
  };

  const handleReopenSlot = async (slotId) => {
    if (
      !window.confirm(
        "Rouvrir ce créneau groupe pour de nouvelles inscriptions ?",
      )
    )
      return;

    try {
      await slotsAPI.reopenSlot(slotId);
      showToast("✅ Créneau rouvert avec succès !", "success");
      loadAllBookings();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la réouverture",
        "error",
      );
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return "Date invalide";
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      CONFIRMED: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "✓ Confirmé",
      },
      PENDING: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "⏳ En attente",
      },
      REQUESTED: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "📝 Demandé",
      },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <div className="rounded-xl shadow-lg p-6 card-dark">
      <h2
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--gold-primary)" }}
      >
        📅 Gestion des Réservations
      </h2>

      <div className="space-y-3">
        {bookings.map((slot, index) => {
          const key = `${slot.date}_${slot.start_time}_${slot.end_time}`;
          const isExpanded = expandedSlots[key];

          return (
            <div
              key={index}
              className="border rounded-xl overflow-hidden transition-all"
              style={{
                borderColor: "var(--chrome-medium)",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              {/* Header */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl">
                      {slot.slot_type === "GROUP" ? "👥" : "👤"}
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-bold text-lg"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {formatDate(slot.date)}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {slot.start_time} - {slot.end_time} •{" "}
                        {slot.slot_type === "GROUP" ? "Groupe" : "Solo"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                        {slot.bookings.length} réservation
                        {slot.bookings.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleSlot(key)}
                      className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:shadow-md btn-gold"
                    >
                      {isExpanded ? "▼ Masquer" : "▶ Voir détails"}
                    </button>

                    {slot.slot_type === "GROUP" &&
                      (slot.slot_status === "BLOCKED_FOR_GROUP" ? (
                        <div className="flex gap-2">
                          <button
                            disabled
                            className="px-4 py-2 rounded-lg font-semibold text-sm cursor-not-allowed opacity-60"
                            style={{
                              background: "var(--chrome-medium)",
                              color: "var(--text-secondary)",
                            }}
                            title="Créneau bloqué et validé"
                          >
                            ✅ Créneau Bloqué
                          </button>
                          <button
                            onClick={() => handleReopenSlot(slot.slot_id)}
                            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:shadow-md"
                            style={{
                              background:
                                "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              color: "white",
                            }}
                            title="Rouvrir le créneau pour de nouvelles inscriptions"
                          >
                            🔓 Rouvrir
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBlockSlot(slot.slot_id)}
                          className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:shadow-md"
                          style={{
                            background:
                              "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                            color: "white",
                          }}
                          title="Bloquer et valider tous les participants"
                        >
                          🚫 Bloquer & Valider
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Liste des participants */}
              {isExpanded && (
                <div
                  className="border-t p-4"
                  style={{
                    borderColor: "var(--chrome-medium)",
                    backgroundColor: "var(--bg-tertiary)",
                  }}
                >
                  <div className="space-y-2">
                    {slot.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                            style={{
                              background:
                                "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                            }}
                          >
                            {booking.user_name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div className="flex-1">
                            <p
                              className="font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {booking.user_name}
                            </p>
                            <p
                              className="text-sm"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {booking.user_email}
                            </p>
                          </div>
                          <div>{getStatusBadge(booking.status)}</div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() =>
                              setEmailModal({
                                isOpen: true,
                                email: booking.user_email,
                                name: booking.user_name,
                              })
                            }
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:shadow-md"
                            style={{
                              background:
                                "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                              color: "white",
                            }}
                            title="Envoyer un email"
                          >
                            ✉️ Email
                          </button>

                          {booking.status !== "CONFIRMED" && (
                            <button
                              onClick={() => handleConfirmBooking(booking.id)}
                              className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                background:
                                  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "white",
                              }}
                              title="Valider la réservation"
                            >
                              ✓
                            </button>
                          )}

                          <button
                            onClick={() =>
                              handleDeleteBooking(
                                booking.id,
                                booking.booking_type,
                              )
                            }
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:shadow-md"
                            style={{
                              background:
                                "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                              color: "white",
                            }}
                            title="Supprimer la réservation"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Aucune réservation
          </p>
        </div>
      )}

      <QuickEmailModal
        isOpen={emailModal.isOpen}
        onClose={() => setEmailModal({ isOpen: false, email: "", name: "" })}
        recipientEmail={emailModal.email}
        recipientName={emailModal.name}
      />
    </div>
  );
}

export default AdminBookingsManager;
