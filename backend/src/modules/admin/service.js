const pool = require('../../database');
const { createHistory } = require('../common/historyService');

const validateGroupSlot = async (slotId) => {
  await pool.query('BEGIN');
  
  try {
    await pool.query(
      'UPDATE slots SET status = $1 WHERE id = $2',
      ['GROUP_CONFIRMED', slotId]
    );

    const prebookings = await pool.query(
      `SELECT gp.*, u.name, u.email 
       FROM group_prebookings gp 
       JOIN users u ON gp.user_id = u.id 
       WHERE gp.slot_id = $1`,
      [slotId]
    );

    for (const prebooking of prebookings.rows) {
      const { v4: uuidv4 } = require('uuid');
      const bookingId = uuidv4();
      
      await pool.query(
        'INSERT INTO bookings (id, user_id, slot_id, status) VALUES ($1, $2, $3, $4)',
        [bookingId, prebooking.user_id, slotId, 'CONFIRMED']
      );
    }

    await pool.query('DELETE FROM group_prebookings WHERE slot_id = $1', [slotId]);
    
    await pool.query('COMMIT');
    await createHistory('SLOT', slotId, 'GROUP_VALIDATED', { prebookings: prebookings.rows.length });
    
    return { success: true, bookingsCreated: prebookings.rows.length };
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

const releaseSlotsForSolo = async (slotIds) => {
  const results = [];
  
  for (const slotId of slotIds) {
    const result = await pool.query(
      'UPDATE slots SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
      ['OPEN_SOLO', slotId, 'BLOCKED_FOR_GROUP']
    );
    
    if (result.rows.length > 0) {
      await pool.query('DELETE FROM group_prebookings WHERE slot_id = $1', [slotId]);
      await createHistory('SLOT', slotId, 'RELEASED_FOR_SOLO', {});
      results.push(result.rows[0]);
    }
  }
  
  return results;
};

const blockSlot = async (slotId) => {
  const result = await pool.query(
    'UPDATE slots SET status = $1 WHERE id = $2 RETURNING *',
    ['CANCELLED', slotId]
  );
  
  await createHistory('SLOT', slotId, 'BLOCKED', {});
  return result.rows[0];
};

const setAvailability = async (date, isAvailable) => {
  const result = await pool.query(
    `INSERT INTO availability (date, is_available) 
     VALUES ($1, $2) 
     ON CONFLICT (date) 
     DO UPDATE SET is_available = $2 
     RETURNING *`,
    [date, isAvailable]
  );
  
  await createHistory('AVAILABILITY', result.rows[0].id, 'SET', { date, isAvailable });
  return result.rows[0];
};

const getAvailability = async (startDate, endDate) => {
  const result = await pool.query(
    'SELECT * FROM availability WHERE date >= $1 AND date <= $2 ORDER BY date',
    [startDate, endDate]
  );
  return result.rows;
};

const getHistory = async (entity, limit = 50) => {
  let query = 'SELECT * FROM history';
  const params = [];
  
  if (entity) {
    query += ' WHERE entity = $1';
    params.push(entity);
  }
  
  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
  params.push(limit);
  
  const result = await pool.query(query, params);
  return result.rows;
};

const getDashboardData = async () => {
  const [
    totalUsers,
    totalSlots,
    pendingBookings,
    groupPrebookings,
    upcomingSlots
  ] = await Promise.all([
    pool.query('SELECT COUNT(*) as count FROM users'),
    pool.query('SELECT COUNT(*) as count FROM slots'),
    pool.query("SELECT COUNT(*) as count FROM bookings WHERE status = 'PENDING'"),
    pool.query('SELECT COUNT(*) as count FROM group_prebookings'),
    pool.query("SELECT COUNT(*) as count FROM slots WHERE date >= CURRENT_DATE AND status != 'CANCELLED'")
  ]);

  return {
    totalUsers: parseInt(totalUsers.rows[0].count),
    totalSlots: parseInt(totalSlots.rows[0].count),
    pendingBookings: parseInt(pendingBookings.rows[0].count),
    groupPrebookings: parseInt(groupPrebookings.rows[0].count),
    upcomingSlots: parseInt(upcomingSlots.rows[0].count)
  };
};

module.exports = {
  validateGroupSlot,
  releaseSlotsForSolo,
  blockSlot,
  setAvailability,
  getAvailability,
  getHistory,
  getDashboardData
};
