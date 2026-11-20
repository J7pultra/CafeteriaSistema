import api from './api'
import type { Customer, CustomerRequest } from '../types'
import type { PageResponse } from './productService'

export const customerService = {
  async getCustomers(page = 0, size = 20): Promise<PageResponse<Customer>> {
    const response = await api.get<PageResponse<Customer>>('/customers', {
      params: { page, size },
    })
    return response.data
  },

  async getCustomerById(id: number): Promise<Customer> {
    const response = await api.get<Customer>(`/customers/${id}`)
    return response.data
  },

  async getCustomerByEmail(email: string): Promise<Customer> {
    const response = await api.get<Customer>(`/customers/email/${encodeURIComponent(email)}`)
    return response.data
  },

  async createCustomer(customer: CustomerRequest): Promise<Customer> {
    const response = await api.post<Customer>('/customers', customer)
    return response.data
  },
}

export default customerService
