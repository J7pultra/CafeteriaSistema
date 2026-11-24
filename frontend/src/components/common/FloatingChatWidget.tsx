import React, { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  X,
  Send,
  MessageSquare,
  RotateCcw,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import chatService, { type ChatMessage } from '../../services/chatService'
import useSommelierActionDispatcher from '../../hooks/useSommelierActionDispatcher'

export const FloatingChatWidget: React.FC = () => {
  const location = useLocation()
  const { user } = useAuth()
  const { cart, addToCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const { dispatchActions, isExecuting, statusMessage } = useSommelierActionDispatcher()

  const userRole = user?.roles?.[0] || 'ROLE_CUSTOMER'
  const isAdmin = userRole === 'ROLE_ADMIN'
  const isBarista = userRole === 'ROLE_BARISTA'

  const roleConfig = isAdmin
    ? {
        title: 'Asistente de Operaciones',
        badge: 'Administración',
        buttonLabel: 'Asistente',
        welcome:
          'Hola Administrador. Soy el asistente de operaciones de Sistema Café. Puedo ayudarte con consultas de inventario, métricas de ventas y estado de pedidos.',
        chips: [
          'Reporte de stock bajo',
          'Resumen de ventas',
          'Clientes registrados',
          'Productos en catálogo',
        ],
      }
    : isBarista
    ? {
        title: 'Asistente de Barra',
        badge: 'Estación de Barra',
        buttonLabel: 'Asistente',
        welcome:
          'Hola Barista. Estoy a tu disposición para ayudarte a consultar pedidos en preparación y disponibilidad de productos en el catálogo.',
        chips: [
          'Pedidos en preparación',
          'Productos disponibles',
          'Consultar stock de leche',
          'Ver pedidos pendientes',
        ],
      }
    : {
        title: 'Soporte y Consultas',
        badge: 'Atención al Cliente',
        buttonLabel: 'Soporte',
        welcome:
          'Hola. Bienvenido a Sistema Café. Puedo ayudarte a conocer nuestras bebidas calientes, frías y repostería artesanal.',
        chips: [
          'Ver bebidas calientes',
          'Opciones de repostería',
          'Consultar horarios',
          'Información de membresía',
        ],
      }

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'float-welcome',
      sender: 'assistant',
      text: roleConfig.welcome,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      riskLevel: 'SAFE',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([
      {
        id: 'float-welcome',
        sender: 'assistant',
        text: roleConfig.welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        riskLevel: 'SAFE',
      },
    ])
  }, [userRole])

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, loading, isOpen])

  const handleSend = async (manualText?: string) => {
    const textToSend = (manualText ?? input).trim()
    if (!textToSend || loading) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!manualText) setInput('')
    setLoading(true)

    try {
      const cartPayload = cart.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: Number(item.product.unitPrice ?? item.product.price ?? 0),
      }))

      const response = await chatService.sendMessage(textToSend, cartPayload)

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolUsed: response.toolUsed,
        toolData: response.toolData,
      }

      setMessages((prev) => [...prev, assistantMsg])

      if (response.tool_results && response.tool_results.length > 0) {
        for (const tr of response.tool_results) {
          if (tr.tool === 'add_to_cart' && tr.success && tr.payload) {
            const qty = Number(tr.payload.quantity) || 1
            addToCart(tr.payload as any, qty)
          }
        }
      }

      if (response.ui_actions && response.ui_actions.length > 0) {
        await dispatchActions(response.ui_actions)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'No se pudo contactar el servicio de asistencia. Intenta nuevamente.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setMessages([
      {
        id: 'float-welcome-reset',
        sender: 'assistant',
        text: roleConfig.welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        riskLevel: 'SAFE',
      },
    ])
  }

  if (location.pathname === '/chat') {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      {/* Botón flotante estilizado */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chat-trigger-pulse"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '24px',
            backgroundColor: 'var(--accent-gold)',
            color: '#140e0a',
            border: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.88rem',
            transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
          data-testid="floating-chat-trigger"
        >
          <MessageSquare size={17} />
          <span>{roleConfig.buttonLabel}</span>
        </button>
      )}

      {/* Ventana de chat adaptada al rol */}
      {isOpen && (
        <div
          className="chat-window-pop"
          style={{
            width: '380px',
            height: '520px',
            backgroundColor: '#140e0a',
            borderRadius: '12px',
            border: '1px solid rgba(212, 163, 115, 0.35)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#1d1510',
              borderBottom: '1px solid rgba(212, 163, 115, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} color="var(--accent-gold)" />
              <div>
                <div style={{ color: 'var(--accent-gold)', fontSize: '0.88rem', fontWeight: 600 }}>
                  {roleConfig.title}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {roleConfig.badge}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={handleReset}
                title="Reiniciar conversación"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Cerrar"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Banner de acción estructurada en progreso */}
          {isExecuting && (
            <div
              style={{
                backgroundColor: 'rgba(212, 163, 115, 0.2)',
                color: 'var(--accent-gold)',
                padding: '6px 12px',
                fontSize: '0.74rem',
                borderBottom: '1px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{statusMessage || 'Ejecutando acción...'}</span>
            </div>
          )}

          {/* Lista de mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: '#120d09',
            }}
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user'
              if (location.pathname === '/chat') {
    return null
  }

  return (
                <div
                  key={m.id}
                  className={isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    backgroundColor: isUser ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)',
                    color: isUser ? '#140e0a' : 'var(--text-primary)',
                    borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    padding: '8px 12px',
                    fontSize: '0.84rem',
                    lineHeight: '1.4',
                    border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {m.text.split('\n').map((line, lIdx, arr) => {
                      const parts = line.split(/(`[^`]+`)/g)
                      if (location.pathname === '/chat') {
    return null
  }

  return (
                        <React.Fragment key={lIdx}>
                          {parts.map((p, pIdx) => {
                            if (p.startsWith('`') && p.endsWith('`')) {
                              if (location.pathname === '/chat') {
    return null
  }

  return (
                                <code
                                  key={pIdx}
                                  style={{
                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                    padding: '1px 4px',
                                    borderRadius: '3px',
                                  }}
                                >
                                  {p.slice(1, -1)}
                                </code>
                              )
                            }
                            return p
                          })}
                          {lIdx < arr.length - 1 && <br />}
                        </React.Fragment>
                      )
                    })}
                  </div>
                  {m.toolUsed && (
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--accent-gold)',
                        marginTop: '3px',
                      }}
                    >
                      Herramienta: {m.toolUsed}
                    </div>
                  )}
                </div>
              )
            })}
            {loading && (
              <div
                className="chat-bubble-assistant"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: 'var(--accent-gold)',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: '12px',
                  alignSelf: 'flex-start',
                }}
              >
                <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
                <span>Consultando sistema...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chips de sugerencias contextuales según el rol */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              padding: '8px 12px',
              backgroundColor: '#100b08',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {roleConfig.chips.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                style={{
                  fontSize: '0.7rem',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(212, 163, 115, 0.25)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(212, 163, 115, 0.2)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Caja de entrada */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            style={{
              padding: '10px 12px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              gap: '8px',
              backgroundColor: '#17100b',
            }}
          >
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
              placeholder={
                isAdmin
                  ? 'Consulta métricas o inventario...'
                  : isBarista
                  ? 'Consulta pedidos o productos...'
                  : 'Consulta el menú o tus pedidos...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ padding: '8px 12px' }}
              disabled={loading || !input.trim()}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default FloatingChatWidget
