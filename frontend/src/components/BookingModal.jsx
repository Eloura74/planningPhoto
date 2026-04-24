function BookingModal({
  slot,
  status,
  onClose,
  onBookSolo,
  onBookGroup,
  user,
}) {
  const canBookSolo = status === "OPEN_SOLO" && slot.type === "SOLO";
  const canBookGroup =
    (status === "BLOCKED_FOR_GROUP" || status === "GROUP_PREBOOKING") &&
    slot.type === "GROUP" &&
    user?.is_group_member;

  const getStatusBadge = (status) => {
    const styles = {
      OPEN_SOLO: "bg-green-100 text-green-800",
      BLOCKED_FOR_GROUP: "bg-red-100 text-red-800",
      GROUP_PREBOOKING: "bg-orange-100 text-orange-800",
      GROUP_CONFIRMED: "bg-blue-100 text-blue-800",
      BOOKED: "bg-purple-100 text-purple-800",
      PENDING: "bg-yellow-100 text-yellow-800",
    };
    const labels = {
      OPEN_SOLO: "Disponible",
      BLOCKED_FOR_GROUP: "Réservé groupe",
      GROUP_PREBOOKING: "Pré-réservation",
      GROUP_CONFIRMED: "Confirmé",
      BOOKED: "Réservé",
      PENDING: "En attente",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Détails du créneau
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition text-xl sm:text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-indigo-600">
                <svg
                  className="w-6 h-6"
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
                <div className="text-sm text-gray-600">Date</div>
                <div className="font-semibold text-gray-900">
                  {new Date(slot.date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-indigo-600">
                <svg
                  className="w-6 h-6"
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
              <div>
                <div className="text-sm text-gray-600">Horaires</div>
                <div className="font-semibold text-gray-900">
                  {slot.start_time} - {slot.end_time}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-indigo-600">
                <svg
                  className="w-6 h-6"
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
              <div>
                <div className="text-sm text-gray-600">Type</div>
                <div className="font-semibold text-gray-900">
                  {slot.type === "SOLO"
                    ? "Session individuelle"
                    : "Session de groupe"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-indigo-600">
                <svg
                  className="w-6 h-6"
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
              <div>
                <div className="text-sm text-gray-600">Statut</div>
                {getStatusBadge(status)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {canBookSolo && (
              <button
                onClick={() => onBookSolo(slot.id)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Réserver ce créneau
              </button>
            )}

            {canBookGroup && (
              <button
                onClick={() => onBookGroup(slot.id)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Pré-réserver (Groupe)
              </button>
            )}

            {status === "BOOKED" && (
              <div className="text-center py-3 bg-purple-50 rounded-xl">
                <div className="text-purple-700 font-medium">
                  ✓ Vous avez déjà réservé ce créneau
                </div>
              </div>
            )}

            {status === "PENDING" && (
              <div className="text-center py-3 bg-yellow-50 rounded-xl">
                <div className="text-yellow-700 font-medium">
                  ⏳ Votre réservation est en attente de validation
                </div>
              </div>
            )}

            {!canBookSolo &&
              !canBookGroup &&
              status !== "BOOKED" &&
              status !== "PENDING" && (
                <div className="text-center py-3 bg-gray-50 rounded-xl">
                  <div className="text-gray-600">
                    Ce créneau n'est pas disponible pour la réservation
                  </div>
                </div>
              )}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
