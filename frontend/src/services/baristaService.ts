import api from './api'

export interface StaffUser {
  id: number
  username: string
  email: string
  enabled: boolean
  roles: string[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateBaristaRequest {
  username: string
  email: string
  password: string
}

export const baristaService = {
  async listBaristas(): Promise<StaffUser[]> {
    const response = await api.get<StaffUser[]>('/users/baristas')
    return response.data
  },

  async createBarista(data: CreateBaristaRequest): Promise<StaffUser> {
    const response = await api.post<StaffUser>('/users/baristas', data)
    return response.data
  },

  async updateBaristaStatus(id: number, enabled: boolean): Promise<StaffUser> {
    const response = await api.patch<StaffUser>(`/users/${id}/status`, null, {
      params: { enabled },
    })
    return response.data
  },
}

export default baristaService
