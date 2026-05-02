import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { usersAPI } from "../services/api";
import axios from "axios";
import { API_BASE_URL } from "../api-config";
import LoadingSpinner from "../components/LoadingSpinner";

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "STUDENT",
    isGroupMember: false,
  });
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      navigate("/calendar");
      return;
    }
    loadUsers();
  }, [user, navigate]);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, newUser);
      showToast("Utilisateur créé avec succès", "success");
      setShowForm(false);
      setNewUser({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "STUDENT",
        isGroupMember: false,
      });
      loadUsers();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la création",
        "error",
      );
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditForm(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role,
        is_group_member: editingUser.is_group_member,
      };
      if (editingUser.password) {
        updateData.password = editingUser.password;
      }
      await usersAPI.update(editingUser.id, updateData);
      showToast("Utilisateur mis à jour avec succès", "success");
      setShowEditForm(false);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la mise à jour",
        "error",
      );
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")
    ) {
      return;
    }
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}`);
      showToast("Utilisateur supprimé avec succès", "success");
      loadUsers();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la suppression",
        "error",
      );
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await usersAPI.toggleStatus(userId);
      showToast("Statut utilisateur mis à jour avec succès", "success");
      loadUsers();
    } catch (error) {
      showToast(
        error.response?.data?.error ||
          "Erreur lors de la mise à jour du statut",
        "error",
      );
    }
  };

  const handleToggleGroupMember = async (userId, currentStatus) => {
    try {
      const userToUpdate = users.find((u) => u.id === userId);
      await usersAPI.update(userId, {
        ...userToUpdate,
        is_group_member: !currentStatus,
      });
      showToast(
        currentStatus
          ? "Utilisateur retiré du groupe"
          : "Utilisateur ajouté au groupe",
        "success",
      );
      // Forcer le rechargement immédiat
      await loadUsers();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Erreur lors de la mise à jour",
        "error",
      );
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div
      className="min-h-screen fade-in"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <nav
        className="shadow-lg border-b"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-primary)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg glow-gold"
              style={{ background: "var(--chrome-gradient)" }}
            >
              <svg
                className="w-6 h-6"
                style={{ color: "var(--text-dark)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h1
              className="text-lg sm:text-xl font-bold"
              style={{
                background: "var(--chrome-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Gestion des Utilisateurs
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {user && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "var(--bg-tertiary)" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm"
                  style={{
                    background: "var(--chrome-gradient)",
                    color: "var(--text-dark)",
                  }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Administrateur
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/admin")}
                className="px-3 py-2 rounded-lg transition text-sm btn-chrome"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/calendar")}
                className="px-3 py-2 rounded-lg transition text-sm btn-chrome"
              >
                Calendrier
              </button>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-lg transition text-sm"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-lg shadow-md p-6 card-dark">
          <div className="flex justify-between items-center mb-6">
            <h2
              className="text-2xl font-bold"
              style={{ color: "var(--gold-primary)" }}
            >
              Liste des utilisateurs
            </h2>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-lg btn-gold"
            >
              + Créer un utilisateur
            </button>
          </div>

          {showForm && (
            <div
              className="mb-6 p-4 rounded-lg"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--gold-primary)" }}
              >
                Nouvel utilisateur
              </h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Nom
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg input-dark"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg input-dark"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) =>
                        setNewUser({ ...newUser, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg input-dark"
                    />
                  </div>
                  <div>
                    <label
                      className="block mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg input-dark"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Rôle
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg input-dark"
                    >
                      <option value="STUDENT">Élève</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      checked={newUser.isGroupMember}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          isGroupMember: e.target.checked,
                        })
                      }
                      className="mr-2"
                      style={{ accentColor: "var(--gold-primary)" }}
                    />
                    <label style={{ color: "var(--text-secondary)" }}>
                      Membre du groupe
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg btn-gold"
                  >
                    Créer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-lg btn-chrome"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {showEditForm && editingUser && (
            <div
              className="mb-6 p-4 rounded-lg"
              style={{
                backgroundColor: "rgba(255, 215, 0, 0.1)",
                border: "1px solid var(--border-gold)",
              }}
            >
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--gold-primary)" }}
              >
                Modifier l'utilisateur
              </h3>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Nom
                    </label>
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, name: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg input-dark"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg input-dark"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={editingUser.phone || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg input-dark"
                    />
                  </div>
                  <div>
                    <label
                      className="block mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Nouveau mot de passe (optionnel)
                    </label>
                    <input
                      type="password"
                      value={editingUser.password || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          password: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg input-dark"
                    />
                  </div>
                  <div>
                    <label
                      className="block mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Rôle
                    </label>
                    <select
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, role: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg input-dark"
                    >
                      <option value="STUDENT">Élève</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      checked={editingUser.is_group_member}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          is_group_member: e.target.checked,
                        })
                      }
                      className="mr-2"
                      style={{ accentColor: "var(--gold-primary)" }}
                    />
                    <label style={{ color: "var(--text-secondary)" }}>
                      Membre du groupe
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg btn-gold"
                  >
                    Mettre à jour
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingUser(null);
                    }}
                    className="px-4 py-2 rounded-lg btn-chrome"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  <th
                    className="text-left p-3"
                    style={{ color: "var(--gold-primary)" }}
                  >
                    Nom
                  </th>
                  <th
                    className="text-left p-3"
                    style={{ color: "var(--gold-primary)" }}
                  >
                    Email
                  </th>
                  <th
                    className="text-left p-3"
                    style={{ color: "var(--gold-primary)" }}
                  >
                    Téléphone
                  </th>
                  <th
                    className="text-left p-3"
                    style={{ color: "var(--gold-primary)" }}
                  >
                    Rôle
                  </th>
                  <th
                    className="text-left p-3"
                    style={{ color: "var(--gold-primary)" }}
                  >
                    Groupe
                  </th>
                  <th
                    className="text-left p-3"
                    style={{ color: "var(--gold-primary)" }}
                  >
                    Statut
                  </th>
                  <th
                    className="text-left p-3"
                    style={{ color: "var(--gold-primary)" }}
                  >
                    Créé le
                  </th>
                  <th
                    className="text-left p-3"
                    style={{ color: "var(--gold-primary)" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b"
                    style={{ borderColor: "var(--border-secondary)" }}
                  >
                    <td
                      className="p-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {user.name}
                    </td>
                    <td
                      className="p-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {user.email}
                    </td>
                    <td
                      className="p-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {user.phone || "-"}
                    </td>
                    <td className="p-3">
                      <span
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor:
                            user.role === "ADMIN"
                              ? "rgba(168, 168, 168, 0.2)"
                              : "rgba(0, 0, 255, 0.2)",
                          color:
                            user.role === "ADMIN"
                              ? "var(--chrome-light)"
                              : "#0000ff",
                          border:
                            "1px solid " +
                            (user.role === "ADMIN"
                              ? "var(--chrome-medium)"
                              : "#0000ff"),
                        }}
                      >
                        {user.role === "ADMIN" ? "Admin" : "Élève"}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() =>
                          handleToggleGroupMember(user.id, user.is_group_member)
                        }
                        className="px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: user.is_group_member
                            ? "rgba(0, 255, 0, 0.2)"
                            : "rgba(128, 128, 128, 0.2)",
                          color: user.is_group_member
                            ? "#00ff00"
                            : "var(--text-muted)",
                          border: user.is_group_member
                            ? "1px solid #00ff00"
                            : "1px solid var(--border-secondary)",
                        }}
                      >
                        {user.is_group_member ? "✓ Groupe" : "➕ Ajouter"}
                      </button>
                    </td>
                    <td className="p-3">
                      {user.is_active ? (
                        <span
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: "rgba(0, 255, 0, 0.2)",
                            color: "#00ff00",
                            border: "1px solid #00ff00",
                          }}
                        >
                          Actif
                        </span>
                      ) : (
                        <span
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: "rgba(255, 0, 0, 0.2)",
                            color: "#ff6b6b",
                            border: "1px solid #ff6b6b",
                          }}
                        >
                          Inactif
                        </span>
                      )}
                    </td>
                    <td
                      className="p-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {new Date(user.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="px-3 py-1 rounded text-sm btn-chrome"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user.id)}
                          className="px-3 py-1 rounded text-sm"
                          style={{
                            backgroundColor: user.is_active
                              ? "rgba(255, 215, 0, 0.2)"
                              : "rgba(0, 255, 0, 0.2)",
                            color: user.is_active
                              ? "var(--gold-primary)"
                              : "#00ff00",
                            border:
                              "1px solid " +
                              (user.is_active
                                ? "var(--gold-primary)"
                                : "#00ff00"),
                          }}
                        >
                          {user.is_active ? "Désactiver" : "Activer"}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-3 py-1 rounded text-sm"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.2)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsersManagement;
