import { useState } from "react";

function QuickEmailModal({ isOpen, onClose, recipientEmail, recipientName }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleSend = () => {
    // Utiliser Gmail directement au lieu de mailto
    const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipientEmail}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(gmailLink, "_blank");
    onClose();
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(recipientEmail);
    alert(`📋 Email copié: ${recipientEmail}`);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
        style={{ backgroundColor: "var(--bg-secondary)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-xl font-bold mb-4"
          style={{ color: "var(--gold-primary)" }}
        >
          ✉️ Contacter {recipientName}
        </h3>

        <div className="mb-4">
          <label
            className="block mb-2 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Email:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={recipientEmail}
              readOnly
              className="flex-1 px-3 py-2 rounded-lg input-dark"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-primary)",
              }}
            />
            <button
              onClick={handleCopyEmail}
              className="px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-md"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "white",
              }}
            >
              📋
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label
            className="block mb-2 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Sujet:
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Objet de l'email"
            className="w-full px-3 py-2 rounded-lg input-dark"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div className="mb-6">
          <label
            className="block mb-2 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Message:
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Votre message..."
            rows="4"
            className="w-full px-3 py-2 rounded-lg input-dark"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSend}
            className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-md"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
            }}
          >
            ✉️ Envoyer
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-md"
            style={{
              backgroundColor: "var(--chrome-medium)",
              color: "var(--text-secondary)",
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuickEmailModal;
