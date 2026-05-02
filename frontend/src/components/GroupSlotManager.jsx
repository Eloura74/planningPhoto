import { useState, useEffect } from "react";
import { slotsAPI, bookingsAPI } from "../services/api";
import { useToast } from "../contexts/ToastContext";

function GroupSlotManager() {
  const [groupSlots, setGroupSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [participants, setParticipants] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    loadGroupSlots();
  }, []);

  const loadGroupSlots = async () => {
    try {
      const now = new Date();
      const startDate = now.toISOString().split("T")[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0)
        .toISOString()
        .split("T")[0];

      const response = await slotsAPI.getAll(startDate, endDate);
      const slots = response.data.filter(
        (s) =>
          (s.type === "GROUP" || s.type === "MIXED") &&
          (s.status === "BLOCKED_FOR_GROUP" ||
            s.status === "GROUP_PREBOOKING" ||
            s.status === "OPEN_TUESDAY")
      );
      setGroupSlots(slots);
    } catch (error) {
      console.error("Error loading group slots:", error);
    }
  };

  const loadParticipants = async (slotId) => {
    try {
      const response = await bookingsAPI.getGroupPrebookings(slotId);
      setParticipants(response.data);
      setSelectedSlot(slotId);
    } catch (error) {
      console.error("Error loading participants:", error);
    }
  };

  const handleValidateSlot = async (slotId) => {
    try {
      await slotsAPI.confirmGroup([slotId]);
      showToast("Créneau groupe validé avec succès", "success");
      loadGroupSlots();
      setSelectedSlot(null);
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la validation",
        "error"
      );
    }
  };

  const handleBlockSlot = async (slotId) => {
    try {
      await slotsAPI.blockSlot(slotId);
      showToast("Créneau bloqué avec succès", "success");
      loadGroupSlots();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors du blocage",
        "error"
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">👨‍👩‍👧‍👦</div>
        <h2 className="text-2xl font-bold text-gray-800">
          Gestion des créneaux groupe
        </h2>
      </div>

      {groupSlots.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Aucun créneau groupe disponible</p>
          <p className="text-sm mt-2">
            Les créneaux groupe apparaîtront automatiquement les mardis et
            jeudis
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupSlots.map((slot) => (
            <div
              key={slot.id}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📅</div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {new Date(slot.date + "T00:00:00").toLocaleDateString(
                          "fr-FR",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        {slot.start_time} - {slot.end_time}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            slot.status === "BLOCKED_FOR_GROUP"
                              ? "bg-blue-100 text-blue-700"
                              : slot.status === "GROUP_PREBOOKING"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {slot.status === "BLOCKED_FOR_GROUP"
                            ? "Réservé groupe"
                            : slot.status === "GROUP_PREBOOKING"
                            ? "Pré-réservations"
                            : "Ouvert"}
                        </span>
                        {slot.group_prebooking_count > 0 && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                            {slot.group_prebooking_count} participant
                            {slot.group_prebooking_count > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {slot.group_prebooking_count > 0 && (
                    <button
                      onClick={() => loadParticipants(slot.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold"
                    >
                      👥 Voir participants
                    </button>
                  )}
                  {slot.group_prebooking_count >= 3 && (
                    <button
                      onClick={() => handleValidateSlot(slot.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold"
                    >
                      ✓ Valider
                    </button>
                  )}
                  <button
                    onClick={() => handleBlockSlot(slot.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
                  >
                    🚫 Bloquer
                  </button>
                </div>
              </div>

              {selectedSlot === slot.id && participants.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="font-semibold text-gray-700 mb-3">
                    Participants inscrits :
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {participants.map((p, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-gray-50 rounded-lg p-3"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {p.user_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {p.user_name}
                          </p>
                          <p className="text-xs text-gray-600">{p.user_email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GroupSlotManager;
