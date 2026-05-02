import { useState, useEffect } from "react";
import { bookingsAPI } from "../services/api";
import { useToast } from "../contexts/ToastContext";

function BookingsTable() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const { showToast } = useToast();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await bookingsAPI.getAll();
      setBookings(response.data);
    } catch (error) {
      console.error("Error loading bookings:", error);
    }
  };

  const handleConfirm = async (bookingId) => {
    try {
      await bookingsAPI.confirm(bookingId);
      showToast("Réservation confirmée", "success");
      loadBookings();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la confirmation",
        "error",
      );
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      await bookingsAPI.cancel(bookingId);
      showToast("Réservation annulée", "success");
      loadBookings();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de l'annulation",
        "error",
      );
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "ALL") return true;
    return b.status === filter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      REQUESTED: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "En attente",
      },
      CONFIRMED: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Confirmé",
      },
      CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "Annulé" },
    };
    const badge = badges[status] || badges.REQUESTED;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">📋</div>
          <h2 className="text-2xl font-bold text-gray-800">
            Réservations ({filteredBookings.length})
          </h2>
        </div>

        <div className="flex gap-2">
          {["ALL", "REQUESTED", "CONFIRMED", "CANCELLED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === status
                  ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status === "ALL"
                ? "Toutes"
                : status === "REQUESTED"
                  ? "En attente"
                  : status === "CONFIRMED"
                    ? "Confirmées"
                    : "Annulées"}
            </button>
          ))}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Aucune réservation</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Utilisateur
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Horaire
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Type
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Statut
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {booking.user_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {booking.user_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {booking.user_email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-800">
                      {new Date(
                        booking.slot_date + "T00:00:00",
                      ).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-800">
                      {booking.slot_start_time} - {booking.slot_end_time}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        booking.slot_type === "GROUP"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {booking.slot_type === "GROUP" ? "Groupe" : "Solo"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      {booking.status === "REQUESTED" && (
                        <>
                          <button
                            onClick={() => handleConfirm(booking.id)}
                            className="px-3 py-1 rounded-lg font-semibold text-sm transition-all hover:shadow-md"
                            style={{
                              background:
                                "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              color: "white",
                            }}
                            title="Confirmer"
                          >
                            ✓ Confirmer
                          </button>
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="px-3 py-1 rounded-lg font-semibold text-sm transition-all hover:shadow-md"
                            style={{
                              background:
                                "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                              color: "white",
                            }}
                            title="Refuser"
                          >
                            ✕ Refuser
                          </button>
                        </>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="px-3 py-1 rounded-lg font-semibold text-sm transition-all hover:shadow-md"
                          style={{
                            background:
                              "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                            color: "white",
                          }}
                          title="Annuler"
                        >
                          🚫 Annuler
                        </button>
                      )}
                      <button
                        onClick={() =>
                          (window.location.href = `mailto:${booking.user_email}?subject=Réservation du ${new Date(booking.slot_date + "T00:00:00").toLocaleDateString("fr-FR")}`)
                        }
                        className="px-3 py-1 rounded-lg font-semibold text-sm transition-all hover:shadow-md"
                        style={{
                          background:
                            "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                          color: "white",
                        }}
                        title="Envoyer un email"
                      >
                        ✉️
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Supprimer définitivement la réservation de ${booking.user_name} ?`,
                            )
                          ) {
                            handleCancel(booking.id);
                          }
                        }}
                        className="px-3 py-1 rounded-lg font-semibold text-sm transition-all hover:shadow-md"
                        style={{
                          background:
                            "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                          color: "white",
                        }}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BookingsTable;
