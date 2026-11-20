import api from './api'
import type { Order, OrderCreateRequest, GuestCheckoutRequest, OrderStatus } from '../types'
import type { PageResponse } from './productService'

export const orderService = {
  async getOrders(page = 0, size = 20): Promise<PageResponse<Order>> {
    const response = await api.get<PageResponse<Order>>('/orders', {
      params: { page, size },
    })
    return response.data
  },

  async getOrderById(id: number): Promise<Order> {
    const response = await api.get<Order>(`/orders/${id}`)
    return response.data
  },

  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const response = await api.get<Order>(`/orders/number/${orderNumber}`)
    return response.data
  },

  async getOrdersByCustomer(customerId: number, page = 0, size = 20): Promise<PageResponse<Order>> {
    const response = await api.get<PageResponse<Order>>(`/orders/customer/${customerId}`, {
      params: { page, size },
    })
    return response.data
  },

  async createOrder(orderRequest: OrderCreateRequest): Promise<Order> {
    const response = await api.post<Order>('/orders', orderRequest)
    return response.data
  },

  async guestCheckout(request: GuestCheckoutRequest): Promise<Order> {
    const response = await api.post<Order>('/orders/checkout', request)
    return response.data
  },

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
    const response = await api.patch<Order>(`/orders/${id}/status`, { status })
    return response.data
  },

  async cancelOrder(id: number): Promise<Order> {
    const response = await api.delete<Order>(`/orders/${id}`)
    return response.data
  },
}

export default orderService
