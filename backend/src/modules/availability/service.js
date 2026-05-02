const pool = require("../../database");
const { v4: uuidv4 } = require("uuid");

// Générer les créneaux disponibles pour une période donnée
const getAvailableSlots = async (startDate, endDate) => {
  // Récupérer les indisponibilités de l'admin
  const unavailabilities = await pool.query(
    "SELECT * FROM unavailabilities WHERE date >= $1 AND date <= $2",
    [startDate, endDate],
  );

  const unavailableDates = new Set(
    unavailabilities.rows.map((u) => u.date.toISOString().split("T")[0]),
  );

  // Récupérer tous les slots existants
  const existingSlots = await pool.query(
    "SELECT * FROM slots WHERE date >= $1 AND date <= $2",
    [startDate, endDate],
  );

  const existingSlotsMap = new Map();
  existingSlots.rows.forEach((slot) => {
    const key = `${slot.date}_${slot.start_time}`;
    existingSlotsMap.set(key, slot);
  });

  // Récupérer les pré-réservations groupe
  const groupPrebookings = await pool.query(
    "SELECT * FROM group_prebookings",
    [],
  );

  const groupPrebookingsBySlot = new Map();
  groupPrebookings.rows.forEach((gp) => {
    if (!groupPrebookingsBySlot.has(gp.slot_id)) {
      groupPrebookingsBySlot.set(gp.slot_id, []);
    }
    groupPrebookingsBySlot.get(gp.slot_id).push(gp);
  });

  const slots = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Générer tous les jours de la période
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay();
    const isTuesday = dayOfWeek === 2;

    // Ignorer les dimanches et les jours indisponibles
    if (dayOfWeek === 0 || unavailableDates.has(dateStr)) {
      continue;
    }

    // Créneaux par défaut (9h-12h et 14h-17h)
    const timeSlots = [
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "17:00" },
    ];

    for (const timeSlot of timeSlots) {
      const slotKey = `${dateStr}_${timeSlot.start}`;

      // Vérifier si un slot existe déjà dans la base
      const existingSlot = existingSlotsMap.get(slotKey);

      if (existingSlot) {
        // Utiliser le slot existant avec ses pré-réservations
        const prebookingCount =
          groupPrebookingsBySlot.get(existingSlot.id)?.length || 0;
        slots.push({
          ...existingSlot,
          group_prebooking_count: prebookingCount,
        });
      } else {
        // Créer un slot virtuel
        let status, type;

        if (isTuesday) {
          // Mardi : disponible pour groupe en priorité, solo si pas de groupe
          status = "OPEN_TUESDAY";
          type = "MIXED";
        } else {
          // Autres jours : solo uniquement
          status = "OPEN_SOLO";
          type = "SOLO";
        }

        slots.push({
          id: slotKey,
          date: dateStr,
          start_time: timeSlot.start,
          end_time: timeSlot.end,
          type,
          status,
          capacity_min: type === "GROUP" ? 3 : 1,
          capacity_max: type === "GROUP" ? 5 : 1,
          group_prebooking_count: 0,
          is_virtual: true,
        });
      }
    }
  }

  return slots;
};

// Marquer un jour comme indisponible
const markUnavailable = async (date, adminId) => {
  const id = uuidv4();
  const result = await pool.query(
    "INSERT INTO unavailabilities (id, date, created_by, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
    [id, date, adminId],
  );
  return result.rows[0];
};

// Retirer une indisponibilité
const removeUnavailability = async (date) => {
  const result = await pool.query(
    "DELETE FROM unavailabilities WHERE date = $1 RETURNING *",
    [date],
  );
  return result.rows[0];
};

// Récupérer toutes les indisponibilités
const getUnavailabilities = async (startDate, endDate) => {
  const result = await pool.query(
    "SELECT * FROM unavailabilities WHERE date >= $1 AND date <= $2 ORDER BY date",
    [startDate, endDate],
  );
  return result.rows;
};

module.exports = {
  getAvailableSlots,
  markUnavailable,
  removeUnavailability,
  getUnavailabilities,
};
