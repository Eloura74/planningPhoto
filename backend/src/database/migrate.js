const pool = require("./index");

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        role TEXT CHECK (role IN ('ADMIN', 'STUDENT')) NOT NULL,
        is_group_member BOOLEAN DEFAULT FALSE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Supprimer la table slots si elle existe avec un mauvais schéma
    await client.query("DROP TABLE IF EXISTS slots CASCADE");

    await client.query(`
      CREATE TABLE slots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        type TEXT CHECK (type IN ('SOLO', 'GROUP')) NOT NULL,
        status TEXT DEFAULT 'DRAFT',
        capacity_min INT DEFAULT 1,
        capacity_max INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        modified_by UUID REFERENCES users(id),
        modification_reason TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        slot_id UUID REFERENCES slots(id) ON DELETE CASCADE,
        status TEXT CHECK (
          status IN (
            'REQUESTED',
            'PENDING_ADMIN_VALIDATION',
            'CONFIRMED',
            'REFUSED',
            'CANCELLED_BY_STUDENT',
            'CANCELLED_BY_ADMIN',
            'MODIFIED',
            'COMPLETED',
            'NO_SHOW'
          )
        ) DEFAULT 'REQUESTED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        modified_by UUID REFERENCES users(id),
        modification_reason TEXT,
        cancellation_reason TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS group_prebookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        slot_id UUID REFERENCES slots(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, slot_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS availability (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE UNIQUE NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Supprimer la table history si elle existe avec un mauvais schéma
    await client.query("DROP TABLE IF EXISTS history CASCADE");

    await client.query(`
      CREATE TABLE history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity TEXT NOT NULL,
        entity_id UUID NOT NULL,
        action TEXT NOT NULL,
        user_id UUID REFERENCES users(id),
        reason TEXT,
        payload JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS availability_periods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_group_prebooking_open BOOLEAN DEFAULT FALSE,
        group_prebooking_close_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id),
        UNIQUE(start_date, end_date)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT TRUE,
        solo_booking_enabled BOOLEAN DEFAULT TRUE,
        group_booking_enabled BOOLEAN DEFAULT TRUE,
        max_solo_per_week INT DEFAULT 1,
        max_solo_per_month INT DEFAULT 4,
        min_solo_advance_days INT DEFAULT 7,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `);

    await client.query("COMMIT");
    console.log("Database migration completed successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration error:", error);
    throw error;
  } finally {
    client.release();
  }
};

createTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
