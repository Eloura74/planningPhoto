const { Pool } = require("pg");
require("dotenv").config();

// Utiliser la base de données de production (Render)
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://planningphoto_user:Uh9Dn5aqKQMPYqCzTXZqEPEhGVnBGjdH@dpg-cu1hqhm8ii6s73d2i0p0-a.frankfurt-postgres.render.com/planningphoto";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 1,
});

async function fixSeptemberSlots() {
  const client = await pool.connect();
  try {
    console.log("🔧 Réparation des créneaux de septembre 2026...\n");
    console.log("✅ Connecté à la base de données\n");

    // 1. Compter les créneaux GROUP_CONFIRMED en septembre
    const confirmedResult = await client.query(`
      SELECT COUNT(*) as count, array_agg(date) as dates
      FROM slots 
      WHERE date >= '2026-09-01' 
      AND date <= '2026-09-30'
      AND type = 'GROUP'
      AND status = 'GROUP_CONFIRMED'
    `);

    const confirmedCount = parseInt(confirmedResult.rows[0].count);
    const confirmedDates = confirmedResult.rows[0].dates || [];

    console.log(
      `📊 ${confirmedCount} créneau(x) groupe CONFIRMÉ(S) en septembre`,
    );
    if (confirmedDates.length > 0) {
      console.log(`   Dates confirmées: ${confirmedDates.join(", ")}`);
    }

    // 2. Si moins de 2 créneaux confirmés, restaurer les mardis/jeudis en BLOCKED_FOR_GROUP
    if (confirmedCount < 2) {
      console.log(
        "\n✅ Moins de 2 créneaux confirmés → Restauration des mardis/jeudis en GROUPE\n",
      );

      // Mettre à jour les slots existants qui sont passés en SOLO
      const updateResult = await client.query(`
        UPDATE slots 
        SET type = 'GROUP', status = 'BLOCKED_FOR_GROUP'
        WHERE date >= '2026-09-01' 
        AND date <= '2026-09-30'
        AND EXTRACT(DOW FROM date) IN (2, 4)
        AND status NOT IN ('GROUP_CONFIRMED', 'SOLO_CONFIRMED')
        RETURNING date, type, status
      `);

      if (updateResult.rows.length > 0) {
        console.log(
          `🔄 ${updateResult.rows.length} créneau(x) restauré(s) en GROUPE:`,
        );
        updateResult.rows.forEach((row) => {
          const date = new Date(row.date);
          const dayName = date.getDay() === 2 ? "Mardi" : "Jeudi";
          console.log(`   - ${row.date} (${dayName})`);
        });
      } else {
        console.log(
          "ℹ️  Aucun créneau à restaurer (déjà en GROUPE ou confirmés)",
        );
      }

      // Vérifier s'il manque des mardis/jeudis et les créer
      console.log("\n🔍 Vérification des mardis/jeudis manquants...");

      const allTuesdaysThursdays = [];
      for (let day = 1; day <= 30; day++) {
        const date = new Date(2026, 8, day); // Mois 8 = septembre
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 2 || dayOfWeek === 4) {
          allTuesdaysThursdays.push(date.toISOString().split("T")[0]);
        }
      }

      console.log(
        `   ${allTuesdaysThursdays.length} mardis/jeudis en septembre 2026`,
      );

      for (const dateStr of allTuesdaysThursdays) {
        const existing = await client.query(
          "SELECT id, type, status FROM slots WHERE date = $1",
          [dateStr],
        );

        if (existing.rows.length === 0) {
          // Créer le slot manquant
          await client.query(
            `
            INSERT INTO slots (id, date, start_time, end_time, type, status, capacity_min, capacity_max)
            VALUES (gen_random_uuid(), $1, '10:00', '17:00', 'GROUP', 'BLOCKED_FOR_GROUP', 3, 999)
          `,
            [dateStr],
          );

          const dayName = new Date(dateStr).getDay() === 2 ? "Mardi" : "Jeudi";
          console.log(`   ✅ Créé: ${dateStr} (${dayName})`);
        }
      }
    } else {
      console.log(
        "\n⚠️  2+ créneaux groupe confirmés → Les autres restent en SOLO (règle respectée)",
      );
      console.log(
        "   Si vous voulez restaurer les créneaux groupe, annulez d'abord les confirmations.",
      );
    }

    console.log("\n✅ Réparation terminée !");
    console.log("👉 Rechargez le calendrier (Ctrl+Shift+R)");
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

fixSeptemberSlots();
