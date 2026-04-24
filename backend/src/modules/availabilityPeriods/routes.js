const express = require('express');
const router = express.Router();
const {
  createAvailabilityPeriod,
  getActiveAvailabilityPeriod,
  getAllAvailabilityPeriods,
  updateAvailabilityPeriod,
  deleteAvailabilityPeriod,
  isGroupPrebookingOpen
} = require('./service');

// POST /api/availability-periods - Create availability period
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const period = await createAvailabilityPeriod(req.body, userId);
    res.status(201).json(period);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/availability-periods/active - Get active availability period
router.get('/active', async (req, res) => {
  try {
    const period = await getActiveAvailabilityPeriod();
    res.json(period);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/availability-periods - Get all availability periods
router.get('/', async (req, res) => {
  try {
    const periods = await getAllAvailabilityPeriods();
    res.json(periods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/availability-periods/:id - Update availability period
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const period = await updateAvailabilityPeriod(req.params.id, req.body, userId);
    res.json(period);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/availability-periods/:id - Delete availability period
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    await deleteAvailabilityPeriod(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/availability-periods/prebooking-open - Check if group prebooking is open
router.get('/prebooking-open', async (req, res) => {
  try {
    const isOpen = await isGroupPrebookingOpen();
    res.json({ isOpen });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
