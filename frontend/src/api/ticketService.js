import { attachmentsApi, commentsApi, ticketsApi } from './index'

const USER_ID_KEYS = ['currentUser', 'userId', 'username']
const ROLE_KEYS = ['currentUserRole', 'userRole', 'role']

function readFirstValue(keys, fallback = '') {
  for (const key of keys) {
    const value = localStorage.getItem(key)
    if (value && value.trim()) {
      return value.trim()
    }
  }
  return fallback
}

export function getCurrentUserId() {
  return readFirstValue(USER_ID_KEYS)
}

export function setCurrentUserId(userId) {
  const normalized = String(userId || '').trim()
  if (!normalized) {
    return false
  }

  USER_ID_KEYS.forEach((key) => localStorage.setItem(key, normalized))
  return true
}

export function getCurrentUserRole() {
  return readFirstValue(ROLE_KEYS, 'USER').toUpperCase()
}

export function setCurrentUserRole(role) {
  const normalized = String(role || '').trim().toUpperCase()
  if (!normalized) {
    return false
  }

  ROLE_KEYS.forEach((key) => localStorage.setItem(key, normalized))
  return true
}

export const ticketService = {
  createTicket: ticketsApi.createTicket,
  getTicketById: ticketsApi.getTicketById,
  getMyTickets: ticketsApi.getMyTickets,
  getAllTickets: ticketsApi.getAllTickets,
  assignTechnician: ticketsApi.assignTechnician,
  updateStatus: ticketsApi.updateStatus,
  deleteTicket: ticketsApi.deleteTicket,

  getTicketAttachments: attachmentsApi.getTicketAttachments,
  uploadAttachments: attachmentsApi.uploadAttachment,

  getTicketComments: commentsApi.getTicketComments,
  addComment: commentsApi.addComment,
  updateComment: commentsApi.updateComment,
  deleteComment: commentsApi.deleteComment,
}
