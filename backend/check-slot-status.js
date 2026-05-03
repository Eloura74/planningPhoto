const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkSlotStatus() {
  try {
    console.log('🔍 Vérification du slot du 6 mai 2026 14:00-17:00...\n');
    
    // Chercher le slot
    const slot = await pool.query(
      `SELECT * FROM slots 
       WHERE date = '2026-05-06' 
       AND start_time = '14:00'
       ORDER BY created_at DESC
       LIMIT 1`
    );
    
    if (slot.rows.length === 0) {
      console.log('❌ AUCUN SLOT TROUVÉ pour le 6 mai 14:00');
      console.log('Le slot est probablement virtuel (pas encore créé dans la DB)\n');
    } else {
      console.log('✅ SLOT TROUVÉ:');
      console.log('ID:', slot.rows[0].id);
      console.log('Type:', slot.rows[0].type);
      console.log('Status:', slot.rows[0].status);
      console.log('Date:', slot.rows[0].date);
      console.log('Horaire:', slot.rows[0].start_time, '-', slot.rows[0].end_time);
      console.log('\n');
    }
    
    // Chercher les bookings pour ce jour
    const bookings = await pool.query(
      `SELECT b.*, s.start_time, s.end_time, s.status as slot_status, u.name
       FROM bookings b
       JOIN slots s ON b.slot_id = s.id
       JOIN users u ON b.user_id = u.id
       WHERE s.date = '2026-05-06'
       AND s.start_time = '14:00'
       ORDER BY b.created_at DESC`
    );
    
    console.log(`📊 BOOKINGS pour le 6 mai 14:00: ${bookings.rows.length}\n`);
    
    bookings.rows.forEach((b, i) => {
      console.log(`--- Booking ${i + 1} ---`);
      console.log('User:', b.name);
      console.log('Booking Status:', b.status);
      console.log('Slot Status:', b.slot_status);
      console.log('Booking Type:', b.booking_type);
      console.log('Created:', b.created_at);
      console.log('');
    });
    
    if (bookings.rows.length > 0 && slot.rows.length > 0) {
      const currentSlotStatus = slot.rows[0].status;
      const hasConfirmedBooking = bookings.rows.some(b => b.status === 'CONFIRMED');
      
      console.log('\n🔍 DIAGNOSTIC:');
      console.log('Statut actuel du slot:', currentSlotStatus);
      console.log('Booking confirmé trouvé:', hasConfirmedBooking ? 'OUI' : 'NON');
      
      if (hasConfirmedBooking && currentSlotStatus !== 'SOLO_CONFIRMED') {
        console.log('\n❌ PROBLÈME DÉTECTÉ:');
        console.log('Un booking est confirmé mais le slot n\'est pas en SOLO_CONFIRMED');
        console.log('Le slot devrait être mis à jour à SOLO_CONFIRMED');
      } else if (hasConfirmedBooking && currentSlotStatus === 'SOLO_CONFIRMED') {
        console.log('\n✅ TOUT EST CORRECT:');
        console.log('Le slot est bien en SOLO_CONFIRMED');
        console.log('Le problème vient probablement du frontend qui ne l\'affiche pas correctement');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkSlotStatus();
