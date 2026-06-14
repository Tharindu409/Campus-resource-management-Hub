import { apiRequest } from './httpClient'

export const attachmentsApi = {
  getTicketAttachments(ticketId) {
    return apiRequest(`/api/tickets/${ticketId}/attachments`)
  },

  uploadAttachment(ticketId, file) {
    const formData = new FormData()
    formData.append('file', file)

    return apiRequest(`/api/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: formData,
    })
  },
}
