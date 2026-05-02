import { useState, useEffect } from "react";
import { adminAPI } from "../services/api";

function AdminStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  if (!stats) return null;

  const statCards = [
    {
      title: "Utilisateurs",
      value: stats.totalUsers || 0,
      icon: "👥",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Créneaux",
      value: stats.totalSlots || 0,
      icon: "📅",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "En attente",
      value: stats.pendingBookings || 0,
      icon: "⏳",
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "Pré-réservations",
      value: stats.groupPrebookings || 0,
      icon: "👨‍👩‍👧‍👦",
      color: "from-green-500 to-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((card, index) => (
        <div
          key={index}
          className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">{card.title}</p>
              <p className="text-3xl font-bold">{card.value}</p>
            </div>
            <div className="text-4xl opacity-80">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminStats;
