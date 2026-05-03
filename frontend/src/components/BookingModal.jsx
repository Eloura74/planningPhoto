function BookingModal({
  slot,
  status,
  onClose,
  onBookSolo,
  onBookGroup,
  onViewDetails,
  user,
}) {
  const canBookSolo =
    status === "OPEN_SOLO" &&
    slot.type === "SOLO" &&
    status !== "SOLO_CONFIRMED" &&
    status !== "BOOKED" &&
    status !== "PENDING";
  const canBookGroup =
    (status === "OPEN_TUESDAY" ||
      status === "MIXED" ||
      status === "BLOCKED_FOR_GROUP" ||
      status === "GROUP_PREBOOKING") &&
    user?.isGroupMember &&
    status !== "GROUP_CONFIRMED" &&
    status !== "SOLO_CONFIRMED" &&
    status !== "BOOKED" &&
    status !== "PENDING";

  const getStatusBadge = (status) => {
    const styles = {
      OPEN_SOLO: { bg: "rgba(0, 255, 0, 0.1)", color: "#00ff00" },
      BLOCKED_FOR_GROUP: { bg: "rgba(255, 0, 0, 0.1)", color: "#ff0000" },
      GROUP_PREBOOKING: {
        bg: "rgba(255, 183, 71, 0.1)",
        color: "var(--gold-secondary)",
      },
      GROUP_CONFIRMED: { bg: "rgba(0, 0, 255, 0.1)", color: "#0000ff" },
      BOOKED: { bg: "rgba(168, 168, 168, 0.1)", color: "var(--chrome-light)" },
      PENDING: { bg: "rgba(255, 215, 0, 0.1)", color: "var(--gold-primary)" },
    };
    const labels = {
      OPEN_SOLO: "Disponible",
      BLOCKED_FOR_GROUP: "Réservé groupe",
      GROUP_PREBOOKING: "Pré-réservation",
      GROUP_CONFIRMED: "Confirmé",
      SOLO_CONFIRMED: "Réservé",
      BOOKED: "Réservé",
      PENDING: "En attente",
    };
    const style = styles[status] || {
      bg: "rgba(128, 128, 128, 0.1)",
      color: "var(--text-muted)",
    };
    return (
      <span
        className="px-3 py-1 rounded-full text-sm font-medium"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-hidden card-gold">
        <div
          className="px-4 sm:px-6 py-4"
          style={{ background: "var(--chrome-gradient)" }}
        >
          <div className="flex justify-between items-center">
            <h3
              className="text-lg sm:text-xl font-bold"
              style={{ color: "var(--text-dark)" }}
            >
              Détails du créneau
            </h3>
            <button
              onClick={onClose}
              className="transition text-xl sm:text-2xl"
              style={{ color: "var(--text-dark)" }}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="space-y-4 mb-6">
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <div style={{ color: "var(--gold-primary)" }}>
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
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Date
                </div>
                <div
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {new Date(slot.date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <div style={{ color: "var(--gold-primary)" }}>
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
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Horaires
                </div>
                <div
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {slot.start_time} - {slot.end_time}
                </div>
              </div>
            </div>

            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <div style={{ color: "var(--gold-primary)" }}>
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
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Type
                </div>
                <div
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {slot.type === "SOLO"
                    ? "Session individuelle"
                    : "Session de groupe"}
                </div>
              </div>
            </div>

            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <div style={{ color: "var(--gold-primary)" }}>
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
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Statut
                </div>
                {getStatusBadge(status)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {canBookSolo && (
              <button
                onClick={() => onBookSolo(slot.id)}
                className="w-full py-3 rounded-xl font-semibold btn-gold"
              >
                Réserver ce créneau
              </button>
            )}

            {canBookGroup && (
              <button
                onClick={() => onBookGroup(slot.id)}
                className="w-full py-3 rounded-xl font-semibold btn-chrome"
              >
                Pré-réserver (Groupe)
              </button>
            )}

            {status === "BOOKED" && (
              <div
                className="text-center py-3 rounded-xl"
                style={{ backgroundColor: "rgba(168, 168, 168, 0.1)" }}
              >
                <div
                  className="font-medium"
                  style={{ color: "var(--chrome-light)" }}
                >
                  ✓ Vous avez déjà réservé ce créneau
                </div>
              </div>
            )}

            {status === "PENDING" && (
              <div
                className="text-center py-3 rounded-xl"
                style={{ backgroundColor: "rgba(255, 215, 0, 0.1)" }}
              >
                <div
                  className="font-medium"
                  style={{ color: "var(--gold-primary)" }}
                >
                  ⏳ Votre réservation est en attente de validation
                </div>
              </div>
            )}

            {!canBookSolo &&
              !canBookGroup &&
              status !== "BOOKED" &&
              status !== "PENDING" && (
                <div
                  className="text-center py-3 rounded-xl"
                  style={{ backgroundColor: "var(--bg-tertiary)" }}
                >
                  <div style={{ color: "var(--text-muted)" }}>
                    Ce créneau n'est pas disponible pour la réservation
                  </div>
                </div>
              )}
          </div>

          <div className="flex gap-3 mt-4">
            {(slot.type === "GROUP" || slot.type === "MIXED") &&
              user?.isGroupMember && (
                <button
                  onClick={() => onViewDetails && onViewDetails(slot)}
                  className="flex-1 py-3 rounded-xl font-semibold btn-gold"
                >
                  👥 Voir les participants{" "}
                  {slot.group_prebooking_count
                    ? `(${slot.group_prebooking_count})`
                    : ""}
                </button>
              )}
            <button
              onClick={onClose}
              className={`${(slot.type === "GROUP" || slot.type === "MIXED") && user?.isGroupMember ? "flex-1" : "w-full"} py-3 rounded-xl font-semibold btn-chrome`}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
