import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
  });
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      await register(
        formData.name,
        formData.email,
        formData.phone,
        formData.password,
        formData.role,
        false, // L'admin décide qui est dans le groupe
      );
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur d'inscription");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center fade-in"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="max-w-md w-full p-8 card-gold">
        <h2
          className="text-2xl font-bold text-center mb-6"
          style={{ color: "var(--gold-primary)" }}
        >
          Inscription
        </h2>
        {error && (
          <div
            className="p-3 rounded mb-4"
            style={{
              backgroundColor: "rgba(255, 0, 0, 0.1)",
              color: "#ff6b6b",
              border: "1px solid rgba(255, 0, 0, 0.3)",
            }}
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Nom
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg input-dark"
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg input-dark"
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Téléphone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg input-dark"
            />
          </div>
          <div className="mb-4">
            <label
              className="block mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg input-dark"
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg input-dark"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-lg btn-gold mt-6"
          >
            S'inscrire
          </button>
        </form>
        <p className="text-center mt-4" style={{ color: "var(--text-muted)" }}>
          Déjà un compte ?{" "}
          <a
            href="/login"
            style={{
              color: "var(--gold-primary)",
              textDecoration: "underline",
            }}
          >
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;
