const pool = require("../../database");
const { v4: uuidv4 } = require("uuid");
const { createHistory } = require("../common/historyService");

const createAvailabilityPeriod = async (data, userId) => {
  const {
    startDate,
    endDate,
    isGroupPrebookingOpen,
    groupPrebookingCloseDate,
  } = data;
  const periodId = uuidv4();

  const result = await pool.query(
    "INSERT INTO availability_periods (id, start_date, end_date, is_group_prebooking_open, group_prebooking_close_date, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [
      periodId,
      startDate,
      endDate,
      isGroupPrebookingOpen || false,
      groupPrebookingCloseDate,
      userId,
    ],
  );

  await createHistory(
    "AVAILABILITY_PERIOD",
    periodId,
    "CREATE",
    data,
    null,
    "Création période de disponibilité",
  );
  return result.rows[0];
};

const getActiveAvailabilityPeriod = async () => {
  const today = new Date().toISOString().split("T")[0];
  const result = await pool.query(
    "SELECT * FROM availability_periods WHERE start_date <= $1 AND end_date >= $1 ORDER BY created_at DESC LIMIT 1",
    [today],
  );
  return result.rows[0];
};

const getAllAvailabilityPeriods = async () => {
  const result = await pool.query(
    "SELECT * FROM availability_periods ORDER BY start_date DESC",
  );
  return result.rows;
};

const updateAvailabilityPeriod = async (id, data, userId) => {
  const {
    startDate,
    endDate,
    isGroupPrebookingOpen,
    groupPrebookingCloseDate,
  } = data;

  const result = await pool.query(
    "UPDATE availability_periods SET start_date = $1, end_date = $2, is_group_prebooking_open = $3, group_prebooking_close_date = $4 WHERE id = $5 RETURNING *",
    [startDate, endDate, isGroupPrebookingOpen, groupPrebookingCloseDate, id],
  );

  await createHistory(
    "AVAILABILITY_PERIOD",
    id,
    "UPDATE",
    data,
    null,
    "Modification période de disponibilité",
  );
  return result.rows[0];
};

const deleteAvailabilityPeriod = async (id, userId) => {
  const result = await pool.query(
    "DELETE FROM availability_periods WHERE id = $1 RETURNING *",
    [id],
  );
  await createHistory(
    "AVAILABILITY_PERIOD",
    id,
    "DELETE",
    {},
    null,
    "Suppression période de disponibilité",
  );
  return result.rows[0];
};

const isGroupPrebookingOpen = async () => {
  const period = await getActiveAvailabilityPeriod();
  if (!period) return false;

  if (!period.is_group_prebooking_open) return false;

  if (period.group_prebooking_close_date) {
    const today = new Date().toISOString().split("T")[0];
    return today <= period.group_prebooking_close_date;
  }

  return true;
};

module.exports = {
  createAvailabilityPeriod,
  getActiveAvailabilityPeriod,
  getAllAvailabilityPeriods,
  updateAvailabilityPeriod,
  deleteAvailabilityPeriod,
  isGroupPrebookingOpen,
};
