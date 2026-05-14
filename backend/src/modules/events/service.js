const pool = require("../../database");
const { v4: uuidv4 } = require("uuid");
const { createHistory } = require("../common/historyService");

// Créer un événement
const createEvent = async (eventData, adminId) => {
  const { name, description, start_date, end_date } = eventData;
  const id = uuidv4();

  const result = await pool.query(
    `INSERT INTO events (id, name, description, start_date, end_date, status, created_by) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     RETURNING *`,
    [id, name, description, start_date, end_date, "OPEN", adminId]
  );

  await createHistory(
    "EVENT",
    id,
    "CREATE",
    {},
    adminId,
    `Événement créé: ${name}`
  );

  return result.rows[0];
};

// Récupérer tous les événements
const getAllEvents = async () => {
  const result = await pool.query(
    `SELECT e.*, u.name as creator_name 
     FROM events e 
     LEFT JOIN users u ON e.created_by = u.id 
     ORDER BY e.start_date DESC`
  );
  return result.rows;
};

// Récupérer un événement par ID
const getEventById = async (eventId) => {
  const result = await pool.query(
    `SELECT e.*, u.name as creator_name 
     FROM events e 
     LEFT JOIN users u ON e.created_by = u.id 
     WHERE e.id = $1`,
    [eventId]
  );
  return result.rows[0];
};

// Récupérer les événements ouverts (pour les membres)
const getOpenEvents = async () => {
  const result = await pool.query(
    `SELECT * FROM events 
     WHERE status IN ('OPEN', 'CONFIRMED') 
     ORDER BY start_date ASC`
  );
  return result.rows;
};

// Voter pour des disponibilités
const voteAvailability = async (eventId, userId, dates) => {
  // Supprimer les anciens votes de cet utilisateur pour cet événement
  await pool.query(
    "DELETE FROM event_availabilities WHERE event_id = $1 AND user_id = $2",
    [eventId, userId]
  );

  // Insérer les nouveaux votes
  const insertPromises = dates.map((date) => {
    const id = uuidv4();
    return pool.query(
      `INSERT INTO event_availabilities (id, event_id, user_id, available_date) 
       VALUES ($1, $2, $3, $4)`,
      [id, eventId, userId, date]
    );
  });

  await Promise.all(insertPromises);

  await createHistory(
    "EVENT",
    eventId,
    "VOTE",
    { dates },
    userId,
    `Vote de disponibilités`
  );

  return { success: true, votedDates: dates.length };
};

// Récupérer les votes d'un utilisateur pour un événement
const getUserVotes = async (eventId, userId) => {
  const result = await pool.query(
    `SELECT available_date FROM event_availabilities 
     WHERE event_id = $1 AND user_id = $2 
     ORDER BY available_date ASC`,
    [eventId, userId]
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
    [eventId]
  );
  return result.rows;
};

// Confirmer un événement avec les dates choisies
const confirmEvent = async (eventId, confirmedDates, adminId) => {
  const result = await pool.query(
    `UPDATE events 
     SET status = $1, confirmed_dates = $2, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $3 
     RETURNING *`,
    ["CONFIRMED", JSON.stringify(confirmedDates), eventId]
  );

  await createHistory(
    "EVENT",
    eventId,
    "CONFIRM",
    { confirmedDates },
    adminId,
    `Événement confirmé avec ${confirmedDates.length} date(s)`
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
    `Événement supprimé`
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
    [status, eventId]
  );

  await createHistory(
    "EVENT",
    eventId,
    "UPDATE_STATUS",
    { status },
    adminId,
    `Statut changé: ${status}`
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
