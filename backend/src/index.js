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

async function initializeDefaultAdmin() {
  try {
    console.log("Début de l'initialisation de l'admin...");

    const adminEmail = "fabien.licata@gmail.com";
    const adminPassword = "admin1412";

    console.log("Vérification de l'admin:", adminEmail);

    // Vérifier si un utilisateur avec cet email existe
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [adminEmail],
    );

    console.log("Admin existe:", existingUser.rows.length > 0);

    if (existingUser.rows.length === 0) {
      // Créer un nouvel admin seulement s'il n'existe pas
      const adminId = uuidv4();
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, is_group_member, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [adminId, "Fabien Licata", adminEmail, hashedPassword, "ADMIN", 1, 1],
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
  await initializeDefaultAdmin();
});
