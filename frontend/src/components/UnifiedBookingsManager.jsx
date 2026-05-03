import { useState, useEffect } from "react";
import { bookingsAPI, slotsAPI } from "../services/api";
import { useToast } from "../contexts/ToastContext";

function UnifiedBookingsManager() {
  const [slots, setSlots] = useState([]);
  const [expandedSlots, setExpandedSlots] = useState({});
  const [filter, setFilter] = useState("ALL");
  const { showToast } = useToast();

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    try {
      const now = new Date();
      const startDate = now.toISOString().split("T")[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0)
        .toISOString()
        .split("T")[0];

      const response = await slotsAPI.getAll(startDate, endDate);

      // Regrouper les slots par date+heure (éviter les doublons)
      const uniqueSlots = {};
      response.data.forEach((slot) => {
        const key = `${slot.date}_${slot.start_time}_${slot.end_time}`;
        if (!uniqueSlots[key] || slot.type === "GROUP") {
          uniqueSlots[key] = slot;
        }
      });

      // Charger les participants pour chaque slot unique
      const slotsWithParticipants = await Promise.all(
        Object.values(uniqueSlots).map(async (slot) => {
          if (slot.type === "GROUP") {
            try {
              const participantsRes = await bookingsAPI.getGroupPrebookings(
                slot.id,
              );
              return { ...slot, participants: participantsRes.data || [] };
            } catch (e) {
              return { ...slot, participants: [] };
            }
          }
          return { ...slot, participants: [] };
        }),
      );

      setSlots(slotsWithParticipants);
    } catch (error) {
      console.error("Error loading slots:", error);
    }
  };

  const toggleSlot = (slotId) => {
    setExpandedSlots((prev) => ({
      ...prev,
      [slotId]: !prev[slotId],
    }));
  };

  const handleBlockSlot = async (slotId) => {
    try {
      await slotsAPI.blockSlot(slotId);
      showToast("Créneau bloqué et participants validés", "success");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      showToast(error.response?.data?.error || "Erreur", "error");
    }
  };

  const handleReleaseSlot = async (slotId) => {
    try {
      await slotsAPI.releaseSlot(slotId);
      showToast("Créneau débloqué", "success");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      showToast(error.response?.data?.error || "Erreur", "error");
    }
  };

  const handleDeletePrebooking = async (prebookingId) => {
    if (!window.confirm("Supprimer cette pré-réservation ?")) return;
    try {
      await bookingsAPI.deleteGroupPrebookingById(prebookingId);
      showToast("Pré-réservation supprimée", "success");
      loadSlots();
    } catch (error) {
      showToast(error.response?.data?.error || "Erreur", "error");
    }
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
      return "Date invalide";
    }
  };

  const getStatusBadge = (slot) => {
    if (slot.status === "BLOCKED_FOR_GROUP") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          🚫 Bloqué
        </span>
      );
    }
    if (slot.participants?.length > 0) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          ✓ {slot.participants.length} participant
          {slot.participants.length > 1 ? "s" : ""}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
        Ouvert
      </span>
    );
  };

  const filteredSlots = slots.filter((slot) => {
    if (filter === "ALL") return true;
    if (filter === "BLOCKED") return slot.status === "BLOCKED_FOR_GROUP";
    if (filter === "WITH_PARTICIPANTS") return slot.participants?.length > 0;
    if (filter === "EMPTY")
      return (
        slot.participants?.length === 0 && slot.status !== "BLOCKED_FOR_GROUP"
      );
    return true;
  });

  return (
    <div className="rounded-xl shadow-lg p-6 card-dark">
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--gold-primary)" }}
        >
          📅 Gestion des Créneaux Groupe
        </h2>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            filter === "ALL" ? "btn-gold" : "btn-chrome"
          }`}
        >
          Tous ({slots.length})
        </button>
        <button
          onClick={() => setFilter("WITH_PARTICIPANTS")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            filter === "WITH_PARTICIPANTS" ? "btn-gold" : "btn-chrome"
          }`}
        >
          Avec participants (
          {slots.filter((s) => s.participants?.length > 0).length})
        </button>
        <button
          onClick={() => setFilter("BLOCKED")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            filter === "BLOCKED" ? "btn-gold" : "btn-chrome"
          }`}
        >
          Bloqués (
          {slots.filter((s) => s.status === "BLOCKED_FOR_GROUP").length})
        </button>
        <button
          onClick={() => setFilter("EMPTY")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            filter === "EMPTY" ? "btn-gold" : "btn-chrome"
          }`}
        >
          Vides (
          {
            slots.filter(
              (s) =>
                s.participants?.length === 0 &&
                s.status !== "BLOCKED_FOR_GROUP",
            ).length
          }
          )
        </button>
      </div>

      {/* Liste des créneaux */}
      <div className="space-y-3">
        {filteredSlots.map((slot) => (
          <div
            key={slot.id}
            className="border rounded-xl overflow-hidden transition-all"
            style={{
              borderColor: "var(--chrome-medium)",
              backgroundColor: "var(--bg-secondary)",
            }}
          >
            {/* Header du créneau */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-3xl">📅</div>
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
                      {slot.start_time} - {slot.end_time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(slot)}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {slot.participants?.length > 0 && (
                    <button
                      onClick={() => toggleSlot(slot.id)}
                      className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:shadow-md"
                      style={{
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        color: "white",
                      }}
                    >
                      {expandedSlots[slot.id] ? "▼" : "▶"} Voir participants (
                      {slot.participants.length})
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
                      title="Bloquer le créneau et valider tous les participants"
                    >
                      🚫 Bloquer & Valider
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Liste des participants (expandable) */}
            {expandedSlots[slot.id] && slot.participants?.length > 0 && (
              <div
                className="border-t p-4"
                style={{
                  borderColor: "var(--chrome-medium)",
                  backgroundColor: "var(--bg-tertiary)",
                }}
              >
                <p
                  className="font-semibold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  👥 Participants inscrits :
                </p>
                <div className="space-y-2">
                  {slot.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{
                            background:
                              "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                          }}
                        >
                          {participant.user_name?.charAt(0).toUpperCase() ||
                            "?"}
                        </div>
                        <div>
                          <p
                            className="font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {participant.user_name}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {participant.user_email}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            (window.location.href = `mailto:${participant.user_email}`)
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
                        {slot.status !== "BLOCKED_FOR_GROUP" && (
                          <button
                            onClick={() =>
                              handleDeletePrebooking(participant.id)
                            }
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:shadow-md"
                            style={{
                              background:
                                "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                              color: "white",
                            }}
                            title="Supprimer la pré-réservation"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredSlots.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Aucun créneau trouvé
          </p>
        </div>
      )}
    </div>
  );
}

export default UnifiedBookingsManager;
