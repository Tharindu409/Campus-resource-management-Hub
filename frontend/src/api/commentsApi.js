import { apiRequest } from './httpClient'

export const commentsApi = {
  getTicketComments(ticketId) {
    return apiRequest(`/api/tickets/${ticketId}/comments`)
  },

  addComment(ticketId, content, actor = null) {
    const payload = {
      content,
    }

    if (actor && typeof actor === 'object') {
      payload.actorId = actor.actorId || ''
      payload.actorName = actor.actorName || ''
      payload.actorRole = actor.actorRole || ''
    }

    return apiRequest(`/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },

  updateComment(commentId, content, actor = null) {
    const payload = {
      content,
    }

    if (actor && typeof actor === 'object') {
      payload.actorId = actor.actorId || ''
      payload.actorName = actor.actorName || ''
      payload.actorRole = actor.actorRole || ''
    }

    return apiRequest(`/api/tickets/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },

  deleteComment(commentId) {
    return apiRequest(`/api/tickets/comments/${commentId}`, {
      method: 'DELETE',
    })
  },
}
