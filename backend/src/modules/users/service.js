const pool = require("../../database");
const { createHistory } = require("../common/historyService");

const getAllUsers = async () => {
  const result = await pool.query(
    "SELECT id, name, email, phone, role, is_group_member, created_at FROM users ORDER BY created_at DESC",
  );
  return result.rows;
};

const getUserById = async (id) => {
  const result = await pool.query(
    "SELECT id, name, email, phone, role, is_group_member, created_at FROM users WHERE id = $1",
    [id],
  );
  return result.rows[0];
};

const updateUser = async (id, data) => {
  const { name, email, phone, is_group_member, password, role } = data;
  let query =
    "UPDATE users SET name = $1, email = $2, phone = $3, is_group_member = $4";
  let params = [name, email, phone, is_group_member];

  if (password) {
    query += ", password_hash = crypt($6)";
    params.push(password);
  }

  if (role) {
    query += ", role = $" + (params.length + 1);
    params.push(role);
  }

  query +=
    " WHERE id = $" +
    (params.length + 1) +
    " RETURNING id, name, email, phone, role, is_group_member";
  params.push(id);

  const result = await pool.query(query, params);

  await createHistory("USER", id, "UPDATE", data);
  return result.rows[0];
};

const deleteUser = async (id) => {
  await pool.query("DELETE FROM users WHERE id = $1", [id]);
  await createHistory("USER", id, "DELETE", { userId: id });
  return { success: true };
};

const toggleUserStatus = async (id) => {
  // Vérifier si c'est l'admin principal
  const user = await pool.query("SELECT email, role FROM users WHERE id = $1", [
    id,
  ]);
  if (
    user.rows[0]?.email === "fabien.licata@gmail.com" &&
    user.rows[0]?.role === "ADMIN"
  ) {
    throw new Error(
      "Impossible de désactiver le compte administrateur principal",
    );
  }

  const result = await pool.query(
    "UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, email, is_active, role",
    [id],
  );
  await createHistory("USER", id, "TOGGLE_STATUS", {
    userId: id,
    newStatus: result.rows[0].is_active,
  });
  return result.rows[0];
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
};
