// Default to the backend server port defined in backend application.properties
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091'

export class ApiError extends Error {
  constructor(message, response) {
    super(message)
    this.name = 'ApiError'
    this.response = response
  }
}

function buildUrl(path, query) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${API_BASE_URL}${normalizedPath}`)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
}

async function parseBody(response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', query, body, headers = {} } = options
  const token = localStorage.getItem('token')
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      ...authHeaders,
      ...headers,
    },
    body,
  })

  const data = await parseBody(response)

  if (!response.ok) {
    const message =
      (typeof data === 'string' && data) || data?.message || data?.error || `Request failed with status ${response.status}`

    throw new ApiError(message, {
      status: response.status,
      data,
    })
  }

  return data
}

export { API_BASE_URL }
