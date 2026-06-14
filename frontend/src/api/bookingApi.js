import api from './axios';

// ─── Bookings ────────────────────────────────────────────
export const bookingApi = {
  // 1. POST /api/bookings — Create booking
  create: (data) => api.post('/bookings', data),

  // 2. GET /api/bookings/my?userId=x — My bookings
  getMyBookings: (userId) => api.get(`/bookings/my?userId=${userId}`),

  // 3. GET /api/bookings — All bookings (admin)
  getAll: () => api.get('/bookings'),

  // 4. PUT /api/bookings/{id}/approve
  approve: (id) => api.put(`/bookings/${id}/approve`, {}),

  // 5. PUT /api/bookings/{id}/reject
  reject: (id, reason) => api.put(`/bookings/${id}/reject`, { reason: reason }),

  // 6. PUT /api/bookings/{id}/cancel
  cancel: (id, userId, role) => api.put(`/bookings/${id}/cancel`, { userId: userId, role: role }),

  // 6b. PUT /api/bookings/{id}/cancel-delete
  cancelAndDelete: (id, userId, role) => api.put(`/bookings/${id}/cancel-delete`, { userId: userId, role: role }),

  // 7. GET /api/bookings/resource/{resourceId}
  getByResource: (resourceId) => api.get(`/bookings/resource/${resourceId}`),

  // 8. DELETE /api/bookings/{id}
  deleteById: (id) => api.delete(`/bookings/${id}`),

  // Bonus: GET /api/bookings/stats
  getStats: () => api.get('/bookings/stats'),
};
