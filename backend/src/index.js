require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const pool = require("./database");

const authRoutes = require("./modules/auth/routes");
const userRoutes = require("./modules/users/routes");
const slotRoutes = require("./modules/slots/routes");
const bookingRoutes = require("./modules/bookings/routes");
const adminRoutes = require("./modules/admin/routes");
const availabilityPeriodRoutes = require("./modules/availabilityPeriods/routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/availability-periods", availabilityPeriodRoutes);

const PORT = process.env.PORT || 5000;

async function runMigrations() {
  try {
    console.log("Exécution des migrations de base de données...");

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        role TEXT CHECK (role IN ('ADMIN', 'STUDENT')) NOT NULL,
        is_group_member BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Slots table
    await pool.query("DROP TABLE IF EXISTS slots CASCADE");

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
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // History table
    await pool.query("DROP TABLE IF EXISTS history CASCADE");

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
        is_group_prebooking_open BOOLEAN DEFAULT false,
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
        is_active BOOLEAN DEFAULT true,
        solo_booking_enabled BOOLEAN DEFAULT true,
        group_booking_enabled BOOLEAN DEFAULT true,
        max_solo_per_week INTEGER DEFAULT 1,
        max_solo_per_month INTEGER DEFAULT 4,
        min_solo_advance_days INTEGER DEFAULT 7,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `);

    console.log("✓ Migrations terminées avec succès");
  } catch (error) {
    console.error("Erreur lors des migrations:", error.message);
    throw error;
  }
}

async function initializeDefaultAdmin() {
  try {
    console.log("Début de l'initialisation de l'admin...");

    const adminEmail = "fabien.licata@gmail.com";
    const adminPassword = "admin1412";

    console.log("Vérification de l'admin:", adminEmail);

    // Vérifier si un utilisateur avec cet email existe
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [adminEmail],
    );

    console.log("Admin existe:", existingUser.rows.length > 0);

    if (existingUser.rows.length === 0) {
      // Créer un nouvel admin seulement s'il n'existe pas
      const adminId = uuidv4();
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, is_group_member, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          adminId,
          "Fabien Licata",
          adminEmail,
          hashedPassword,
          "ADMIN",
          true,
          true,
        ],
      );

      console.log("✓ Admin par défaut créé avec succès");
      console.log("  Email: fabien.licata@gmail.com");
      console.log("  Mot de passe: admin1412");
    } else {
      console.log("✓ Admin existe déjà");
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation de l'admin:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await runMigrations();
  await initializeDefaultAdmin();
});
