const pool = require("../../database");
const { v4: uuidv4 } = require("uuid");

// Générer les créneaux disponibles pour une période donnée
const getAvailableSlots = async (startDate, endDate) => {
  // Récupérer les indisponibilités de l'admin
  const unavailabilities = await pool.query(
    "SELECT * FROM unavailabilities WHERE date >= $1 AND date <= $2",
    [startDate, endDate]
  );
  
  const unavailableDates = new Set(
    unavailabilities.rows.map(u => u.date)
  );
  
  // Récupérer les réservations existantes
  const bookings = await pool.query(
    `SELECT b.*, s.date, s.start_time, s.end_time 
     FROM bookings b 
     LEFT JOIN slots s ON b.slot_id = s.id
     WHERE s.date >= $1 AND s.date <= $2 
     AND b.status NOT IN ('CANCELLED', 'CANCELLED_BY_ADMIN', 'CANCELLED_BY_STUDENT')`,
    [startDate, endDate]
  );
  
  // Récupérer les pré-réservations groupe
  const groupPrebookings = await pool.query(
    `SELECT gp.*, s.date 
     FROM group_prebookings gp
     LEFT JOIN slots s ON gp.slot_id = s.id
     WHERE s.date >= $1 AND s.date <= $2`,
    [startDate, endDate]
  );
  
  const slots = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Générer tous les jours de la période
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    const isTuesday = dayOfWeek === 2;
    
    // Ignorer les dimanches et les jours indisponibles
    if (dayOfWeek === 0 || unavailableDates.has(dateStr)) {
      continue;
    }
    
    // Créneaux par défaut (9h-12h et 14h-17h)
    const timeSlots = [
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '17:00' }
    ];
    
    for (const timeSlot of timeSlots) {
      const slotKey = `${dateStr}_${timeSlot.start}`;
      
      // Vérifier si une réservation existe déjà
      const existingBooking = bookings.rows.find(
        b => b.date === dateStr && b.start_time === timeSlot.start
      );
      
      // Vérifier les pré-réservations groupe pour les mardis
      const groupPrebookingCount = isTuesday 
        ? groupPrebookings.rows.filter(
            gp => gp.date === dateStr
          ).length
        : 0;
      
      let status, type;
      
      if (isTuesday) {
        // Mardi : priorité au groupe
        if (groupPrebookingCount > 0) {
          status = 'BLOCKED_FOR_GROUP';
          type = 'GROUP';
        } else if (existingBooking) {
          status = 'SOLO_CONFIRMED';
          type = 'SOLO';
        } else {
          // Disponible pour groupe ET solo (si groupe ne s'inscrit pas)
          status = 'OPEN_TUESDAY';
          type = 'MIXED';
        }
      } else {
        // Autres jours : solo uniquement
        if (existingBooking) {
          status = 'SOLO_CONFIRMED';
          type = 'SOLO';
        } else {
          status = 'OPEN_SOLO';
          type = 'SOLO';
        }
      }
      
      slots.push({
        id: slotKey,
        date: dateStr,
        start_time: timeSlot.start,
        end_time: timeSlot.end,
        type,
        status,
        capacity_min: type === 'GROUP' ? 3 : 1,
        capacity_max: type === 'GROUP' ? 5 : 1,
        group_prebooking_count: groupPrebookingCount
      });
    }
  }
  
  return slots;
};

// Marquer un jour comme indisponible
const markUnavailable = async (date, adminId) => {
  const id = uuidv4();
  const result = await pool.query(
    "INSERT INTO unavailabilities (id, date, created_by, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
    [id, date, adminId]
  );
  return result.rows[0];
};

// Retirer une indisponibilité
const removeUnavailability = async (date) => {
  const result = await pool.query(
    "DELETE FROM unavailabilities WHERE date = $1 RETURNING *",
    [date]
  );
  return result.rows[0];
};

// Récupérer toutes les indisponibilités
const getUnavailabilities = async (startDate, endDate) => {
  const result = await pool.query(
    "SELECT * FROM unavailabilities WHERE date >= $1 AND date <= $2 ORDER BY date",
    [startDate, endDate]
  );
  return result.rows;
};

module.exports = {
  getAvailableSlots,
  markUnavailable,
  removeUnavailability,
  getUnavailabilities
};
