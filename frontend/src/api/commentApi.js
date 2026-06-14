import api from './axios';

export const commentApi = {
  getComments: (ticketId) =>
    api.get(`/tickets/${ticketId}/comments`),
  addComment: (ticketId, content) =>
    api.post(`/tickets/${ticketId}/comments`, { content }),
  updateComment: (commentId, content) =>
    api.put(`/tickets/comments/${commentId}`, { content }),
  deleteComment: (commentId) =>
    api.delete(`/tickets/comments/${commentId}`),
};