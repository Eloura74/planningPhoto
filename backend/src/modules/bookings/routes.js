const express = require("express");
const router = express.Router();
const pool = require("../../database");
const { authenticate, requireAdmin } = require("../common/authMiddleware");
const {
  createSoloBooking,
  createGroupPrebooking,
  getBookingsByUser,
  getBookingsBySlot,
  confirmBooking,
  cancelBooking,
  getUserWeeklyBookings,
  getUserMonthlyBookings,
  getGroupPrebookingsBySlot,
  deleteGroupPrebooking,
  getSlotsWithLowGroupParticipation,
} = require("./service");

router.post("/solo", authenticate, async (req, res) => {
  try {
    const { slotId } = req.body;

    const slot = await pool.query("SELECT date FROM slots WHERE id = $1", [
      slotId,
    ]);
    const slotDate = new Date(slot.rows[0].date);
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Temporarily disabled for testing
    // if (slotDate < oneWeekLater) {
    //   throw new Error("Booking must be made at least one week in advance");
    // }

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weeklyCount = await getUserWeeklyBookings(
      req.userId,
      weekStart.toISOString().split("T")[0],
      weekEnd.toISOString().split("T")[0],
    );
    if (weeklyCount >= 1) {
      throw new Error("Maximum 1 solo booking per week");
    }

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyCount = await getUserMonthlyBookings(
      req.userId,
      monthStart.toISOString().split("T")[0],
      monthEnd.toISOString().split("T")[0],
    );
    if (monthlyCount >= 4) {
      throw new Error("Maximum 4 solo bookings per month");
    }

    const booking = await createSoloBooking(req.userId, slotId);
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/group", authenticate, async (req, res) => {
  try {
    const { slotId } = req.body;
    const prebooking = await createGroupPrebooking(req.userId, slotId);
    res.status(201).json(prebooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/my", authenticate, async (req, res) => {
  try {
    const bookings = await getBookingsByUser(req.userId);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/pending", authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const statusFilter = status ? `AND b.status = '${status}'` : "";
    const result = await pool.query(`
      SELECT b.*, u.name as user_name, u.email as user_email, s.date as slot_date, s.start_time, s.end_time, s.type as slot_type
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN slots s ON b.slot_id = s.id
      WHERE s.type = 'SOLO' ${statusFilter}
      ORDER BY s.date DESC, b.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/slot/:slotId", authenticate, async (req, res) => {
  try {
    const bookings = await getBookingsBySlot(req.params.slotId);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/group/:slotId", authenticate, async (req, res) => {
  try {
    const { slotId } = req.params;
    const userRole = await pool.query("SELECT role FROM users WHERE id = $1", [
      req.userId,
    ]);
    const role = userRole.rows[0]?.role;

    let bookings;
    if (role === "ADMIN") {
      bookings = await getGroupPrebookingsBySlot(slotId);
    } else {
      // Les élèves ne voient que leurs propres pré-réservations
      bookings = await getGroupPrebookingsBySlot(slotId, req.userId);
    }
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/confirm", authenticate, requireAdmin, async (req, res) => {
  try {
    const booking = await confirmBooking(req.params.id, {
      id: req.userId,
      role: "ADMIN",
    });
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.userId,
    ]);
    const cancelledBy = {
      id: req.userId,
      role: user.rows[0]?.role || "STUDENT",
    };
    const booking = await cancelBooking(req.params.id, cancelledBy, reason);
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/group/:slotId", authenticate, async (req, res) => {
  try {
    const prebooking = await deleteGroupPrebooking(
      req.userId,
      req.params.slotId,
    );
    res.json(prebooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get(
  "/low-participation",
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const slots = await getSlotsWithLowGroupParticipation();
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

module.exports = router;
