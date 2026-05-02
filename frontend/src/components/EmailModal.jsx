import { useState } from "react";

function EmailModal({ booking, onClose, onSend }) {
  const [subject, setSubject] = useState(
    `Réservation du ${booking.slot_date instanceof Date 
      ? booking.slot_date.toLocaleDateString("fr-FR") 
      : new Date(booking.slot_date + "T00:00:00").toLocaleDateString("fr-FR")}`
  );
  const [message, setMessage] = useState(
    `Bonjour ${booking.user_name},\n\nConcernant votre réservation du ${booking.slot_date instanceof Date 
      ? booking.slot_date.toLocaleDateString("fr-FR") 
      : new Date(booking.slot_date + "T00:00:00").toLocaleDateString("fr-FR")} de ${booking.slot_start_time} à ${booking.slot_end_time}.\n\nCordialement,\nFabien Licata`
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      // Créer un mailto link et l'ouvrir
      const mailtoLink = `mailto:${booking.user_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.location.href = mailtoLink;
      
      // Fermer le modal après un court délai
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setSending(false);
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2
              className="text-2xl font-bold"
              style={{ color: "var(--gold-primary)" }}
            >
              Envoyer un email
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

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Destinataire
            </label>
            <input
              type="email"
              value={booking.user_email}
              disabled
              className="w-full px-4 py-2 rounded-lg input-dark opacity-60"
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Sujet
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 rounded-lg input-dark"
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 rounded-lg input-dark resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={onClose} className="px-6 py-2 rounded-lg font-semibold btn-chrome">
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-6 py-2 rounded-lg font-semibold btn-gold"
          >
            {sending ? "Envoi..." : "✉️ Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailModal;
