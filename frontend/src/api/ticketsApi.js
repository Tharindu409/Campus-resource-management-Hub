import { apiRequest } from './httpClient'

export const ticketsApi = {
  createTicket(payload) {
    return apiRequest('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  },

  getTicketById(id) {
    return apiRequest(`/api/tickets/${id}`)
  },

  getMyTickets(createdBy) {
    return apiRequest('/api/tickets/my', {
      query: { createdBy },
    })
  },

  getAllTickets() {
    return apiRequest('/api/tickets')
  },

  assignTechnician(id, technician, actorRole = 'STAFF') {
    return apiRequest(`/api/tickets/${id}/assign`, {
      method: 'PUT',
      query: { technician, actorRole },
    })
  },

  updateStatus(id, status, actorRole = 'USER', resolutionNotes = '', rejectionReason = '') {
    return apiRequest(`/api/tickets/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        actorRole,
        resolutionNotes,
        rejectionReason,
      }),
    })
  },

  deleteTicket(id, actorRole = 'USER') {
    return apiRequest(`/api/tickets/${id}`, {
      method: 'DELETE',
      query: { actorRole },
    })
  },
}
