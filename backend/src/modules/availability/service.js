const pool = require("../../database");
const { v4: uuidv4 } = require("uuid");

// Générer les créneaux disponibles pour une période donnée
const getAvailableSlots = async (startDate, endDate) => {
  // Récupérer les slots existants
  const existingSlots = await pool.query(
    "SELECT * FROM slots WHERE date >= $1 AND date <= $2",
    [startDate, endDate],
  );

  // Récupérer les pré-réservations groupe ET les bookings confirmés
  const groupPrebookings = await pool.query(
    `SELECT gp.*, s.date, s.start_time 
     FROM group_prebookings gp 
     JOIN slots s ON gp.slot_id = s.id 
     WHERE s.date >= $1 AND s.date <= $2`,
    [startDate, endDate],
  );

  // Récupérer aussi les bookings (solo et groupe confirmés)
  const confirmedBookings = await pool.query(
    `SELECT b.*, s.date, s.start_time, s.type as slot_type
     FROM bookings b
     JOIN slots s ON b.slot_id = s.id
     WHERE s.date >= $1 AND s.date <= $2
     AND b.status = 'CONFIRMED'`,
    [startDate, endDate],
  );

  // Récupérer les jours indisponibles
  const unavailabilities = await pool.query(
    "SELECT date FROM unavailabilities WHERE date >= $1 AND date <= $2",
    [startDate, endDate],
  );

  // Compter les créneaux groupe confirmés dans le mois ACTUEL
  // Utiliser la date de début pour déterminer le mois actuel
  const start = new Date(startDate);
  const monthStart = new Date(start.getFullYear(), start.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  // Compter les JOURS UNIQUES avec des créneaux groupe confirmés (pas le nombre de créneaux)
  const confirmedGroupSlots = await pool.query(
    `SELECT COUNT(DISTINCT date) as count FROM slots 
     WHERE type = 'GROUP' 
     AND (status = 'GROUP_CONFIRMED' OR status = 'BLOCKED_FOR_GROUP')
     AND date >= $1 AND date <= $2`,
    [monthStart, monthEnd],
  );

  const groupSlotsConfirmedCount = parseInt(confirmedGroupSlots.rows[0].count);
  const shouldReleaseForSolo = groupSlotsConfirmedCount >= 2;

  // Log pour debug
  if (groupSlotsConfirmedCount > 0) {
    console.log(
      `📊 ${groupSlotsConfirmedCount} jour(s) groupe confirmé(s) dans le mois ${monthStart} → ${shouldReleaseForSolo ? "Libération mardis/jeudis en solo" : "Mardis/jeudis restent en groupe"}`,
    );
  }

  console.log(`📅 Période: ${startDate} → ${endDate}`);

  const existingSlotsMap = new Map();
  existingSlots.rows.forEach((slot) => {
    // Normaliser la date au format YYYY-MM-DD
    const dateStr =
      slot.date instanceof Date
        ? slot.date.toISOString().split("T")[0]
        : slot.date;
    // Utiliser uniquement la date comme clé (ignorer l'horaire)
    const key = dateStr;
    existingSlotsMap.set(key, slot);
  });

  const groupPrebookingsBySlot = new Map();
  groupPrebookings.rows.forEach((gp) => {
    if (!groupPrebookingsBySlot.has(gp.slot_id)) {
      groupPrebookingsBySlot.set(gp.slot_id, []);
    }
    groupPrebookingsBySlot.get(gp.slot_id).push(gp);
  });

  // Ajouter aussi les bookings confirmés au compteur
  const confirmedBookingsBySlot = new Map();
  confirmedBookings.rows.forEach((b) => {
    if (!confirmedBookingsBySlot.has(b.slot_id)) {
      confirmedBookingsBySlot.set(b.slot_id, []);
    }
    confirmedBookingsBySlot.get(b.slot_id).push(b);
  });

  const unavailableDates = new Set(
    unavailabilities.rows.map((u) => {
      const date =
        u.date instanceof Date ? u.date : new Date(u.date + "T00:00:00");
      return date.toISOString().split("T")[0];
    }),
  );

  const slots = [];
  const startLoop = new Date(startDate + "T00:00:00Z");
  const endLoop = new Date(endDate + "T00:00:00Z");

  // Générer tous les jours de la période
  let totalDaysGenerated = 0;
  let tuesdaysThursdaysGenerated = 0;

  for (
    let d = new Date(startLoop);
    d <= endLoop;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getUTCDay();

    // Ignorer les dimanches et les jours indisponibles
    if (dayOfWeek === 0 || unavailableDates.has(dateStr)) {
      continue;
    }

    // Créneaux selon le jour
    const isTuesdayOrThursday = dayOfWeek === 2 || dayOfWeek === 4; // Mardi ou Jeudi

    if (isTuesdayOrThursday) {
      tuesdaysThursdaysGenerated++;
    }
    totalDaysGenerated++;

    let timeSlots;
    if (isTuesdayOrThursday) {
      // Mardi/Jeudi : groupe toute la journée (9h-17h en un seul créneau)
      timeSlots = [{ start: "09:00", end: "17:00" }];
    } else {
      // Autres jours : solo uniquement l'après-midi (14h-17h)
      timeSlots = [{ start: "14:00", end: "17:00" }];
    }

    for (const timeSlot of timeSlots) {
      // Utiliser uniquement la date comme clé (ignorer l'horaire)
      const slotKey = dateStr;

      // Vérifier si un slot existe déjà dans la base
      const existingSlot = existingSlotsMap.get(slotKey);

      if (existingSlot) {
        // Utiliser le slot existant avec ses pré-réservations ET bookings confirmés
        const prebookingCount =
          groupPrebookingsBySlot.get(existingSlot.id)?.length || 0;
        const confirmedCount =
          confirmedBookingsBySlot.get(existingSlot.id)?.length || 0;
        const totalParticipants = prebookingCount + confirmedCount;

        slots.push({
          ...existingSlot,
          group_prebooking_count: totalParticipants,
        });
      } else {
        // Créer un slot virtuel selon le jour de la semaine
        let status, type;

        if (isTuesdayOrThursday) {
          // Mardi/Jeudi : TOUJOURS groupe (sauf si 2+ jours groupe confirmés dans le mois)
          if (shouldReleaseForSolo) {
            // Exception : 2+ jours groupe confirmés → libérer en solo
            status = "OPEN_SOLO";
            type = "SOLO";
          } else {
            // Normal : réservé au groupe
            status = "OPEN_TUESDAY";
            type = "MIXED";
          }
        } else {
          // Autres jours : TOUJOURS solo
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

  console.log(
    `✅ Génération terminée: ${slots.length} créneaux (${tuesdaysThursdaysGenerated} mardis/jeudis sur ${totalDaysGenerated} jours)`,
  );

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
