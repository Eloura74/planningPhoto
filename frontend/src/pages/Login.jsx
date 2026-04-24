import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/calendar");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur de connexion");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="max-w-md w-full rounded-lg p-8 card-gold fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2
            className="text-2xl font-bold"
            style={{ color: "var(--gold-primary)" }}
          >
            Connexion
          </h2>
          <button
            onClick={toggleTheme}
            className="px-3 py-1 rounded-lg btn-chrome"
            style={{ color: "var(--gold-primary)" }}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg input-dark"
              required
            />
          </div>
          <div className="mb-6">
            <label
              className="block mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg input-dark"
              required
            />
          </div>
          <button type="submit" className="w-full py-2 rounded-lg btn-gold">
            Se connecter
          </button>
        </form>
        <p className="text-center mt-4" style={{ color: "var(--text-muted)" }}>
          Pas de compte ?{" "}
          <a
            href="/register"
            style={{
              color: "var(--gold-primary)",
              textDecoration: "underline",
            }}
          >
            S'inscrire
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
