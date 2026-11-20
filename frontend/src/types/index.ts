// Auth Types
export interface User {
  id: number
  username: string
  email: string
  roles: string[]
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  roles?: string[]
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  username: string
  roles: string[]
}

// Product Types - Resilient to backend English and Spanish enums
export type ProductCategory =
  | 'SPECIALTY_BEANS'
  | 'ESPRESSO_SINGLE_ORIGIN'
  | 'COLD_BREW_BLEND'
  | 'DECAF_ORGANIC'
  | 'BARISTA_EQUIPMENT'
  | 'ESPECIALIDAD'
  | 'ORIGEN_UNICO'
  | 'MEZCLA'
  | 'DESCAFEINADO'
  | 'ACCESORIOS'

export type RoastLevel =
  | 'LIGHT'
  | 'MEDIUM_LIGHT'
  | 'MEDIUM'
  | 'MEDIUM_DARK'
  | 'DARK'
  | 'CLARO'
  | 'MEDIO_CLARO'
  | 'MEDIO'
  | 'MEDIO_OSCURO'
  | 'OSCURO'

export interface Product {
  id: number
  sku: string
  name: string
  description?: string
  origin?: string
  altitudeMasl?: number
  processMethod?: string
  roastLevel: RoastLevel
  flavorNotes?: string
  imageUrl?: string
  category: ProductCategory
  price?: number
  unitPrice?: number
  stockQuantity: number
  active: boolean
  lowStock?: boolean
}

export interface ProductRequest {
  sku: string
  name: string
  description?: string
  origin?: string
  roastLevel: RoastLevel
  imageUrl?: string
  category: ProductCategory
  unitPrice?: number
  price?: number
  stockQuantity: number
  active: boolean
}

// Customer Types
export type CustomerTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

export interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  tier: CustomerTier
  loyaltyPoints: number
  active: boolean
  createdAt?: string
}

export interface CustomerRequest {
  firstName: string
  lastName: string
  email: string
  phone?: string
  tier?: CustomerTier
}

// Order Types
export type OrderStatus =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'LISTO'
  | 'ENTREGADO'
  | 'CANCELADO'

export type PaymentMethod =
  | 'EFECTIVO'
  | 'TARJETA_CREDITO'
  | 'TARJETA_DEBITO'
  | 'TRANSFERENCIA'
  | 'PUNTOS_LEALTAD'

export interface OrderItem {
  id?: number
  productId: number
  productSku: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Order {
  id: number
  orderNumber: string
  customerId: number
  customerName?: string
  customerTier?: CustomerTier
  items: OrderItem[]
  status: OrderStatus
  paymentMethod: PaymentMethod
  subtotal: number
  discount: number
  tax: number
  total: number
  notes?: string
  createdAt: string
}

export interface OrderItemRequest {
  productId: number
  quantity: number
}

export interface OrderCreateRequest {
  customerId: number
  items: OrderItemRequest[]
  paymentMethod: PaymentMethod
  notes?: string
}

export interface GuestCheckoutRequest {
  fullName: string
  email: string
  phone?: string
  paymentMethod: PaymentMethod
  notes?: string
  items: OrderItemRequest[]
}

// Cart & Simulated Billing Types
export interface CartItem {
  product: Product
  quantity: number
}

export interface SimulatedInvoice {
  invoiceNumber: string
  date: string
  customerName: string
  customerEmail: string
  customerTier: CustomerTier
  items: Array<{
    name: string
    sku: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
  subtotal: number
  discountPercentage: number
  discountAmount: number
  taxAmount: number
  total: number
  pointsEarned: number
  paymentMethod: PaymentMethod
  notes?: string
}

// Dashboard Analytics Types
export interface DashboardMetrics {
  totalOrders: number
  totalRevenue: number
  activeOrders: number
  lowStockCount: number
  weeklyNewCustomers: number
  customersByTier: Record<CustomerTier, number>
  salesByRoastLevel: Record<string, number>
}

// Coffee Skills Types
export interface SkillParameter {
  type: string
  description: string
  required: boolean
  defaultValue?: unknown
}

export interface CoffeeSkillDescriptor {
  id: string
  name: string
  description: string
  version: string
  parameters: Record<string, SkillParameter>
}

export interface SkillExecutionResponse {
  skillId: string
  executionTimeMs: number
  success: boolean
  result: Record<string, unknown>
  error?: string
}

// Chatbot AI Message Types
export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  toolUsed?: string
  toolData?: Record<string, unknown>
  riskLevel?: string
  blockedByShield?: boolean
}
