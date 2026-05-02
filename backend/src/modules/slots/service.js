const pool = require("../../database");
const { v4: uuidv4 } = require("uuid");
const { createHistory } = require("../common/historyService");

const getAllSlots = async (startDate, endDate) => {
  try {
    console.log("getAllSlots appelé avec:", { startDate, endDate });
    let query = "SELECT * FROM slots";
    const params = [];

    if (startDate && endDate) {
      query += " WHERE date >= $1 AND date <= $2";
      params.push(startDate, endDate);
    }

    query += " ORDER BY date, start_time";

    const result = await pool.query(query, params);
    console.log(
      "getAllSlots résultat:",
      result.rows.length,
      "créneaux trouvés",
    );
    return result.rows;
  } catch (error) {
    console.error("Erreur dans getAllSlots:", error.message);
    throw error;
  }
};

const getSlotById = async (id) => {
  const result = await pool.query("SELECT * FROM slots WHERE id = $1", [id]);
  return result.rows[0];
};

const createSlot = async (data, userId) => {
  try {
    const {
      date,
      startTime,
      endTime,
      type,
      capacityMin,
      capacityMax,
      forceStatus,
    } = data;
    const slotId = uuidv4();

    const dayOfWeek = new Date(date).getDay();
    const isTuesdayOrThursday = dayOfWeek === 2 || dayOfWeek === 4;

    let status = forceStatus || "DRAFT";

    // Définir le statut par défaut selon le type si pas forcé
    if (!forceStatus) {
      if (type === "SOLO") {
        status = "OPEN_SOLO";
      } else if (type === "GROUP") {
        status = "BLOCKED_FOR_GROUP";
      }
    }

    const result = await pool.query(
      "INSERT INTO slots (id, date, start_time, end_time, type, status, capacity_min, capacity_max) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        slotId,
        date,
        startTime,
        endTime,
        type,
        status,
        capacityMin || 1,
        capacityMax || 5,
      ],
    );

    await createHistory(
      "SLOT",
      slotId,
      "CREATE",
      data,
      null,
      `Création créneau ${type}`,
    );

    return result.rows[0];
  } catch (error) {
    console.error("Erreur dans createSlot:", error.message);
    throw error;
  }
};

const updateSlot = async (id, data) => {
  const { date, startTime, endTime, type, status, capacityMin, capacityMax } =
    data;

  const result = await pool.query(
    "UPDATE slots SET date = $1, start_time = $2, end_time = $3, type = $4, status = $5, capacity_min = $6, capacity_max = $7 WHERE id = $8 RETURNING *",
    [date, startTime, endTime, type, status, capacityMin, capacityMax, id],
  );

  await createHistory("SLOT", id, "UPDATE", data, null);
  return result.rows[0];
};

const deleteSlot = async (id) => {
  const result = await pool.query(
    "DELETE FROM slots WHERE id = $1 RETURNING *",
    [id],
  );
  await createHistory("SLOT", id, "DELETE", {}, null);
  return result.rows[0];
};

const getSlotsByDateRange = async (startDate, endDate) => {
  const result = await pool.query(
    "SELECT * FROM slots WHERE date >= $1 AND date <= $2 ORDER BY date, start_time",
    [startDate, endDate],
  );
  return result.rows;
};

const confirmGroupSlots = async (confirmedSlotIds, userId) => {
  // Confirmer les créneaux sélectionnés
  for (const slotId of confirmedSlotIds) {
    await pool.query("UPDATE slots SET status = $1 WHERE id = $2", [
      "GROUP_CONFIRMED",
      slotId,
    ]);
    await createHistory(
      "SLOT",
      slotId,
      "CONFIRM_GROUP",
      { confirmed: true },
      userId,
      "Créneau groupe confirmé",
    );
  }

  // Libérer les autres mardis/jeudis bloqués dans la même période
  if (confirmedSlotIds.length > 0) {
    const firstSlot = await pool.query("SELECT * FROM slots WHERE id = $1", [
      confirmedSlotIds[0],
    ]);
    if (firstSlot.rows.length > 0) {
      const firstDate = new Date(firstSlot.rows[0].date);
      const monthStart = new Date(
        firstDate.getFullYear(),
        firstDate.getMonth(),
        1,
      );
      const monthEnd = new Date(
        firstDate.getFullYear(),
        firstDate.getMonth() + 1,
        0,
      );

      await pool.query(
        `
          UPDATE slots
          SET status = 'OPEN_SOLO'
          WHERE id NOT IN (${confirmedSlotIds
            .map((_, i) => `$${i + 2}`)
            .join(",")})
          AND type = 'GROUP'
          AND status IN ('BLOCKED_FOR_GROUP', 'GROUP_PREBOOKING', 'GROUP_PREBOOKING_OPEN')
          AND date >= $1
          AND date <= $${confirmedSlotIds.length + 2}
          AND EXTRACT(DOW FROM date) IN (2, 4)
        `,
        [
          monthStart.toISOString().split("T")[0],
          monthEnd.toISOString().split("T")[0],
          ...confirmedSlotIds,
        ],
      );

      await createHistory(
        "SLOT",
        "BATCH",
        "RELEASE_TUESDAY_THURSDAY",
        {
          period: `${monthStart.toISOString().split("T")[0]} to ${monthEnd.toISOString().split("T")[0]}`,
          excluded: confirmedSlotIds,
        },
        userId,
        "Libération auto mardis/jeudis non retenus",
      );
    }
  }

  return { success: true, confirmedCount: confirmedSlotIds.length };
};

const confirmGroupSlotsAdmin = async (slotIds, adminId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const slotId of slotIds) {
      const slot = await client.query("SELECT * FROM slots WHERE id = $1", [
        slotId,
      ]);
      if (slot.rows.length === 0) continue;

      const slotData = slot.rows[0];
      const prebookings = await client.query(
        "SELECT * FROM group_prebookings WHERE slot_id = $1",
        [slotId],
      );

      if (prebookings.rows.length < slotData.capacity_min) {
        await client.query("ROLLBACK");
        throw new Error(
          `Créneau ${slotData.date} : seuil minimum non atteint (${prebookings.rows.length}/${slotData.capacity_min})`,
        );
      }

      await client.query("UPDATE slots SET status = $1 WHERE id = $2", [
        "GROUP_CONFIRMED",
        slotId,
      ]);

      for (const prebooking of prebookings.rows) {
        const bookingId = uuidv4();
        await client.query(
          `INSERT INTO bookings (id, user_id, slot_id, status, created_at) 
           VALUES ($1, $2, $3, $4, NOW())`,
          [bookingId, prebooking.user_id, slotId, "CONFIRMED"],
        );

        await createHistory(
          "BOOKING",
          bookingId,
          "CREATE",
          {
            userId: prebooking.user_id,
            slotId: slotId,
            adminId: adminId,
          },
          adminId,
          `Confirmation groupe par admin`,
        );
      }

      await client.query("DELETE FROM group_prebookings WHERE slot_id = $1", [
        slotId,
      ]);
    }

    await client.query("COMMIT");
    return { success: true, message: "Group slots confirmed successfully" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const blockSlot = async (slotId, userId) => {
  const result = await pool.query(
    "UPDATE slots SET status = $1, modified_by = $2, modification_reason = $3 WHERE id = $4 RETURNING *",
    ["BLOCKED_FOR_GROUP", userId, "Blocked by admin", slotId],
  );

  if (result.rows.length === 0) {
    throw new Error("Slot not found");
  }

  await createHistory(
    "SLOT",
    slotId,
    "BLOCK",
    { status: "BLOCKED_FOR_GROUP" },
    userId,
  );
  return result.rows[0];
};

const releaseSlot = async (slotId) => {
  const result = await pool.query(
    "UPDATE slots SET status = $1 WHERE id = $2 RETURNING *",
    ["OPEN_TUESDAY", slotId],
  );

  if (result.rows.length === 0) {
    throw new Error("Slot not found");
  }

  return result.rows[0];
};

module.exports = {
  getAllSlots,
  getSlotById,
  createSlot,
  updateSlot,
  deleteSlot,
  blockSlot,
  releaseSlot,
  getSlotsByDateRange,
  confirmGroupSlots,
  confirmGroupSlotsAdmin,
};
