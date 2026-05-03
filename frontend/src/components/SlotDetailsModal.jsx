import { useState, useEffect } from "react";
import { bookingsAPI } from "../services/api";

function SlotDetailsModal({ slot, onClose, user }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants();
  }, [slot.id]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      if (slot.type === "GROUP" || slot.type === "MIXED") {
        // Utiliser slot_id s'il existe (slot réel), sinon slot.id (slot virtuel)
        const slotId = slot.slot_id || slot.id;
        console.log("🔍 Loading participants for slot:", slotId);
        const response = await bookingsAPI.getGroupPrebookings(slotId);
        console.log("🔍 Participants loaded:", response.data);
        setParticipants(response.data);
      }
    } catch (error) {
      console.error("❌ Error loading participants:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl p-6 max-w-2xl w-full card-dark"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2
              className="text-2xl font-bold"
              style={{ color: "var(--gold-primary)" }}
            >
              Détails du créneau
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: "var(--text-primary)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Slot Info */}
        <div
          className="mb-6 p-4 rounded-lg"
          style={{ backgroundColor: "var(--bg-tertiary)" }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Date
              </p>
              <p
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {new Date(slot.date + "T00:00:00").toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Horaire
              </p>
              <p
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {slot.start_time} - {slot.end_time}
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Type
              </p>
              <p
                className="font-semibold"
                style={{ color: "var(--gold-primary)" }}
              >
                {slot.type === "GROUP" ? "Session de groupe" : "Session solo"}
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Participants
              </p>
              <p
                className="font-semibold"
                style={{ color: "var(--gold-primary)" }}
              >
                {participants.length} / 5
              </p>
            </div>
          </div>
        </div>

        {/* Participants List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              👥 Participants pré-inscrits
            </h3>
            <span
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{
                background: "var(--chrome-gradient)",
                color: "var(--text-dark)",
              }}
            >
              {participants.length} / 5
            </span>
          </div>

          {loading ? (
            <div
              className="text-center py-12 rounded-lg"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <div className="animate-pulse">
                <div className="text-4xl mb-2">⏳</div>
                <p style={{ color: "var(--text-muted)" }}>
                  Chargement des participants...
                </p>
              </div>
            </div>
          ) : participants.length === 0 ? (
            <div
              className="text-center py-12 rounded-lg"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <div className="text-6xl mb-4">📭</div>
              <p
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Aucun participant pour le moment
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Soyez le premier à vous pré-inscrire !
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {participants.map((participant, index) => (
                <div
                  key={participant.id || index}
                  className="flex items-center gap-4 p-4 rounded-lg transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--chrome-medium)",
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg"
                      style={{
                        background:
                          participant.user_id === user?.id
                            ? "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
                            : "var(--chrome-gradient)",
                        color: "var(--text-dark)",
                      }}
                    >
                      {participant.user_name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <p
                        className="font-bold text-base"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {participant.user_name || "Utilisateur inconnu"}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {participant.user_email || "Email non disponible"}
                      </p>
                    </div>
                  </div>
                  {participant.user_id === user?.id && (
                    <span
                      className="px-4 py-1.5 rounded-full text-xs font-bold shadow-md"
                      style={{
                        background:
                          "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                        color: "var(--text-dark)",
                      }}
                    >
                      ✓ Vous
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-semibold btn-chrome"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default SlotDetailsModal;
