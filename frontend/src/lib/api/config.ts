import { createApiClient } from './client'

export const apiClient = createApiClient({
  baseUrl:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? 'http://127.0.0.1:8000' : window.location.origin),
})
