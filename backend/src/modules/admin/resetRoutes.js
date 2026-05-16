const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin } = require("../common/authMiddleware");
const pool = require("../../database");

// Route pour nettoyer toutes les réservations et événements
router.post("/reset-all", authenticate, requireAdmin, async (req, res) => {
  try {
    console.log("🗑️ Nettoyage de toutes les données...");

    // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
    await pool.query("DELETE FROM bookings");
    await pool.query("DELETE FROM group_prebookings");
    await pool.query("DELETE FROM event_availabilities");
    await pool.query("DELETE FROM events");
    await pool.query("DELETE FROM slots");
    await pool.query("DELETE FROM history");

    // Compter ce qui reste
    const counts = await Promise.all([
      pool.query("SELECT COUNT(*) FROM bookings"),
      pool.query("SELECT COUNT(*) FROM group_prebookings"),
      pool.query("SELECT COUNT(*) FROM event_availabilities"),
      pool.query("SELECT COUNT(*) FROM events"),
      pool.query("SELECT COUNT(*) FROM slots"),
      pool.query("SELECT COUNT(*) FROM history"),
    ]);

    const result = {
      bookings: parseInt(counts[0].rows[0].count),
      group_prebookings: parseInt(counts[1].rows[0].count),
      event_availabilities: parseInt(counts[2].rows[0].count),
      events: parseInt(counts[3].rows[0].count),
      slots: parseInt(counts[4].rows[0].count),
      history: parseInt(counts[5].rows[0].count),
    };

    console.log("✅ Nettoyage terminé:", result);

    res.json({
      success: true,
      message: "Toutes les données ont été supprimées",
      remaining: result,
    });
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
