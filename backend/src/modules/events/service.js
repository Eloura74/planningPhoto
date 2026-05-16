const pool = require("../../database");
const { v4: uuidv4 } = require("uuid");
const { createHistory } = require("../common/historyService");

// Créer un événement (sans dates, les membres les proposeront)
const createEvent = async (eventData, adminId) => {
  const { name, description } = eventData;
  const id = uuidv4();

  const result = await pool.query(
    `INSERT INTO events (id, name, description, status, created_by) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING *`,
    [id, name, description, "OPEN", adminId],
  );

  await createHistory(
    "EVENT",
    id,
    "CREATE",
    {},
    adminId,
    `Événement créé: ${name}`,
  );

  return result.rows[0];
};

// Récupérer tous les événements
const getAllEvents = async () => {
  const result = await pool.query(
    `SELECT e.*, u.name as creator_name 
     FROM events e 
     LEFT JOIN users u ON e.created_by = u.id 
     ORDER BY e.created_at DESC`,
  );
  return result.rows.map((event) => ({
    ...event,
    confirmed_dates: event.confirmed_dates || null,
  }));
};

// Récupérer un événement par ID
const getEventById = async (eventId) => {
  const result = await pool.query(
    `SELECT e.*, u.name as creator_name 
     FROM events e 
     LEFT JOIN users u ON e.created_by = u.id 
     WHERE e.id = $1`,
    [eventId],
  );
  return result.rows[0];
};

// Récupérer les événements ouverts (pour les membres)
const getOpenEvents = async () => {
  const result = await pool.query(
    `SELECT * FROM events 
     WHERE status IN ('OPEN', 'CONFIRMED') 
     ORDER BY created_at DESC`,
  );
  return result.rows.map((event) => ({
    ...event,
    confirmed_dates: event.confirmed_dates || null,
  }));
};

// Voter pour des disponibilités
const voteAvailability = async (eventId, userId, dates) => {
  // Supprimer les anciens votes de cet utilisateur pour cet événement
  await pool.query(
    "DELETE FROM event_availabilities WHERE event_id = $1 AND user_id = $2",
    [eventId, userId],
  );

  // Insérer les nouveaux votes
  const insertPromises = dates.map((date) => {
    const id = uuidv4();
    return pool.query(
      `INSERT INTO event_availabilities (id, event_id, user_id, available_date) 
       VALUES ($1, $2, $3, $4)`,
      [id, eventId, userId, date],
    );
  });

  await Promise.all(insertPromises);

  await createHistory(
    "EVENT",
    eventId,
    "VOTE",
    { dates },
    userId,
    `Vote de disponibilités`,
  );

  return { success: true, votedDates: dates.length };
};

// Récupérer les votes d'un utilisateur pour un événement
const getUserVotes = async (eventId, userId) => {
  const result = await pool.query(
    `SELECT available_date FROM event_availabilities 
     WHERE event_id = $1 AND user_id = $2 
     ORDER BY available_date ASC`,
    [eventId, userId],
  );
  return result.rows.map((row) => row.available_date);
};

// Récupérer les statistiques de votes pour un événement
const getEventStats = async (eventId) => {
  const result = await pool.query(
    `SELECT 
       available_date, 
       COUNT(*) as vote_count,
       ARRAY_AGG(u.name) as voters
     FROM event_availabilities ea
     JOIN users u ON ea.user_id = u.id
     WHERE ea.event_id = $1
     GROUP BY available_date
     ORDER BY vote_count DESC, available_date ASC`,
    [eventId],
  );
  return result.rows;
};

// Confirmer un événement avec les dates choisies
const confirmEvent = async (eventId, confirmedDates, adminId) => {
  console.log("🔍 confirmEvent called with:", {
    eventId,
    confirmedDates,
    adminId,
  });

  const result = await pool.query(
    `UPDATE events 
     SET status = $1, confirmed_dates = $2, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $3 
     RETURNING *`,
    ["CONFIRMED", JSON.stringify(confirmedDates), eventId],
  );
  console.log("✅ Event updated:", result.rows[0]);

  // Récupérer tous les membres du groupe qui ont voté
  const voters = await pool.query(
    `SELECT DISTINCT user_id FROM event_availabilities WHERE event_id = $1`,
    [eventId],
  );
  console.log("👥 Voters found:", voters.rows.length);

  // Créer des créneaux GROUP bloqués pour chaque date confirmée
  for (const date of confirmedDates) {
    const slotId = `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log("📅 Creating slot for date:", date, "with ID:", slotId);

    try {
      // Créer un créneau GROUP pour toute la journée
      await pool.query(
        `INSERT INTO slots (id, date, start_time, end_time, type, status, capacity_min, capacity_max, modified_by, modification_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT DO NOTHING`,
        [
          slotId,
          date,
          "09:00",
          "18:00",
          "GROUP",
          "CONFIRMED",
          1,
          20,
          adminId,
          `Créneau réservé pour l'événement ${eventId}`,
        ],
      );
      console.log("✅ Slot created:", slotId);

      // Créer des réservations GROUP_PREBOOKING pour tous les votants
      for (const voter of voters.rows) {
        const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log("📝 Creating booking for user:", voter.user_id);
        await pool.query(
          `INSERT INTO bookings (id, slot_id, user_id, status, created_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           ON CONFLICT DO NOTHING`,
          [bookingId, slotId, voter.user_id, "GROUP_PREBOOKING"],
        );
        console.log("✅ Booking created:", bookingId);
      }
    } catch (error) {
      console.error("❌ Error creating slot/bookings:", error.message);
      throw error;
    }
  }

  await createHistory(
    "EVENT",
    eventId,
    "CONFIRM",
    { confirmedDates },
    adminId,
    `Événement confirmé avec ${confirmedDates.length} date(s)`,
  );

  return result.rows[0];
};

// Supprimer un événement
const deleteEvent = async (eventId, adminId) => {
  await pool.query("DELETE FROM events WHERE id = $1", [eventId]);

  await createHistory(
    "EVENT",
    eventId,
    "DELETE",
    {},
    adminId,
    `Événement supprimé`,
  );

  return { success: true };
};

// Mettre à jour le statut d'un événement
const updateEventStatus = async (eventId, status, adminId) => {
  const result = await pool.query(
    `UPDATE events 
     SET status = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 
     RETURNING *`,
    [status, eventId],
  );

  await createHistory(
    "EVENT",
    eventId,
    "UPDATE_STATUS",
    { status },
    adminId,
    `Statut changé: ${status}`,
  );

  return result.rows[0];
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  getOpenEvents,
  voteAvailability,
  getUserVotes,
  getEventStats,
  confirmEvent,
  deleteEvent,
  updateEventStatus,
};
