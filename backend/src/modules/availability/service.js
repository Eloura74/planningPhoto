const pool = require("../../database");
const { v4: uuidv4 } = require("uuid");

// Générer les créneaux disponibles pour une période donnée
const getAvailableSlots = async (startDate, endDate) => {
  // Récupérer les slots existants
  const existingSlots = await pool.query(
    "SELECT * FROM slots WHERE date >= $1 AND date <= $2",
    [startDate, endDate],
  );

  // Récupérer les pré-réservations groupe
  const groupPrebookings = await pool.query(
    `SELECT gp.*, s.date, s.start_time 
     FROM group_prebookings gp 
     JOIN slots s ON gp.slot_id = s.id 
     WHERE s.date >= $1 AND s.date <= $2`,
    [startDate, endDate],
  );

  // Récupérer les jours indisponibles
  const unavailabilities = await pool.query(
    "SELECT date FROM unavailabilities WHERE date >= $1 AND date <= $2",
    [startDate, endDate],
  );

  // Compter les créneaux groupe confirmés dans le mois
  const start = new Date(startDate);
  const monthStart = new Date(start.getFullYear(), start.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const confirmedGroupSlots = await pool.query(
    `SELECT COUNT(*) as count FROM slots 
     WHERE type = 'GROUP' 
     AND status = 'GROUP_CONFIRMED' 
     AND date >= $1 AND date <= $2`,
    [monthStart, monthEnd],
  );

  const groupSlotsConfirmedCount = parseInt(confirmedGroupSlots.rows[0].count);
  const shouldReleaseForSolo = groupSlotsConfirmedCount >= 2;

  const existingSlotsMap = new Map();
  existingSlots.rows.forEach((slot) => {
    const key = `${slot.date}_${slot.start_time}`;
    existingSlotsMap.set(key, slot);
  });

  const groupPrebookingsBySlot = new Map();
  groupPrebookings.rows.forEach((gp) => {
    if (!groupPrebookingsBySlot.has(gp.slot_id)) {
      groupPrebookingsBySlot.set(gp.slot_id, []);
    }
    groupPrebookingsBySlot.get(gp.slot_id).push(gp);
  });

  const unavailableDates = new Set(
    unavailabilities.rows.map((u) => {
      const date =
        u.date instanceof Date ? u.date : new Date(u.date + "T00:00:00");
      return date.toISOString().split("T")[0];
    }),
  );

  const slots = [];
  const startLoop = new Date(startDate);
  const endLoop = new Date(endDate);

  // Générer tous les jours de la période
  for (let d = new Date(startLoop); d <= endLoop; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay();

    // Ignorer les dimanches et les jours indisponibles
    if (dayOfWeek === 0 || unavailableDates.has(dateStr)) {
      continue;
    }

    // Créneaux selon le jour
    const isTuesdayOrThursday = dayOfWeek === 2 || dayOfWeek === 4; // Mardi ou Jeudi

    let timeSlots;
    if (isTuesdayOrThursday) {
      // Mardi/Jeudi : groupe toute la journée (9h-17h en un seul créneau)
      timeSlots = [{ start: "09:00", end: "17:00" }];
    } else {
      // Autres jours : solo uniquement l'après-midi (14h-17h)
      timeSlots = [{ start: "14:00", end: "17:00" }];
    }

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

        if (isTuesdayOrThursday && !shouldReleaseForSolo) {
          // Mardi/Jeudi : disponible pour groupe en priorité (si moins de 2 confirmés)
          status = "OPEN_TUESDAY";
          type = "MIXED";
        } else {
          // Autres jours OU mardis/jeudis libérés : solo uniquement
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
          released_for_solo: shouldReleaseForSolo && isTuesdayOrThursday,
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
