const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin } = require("../common/authMiddleware");
const {
  getAllSlots,
  getSlotById,
  createSlot,
  updateSlot,
  deleteSlot,
  blockSlot,
  releaseSlot,
  confirmGroupSlots,
  confirmGroupSlotsAdmin,
} = require("./service");

router.get("/", authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const slots = await getAllSlots(startDate, endDate);
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const slot = await getSlotById(req.params.id);
    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }
    res.json(slot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const slot = await createSlot(req.body, req.userId);
    res.status(201).json(slot);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const slot = await updateSlot(req.params.id, req.body);
    res.json(slot);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch("/:id/block", authenticate, requireAdmin, async (req, res) => {
  try {
    console.log("🔍 Blocking slot:", req.params.id, "by user:", req.userId);
    const slot = await blockSlot(req.params.id, req.userId);
    console.log("✅ Slot blocked successfully:", slot);
    res.json(slot);
  } catch (error) {
    console.error("❌ Error blocking slot:", error.message);
    res.status(400).json({ error: error.message });
  }
});

router.patch("/:id/release", authenticate, requireAdmin, async (req, res) => {
  try {
    const slot = await releaseSlot(req.params.id);
    res.json(slot);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch(
  "/:id/confirm-group",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { slotIds } = req.body;
      const slots = await confirmGroupSlots(slotIds);
      res.json(slots);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await deleteSlot(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/confirm-group", authenticate, requireAdmin, async (req, res) => {
  try {
    const { slotIds } = req.body;
    const result = await confirmGroupSlots(slotIds, req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
