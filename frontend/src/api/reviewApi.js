import api from './axios';

export const reviewApi = {
  getReviews: () => api.get('/reviews'),
  addReview: (payload) => api.post('/reviews', payload),
  updateReview: (id, payload) => api.put(`/reviews/${id}`, payload),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};
