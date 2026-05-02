import { useState, useEffect } from "react";
import { availabilityAPI } from "../services/api";
import { useToast } from "../contexts/ToastContext";

function UnavailabilityManager() {
  const [unavailabilities, setUnavailabilities] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const { showToast } = useToast();

  const loadUnavailabilities = async () => {
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0)
        .toISOString()
        .split("T")[0];

      const response = await availabilityAPI.getUnavailabilities(
        startDate,
        endDate,
      );
      setUnavailabilities(response.data);
    } catch (error) {
      console.error("Error loading unavailabilities:", error);
    }
  };

  useEffect(() => {
    loadUnavailabilities();
  }, []);

  const handleMarkUnavailable = async (e) => {
    e.preventDefault();
    if (!selectedDate) return;

    try {
      await availabilityAPI.markUnavailable(selectedDate);
      showToast("Jour marqué comme indisponible", "success");
      setSelectedDate("");
      loadUnavailabilities();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la mise à jour",
        "error",
      );
    }
  };

  const handleRemoveUnavailability = async (date) => {
    try {
      await availabilityAPI.removeUnavailability(date);
      showToast("Jour retiré des indisponibilités", "success");
      loadUnavailabilities();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la suppression",
        "error",
      );
    }
  };

  return (
    <div
      className="p-6 rounded-2xl card-gold"
      style={{ backgroundColor: "var(--bg-secondary)" }}
    >
      <h3
        className="text-xl font-bold mb-4"
        style={{ color: "var(--gold-primary)" }}
      >
        📅 Gestion des indisponibilités
      </h3>

      <div className="mb-6">
        <p style={{ color: "var(--text-muted)" }} className="mb-3">
          💡 Sélectionnez une date pour la marquer comme indisponible. Les
          créneaux de cette journée n'apparaîtront plus dans le calendrier.
        </p>
        <form onSubmit={handleMarkUnavailable}>
          <div className="flex gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg input-dark"
              min={new Date().toISOString().split("T")[0]}
              required
            />
            <button type="submit" className="px-6 py-2 rounded-lg btn-gold">
              ➕ Marquer indisponible
            </button>
          </div>
        </form>
      </div>

      <div>
        <h4
          className="font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          📅 Jours indisponibles ({unavailabilities.length})
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {unavailabilities.length === 0 ? (
            <div
              className="text-center py-6 rounded-lg"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <p style={{ color: "var(--text-muted)" }}>
                ✅ Aucune indisponibilité définie
              </p>
              <p
                style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
                className="mt-1"
              >
                Tous les jours sont disponibles pour les réservations
              </p>
            </div>
          ) : (
            unavailabilities.map((unavail) => (
              <div
                key={unavail.date}
                className="flex justify-between items-center p-3 rounded-lg hover:opacity-80 transition-opacity"
                style={{ backgroundColor: "var(--bg-tertiary)" }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--gold-primary)" }}>🚫</span>
                  <span style={{ color: "var(--text-primary)" }}>
                    {new Date(unavail.date + "T00:00:00").toLocaleDateString(
                      "fr-FR",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveUnavailability(unavail.date)}
                  className="px-3 py-1 rounded text-sm hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: "rgba(255, 0, 0, 0.1)",
                    color: "#ff6b6b",
                    border: "1px solid rgba(255, 0, 0, 0.3)",
                  }}
                >
                  ✕ Retirer
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default UnavailabilityManager;
