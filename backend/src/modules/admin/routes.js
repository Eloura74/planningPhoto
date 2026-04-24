const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../common/authMiddleware');
const {
  validateGroupSlot,
  releaseSlotsForSolo,
  blockSlot,
  setAvailability,
  getAvailability,
  getHistory,
  getDashboardData
} = require('./service');

router.post('/validate-group', authenticate, requireAdmin, async (req, res) => {
  try {
    const { slotId } = req.body;
    const result = await validateGroupSlot(slotId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/release-slots', authenticate, requireAdmin, async (req, res) => {
  try {
    const { slotIds } = req.body;
    const results = await releaseSlotsForSolo(slotIds);
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/block-slot', authenticate, requireAdmin, async (req, res) => {
  try {
    const { slotId } = req.body;
    const slot = await blockSlot(slotId);
    res.json(slot);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/availability', authenticate, requireAdmin, async (req, res) => {
  try {
    const { date, isAvailable } = req.body;
    const availability = await setAvailability(date, isAvailable);
    res.json(availability);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/availability', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const availability = await getAvailability(startDate, endDate);
    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', authenticate, requireAdmin, async (req, res) => {
  try {
    const { entity, limit } = req.query;
    const history = await getHistory(entity, limit);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const data = await getDashboardData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
