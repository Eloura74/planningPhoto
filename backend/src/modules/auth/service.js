const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const pool = require("../../database");
const { createHistory } = require("../common/historyService");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const register = async (
  name,
  email,
  phone,
  password,
  role = "STUDENT",
  isGroupMember = false,
) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  await pool.query(
    "INSERT INTO users (id, name, email, phone, role, is_group_member, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [userId, name, email, phone, role, isGroupMember, passwordHash],
  );

  await createHistory(
    "USER",
    userId,
    "CREATE",
    {
      name,
      email,
      role,
    },
    null,
  );

  return {
    id: userId,
    name,
    email,
    role,
    is_group_member: isGroupMember,
  };
};

const login = async (email, password) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (result.rows.length === 0) {
    throw new Error("User not found");
  }

  const user = result.rows[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    throw new Error("Invalid password");
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

  try {
    await createHistory("USER", user.id, "LOGIN", { email }, null);
  } catch (error) {
    console.error("Erreur lors de la création de l'historique:", error.message);
    // Ne pas bloquer la connexion si l'historique échoue
  }

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isGroupMember: user.is_group_member,
    },
  };
};

module.exports = { register, login };
