import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Coffee,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  Bot,
  User as UserIcon,
  RotateCcw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import chatService, { type ChatMessage } from '../services/chatService'
import useSommelierActionDispatcher from '../hooks/useSommelierActionDispatcher'

export const ChatPage: React.FC = () => {
  const { user } = useAuth()
  const { cart, addToCart } = useCart()
  const { dispatchActions } = useSommelierActionDispatcher()

  const userRole = user?.roles?.[0] || 'ROLE_CUSTOMER'
  const isAdmin = userRole === 'ROLE_ADMIN'
  const isBarista = userRole === 'ROLE_BARISTA'

  const roleConfig = isAdmin
    ? {
      title: 'Asistente de Operaciones',
      subtitle: 'Supervisión de catálogo, existencias y pedidos de cafetería en tiempo real',
      welcome: `Hola ${user?.username || 'Administrador'}. Soy el asistente de operaciones de Sistema Café. Puedo reportarte el estado de inventario, consultar productos registrados o revisar pedidos. ¿En qué te colaboro hoy?`,
      suggestions: [
        '¿Cuántos productos tienen registrados?',
        'Reporte de productos con stock bajo',
        'Resumen de ventas y pedidos',
        'Consultar disponibilidad de cafetería',
      ],
    }
    : isBarista
      ? {
        title: 'Asistente de Barra',
        subtitle: 'Consulta de disponibilidad de productos y comandas en tiempo real',
        welcome: `Hola ${user?.username || 'Barista'}. Estoy a tu disposición para consultar pedidos en preparación o disponibilidad de insumos en la cafetería. ¿Qué consulta deseas realizar?`,
        suggestions: [
          '¿Qué productos hay en el catálogo?',
          'Pedidos en preparación',
          'Consultar stock de bebidas',
          'Ver pedidos pendientes',
        ],
      }
      : {
        title: 'Soporte y Atención',
        subtitle: 'Consulta de menú, recomendaciones y estado de tus pedidos',
        welcome: `Hola ${user?.username || ''}. Bienvenido a Sistema Café. Puedo ayudarte con información sobre nuestro menú de bebidas calientes, frías y repostería artesanal.`,
        suggestions: [
          '¿Qué bebidas calientes tienen disponibles?',
          'Opciones de repostería artesanal',
          'Consultar el estado de mi pedido',
          'Beneficios de lealtad',
        ],
      }

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: roleConfig.welcome,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      riskLevel: 'SAFE',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText ?? input).trim()
    if (!textToSend || loading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const currentCart = cart.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: Number(item.product.unitPrice ?? item.product.price ?? 0),
      }))
      const response = await chatService.sendMessage(textToSend, currentCart)

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolUsed: response.toolUsed,
        toolData: response.toolData,
        ui_actions: response.ui_actions,
        riskLevel: response.riskLevel,
        blockedByShield: response.blockedByShield,
      }

      setMessages((prev) => [...prev, assistantMsg])

      // 1. Direct Global Cart Synchronization via tool_results (Single Atomic Addition)
      if (response.tool_results && response.tool_results.length > 0) {
        for (const tr of response.tool_results) {
          if (tr.tool === 'add_to_cart' && tr.success && tr.payload) {
            const qty = Number(tr.payload.quantity) || 1
            addToCart(tr.payload, qty)
          }
        }
      }

      // 2. Co-Navigation & Visual Actions
      if (response.ui_actions && response.ui_actions.length > 0) {
        dispatchActions(response.ui_actions)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Lo siento, ocurrió un error de comunicación con el motor de IA. Por favor intenta nuevamente.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          riskLevel: 'SAFE',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: '¡Conversación reiniciada! ¿Qué café te gustaría explorar o preparar hoy?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        riskLevel: 'SAFE',
      },
    ])
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        maxHeight: '880px',
      }}
    >
      {/* Header */}
      <div
        className="card"
        style={{
          marginBottom: '16px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 163, 115, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--accent-gold)',
            }}
          >
            <Bot size={22} color="var(--accent-gold)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {roleConfig.title}
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {roleConfig.subtitle}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            className="badge badge-green"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
          >
            <span className="pulse-dot-green" />
            En Línea
          </span>
          <button
            onClick={handleReset}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Reiniciar chat"
          >
            <RotateCcw size={14} />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Suggestion Pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '10px',
          marginBottom: '10px',
        }}
      >
        {roleConfig.suggestions.map((sug, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sug)}
            disabled={loading}
            className={`animate-stagger stagger-${Math.min(idx + 1, 12)}`}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(212, 163, 115, 0.25)',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-gold)'
              e.currentTarget.style.color = 'var(--accent-gold)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212, 163, 115, 0.25)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div
        className="card"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          backgroundColor: '#120d0a',
          border: '1px solid var(--border-color)',
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user'
          const isBlocked = msg.blockedByShield

          return (
            <div
              key={msg.id}
              className={isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              {/* Sender label */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '4px',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                }}
              >
                {isUser ? (
                  <>
                    <span>{user?.username || 'Tú'}</span>
                    <UserIcon size={12} />
                  </>
                ) : (
                  <>
                    <Coffee size={12} color="var(--accent-gold)" />
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
                      Asistente
                    </span>
                  </>
                )}
                <span>• {msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  backgroundColor: isUser
                    ? 'var(--accent-gold)'
                    : isBlocked
                      ? 'rgba(230, 57, 70, 0.15)'
                      : 'var(--bg-card)',
                  color: isUser ? '#1a120c' : 'var(--text-primary)',
                  fontWeight: isUser ? 600 : 400,
                  fontSize: '0.92rem',
                  lineHeight: '1.5',
                  border: isBlocked
                    ? '1px solid var(--accent-red)'
                    : isUser
                      ? 'none'
                      : '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  whiteSpace: 'pre-line',
                }}
              >
                {msg.text.split('\n').map((line, lIdx, arr) => {
                  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
                  return (
                    <React.Fragment key={lIdx}>
                      {parts.map((p, pIdx) => {
                        if (p.startsWith('**') && p.endsWith('**')) {
                          return <strong key={pIdx}>{p.slice(2, -2)}</strong>
                        }
                        if (p.startsWith('`') && p.endsWith('`')) {
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

              {/* Tool Execution & Risk Badges */}
              {!isUser && (msg.toolUsed || msg.riskLevel) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '6px',
                    flexWrap: 'wrap',
                  }}
                >
                  {msg.toolUsed && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(212, 163, 115, 0.2)',
                        color: 'var(--accent-gold)',
                        border: '1px solid rgba(212, 163, 115, 0.3)',
                      }}
                    >
                      <Wrench size={11} />
                      Tool: <strong>{msg.toolUsed}</strong>
                    </span>
                  )}

                  {isBlocked ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(230, 57, 70, 0.2)',
                        color: 'var(--accent-red)',
                        border: '1px solid var(--accent-red)',
                        fontWeight: 700,
                      }}
                    >
                      <ShieldAlert size={12} />
                      Ataque Bloqueado ({msg.riskLevel})
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(42, 157, 143, 0.15)',
                        color: 'var(--accent-green)',
                      }}
                    >
                      <ShieldCheck size={11} />
                      Safe Guard
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div
            className="chat-bubble-assistant"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              padding: '10px',
            }}
          >
            <Coffee size={16} color="var(--accent-gold)" className="spin" />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
            <span>Consultando información...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        style={{
          marginTop: '14px',
          display: 'flex',
          gap: '10px',
        }}
      >
        <input
          type="text"
          className="form-input"
          style={{
            flex: 1,
            padding: '14px 18px',
            fontSize: '0.95rem',
            backgroundColor: 'var(--bg-card)',
          }}
          placeholder="Escribe tu consulta (ej. 'cuántos productos hay registrados')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          data-testid="chat-input"
        />

        <button
          type="submit"
          className="btn btn-primary"
          style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          disabled={loading || !input.trim()}
          data-testid="chat-send-btn"
        >
          <Send size={18} />
          <span>Enviar</span>
        </button>
      </form>
    </div>
  )
}

export default ChatPage
