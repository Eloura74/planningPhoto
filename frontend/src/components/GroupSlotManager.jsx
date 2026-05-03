import { useState, useEffect } from "react";
import { slotsAPI, bookingsAPI } from "../services/api";
import { useToast } from "../contexts/ToastContext";

function GroupSlotManager() {
  const [groupSlots, setGroupSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [participants, setParticipants] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    loadGroupSlots();
  }, []);

  const loadGroupSlots = async () => {
    try {
      const now = new Date();
      const startDate = now.toISOString().split("T")[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0)
        .toISOString()
        .split("T")[0];

      const response = await slotsAPI.getAll(startDate, endDate);
      const slots = response.data.filter(
        (s) =>
          (s.type === "GROUP" || s.type === "MIXED") &&
          (s.status === "BLOCKED_FOR_GROUP" ||
            s.status === "GROUP_PREBOOKING" ||
            s.status === "OPEN_TUESDAY"),
      );
      setGroupSlots(slots);
    } catch (error) {
      console.error("Error loading group slots:", error);
    }
  };

  const loadParticipants = async (slotId) => {
    try {
      const response = await bookingsAPI.getGroupPrebookings(slotId);
      setParticipants(response.data);
      setSelectedSlot(slotId);
    } catch (error) {
      console.error("Error loading participants:", error);
    }
  };

  const handleValidateSlot = async (slotId) => {
    try {
      await slotsAPI.confirmGroup([slotId]);
      showToast("Créneau groupe validé avec succès", "success");
      loadGroupSlots();
      setSelectedSlot(null);
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la validation",
        "error",
      );
    }
  };

  const handleBlockSlot = async (slotId) => {
    try {
      await slotsAPI.blockSlot(slotId);
      showToast("Créneau bloqué avec succès", "success");
      loadGroupSlots();
      // Rafraîchir la page pour mettre à jour le calendrier
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors du blocage",
        "error",
      );
    }
  };

  const handleReleaseSlot = async (slotId) => {
    try {
      await slotsAPI.releaseSlot(slotId);
      showToast("Créneau débloqué avec succès", "success");
      loadGroupSlots();
      // Rafraîchir la page pour mettre à jour le calendrier
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors du déblocage",
        "error",
      );
    }
  };

  return (
    <div className="rounded-xl shadow-lg p-6 card-dark">
      <div className="flex items-center gap-3 mb-6">
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--gold-primary)" }}
        >
          Gestion des créneaux groupe
        </h2>
      </div>

      {groupSlots.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Aucun créneau groupe disponible</p>
          <p className="text-sm mt-2">
            Les créneaux groupe apparaîtront automatiquement les mardis et
            jeudis
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupSlots.map((slot) => (
            <div
              key={slot.id}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📅</div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {(() => {
                          const date =
                            slot.date instanceof Date
                              ? slot.date
                              : new Date(slot.date);
                          return date.toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          });
                        })()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {slot.start_time} - {slot.end_time}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            slot.status === "BLOCKED_FOR_GROUP"
                              ? "bg-red-100 text-red-700"
                              : slot.status === "GROUP_PREBOOKING"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {slot.status === "BLOCKED_FOR_GROUP"
                            ? "🚫 Bloqué par admin"
                            : slot.status === "GROUP_PREBOOKING"
                              ? "Pré-réservations"
                              : "Ouvert"}
                        </span>
                        {slot.group_prebooking_count > 0 && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                            {slot.group_prebooking_count} participant
                            {slot.group_prebooking_count > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => loadParticipants(slot.id)}
                    className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:shadow-md"
                    style={{
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      color: "white",
                    }}
                  >
                    👥 Voir participants ({slot.group_prebooking_count || 0})
                  </button>
                  {slot.group_prebooking_count > 0 &&
                    slot.status !== "BLOCKED_FOR_GROUP" && (
                      <button
                        onClick={() => handleValidateSlot(slot.id)}
                        className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:shadow-md"
                        style={{
                          background:
                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "white",
                        }}
                      >
                        ✓ Valider groupe
                      </button>
                    )}
                  {slot.status === "BLOCKED_FOR_GROUP" ? (
                    <button
                      onClick={() => handleReleaseSlot(slot.id)}
                      className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:shadow-md"
                      style={{
                        background:
                          "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "white",
                      }}
                    >
                      ✓ Débloquer
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBlockSlot(slot.id)}
                      className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:shadow-md"
                      style={{
                        background:
                          "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        color: "white",
                      }}
                    >
                      🚫 Bloquer
                    </button>
                  )}
                </div>
              </div>

              {selectedSlot === slot.id && participants.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="font-semibold text-gray-700 mb-3">
                    👥 Participants inscrits ({participants.length}) :
                  </p>
                  <div className="space-y-2">
                    {participants.map((p, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {p.user_name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {p.user_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {p.user_email}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              (window.location.href = `mailto:${p.user_email}`)
                            }
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:shadow-md"
                            style={{
                              background:
                                "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                              color: "white",
                            }}
                            title="Envoyer un email"
                          >
                            ✉️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GroupSlotManager;
