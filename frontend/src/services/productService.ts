import api from './api'
import type { Product, ProductRequest } from '../types'

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export const productService = {
  async getProducts(page = 0, size = 20): Promise<PageResponse<Product>> {
    const response = await api.get<PageResponse<Product>>('/products', {
      params: { page, size },
    })
    return response.data
  },

  async getProductById(id: number): Promise<Product> {
    const response = await api.get<Product>(`/products/${id}`)
    return response.data
  },

  async getProductBySku(sku: string): Promise<Product> {
    const response = await api.get<Product>(`/products/sku/${sku}`)
    return response.data
  },

  async getLowStockProducts(threshold = 10): Promise<Product[]> {
    const response = await api.get<Product[]>('/products/low-stock', {
      params: { threshold },
    })
    return response.data
  },

  async createProduct(product: ProductRequest): Promise<Product> {
    const response = await api.post<Product>('/products', product)
    return response.data
  },

  async updateStock(id: number, quantityToAdd: number): Promise<Product> {
    const response = await api.patch<Product>(`/products/${id}/stock`, {
      quantity: quantityToAdd,
      operation: 'ADD',
    })
    return response.data
  },

  async deleteProduct(id: number): Promise<void> {
    await api.delete(`/products/${id}`)
  },
}

export default productService
