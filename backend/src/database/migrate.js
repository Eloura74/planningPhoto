const pool = require("./index");
const { v4: uuidv4 } = require("uuid");

const createTables = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        role TEXT CHECK (role IN ('ADMIN', 'STUDENT')) NOT NULL,
        is_group_member INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Slots table
    await pool.query("DROP TABLE IF EXISTS slots");

    await pool.query(`
      CREATE TABLE slots (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        type TEXT CHECK (type IN ('SOLO', 'GROUP')) NOT NULL,
        status TEXT DEFAULT 'DRAFT',
        capacity_min INTEGER DEFAULT 1,
        capacity_max INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        modified_by TEXT REFERENCES users(id),
        modification_reason TEXT
      );
    `);

    // Bookings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        slot_id TEXT REFERENCES slots(id) ON DELETE CASCADE,
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
        modified_by TEXT REFERENCES users(id),
        modification_reason TEXT,
        cancellation_reason TEXT
      );
    `);

    // Group prebookings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_prebookings (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        slot_id TEXT REFERENCES slots(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, slot_id)
      );
    `);

    // Availability table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS availability (
        id TEXT PRIMARY KEY,
        date TEXT UNIQUE NOT NULL,
        is_available INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // History table
    await pool.query("DROP TABLE IF EXISTS history");

    await pool.query(`
      CREATE TABLE history (
        id TEXT PRIMARY KEY,
        entity TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        user_id TEXT REFERENCES users(id),
        reason TEXT,
        payload TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Availability periods table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS availability_periods (
        id TEXT PRIMARY KEY,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        is_group_prebooking_open INTEGER DEFAULT 0,
        group_prebooking_close_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT REFERENCES users(id),
        UNIQUE(start_date, end_date)
      );
    `);

    // User settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        is_active INTEGER DEFAULT 1,
        solo_booking_enabled INTEGER DEFAULT 1,
        group_booking_enabled INTEGER DEFAULT 1,
        max_solo_per_week INTEGER DEFAULT 1,
        max_solo_per_month INTEGER DEFAULT 4,
        min_solo_advance_days INTEGER DEFAULT 7,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `);

    console.log("Database migration completed successfully");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
};

createTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
