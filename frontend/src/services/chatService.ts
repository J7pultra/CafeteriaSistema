import axios from 'axios'

export interface UIAction {
  type: 'NAVIGATE' | 'TYPE_AND_SEARCH' | 'HIGHLIGHT_ELEMENT' | 'ADD_TO_CART_VISUAL' | 'OPEN_CART_DRAWER' | 'CLOSE_CART_DRAWER'
  route?: string
  targetId?: string
  text?: string
  animation?: string
  badgeText?: string
  scrollIntoView?: boolean
  durationMs?: number
  delayMs?: number
  product?: Record<string, unknown>
}

export interface ToolResult {
  tool: string
  success: boolean
  payload?: Record<string, any>
  error?: string
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  toolUsed?: string
  toolData?: Record<string, unknown>
  tool_results?: ToolResult[]
  ui_actions?: UIAction[]
  riskLevel?: 'SAFE' | 'LOW' | 'SUSPICIOUS' | 'HIGH' | 'CRITICAL'
  blockedByShield?: boolean
}

export interface CartItemPayload {
  id: number
  name: string
  quantity: number
  price: number
}

export interface ChatResponse {
  reply: string
  tool_results?: ToolResult[]
  ui_actions?: UIAction[]
  toolUsed?: string
  toolData?: Record<string, unknown>
  riskLevel: 'SAFE' | 'LOW' | 'SUSPICIOUS' | 'HIGH' | 'CRITICAL'
  riskScore: number
  blockedByShield: boolean
  auditNotes: string[]
}

export const chatService = {
  async sendMessage(message: string, currentCart: CartItemPayload[] = []): Promise<ChatResponse> {
    const token = localStorage.getItem('coffee_access_token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Zero-Trust: Frontend sends { message, current_cart }. Identity and role are derived strictly from JWT.
    const payload = {
      message,
      current_cart: currentCart,
    }

    try {
      // Intentar vía proxy configurado en Nginx / Vite (/api/chat)
      const response = await axios.post<ChatResponse>('/api/chat', payload, {
        headers,
        timeout: 25000,
      })
      return response.data
    } catch {
      try {
        // Fallback directo al puerto 8000 si el proxy local del dev server no estuviese activo
        const direct = await axios.post<ChatResponse>('http://localhost:8000/api/chat', payload, {
          headers,
          timeout: 25000,
        })
        return direct.data
      } catch {
        return {
          reply:
            'Disculpa, no pude establecer conexión con el asistente de café. Por favor verifica que el servicio esté en ejecución.',
          ui_actions: [],
          riskLevel: 'SAFE',
          riskScore: 0,
          blockedByShield: false,
          auditNotes: ['Error de conexión con el servicio de asistencia'],
        }
      }
    }
  },
}

export default chatService
