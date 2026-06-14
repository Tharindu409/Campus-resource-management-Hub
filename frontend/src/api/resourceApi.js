import api from './axios'

export const resourceApi = {
  getAll(params = {}) {
    return api.get('/resources', { params })
  },

  getById(id) {
    return api.get(`/resources/${id}`)
  },

  create(payload) {
    return api.post('/resources', payload)
  },

  update(id, payload) {
    return api.put(`/resources/${id}`, payload)
  },

  deleteById(id) {
    return api.delete(`/resources/${id}`)
  },
}