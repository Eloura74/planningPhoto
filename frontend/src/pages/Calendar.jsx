import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { slotsAPI, bookingsAPI } from "../services/api";
import CalendarView from "../components/Calendar";
import BookingModal from "../components/BookingModal";
import LoadingSpinner from "../components/LoadingSpinner";

function CalendarPage() {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotTypeFilter, setSlotTypeFilter] = useState("ALL");
  const [slotStatusFilter, setSlotStatusFilter] = useState("ALL");
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
      const response = await slotsAPI.getAll(startDate, endDate);
      let filteredSlots = response.data;

      // Filtre par rôle : les élèves ne voient que les créneaux SOLO ouverts
      if (user?.role === "STUDENT") {
        filteredSlots = filteredSlots.filter(
          (slot) =>
            slot.type === "SOLO" &&
            (slot.status === "OPEN_SOLO" || slot.status === "SOLO_CONFIRMED"),
        );
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
      setMyBookings(response.data);
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
    const booking = myBookings.find(
      (b) => b.slot_id === slot.id && b.status !== "CANCELLED",
    );
    if (booking) {
      return booking.status === "CONFIRMED" ? "BOOKED" : "PENDING";
    }
    return slot.status;
  };

  const getSlotColor = (status) => {
    switch (status) {
      case "OPEN_SOLO":
        return "bg-green-500";
      case "BLOCKED_FOR_GROUP":
      case "GROUP_PREBOOKING":
        return "bg-red-500";
      case "GROUP_CONFIRMED":
        return "bg-blue-500";
      case "FULL":
      case "BOOKED":
        return "bg-gray-500";
      case "PENDING":
        return "bg-yellow-500";
      case "CANCELLED":
        return "bg-red-300";
      default:
        return "bg-gray-300";
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 fade-in">
      <nav className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
              <svg
                className="w-6 h-6 text-white"
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
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Calendrier
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {user?.role === "ADMIN" && (
              <>
                <select
                  value={slotTypeFilter}
                  onChange={(e) => setSlotTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Tous types</option>
                  <option value="SOLO">Solo</option>
                  <option value="GROUP">Groupe</option>
                </select>
                <select
                  value={slotStatusFilter}
                  onChange={(e) => setSlotStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-800">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.role === "ADMIN" ? "Administrateur" : "Élève"}
                </p>
              </div>
            </div>
            {user?.role === "ADMIN" && (
              <button
                onClick={() => navigate("/admin")}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition shadow-md text-sm"
              >
                Admin
              </button>
            )}
            <button
              onClick={() => navigate("/calendar")}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Calendrier
            </button>
            <button
              onClick={logout}
              className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-2 rounded-lg hover:from-red-600 hover:to-rose-600 transition shadow-md text-sm"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Calendrier des disponibilités
          </h2>
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Disponible solo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Réservé groupe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Groupe confirmé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">En attente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm">Complet/Réservé</span>
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
            user={user}
          />
        )}
      </div>
    </div>
  );
}

export default CalendarPage;
