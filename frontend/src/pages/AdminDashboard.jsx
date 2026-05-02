import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { adminAPI, slotsAPI, bookingsAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import UnavailabilityManager from "../components/UnavailabilityManager";

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [groupPrebookings, setGroupPrebookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [slotTypeFilter, setSlotTypeFilter] = useState("ALL");
  const [slotStatusFilter, setSlotStatusFilter] = useState("ALL");
  const [lowParticipationAlerts, setLowParticipationAlerts] = useState([]);
  const [groupSlotsWithPrebookings, setGroupSlotsWithPrebookings] = useState(
    [],
  );
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: "",
    startTime: "",
    endTime: "",
    type: "SOLO",
    capacityMin: 1,
    capacityMax: 1,
  });
  const [loading, setLoading] = useState(true);
  const [historyEntries, setHistoryEntries] = useState([]);
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
    if (user?.role !== "ADMIN") {
      navigate("/calendar");
      return;
    }
    loadDashboardData();
    loadSlots();
    loadPendingBookings();
    loadLowParticipationAlerts();
    loadGroupSlotsWithPrebookings();
    loadHistory();
  }, [user, navigate, bookingStatusFilter]);

  const loadDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  const loadSlots = async () => {
    try {
      const response = await slotsAPI.getAll(startDate, endDate);
      setSlots(response.data);
    } catch (error) {
      console.error("Error loading slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingBookings = async () => {
    try {
      const status =
        bookingStatusFilter === "ALL" ? undefined : bookingStatusFilter;
      const response = await bookingsAPI.getAllPending(status);
      setPendingBookings(response.data || []);
    } catch (error) {
      console.error("Error loading pending bookings:", error);
    }
  };

  const loadLowParticipationAlerts = async () => {
    try {
      const response = await bookingsAPI.getLowGroupParticipation();
      setLowParticipationAlerts(response.data || []);
    } catch (error) {
      console.error("Error loading low participation alerts:", error);
    }
  };

  const loadGroupSlotsWithPrebookings = async () => {
    try {
      const response = await slotsAPI.getAll(startDate, endDate);
      const groupSlots = response.data.filter((slot) => slot.type === "GROUP");
      const slotsWithCounts = await Promise.all(
        groupSlots.map(async (slot) => {
          const prebookings = await bookingsAPI.getGroupPrebookings(slot.id);
          return {
            ...slot,
            prebookingCount: prebookings.data?.length || 0,
            prebookings: prebookings.data || [],
          };
        }),
      );
      setGroupSlotsWithPrebookings(
        slotsWithCounts.filter(
          (s) =>
            s.status === "GROUP_PREBOOKING_OPEN" ||
            s.status === "GROUP_PREBOOKING",
        ),
      );
    } catch (error) {
      console.error("Error loading group slots with prebookings:", error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await adminAPI.getHistory(null, 50);
      setHistoryEntries(response.data || []);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      await bookingsAPI.confirm(bookingId);
      showToast("Réservation confirmée avec succès", "success");
      loadPendingBookings();
      loadDashboardData();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la confirmation",
        "error",
      );
    }
  };

  const handleRefuseBooking = async (bookingId) => {
    try {
      const reason = prompt("Raison du refus (optionnel) :");
      await bookingsAPI.cancel(bookingId, reason);
      showToast("Réservation refusée avec succès", "success");
      loadPendingBookings();
      loadDashboardData();
    } catch (error) {
      showToast(error.response?.data?.error || "Erreur lors du refus", "error");
    }
  };

  const handleConfirmGroupSlot = async (slotId) => {
    try {
      await slotsAPI.confirmGroup([slotId]);
      showToast("Créneau groupe confirmé avec succès", "success");
      loadGroupSlotsWithPrebookings();
      loadSlots();
      loadDashboardData();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la confirmation",
        "error",
      );
    }
  };

  const handleValidateGroup = async (slotId) => {
    try {
      await adminAPI.validateGroup(slotId);
      showToast("Séance groupe validée avec succès", "success");
      loadSlots();
      loadDashboardData();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la validation",
        "error",
      );
    }
  };

  const handleReleaseSlots = async () => {
    try {
      await adminAPI.releaseSlots(selectedSlots);
      showToast("Créneaux libérés avec succès", "success");
      setSelectedSlots([]);
      loadSlots();
      loadDashboardData();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la libération",
        "error",
      );
    }
  };

  const handleBlockSlot = async (slotId) => {
    try {
      await slotsAPI.blockSlot(slotId);
      showToast("Créneau bloqué avec succès", "success");
      loadSlots();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors du blocage",
        "error",
      );
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce créneau ?")) {
      return;
    }
    try {
      await slotsAPI.delete(slotId);
      showToast("Créneau supprimé avec succès", "success");
      loadSlots();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la suppression",
        "error",
      );
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (
      !window.confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")
    ) {
      return;
    }
    try {
      await bookingsAPI.cancel(bookingId, "Suppression par admin");
      showToast("Réservation supprimée avec succès", "success");
      loadPendingBookings();
      loadDashboardData();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la suppression",
        "error",
      );
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await slotsAPI.create(newSlot);
      showToast("Créneau créé avec succès", "success");
      setShowSlotForm(false);
      setNewSlot({
        date: "",
        startTime: "",
        endTime: "",
        type: "SOLO",
        capacityMin: 1,
        capacityMax: 1,
      });
      loadSlots();
      loadDashboardData();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la création",
        "error",
      );
    }
  };

  const handleSlotSelection = (slotId) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId],
    );
  };

  const loadGroupPrebookings = async (slotId) => {
    try {
      const response = await bookingsAPI.getGroupPrebookings(slotId);
      setGroupPrebookings(response.data);
    } catch (error) {
      console.error("Error loading prebookings:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h1
              className="text-xl sm:text-2xl font-bold"
              style={{
                background: "var(--chrome-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/admin/users")}
              className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold text-sm btn-gold"
            >
              Utilisateurs
            </button>
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Alertes */}
        {lowParticipationAlerts.length > 0 && (
          <div
            className="p-4 mb-6 rounded-r-lg"
            style={{
              backgroundColor: "rgba(255, 183, 71, 0.1)",
              borderLeft: "4px solid var(--gold-secondary)",
            }}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5"
                  style={{ color: "var(--gold-secondary)" }}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3
                  className="text-sm font-medium"
                  style={{ color: "var(--gold-primary)" }}
                >
                  Alertes seuil groupe non atteint
                </h3>
                <div className="mt-2">
                  <ul
                    className="list-disc list-inside text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {lowParticipationAlerts.map((alert) => (
                      <li key={alert.id}>
                        {alert.date} - {alert.participant_count} participant(s)
                        (minimum 3 requis)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {dashboardData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="p-6 rounded-xl text-white card-gold scale-in">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-8 h-8"
                  style={{ color: "var(--gold-primary)" }}
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
                <h3
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Utilisateurs
                </h3>
              </div>
              <p
                className="text-4xl font-bold"
                style={{ color: "var(--gold-primary)" }}
              >
                {dashboardData.totalUsers}
              </p>
            </div>
            <div className="p-6 rounded-xl text-white card-dark scale-in">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-8 h-8"
                  style={{ color: "var(--chrome-medium)" }}
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
                <h3
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Créneaux
                </h3>
              </div>
              <p
                className="text-4xl font-bold"
                style={{ color: "var(--chrome-light)" }}
              >
                {dashboardData.totalSlots}
              </p>
            </div>
            <div className="p-6 rounded-xl text-white card-dark scale-in">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-8 h-8"
                  style={{ color: "var(--gold-secondary)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  En attente
                </h3>
              </div>
              <p
                className="text-4xl font-bold"
                style={{ color: "var(--gold-secondary)" }}
              >
                {dashboardData.pendingBookings}
              </p>
            </div>
            <div className="p-6 rounded-xl text-white card-dark scale-in">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-8 h-8"
                  style={{ color: "var(--chrome-light)" }}
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
                <h3
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Pré-réservations
                </h3>
              </div>
              <p
                className="text-4xl font-bold"
                style={{ color: "var(--chrome-light)" }}
              >
                {dashboardData.groupPrebookings}
              </p>
            </div>
            <div className="p-6 rounded-xl text-white card-gold scale-in">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-8 h-8"
                  style={{ color: "var(--gold-primary)" }}
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
                <h3
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  À venir
                </h3>
              </div>
              <p
                className="text-4xl font-bold"
                style={{ color: "var(--gold-primary)" }}
              >
                {dashboardData.upcomingSlots}
              </p>
            </div>
          </div>
        )}

        {pendingBookings.length > 0 && (
          <div className="rounded-xl shadow-lg p-6 mb-8 card-dark">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "var(--gold-primary)" }}
                >
                  Réservations Solo
                </h2>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: "rgba(255, 215, 0, 0.2)",
                    color: "var(--gold-primary)",
                  }}
                >
                  {pendingBookings.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm input-dark"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="REQUESTED">En attente</option>
                  <option value="CONFIRMED">Confirmé</option>
                  <option value="CANCELLED_BY_ADMIN">Annulé par admin</option>
                  <option value="CANCELLED_BY_STUDENT">Annulé par élève</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {pendingBookings.map((booking) => {
                const statusColors = {
                  REQUESTED: "bg-blue-100 text-blue-800",
                  PENDING_ADMIN_VALIDATION: "bg-yellow-100 text-yellow-800",
                  CONFIRMED: "bg-green-100 text-green-800",
                  REFUSED: "bg-red-100 text-red-800",
                  CANCELLED_BY_STUDENT: "bg-gray-100 text-gray-800",
                  CANCELLED_BY_ADMIN: "bg-purple-100 text-purple-800",
                  MODIFIED: "bg-orange-100 text-orange-800",
                  COMPLETED: "bg-teal-100 text-teal-800",
                  NO_SHOW: "bg-pink-100 text-pink-800",
                };
                const statusLabels = {
                  REQUESTED: "Demandée",
                  PENDING_ADMIN_VALIDATION: "En attente",
                  CONFIRMED: "Confirmée",
                  REFUSED: "Refusée",
                  CANCELLED_BY_STUDENT: "Annulée (élève)",
                  CANCELLED_BY_ADMIN: "Annulée (admin)",
                  MODIFIED: "Modifiée",
                  COMPLETED: "Terminée",
                  NO_SHOW: "Absence",
                };

                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {booking.user_name || "Élève"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.slot_date).toLocaleDateString(
                            "fr-FR",
                            {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            },
                          )}{" "}
                          {booking.start_time &&
                            booking.end_time &&
                            `- ${booking.start_time} - ${booking.end_time}`}
                        </p>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${statusColors[booking.status] || "bg-gray-100 text-gray-800"}`}
                        >
                          {statusLabels[booking.status] || booking.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.status === "REQUESTED" ||
                      booking.status === "PENDING_ADMIN_VALIDATION" ? (
                        <>
                          <button
                            onClick={() => handleConfirmBooking(booking.id)}
                            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition shadow-md text-sm"
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => handleRefuseBooking(booking.id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition shadow-md text-sm"
                          >
                            Refuser
                          </button>
                        </>
                      ) : null}
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-gray-600 transition shadow-md text-sm"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {groupSlotsWithPrebookings.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-purple-600"
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
                <h2 className="text-2xl font-bold">
                  Créneaux Groupe - Pré-réservations Ouvertes
                </h2>
              </div>
            </div>
            <div className="space-y-3">
              {groupSlotsWithPrebookings.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-purple-600"
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
                    <div>
                      <p
                        className="font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {new Date(slot.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        - {slot.start_time} - {slot.end_time}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {slot.prebookingCount} pré-choix / {slot.capacity_max}{" "}
                        max
                      </p>
                      {slot.prebookingCount < 3 && (
                        <p
                          className="text-xs font-medium mt-1"
                          style={{ color: "var(--gold-secondary)" }}
                        >
                          ⚠️ Seuil minimum non atteint (3 requis)
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConfirmGroupSlot(slot.id)}
                      className="px-4 py-2 rounded-xl font-semibold text-sm btn-gold"
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {historyEntries.length > 0 && (
          <div className="rounded-xl shadow-lg p-6 mb-8 card-dark">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2
                className="text-2xl font-bold"
                style={{ color: "var(--gold-primary)" }}
              >
                Historique des actions
              </h2>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historyEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 p-4 rounded-xl card-dark"
                  style={{ border: "1px solid var(--border-secondary)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(255, 215, 0, 0.1)" }}
                  >
                    <svg
                      className="w-5 h-5"
                      style={{ color: "var(--gold-primary)" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-semibold"
                        style={{ color: "var(--gold-primary)" }}
                      >
                        {entry.action_type}
                      </span>
                      <span
                        className="text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        sur
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        #{entry.entity_id?.substring(0, 8)}...
                      </span>
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {entry.description || "Aucune raison spécifiée"}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Par {entry.created_by} -{" "}
                      {new Date(entry.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <UnavailabilityManager />

        <div
          className="p-6 rounded-2xl card-gold mt-6"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="p-3 rounded-xl glow-gold"
              style={{ background: "var(--chrome-gradient)" }}
            >
              <svg
                className="w-8 h-8"
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

          {selectedSlots.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="mb-2 font-medium text-blue-900">
                {selectedSlots.length} créneau(x) sélectionné(s)
              </p>
              <button
                onClick={handleReleaseSlots}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition shadow-md"
              >
                Libérer pour solo
              </button>
            </div>
          )}

          <div className="space-y-2">
            {slots
              .filter(
                (slot) =>
                  slot.type === "GROUP" &&
                  (slot.status === "BLOCKED_FOR_GROUP" ||
                    slot.status === "GROUP_PREBOOKING"),
              )
              .map((slot) => (
                <div
                  key={slot.id}
                  className={`p-4 border rounded-lg flex justify-between items-center ${
                    selectedSlots.includes(slot.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedSlots.includes(slot.id)}
                      onChange={() => handleSlotSelection(slot.id)}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="font-semibold">
                        {new Date(slot.date).toLocaleDateString("fr-FR")}
                      </p>
                      <p className="text-gray-600">
                        {slot.start_time} - {slot.end_time}
                      </p>
                      <p className="text-sm">
                        Statut:{" "}
                        <span className="font-semibold">{slot.status}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadGroupPrebookings(slot.id)}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                    >
                      Voir pré-réservations
                    </button>
                    {slot.status === "GROUP_PREBOOKING" && (
                      <button
                        onClick={() => handleValidateGroup(slot.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Valider
                      </button>
                    )}
                    <button
                      onClick={() => handleBlockSlot(slot.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Bloquer
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {groupPrebookings.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold mb-2">
                Pré-réservations pour ce créneau:
              </h3>
              <ul className="space-y-1">
                {groupPrebookings.map((prebooking) => (
                  <li key={prebooking.id} className="text-sm">
                    {prebooking.name} ({prebooking.email})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Tous les créneaux</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  <th
                    className="p-2 text-left font-semibold"
                    style={{ color: "var(--gold-primary)" }}
                  >
                    Date
                  </th>
                  <th
                    className="p-2 text-left font-semibold"
                    style={{ color: "var(--gold-primary)" }}
                  >
                    Horaires
                  </th>
                  <th
                    className="p-2 text-left font-semibold"
                    style={{ color: "var(--gold-primary)" }}
                  >
                    Type
                  </th>
                  <th
                    className="p-2 text-left font-semibold"
                    style={{ color: "var(--gold-primary)" }}
                  >
                    Statut
                  </th>
                  <th
                    className="p-2 text-left font-semibold"
                    style={{ color: "var(--gold-primary)" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {slots
                  .filter(
                    (slot) =>
                      (slotTypeFilter === "ALL" ||
                        slot.type === slotTypeFilter) &&
                      (slotStatusFilter === "ALL" ||
                        slot.status === slotStatusFilter),
                  )
                  .map((slot) => (
                    <tr
                      key={slot.id}
                      className="border-b"
                      style={{ borderColor: "var(--border-secondary)" }}
                    >
                      <td
                        className="p-2"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {new Date(slot.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td
                        className="p-2"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {slot.start_time} - {slot.end_time}
                      </td>
                      <td
                        className="p-2"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {slot.type === "SOLO" ? "Solo" : "Groupe"}
                      </td>
                      <td className="p-2">
                        <span
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor:
                              slot.status === "OPEN_SOLO"
                                ? "rgba(0, 255, 0, 0.1)"
                                : slot.status === "BLOCKED_FOR_GROUP"
                                  ? "rgba(255, 0, 0, 0.1)"
                                  : slot.status === "GROUP_PREBOOKING"
                                    ? "rgba(255, 215, 0, 0.1)"
                                    : slot.status === "GROUP_CONFIRMED"
                                      ? "rgba(0, 0, 255, 0.1)"
                                      : "rgba(128, 128, 128, 0.1)",
                            color:
                              slot.status === "OPEN_SOLO"
                                ? "#00ff00"
                                : slot.status === "BLOCKED_FOR_GROUP"
                                  ? "#ff0000"
                                  : slot.status === "GROUP_PREBOOKING"
                                    ? "var(--gold-primary)"
                                    : slot.status === "GROUP_CONFIRMED"
                                      ? "#0000ff"
                                      : "var(--text-muted)",
                          }}
                        >
                          {slot.status}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          {slot.type === "GROUP" &&
                            slot.status === "BLOCKED_FOR_GROUP" && (
                              <button
                                onClick={() =>
                                  setSelectedSlots([...selectedSlots, slot.id])
                                }
                                className="px-2 py-1 rounded text-xs btn-chrome"
                              >
                                Sélectionner
                              </button>
                            )}
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              backgroundColor: "rgba(239, 68, 68, 0.2)",
                              color: "#ef4444",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
