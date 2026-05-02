const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin } = require("../common/authMiddleware");
const {
  getAvailableSlots,
  markUnavailable,
  removeUnavailability,
  getUnavailabilities
} = require("./service");

// Récupérer les créneaux disponibles (tous les utilisateurs)
router.get("/slots", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const slots = await getAvailableSlots(startDate, endDate);
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les indisponibilités (admin uniquement)
router.get("/unavailabilities", authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const unavailabilities = await getUnavailabilities(startDate, endDate);
    res.json(unavailabilities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marquer un jour comme indisponible (admin uniquement)
router.post("/unavailabilities", authenticate, requireAdmin, async (req, res) => {
  try {
    const { date } = req.body;
    const result = await markUnavailable(date, req.userId);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Retirer une indisponibilité (admin uniquement)
router.delete("/unavailabilities/:date", authenticate, requireAdmin, async (req, res) => {
  try {
    const { date } = req.params;
    const result = await removeUnavailability(date);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
