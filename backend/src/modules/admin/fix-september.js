const pool = require("../../database");

const fixSeptemberSlots = async () => {
  const results = {
    confirmedCount: 0,
    confirmedDates: [],
    updatedCount: 0,
    createdCount: 0,
    message: "",
  };

  try {
    // 1. Compter les créneaux GROUP_CONFIRMED en septembre
    const confirmedResult = await pool.query(`
      SELECT COUNT(*) as count, array_agg(date) as dates
      FROM slots 
      WHERE date >= '2026-09-01' 
      AND date <= '2026-09-30'
      AND type = 'GROUP'
      AND status = 'GROUP_CONFIRMED'
    `);

    results.confirmedCount = parseInt(confirmedResult.rows[0].count);
    results.confirmedDates = confirmedResult.rows[0].dates || [];

    // 2. Si moins de 2 créneaux confirmés, restaurer les mardis/jeudis
    if (results.confirmedCount < 2) {
      // Mettre à jour les slots existants qui sont passés en SOLO
      const updateResult = await pool.query(`
        UPDATE slots 
        SET type = 'GROUP', status = 'BLOCKED_FOR_GROUP'
        WHERE date >= '2026-09-01' 
        AND date <= '2026-09-30'
        AND EXTRACT(DOW FROM date) IN (2, 4)
        AND status NOT IN ('GROUP_CONFIRMED', 'SOLO_CONFIRMED')
        RETURNING date
      `);

      results.updatedCount = updateResult.rows.length;

      // Vérifier s'il manque des mardis/jeudis et les créer
      const allTuesdaysThursdays = [];
      for (let day = 1; day <= 30; day++) {
        const date = new Date(2026, 8, day); // Mois 8 = septembre
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 2 || dayOfWeek === 4) {
          allTuesdaysThursdays.push(date.toISOString().split("T")[0]);
        }
      }

      for (const dateStr of allTuesdaysThursdays) {
        const existing = await pool.query(
          "SELECT id FROM slots WHERE date = $1",
          [dateStr]
        );

        if (existing.rows.length === 0) {
          await pool.query(`
            INSERT INTO slots (id, date, start_time, end_time, type, status, capacity_min, capacity_max)
            VALUES (gen_random_uuid(), $1, '10:00', '17:00', 'GROUP', 'BLOCKED_FOR_GROUP', 3, 999)
          `, [dateStr]);
          results.createdCount++;
        }
      }

      results.message = `Septembre réparé: ${results.updatedCount} créneaux restaurés, ${results.createdCount} créneaux créés`;
    } else {
      results.message = `2+ créneaux groupe confirmés. Les autres restent en SOLO (règle respectée)`;
    }

    return results;
  } catch (error) {
    console.error("Erreur dans fixSeptemberSlots:", error);
    throw error;
  }
};

module.exports = { fixSeptemberSlots };
