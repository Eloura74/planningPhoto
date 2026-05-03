import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { slotsAPI, bookingsAPI, availabilityAPI } from "../services/api";
import CalendarView from "../components/Calendar";
import BookingModal from "../components/BookingModal";
import LoadingSpinner from "../components/LoadingSpinner";
import SlotDetailsModal from "../components/SlotDetailsModal";

function CalendarPage() {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotTypeFilter, setSlotTypeFilter] = useState("ALL");
  const [slotStatusFilter, setSlotStatusFilter] = useState("ALL");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsSlot, setDetailsSlot] = useState(null);
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const currentMonth = new Date();
  const startDate = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  )
    .toISOString()
    .split("T")[0];
  const endDate = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  )
    .toISOString()
    .split("T")[0];

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadSlots();
    loadMyBookings();
  }, [user, navigate, slotTypeFilter, slotStatusFilter]);

  const loadSlots = async () => {
    try {
      const response = await availabilityAPI.getSlots(startDate, endDate);
      let filteredSlots = response.data;

      console.log("🔍 Créneaux reçus:", filteredSlots.length, filteredSlots);
      console.log("🔍 User:", user);

      // DEBUG: Compter les créneaux groupe confirmés
      const groupConfirmed = filteredSlots.filter(
        (s) => s.status === "GROUP_CONFIRMED",
      );
      console.log(
        "🔍 Créneaux GROUPE CONFIRMÉS:",
        groupConfirmed.length,
        groupConfirmed.map((s) => s.date),
      );

      // DEBUG: Afficher les mardis/jeudis
      const tuesdaysThursdays = filteredSlots.filter((s) => {
        const d = new Date(s.date + "T00:00:00");
        return d.getDay() === 2 || d.getDay() === 4;
      });
      console.log(
        "🔍 Mardis/Jeudis:",
        tuesdaysThursdays.length,
        tuesdaysThursdays.map((s) => ({
          date: s.date,
          type: s.type,
          status: s.status,
          released_for_solo: s.released_for_solo,
        })),
      );

      // DEBUG: Afficher le statut du 6 mai
      const slot6mai = filteredSlots.find(
        (s) => s.date === "2026-05-06" && s.start_time === "14:00",
      );
      if (slot6mai) {
        console.log("🔍 SLOT 6 MAI 14:00:", {
          id: slot6mai.id,
          status: slot6mai.status,
          type: slot6mai.type,
          is_virtual: slot6mai.is_virtual,
        });
      }

      // Filtre par rôle et type d'élève
      if (user?.role === "STUDENT") {
        if (user?.isGroupMember) {
          // Membres du groupe : voir les créneaux groupe ET solo
          filteredSlots = filteredSlots.filter(
            (slot) =>
              slot.status === "OPEN_TUESDAY" ||
              slot.status === "MIXED" ||
              slot.status === "BLOCKED_FOR_GROUP" ||
              slot.status === "GROUP_PREBOOKING" ||
              slot.status === "GROUP_CONFIRMED" ||
              slot.status === "OPEN_SOLO" ||
              slot.status === "SOLO_CONFIRMED",
          );
        } else {
          // Élèves solo : voir les créneaux SOLO et MIXED (mardis sans groupe)
          filteredSlots = filteredSlots.filter(
            (slot) =>
              (slot.type === "SOLO" ||
                (slot.type === "MIXED" && slot.group_prebooking_count === 0)) &&
              (slot.status === "OPEN_SOLO" ||
                slot.status === "SOLO_CONFIRMED" ||
                slot.status === "OPEN_TUESDAY"),
          );
        }
      }

      if (slotTypeFilter !== "ALL") {
        filteredSlots = filteredSlots.filter(
          (slot) => slot.type === slotTypeFilter,
        );
      }

      if (slotStatusFilter !== "ALL") {
        filteredSlots = filteredSlots.filter(
          (slot) => slot.status === slotStatusFilter,
        );
      }

      console.log(
        "🔍 Créneaux après filtrage:",
        filteredSlots.length,
        filteredSlots,
      );

      setSlots(filteredSlots);
    } catch (error) {
      console.error("Error loading slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyBookings = async () => {
    try {
      const response = await bookingsAPI.getMyBookings();
      const myBookingsData = response.data;

      // Charger aussi les pré-réservations groupe
      const now = new Date();
      const start = now.toISOString().split("T")[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 3, 0)
        .toISOString()
        .split("T")[0];
      const slotsResponse = await slotsAPI.getAll(start, end);

      const groupPrebookings = [];
      for (const slot of slotsResponse.data.filter((s) => s.type === "GROUP")) {
        try {
          const participants = await bookingsAPI.getGroupPrebookings(slot.id);
          const myPrebooking = participants.data.find(
            (p) => p.user_id === user?.id,
          );
          if (myPrebooking) {
            groupPrebookings.push({
              slot_id: slot.id,
              status: "GROUP_PREBOOKING",
            });
          }
        } catch (e) {
          // Slot sans participants
        }
      }

      setMyBookings([...myBookingsData, ...groupPrebookings]);
    } catch (error) {
      console.error("Error loading bookings:", error);
    }
  };

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBookSolo = async (slotId) => {
    try {
      await bookingsAPI.createSolo(slotId);
      setSelectedSlot(null);
      loadSlots();
      loadMyBookings();
      showToast("Réservation créée avec succès", "success");
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la réservation",
        "error",
      );
    }
  };

  const handleBookGroup = async (slotId) => {
    try {
      await bookingsAPI.createGroup(slotId);
      setSelectedSlot(null);
      loadSlots();
      loadMyBookings();
      showToast("Pré-réservation créée avec succès", "success");
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la pré-réservation",
        "error",
      );
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingsAPI.cancel(bookingId);
      loadSlots();
      loadMyBookings();
      showToast("Réservation annulée avec succès", "success");
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de l'annulation",
        "error",
      );
    }
  };

  const getSlotStatus = (slot) => {
    // Si le slot est déjà confirmé (SOLO_CONFIRMED ou GROUP_CONFIRMED), garder ce statut
    if (slot.status === "SOLO_CONFIRMED" || slot.status === "GROUP_CONFIRMED") {
      // DEBUG
      if (slot.date === "2026-05-06" && slot.start_time === "14:00") {
        console.log("✅ 6 MAI: Statut confirmé détecté:", slot.status);
      }
      return slot.status;
    }

    // Vérifier les bookings solo de l'utilisateur
    const booking = myBookings.find(
      (b) =>
        b.slot_id === slot.id &&
        b.status !== "CANCELLED" &&
        b.status !== "GROUP_PREBOOKING",
    );
    if (booking) {
      return booking.status === "CONFIRMED" ? "BOOKED" : "PENDING";
    }

    // Vérifier les pré-réservations groupe de l'utilisateur
    const groupPrebooking = myBookings.find(
      (b) => b.slot_id === slot.id && b.status === "GROUP_PREBOOKING",
    );
    if (groupPrebooking) {
      return "BOOKED"; // Déjà pré-réservé
    }

    return slot.status;
  };

  const getSlotColor = (status) => {
    switch (status) {
      case "OPEN_SOLO":
        return "#00ff00";
      case "BLOCKED_FOR_GROUP":
      case "GROUP_PREBOOKING":
        return "#ff0000";
      case "GROUP_CONFIRMED":
      case "SOLO_CONFIRMED":
        return "#0000ff";
      case "FULL":
      case "BOOKED":
        return "var(--chrome-dark)";
      case "PENDING":
        return "var(--gold-primary)";
      case "CANCELLED":
        return "#ff6b6b";
      default:
        return "var(--chrome-medium)";
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div
      className="min-h-screen fade-in"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <nav
        className="shadow-lg border-b"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-primary)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
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
            <h1
              className="text-lg sm:text-xl font-bold"
              style={{
                background: "var(--chrome-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Calendrier
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {user?.role === "ADMIN" && (
              <>
                <select
                  value={slotTypeFilter}
                  onChange={(e) => setSlotTypeFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm input-dark"
                >
                  <option value="ALL">Tous types</option>
                  <option value="SOLO">Solo</option>
                  <option value="GROUP">Groupe</option>
                </select>
                <select
                  value={slotStatusFilter}
                  onChange={(e) => setSlotStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm input-dark"
                >
                  <option value="ALL">Tous statuts</option>
                  <option value="OPEN_SOLO">Ouvert Solo</option>
                  <option value="BLOCKED_FOR_GROUP">Bloqué Groupe</option>
                  <option value="GROUP_PREBOOKING_OPEN">
                    Pré-réservation Ouverte
                  </option>
                  <option value="GROUP_PREBOOKING">Pré-réservation</option>
                  <option value="GROUP_CONFIRMED">Groupe Confirmé</option>
                  <option value="SOLO_CONFIRMED">Solo Confirmé</option>
                  <option value="FULL">Complet</option>
                </select>
              </>
            )}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm"
                style={{
                  background: "var(--chrome-gradient)",
                  color: "var(--text-dark)",
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user?.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {user?.role === "ADMIN" ? "Administrateur" : "Élève"}
                </p>
              </div>
            </div>
            {user?.role === "ADMIN" && (
              <button
                onClick={() => navigate("/admin")}
                className="px-3 py-2 rounded-lg text-sm btn-gold"
              >
                Admin
              </button>
            )}
            <button
              onClick={() => navigate("/calendar")}
              className="px-3 py-2 rounded-lg text-sm btn-chrome"
            >
              Calendrier
            </button>
            <button
              onClick={() => navigate("/my-account")}
              className="px-3 py-2 rounded-lg text-sm btn-gold"
            >
              Mon Compte
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-lg text-sm"
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--gold-primary)" }}
          >
            Calendrier des disponibilités
          </h2>
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#00ff00" }}
              ></div>
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Disponible solo
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#ff0000" }}
              ></div>
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Groupe (mardi/jeudi)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "#0000ff" }}
              ></div>
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Réservé / Confirmé
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "var(--gold-primary)" }}
              ></div>
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                En attente
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: "var(--chrome-dark)" }}
              ></div>
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Complet/Réservé
              </span>
            </div>
          </div>
        </div>

        <CalendarView
          slots={slots}
          onSlotClick={handleSlotClick}
          getSlotStatus={getSlotStatus}
          getSlotColor={getSlotColor}
        />

        {selectedSlot && (
          <BookingModal
            slot={selectedSlot}
            status={getSlotStatus(selectedSlot)}
            onClose={() => setSelectedSlot(null)}
            onBookSolo={handleBookSolo}
            onBookGroup={handleBookGroup}
            onViewDetails={(slot) => {
              setDetailsSlot(slot);
              setShowDetailsModal(true);
              setSelectedSlot(null);
            }}
            user={user}
          />
        )}

        {showDetailsModal && detailsSlot && (
          <SlotDetailsModal
            slot={detailsSlot}
            onClose={() => {
              setShowDetailsModal(false);
              setDetailsSlot(null);
            }}
            user={user}
          />
        )}
      </div>
    </div>
  );
}

export default CalendarPage;
