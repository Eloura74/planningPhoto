import { useState, useEffect } from "react";
import { slotsAPI, adminAPI } from "../services/api";
import { useToast } from "../contexts/ToastContext";

function SlotsManagement({ onSlotUpdated }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({
    date: "",
    startTime: "14:00",
    endTime: "17:00",
    type: "SOLO",
  });
  const { showToast } = useToast();

  // Charger les créneaux du mois actuel + 3 mois
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
    currentMonth.getMonth() + 4,
    0,
  )
    .toISOString()
    .split("T")[0];

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    try {
      setLoading(true);
      const response = await slotsAPI.getAll(startDate, endDate);
      setSlots(response.data);
    } catch (error) {
      showToast("Erreur lors du chargement des créneaux", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await slotsAPI.create(formData);
      showToast("Créneau créé avec succès", "success");
      setShowCreateForm(false);
      setFormData({
        date: "",
        startTime: "14:00",
        endTime: "17:00",
        type: "SOLO",
      });
      loadSlots();
      if (onSlotUpdated) onSlotUpdated();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la création",
        "error",
      );
    }
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    try {
      await slotsAPI.update(editingSlot.id, formData);
      showToast("Créneau modifié avec succès", "success");
      setEditingSlot(null);
      setFormData({
        date: "",
        startTime: "14:00",
        endTime: "17:00",
        type: "SOLO",
      });
      loadSlots();
      if (onSlotUpdated) onSlotUpdated();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la modification",
        "error",
      );
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (
      !window.confirm("Supprimer ce créneau ? Cette action est irréversible.")
    ) {
      return;
    }
    try {
      await slotsAPI.delete(slotId);
      showToast("Créneau supprimé avec succès", "success");
      loadSlots();
      if (onSlotUpdated) onSlotUpdated();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la suppression",
        "error",
      );
    }
  };

  const handleForceType = async (slotId, type) => {
    if (
      !window.confirm(
        `Forcer ce créneau en ${type === "SOLO" ? "SOLO (14h-17h)" : "GROUPE (10h-17h)"} ?`,
      )
    ) {
      return;
    }
    try {
      // Utiliser update avec le nouveau type
      const updateData = {
        type: type,
        startTime: type === "SOLO" ? "14:00" : "10:00",
        endTime: "17:00",
      };
      await slotsAPI.update(slotId, updateData);
      showToast(`Créneau converti en ${type}`, "success");
      loadSlots();
      if (onSlotUpdated) onSlotUpdated();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la conversion",
        "error",
      );
    }
  };

  const startEdit = (slot) => {
    setEditingSlot(slot);
    // Convertir la date au format YYYY-MM-DD pour l'input date
    const dateStr = slot.date
      ? new Date(slot.date).toISOString().split("T")[0]
      : "";
    setFormData({
      date: dateStr,
      startTime: slot.start_time,
      endTime: slot.end_time,
      type: slot.type,
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingSlot(null);
    setFormData({
      date: "",
      startTime: "14:00",
      endTime: "17:00",
      type: "SOLO",
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      OPEN_SOLO: { bg: "#10b981", text: "Disponible Solo" },
      BLOCKED_FOR_GROUP: { bg: "#f59e0b", text: "Disponible Groupe" },
      GROUP_CONFIRMED: { bg: "#8b5cf6", text: "Groupe Confirmé" },
      SOLO_CONFIRMED: { bg: "#8b5cf6", text: "Solo Confirmé" },
      OPEN_TUESDAY: { bg: "#f59e0b", text: "Mardi/Jeudi" },
      MIXED: { bg: "#f59e0b", text: "Mixte" },
    };
    const badge = badges[status] || { bg: "#6b7280", text: status };
    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: badge.bg, color: "white" }}
      >
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton créer */}
      <div className="flex justify-between items-center">
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--gold-primary)" }}
        >
          Gestion des Créneaux
        </h2>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setEditingSlot(null);
          }}
          className="px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-md"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            color: "white",
          }}
        >
          {showCreateForm ? "✕ Annuler" : "+ Créer un créneau"}
        </button>
      </div>

      {/* Formulaire création/modification */}
      {(showCreateForm || editingSlot) && (
        <div className="card-dark p-6 rounded-xl">
          <h3
            className="text-xl font-bold mb-4"
            style={{ color: "var(--gold-primary)" }}
          >
            {editingSlot ? "Modifier le créneau" : "Créer un nouveau créneau"}
          </h3>
          <form
            onSubmit={editingSlot ? handleUpdateSlot : handleCreateSlot}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 rounded-lg input-dark"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setFormData({
                      ...formData,
                      type,
                      startTime: type === "SOLO" ? "14:00" : "10:00",
                      endTime: "17:00",
                    });
                  }}
                  className="w-full px-4 py-2 rounded-lg input-dark"
                >
                  <option value="SOLO">SOLO (14h-17h)</option>
                  <option value="GROUP">GROUPE (10h-17h)</option>
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Heure début
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 rounded-lg input-dark"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Heure fin
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 rounded-lg input-dark"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 rounded-lg font-semibold transition-all hover:shadow-md"
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                }}
              >
                {editingSlot ? "💾 Enregistrer" : "✓ Créer"}
              </button>
              {editingSlot && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-2 rounded-lg font-semibold transition-all hover:shadow-md"
                  style={{
                    background:
                      "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                    color: "white",
                  }}
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Liste des créneaux */}
      <div className="card-dark rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: "var(--bg-tertiary)" }}>
              <tr>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold"
                  style={{ color: "var(--gold-primary)" }}
                >
                  Date
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold"
                  style={{ color: "var(--gold-primary)" }}
                >
                  Horaires
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold"
                  style={{ color: "var(--gold-primary)" }}
                >
                  Type
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold"
                  style={{ color: "var(--gold-primary)" }}
                >
                  Statut
                </th>
                <th
                  className="px-4 py-3 text-right text-sm font-semibold"
                  style={{ color: "var(--gold-primary)" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr
                  key={slot.id}
                  className="border-t"
                  style={{ borderColor: "var(--bg-tertiary)" }}
                >
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {slot.date
                      ? new Date(slot.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Date invalide"}
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {slot.start_time} - {slot.end_time}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{
                        backgroundColor:
                          slot.type === "SOLO" ? "#10b981" : "#f59e0b",
                        color: "white",
                      }}
                    >
                      {slot.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(slot.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => startEdit(slot)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:shadow-md"
                        style={{
                          background:
                            "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                          color: "white",
                        }}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      {slot.type === "SOLO" && (
                        <button
                          onClick={() => handleForceType(slot.id, "GROUP")}
                          className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:shadow-md"
                          style={{
                            background:
                              "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                            color: "white",
                          }}
                          title="Convertir en GROUPE"
                        >
                          🟠
                        </button>
                      )}
                      {slot.type === "GROUP" && (
                        <button
                          onClick={() => handleForceType(slot.id, "SOLO")}
                          className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:shadow-md"
                          style={{
                            background:
                              "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "white",
                          }}
                          title="Convertir en SOLO"
                        >
                          🟢
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:shadow-md"
                        style={{
                          background:
                            "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                          color: "white",
                        }}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {slots.length === 0 && (
        <div
          className="text-center py-8"
          style={{ color: "var(--text-muted)" }}
        >
          Aucun créneau trouvé
        </div>
      )}
    </div>
  );
}

export default SlotsManagement;
