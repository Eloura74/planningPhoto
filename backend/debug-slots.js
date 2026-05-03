const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugSlots() {
  try {
    console.log('🔍 Vérification des slots du 6 mai 2026...\n');
    
    // Chercher tous les slots du 6 mai
    const slots = await pool.query(
      "SELECT * FROM slots WHERE date = '2026-05-06' ORDER BY start_time"
    );
    
    console.log(`📊 Nombre de slots trouvés: ${slots.rows.length}\n`);
    
    slots.rows.forEach(slot => {
      console.log('---');
      console.log(`ID: ${slot.id}`);
      console.log(`Type: ${slot.type}`);
      console.log(`Status: ${slot.status}`);
      console.log(`Horaire: ${slot.start_time} - ${slot.end_time}`);
    });
    
    console.log('\n🔍 Vérification des bookings du 6 mai...\n');
    
    // Chercher tous les bookings du 6 mai
    const bookings = await pool.query(
      `SELECT b.*, s.date, s.start_time, s.end_time, s.status as slot_status, u.name
       FROM bookings b
       JOIN slots s ON b.slot_id = s.id
       JOIN users u ON b.user_id = u.id
       WHERE s.date = '2026-05-06'
       ORDER BY s.start_time, b.created_at`
    );
    
    console.log(`📊 Nombre de bookings trouvés: ${bookings.rows.length}\n`);
    
    bookings.rows.forEach(booking => {
      console.log('---');
      console.log(`User: ${booking.name}`);
      console.log(`Horaire: ${booking.start_time} - ${booking.end_time}`);
      console.log(`Booking Status: ${booking.status}`);
      console.log(`Slot Status: ${booking.slot_status}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

debugSlots();
