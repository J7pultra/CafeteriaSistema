import { describe, it, expect, beforeEach } from 'vitest'
import api from '../services/api'

describe('Axios API Client Interceptors', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('attaches Bearer token in request header if stored in localStorage', async () => {
    localStorage.setItem('coffee_access_token', 'jwt-test-token-123')

    // Inspect request interceptor behavior
    const config = await (api.interceptors.request as unknown as {
      handlers: Array<{ fulfilled: (cfg: { headers: Record<string, string> }) => { headers: Record<string, string> } }>
    }).handlers[0].fulfilled({ headers: {} })

    expect(config.headers.Authorization).toBe('Bearer jwt-test-token-123')
  })

  it('leaves headers unchanged if no token is stored', async () => {
    const config = await (api.interceptors.request as unknown as {
      handlers: Array<{ fulfilled: (cfg: { headers: Record<string, string> }) => { headers: Record<string, string> } }>
    }).handlers[0].fulfilled({ headers: {} })

    expect(config.headers.Authorization).toBeUndefined()
  })
})
