import axios from "axios";

const API_BASE_URL = "/api";

export const slotsAPI = {
  getAll: (startDate, endDate) =>
    axios.get(`${API_BASE_URL}/slots`, { params: { startDate, endDate } }),
  getById: (id) => axios.get(`${API_BASE_URL}/slots/${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/slots`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/slots/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/slots/${id}`),
  blockSlot: (id) => axios.patch(`${API_BASE_URL}/slots/${id}/block`),
  releaseSlot: (id) => axios.patch(`${API_BASE_URL}/slots/${id}/release`),
  confirmGroup: (slotIds) =>
    axios.post(`${API_BASE_URL}/slots/confirm-group`, { slotIds }),
};

export const bookingsAPI = {
  createSolo: (slotId) =>
    axios.post(`${API_BASE_URL}/bookings/solo`, { slotId }),
  createGroup: (slotId) =>
    axios.post(`${API_BASE_URL}/bookings/group`, { slotId }),
  getMyBookings: () => axios.get(`${API_BASE_URL}/bookings/my`),
  getBySlot: (slotId) => axios.get(`${API_BASE_URL}/bookings/slot/${slotId}`),
  getGroupPrebookings: (slotId) =>
    axios.get(`${API_BASE_URL}/bookings/group/${slotId}`),
  confirm: (id) => axios.patch(`${API_BASE_URL}/bookings/${id}/confirm`),
  cancel: (id, reason) =>
    axios.delete(`${API_BASE_URL}/bookings/${id}`, { data: { reason } }),
  getAllPending: (status) =>
    axios.get(`${API_BASE_URL}/bookings/pending`, { params: { status } }),
  cancelGroupPrebooking: (slotId) =>
    axios.delete(`${API_BASE_URL}/bookings/group/${slotId}`),
  getLowGroupParticipation: () =>
    axios.get(`${API_BASE_URL}/bookings/low-participation`),
};

export const adminAPI = {
  validateGroup: (slotId) =>
    axios.post(`${API_BASE_URL}/admin/validate-group`, { slotId }),
  releaseSlots: (slotIds) =>
    axios.post(`${API_BASE_URL}/admin/release-slots`, { slotIds }),
  blockSlot: (slotId) =>
    axios.post(`${API_BASE_URL}/admin/block-slot`, { slotId }),
  setAvailability: (date, isAvailable) =>
    axios.post(`${API_BASE_URL}/admin/availability`, { date, isAvailable }),
  getAvailability: (startDate, endDate) =>
    axios.get(`${API_BASE_URL}/admin/availability`, {
      params: { startDate, endDate },
    }),
  getHistory: (entity, limit) =>
    axios.get(`${API_BASE_URL}/admin/history`, { params: { entity, limit } }),
  getDashboard: () => axios.get(`${API_BASE_URL}/admin/dashboard`),
};

export const usersAPI = {
  getMe: () => axios.get(`${API_BASE_URL}/users/me`),
  getAll: () => axios.get(`${API_BASE_URL}/users`),
  getById: (id) => axios.get(`${API_BASE_URL}/users/${id}`),
  update: (id, data) => axios.put(`${API_BASE_URL}/users/${id}`, data),
  toggleStatus: (id) => axios.post(`${API_BASE_URL}/users/${id}/toggle-status`),
};
