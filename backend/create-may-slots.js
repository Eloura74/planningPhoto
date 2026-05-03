const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function createMaySlots() {
  try {
    console.log("🗓️ Création des créneaux de mai 2026...\n");

    // Supprimer tous les slots non confirmés de mai
    await pool.query(`
      DELETE FROM slots 
      WHERE date >= '2026-05-01' 
      AND date <= '2026-05-31'
      AND status NOT IN ('SOLO_CONFIRMED', 'GROUP_CONFIRMED')
    `);

    const slotsToCreate = [];

    // Générer tous les jours de mai 2026
    for (let day = 1; day <= 31; day++) {
      const date = new Date(2026, 4, day); // Mois 4 = mai (0-indexed)
      const dayOfWeek = date.getDay();
      const dateStr = date.toISOString().split("T")[0];

      // Ignorer les dimanches
      if (dayOfWeek === 0) continue;

      // Vérifier si le slot existe déjà
      const existing = await pool.query(
        "SELECT id FROM slots WHERE date = $1",
        [dateStr],
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️  ${dateStr} - Slot existant, ignoré`);
        continue;
      }

      let type, status, startTime, endTime, capacityMin, capacityMax;

      // Mardi (2) ou Jeudi (4) = GROUPE
      if (dayOfWeek === 2 || dayOfWeek === 4) {
        type = "MIXED";
        status = "OPEN_TUESDAY";
        startTime = "09:00";
        endTime = "17:00";
        capacityMin = 3;
        capacityMax = 5;
        console.log(
          `✅ ${dateStr} (${dayOfWeek === 2 ? "Mardi" : "Jeudi"}) - GROUPE`,
        );
      } else {
        // Autres jours = SOLO
        type = "SOLO";
        status = "OPEN_SOLO";
        startTime = "14:00";
        endTime = "17:00";
        capacityMin = 1;
        capacityMax = 1;
        const dayName = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][
          dayOfWeek
        ];
        console.log(`✅ ${dateStr} (${dayName}) - SOLO`);
      }

      slotsToCreate.push({
        id: uuidv4(),
        date: dateStr,
        startTime,
        endTime,
        type,
        status,
        capacityMin,
        capacityMax,
      });
    }

    // Insérer tous les slots
    for (const slot of slotsToCreate) {
      await pool.query(
        `INSERT INTO slots (id, date, start_time, end_time, type, status, capacity_min, capacity_max)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          slot.id,
          slot.date,
          slot.startTime,
          slot.endTime,
          slot.type,
          slot.status,
          slot.capacityMin,
          slot.capacityMax,
        ],
      );
    }

    console.log(`\n✅ ${slotsToCreate.length} créneaux créés !`);
    console.log("👉 Rechargez le calendrier (Ctrl+Shift+R)");
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await pool.end();
  }
}

createMaySlots();
