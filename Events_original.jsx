import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { eventsAPI } from "../services/api";

function Events() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [myVotes, setMyVotes] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getOpen();
      setEvents(response.data);
    } catch (error) {
      console.error("Error loading events:", error);
      showToast("Erreur lors du chargement des événements", "error");
    }
  };

  const loadMyVotes = async (eventId) => {
    try {
      const response = await eventsAPI.getMyVotes(eventId);
      setMyVotes(response.data.map(d => new Date(d).toISOString().split('T')[0]));
      setSelectedDates(response.data.map(d => new Date(d).toISOString().split('T')[0]));
    } catch (error) {
      console.error("Error loading votes:", error);
    }
  };

  const handleVote = async () => {
    if (selectedDates.length === 0) {
      showToast("Veuillez sélectionner au moins une date", "error");
      return;
    }

    try {
      await eventsAPI.vote(selectedEvent.id, selectedDates);
      showToast("✅ Vos disponibilités ont été enregistrées !", "success");
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      showToast(error.response?.data?.error || "Erreur lors du vote", "error");
    }
  };

  const viewEventDetails = async (event) => {
    setSelectedEvent(event);
    await loadMyVotes(event.id);
  };

  const toggleDate = (date) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(selectedDates.filter(d => d !== date));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const generateDateRange = (startDate, endDate) => {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      <nav
        className="border-b sticky top-0 z-10"
        style={{
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--chrome-medium)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                color: "white",
              }}
            >
              🎉
            </div>
            <h1
              className="text-xl sm:text-2xl font-bold"
              style={{ color: "var(--gold-primary)" }}
            >
              Événements Groupe
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/calendar")}
              className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold text-sm btn-chrome"
            >
              Calendrier
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold text-sm"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p style={{ color: "var(--text-secondary)" }}>
            Votez pour vos disponibilités sur les événements proposés. L'admin choisira les dates avec le plus de participants.
          </p>
        </div>

        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-6 rounded-xl border transition-all hover:shadow-lg cursor-pointer"
              style={{
                borderColor: "var(--chrome-medium)",
                backgroundColor: "var(--bg-secondary)",
              }}
              onClick={() => viewEventDetails(event)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    {event.name}
                  </h3>
                  <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                    {event.description}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    📅 Période : {formatDate(event.start_date)} → {formatDate(event.end_date)}
                  </p>
                  {event.status === "CONFIRMED" && event.confirmed_dates && (
                    <div className="mt-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"
                      >
                        ✅ Confirmé
                      </span>
                      <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                        Dates confirmées : {JSON.parse(event.confirmed_dates).map(d => formatDate(d)).join(", ")}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    viewEventDetails(event);
                  }}
                  className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:shadow-md btn-gold"
                >
                  {event.status === "CONFIRMED" ? "Voir" : "Voter"}
                </button>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
              <p className="text-lg">Aucun événement disponible pour le moment</p>
              <p className="text-sm mt-2">Les événements apparaîtront ici quand l'admin les créera</p>
            </div>
          )}
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--bg-primary)" }}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold" style={{ color: "var(--gold-primary)" }}>
                  {selectedEvent.name}
                </h3>
                <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
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

            {selectedEvent.status === "CONFIRMED" ? (
              <div>
                <p className="mb-4" style={{ color: "var(--text-primary)" }}>
                  Cet événement a été confirmé pour les dates suivantes :
                </p>
                <div className="space-y-2">
                  {JSON.parse(selectedEvent.confirmed_dates || "[]").map((date, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {formatDate(date)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h4 className="font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                    Sélectionnez vos disponibilités
                  </h4>
                  <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                    Cochez toutes les dates où vous êtes disponible
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {generateDateRange(selectedEvent.start_date, selectedEvent.end_date).map((date) => (
                      <label
                        key={date}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:shadow-md"
                        style={{
                          backgroundColor: selectedDates.includes(date)
                            ? "rgba(168, 85, 247, 0.1)"
                            : "var(--bg-secondary)",
                          border: selectedDates.includes(date)
                            ? "2px solid var(--gold-primary)"
                            : "2px solid transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDates.includes(date)}
                          onChange={() => toggleDate(date)}
                          className="w-5 h-5"
                        />
                        <span style={{ color: "var(--text-primary)" }}>
                          {formatDate(date)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleVote}
                    className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-md btn-gold"
                  >
                    ✅ Enregistrer mes disponibilités ({selectedDates.length})
                  </button>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-md btn-chrome"
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;
