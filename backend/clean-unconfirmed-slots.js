const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function cleanUnconfirmedSlots() {
  try {
    console.log('🧹 Nettoyage des slots non confirmés...\n');
    
    // Supprimer toutes les pré-réservations groupe
    const deletedPrebookings = await pool.query('DELETE FROM group_prebookings RETURNING *');
    console.log(`✅ ${deletedPrebookings.rows.length} pré-réservations groupe supprimées`);
    
    // Supprimer tous les slots qui ne sont pas confirmés
    const deletedSlots = await pool.query(`
      DELETE FROM slots 
      WHERE status NOT IN ('SOLO_CONFIRMED', 'GROUP_CONFIRMED')
      RETURNING *
    `);
    console.log(`✅ ${deletedSlots.rows.length} slots non confirmés supprimés`);
    
    // Afficher les slots restants
    const remainingSlots = await pool.query(`
      SELECT date, start_time, type, status 
      FROM slots 
      ORDER BY date, start_time
    `);
    
    console.log(`\n📊 Slots restants (confirmés uniquement): ${remainingSlots.rows.length}`);
    remainingSlots.rows.forEach(s => {
      console.log(`  - ${s.date} ${s.start_time} : ${s.type} (${s.status})`);
    });
    
    console.log('\n✅ Nettoyage terminé !');
    console.log('👉 Rechargez le calendrier, les mardis/jeudis devraient être en rouge (groupe)');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

cleanUnconfirmedSlots();
