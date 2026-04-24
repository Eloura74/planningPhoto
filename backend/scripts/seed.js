const pool = require('../src/database');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    // Créer un admin par défaut
    await pool.query(
      'INSERT INTO users (name, email, phone, role, is_group_member, password_hash) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING',
      ['Admin', 'admin@example.com', '0123456789', 'ADMIN', false, passwordHash]
    );
    
    console.log('✅ Admin créé : admin@example.com / admin123');
    console.log('✅ Seed completed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
