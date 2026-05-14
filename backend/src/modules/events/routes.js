const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin } = require("../common/authMiddleware");
const {
  createEvent,
  getAllEvents,
  getEventById,
  getOpenEvents,
  voteAvailability,
  getUserVotes,
  getEventStats,
  confirmEvent,
  deleteEvent,
  updateEventStatus,
} = require("./service");

// Routes ADMIN

// Créer un événement
router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    console.log("📅 Creating event:", req.body);
    const event = await createEvent(req.body, req.userId);
    res.json(event);
  } catch (error) {
    console.error("❌ Error creating event:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Récupérer tous les événements (admin)
router.get("/admin/all", authenticate, requireAdmin, async (req, res) => {
  try {
    const events = await getAllEvents();
    res.json(events);
  } catch (error) {
    console.error("❌ Error fetching events:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les statistiques d'un événement
router.get("/:id/stats", authenticate, requireAdmin, async (req, res) => {
  try {
    const stats = await getEventStats(req.params.id);
    res.json(stats);
  } catch (error) {
    console.error("❌ Error fetching event stats:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Confirmer un événement avec les dates choisies
router.post("/:id/confirm", authenticate, requireAdmin, async (req, res) => {
  try {
    const { confirmedDates } = req.body;
    console.log("✅ Confirming event:", req.params.id, "with dates:", confirmedDates);
    const event = await confirmEvent(req.params.id, confirmedDates, req.userId);
    res.json(event);
  } catch (error) {
    console.error("❌ Error confirming event:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Mettre à jour le statut d'un événement
router.patch("/:id/status", authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const event = await updateEventStatus(req.params.id, status, req.userId);
    res.json(event);
  } catch (error) {
    console.error("❌ Error updating event status:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Supprimer un événement
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await deleteEvent(req.params.id, req.userId);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting event:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Routes MEMBRES

// Récupérer les événements ouverts
router.get("/open", authenticate, async (req, res) => {
  try {
    const events = await getOpenEvents();
    res.json(events);
  } catch (error) {
    console.error("❌ Error fetching open events:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer un événement par ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const event = await getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }
    res.json(event);
  } catch (error) {
    console.error("❌ Error fetching event:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Voter pour des disponibilités
router.post("/:id/vote", authenticate, async (req, res) => {
  try {
    const { dates } = req.body;
    console.log("🗳️ User voting:", req.userId, "for event:", req.params.id, "dates:", dates);
    const result = await voteAvailability(req.params.id, req.userId, dates);
    res.json(result);
  } catch (error) {
    console.error("❌ Error voting:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Récupérer les votes d'un utilisateur
router.get("/:id/my-votes", authenticate, async (req, res) => {
  try {
    const votes = await getUserVotes(req.params.id, req.userId);
    res.json(votes);
  } catch (error) {
    console.error("❌ Error fetching user votes:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
