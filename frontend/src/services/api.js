import axios from "axios";
import { API_BASE_URL } from "../api-config";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs 403 (utilisateur supprimé)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.error(" Erreur 403:", error.response?.data);

      // Déconnecter uniquement si l'utilisateur n'existe vraiment plus
      if (error.response?.data?.error === "User not found") {
        console.log(" Utilisateur supprimé, déconnexion automatique");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export const slotsAPI = {
  getAll: (startDate, endDate) =>
    api.get("/slots", { params: { startDate, endDate } }),
  getById: (id) => api.get(`/slots/${id}`),
  create: (data) => api.post("/slots", data),
  update: (id, data) => api.put(`/slots/${id}`, data),
  delete: (id) => api.delete(`/slots/${id}`),
  blockSlot: (id) => api.patch(`/slots/${id}/block`),
  releaseSlot: (id) => api.patch(`/slots/${id}/release`),
  reopenSlot: (id) => api.patch(`/slots/${id}/reopen`),
  confirmGroup: (slotIds) => api.post("/slots/confirm-group", { slotIds }),
};

export const bookingsAPI = {
  getAll: () => api.get("/bookings"),
  createSolo: (slotId) => api.post("/bookings/solo", { slotId }),
  createGroup: (slotId) => api.post("/bookings/group", { slotId }),
  getMyBookings: () => api.get("/bookings/my"),
  getBySlot: (slotId) => api.get(`/bookings/slot/${slotId}`),
  getGroupPrebookings: (slotId) => api.get(`/bookings/group/${slotId}`),
  confirm: (id) => api.patch(`/bookings/${id}/confirm`),
  cancel: (id, reason) => api.delete(`/bookings/${id}`, { data: { reason } }),
  getAllPending: (status) =>
    api.get("/bookings/pending", { params: { status } }),
  cancelGroupPrebooking: (slotId) => api.delete(`/bookings/group/${slotId}`),
  deleteGroupPrebookingById: (id) =>
    api.delete(`/bookings/group-prebooking/${id}`),
  getLowGroupParticipation: () => api.get("/bookings/low-participation"),
};

export const adminAPI = {
  validateGroup: (slotId) => api.post("/admin/validate-group", { slotId }),
  releaseSlots: (slotIds) => api.post("/admin/release-slots", { slotIds }),
  blockSlot: (slotId) => api.post("/admin/block-slot", { slotId }),
  setAvailability: (date, isAvailable) =>
    api.post("/admin/availability", { date, isAvailable }),
  getAvailability: (startDate, endDate) =>
    api.get("/admin/availability", {
      params: { startDate, endDate },
    }),
  getHistory: (entity, limit) =>
    api.get("/admin/history", { params: { entity, limit } }),
  getDashboard: () => api.get("/admin/dashboard"),
};

export const usersAPI = {
  getMe: () => api.get("/users/me"),
  getAll: () => api.get("/users"),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleStatus: (id) => api.post(`/users/${id}/toggle-status`),
};

export const availabilityAPI = {
  getSlots: (startDate, endDate) =>
    api.get("/availability/slots", { params: { startDate, endDate } }),
  getUnavailabilities: (startDate, endDate) =>
    api.get("/availability/unavailabilities", {
      params: { startDate, endDate },
    }),
  markUnavailable: (date) =>
    api.post("/availability/unavailabilities", { date }),
  removeUnavailability: (date) =>
    api.delete(`/availability/unavailabilities/${date}`),
};
