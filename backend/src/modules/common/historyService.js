const pool = require("../../database");
const { v4: uuidv4 } = require("uuid");

const createHistory = async (
  entity,
  entityId,
  action,
  payload,
  userId = null,
  reason = null,
) => {
  await pool.query(
    "INSERT INTO history (id, entity, entity_id, action, payload) VALUES ($1, $2, $3, $4, $5)",
    [uuidv4(), entity, entityId, action, JSON.stringify(payload)],
  );
};

module.exports = { createHistory };
