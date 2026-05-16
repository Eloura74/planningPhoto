import { useState, useEffect } from "react";
import { eventsAPI, adminAPI } from "../services/api";
import { useToast } from "../contexts/ToastContext";

function EventsManager() {
  const [events, setEvents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [stats, setStats] = useState([]);
  const [selectedDatesToConfirm, setSelectedDatesToConfirm] = useState([]);
  const { showToast } = useToast();

  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getAllAdmin();
      setEvents(response.data);
    } catch (error) {
      console.error("Error loading events:", error);
      showToast("Erreur lors du chargement des événements", "error");
    }
  };

  const loadStats = async (eventId) => {
    try {
      const response = await eventsAPI.getStats(eventId);
      setStats(response.data);
    } catch (error) {
      console.error("Error loading stats:", error);
      showToast("Erreur lors du chargement des statistiques", "error");
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await eventsAPI.create(newEvent);
      showToast(
        "✅ Événement créé ! Les membres peuvent maintenant proposer des dates.",
        "success",
      );
      setShowCreateForm(false);
      setNewEvent({ name: "", description: "" });
      loadEvents();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la création",
        "error",
      );
    }
  };

  const handleConfirmEvent = async (eventId, confirmedDates) => {
    if (!confirmedDates || confirmedDates.length === 0) {
      showToast("Veuillez sélectionner au moins une date", "error");
      return;
    }

    try {
      await eventsAPI.confirm(eventId, confirmedDates);
      showToast("✅ Événement confirmé ! Les dates sont bloquées.", "success");
      loadEvents();
      setSelectedEvent(null);
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la confirmation",
        "error",
      );
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?"))
      return;

    try {
      await eventsAPI.delete(eventId);
      showToast("Événement supprimé", "success");
      loadEvents();
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const handleResetAll = async () => {
    if (
      !window.confirm(
        "⚠️ ATTENTION ! Cela va supprimer TOUTES les réservations, événements et créneaux. Êtes-vous sûr ?",
      )
    )
      return;

    if (
      !window.confirm(
        "Dernière confirmation : Toutes les données seront perdues !",
      )
    )
      return;

    try {
      const response = await adminAPI.resetAll();
      showToast("✅ Base de données nettoyée avec succès !", "success");
      console.log("Données restantes:", response.data.remaining);
      loadEvents();
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error resetting database:", error);
      showToast("Erreur lors du nettoyage", "error");
    }
  };

  const viewEventDetails = async (event) => {
    setSelectedEvent(event);
    setSelectedDatesToConfirm([]);
    await loadStats(event.id);
  };

  const toggleDateSelection = (date) => {
    if (selectedDatesToConfirm.includes(date)) {
      setSelectedDatesToConfirm(
        selectedDatesToConfirm.filter((d) => d !== date),
      );
    } else {
      setSelectedDatesToConfirm([...selectedDatesToConfirm, date]);
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
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: { bg: "bg-gray-100", text: "text-gray-700", label: "Brouillon" },
      OPEN: { bg: "bg-blue-100", text: "text-blue-700", label: "Ouvert" },
      CONFIRMED: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Confirmé",
      },
      CLOSED: { bg: "bg-red-100", text: "text-red-700", label: "Fermé" },
    };

    const badge = badges[status] || badges.DRAFT;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--gold-primary)" }}
        >
          🎉 Gestion des Événements Groupe
        </h2>
        <div className="flex gap-3">
          <button
            onClick={handleResetAll}
            className="px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-md"
            style={{
              backgroundColor: "#dc2626",
              color: "white",
            }}
          >
            🗑️ Nettoyer la base
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-md btn-gold"
          >
            {showCreateForm ? "Annuler" : "+ Nouvel Événement"}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div
          className="p-6 rounded-xl border"
          style={{
            borderColor: "var(--chrome-medium)",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <h3
            className="text-lg font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Créer un événement
          </h3>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Nom de l'événement
              </label>
              <input
                type="text"
                required
                value={newEvent.name}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg input-dark"
                placeholder="Ex: Sortie photo forêt"
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Description
              </label>
              <textarea
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg input-dark"
                rows="3"
                placeholder="Détails de l'événement..."
              />
            </div>

            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: "rgba(168, 85, 247, 0.1)" }}
            >
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                💡 Les membres groupe pourront proposer des dates depuis leur
                calendrier après la création de l'événement.
              </p>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-md btn-gold"
            >
              Créer l'événement
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="p-4 rounded-xl border transition-all hover:shadow-lg cursor-pointer"
            style={{
              borderColor: "var(--chrome-medium)",
              backgroundColor: "var(--bg-secondary)",
            }}
            onClick={() => viewEventDetails(event)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3
                  className="text-lg font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {event.name}
                </h3>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {event.description}
                </p>
                <p
                  className="text-sm mt-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  📅 En attente des propositions des membres
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(event.status)}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    viewEventDetails(event);
                  }}
                  className="px-3 py-1 rounded-lg text-sm font-semibold transition-all hover:shadow-md btn-gold"
                >
                  Voir détails
                </button>
              </div>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div
            className="text-center py-12"
            style={{ color: "var(--text-muted)" }}
          >
            <p>Aucun événement créé</p>
            <p className="text-sm mt-2">
              Créez votre premier événement pour commencer !
            </p>
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--bg-primary)" }}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3
                  className="text-2xl font-bold"
                  style={{ color: "var(--gold-primary)" }}
                >
                  {selectedEvent.name}
                </h3>
                <p
                  className="text-sm mt-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {selectedEvent.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-2xl font-bold"
                style={{ color: "var(--text-secondary)" }}
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <h4
                className="font-bold mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                📊 Résultats des votes
              </h4>
              {stats.length > 0 ? (
                <div className="space-y-2">
                  {stats.map((stat, index) => (
                    <label
                      key={index}
                      className="p-3 rounded-lg flex justify-between items-center cursor-pointer transition-all hover:shadow-md"
                      style={{
                        backgroundColor: selectedDatesToConfirm.includes(
                          stat.available_date,
                        )
                          ? "rgba(168, 85, 247, 0.1)"
                          : "var(--bg-secondary)",
                        border: selectedDatesToConfirm.includes(
                          stat.available_date,
                        )
                          ? "2px solid var(--gold-primary)"
                          : "2px solid transparent",
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {selectedEvent.status === "OPEN" && (
                          <input
                            type="checkbox"
                            checked={selectedDatesToConfirm.includes(
                              stat.available_date,
                            )}
                            onChange={() =>
                              toggleDateSelection(stat.available_date)
                            }
                            className="w-5 h-5"
                          />
                        )}
                        <div>
                          <p
                            className="font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {formatDate(stat.available_date)}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {stat.voters.join(", ")}
                          </p>
                        </div>
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-sm font-bold"
                        style={{
                          backgroundColor: "var(--gold-primary)",
                          color: "var(--bg-primary)",
                        }}
                      >
                        {stat.vote_count} vote{stat.vote_count > 1 ? "s" : ""}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)" }}>
                  Aucun vote pour le moment
                </p>
              )}
            </div>

            <div className="flex gap-3">
              {selectedEvent.status === "OPEN" && stats.length > 0 && (
                <button
                  onClick={() =>
                    handleConfirmEvent(selectedEvent.id, selectedDatesToConfirm)
                  }
                  disabled={selectedDatesToConfirm.length === 0}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      selectedDatesToConfirm.length > 0
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        : "gray",
                    color: "white",
                  }}
                >
                  ✅ Confirmer ({selectedDatesToConfirm.length} date
                  {selectedDatesToConfirm.length > 1 ? "s" : ""})
                </button>
              )}
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-md"
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "white",
                }}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventsManager;
