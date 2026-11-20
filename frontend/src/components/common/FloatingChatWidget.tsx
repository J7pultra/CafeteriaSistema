import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Send,
  Sparkles,
  Bot,
  RotateCcw,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import chatService, { type ChatMessage } from '../../services/chatService'
import useSommelierActionDispatcher from '../../hooks/useSommelierActionDispatcher'

export const FloatingChatWidget: React.FC = () => {
  const { user } = useAuth()
  const { cart, addToCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const { dispatchActions, isExecuting, statusMessage } = useSommelierActionDispatcher()

  const userRole = user?.roles?.[0] || 'ROLE_CUSTOMER'
  const isAdmin = userRole === 'ROLE_ADMIN'
  const isBarista = userRole === 'ROLE_BARISTA'

  const roleConfig = isAdmin
    ? {
        title: 'Asistente de Operaciones & Ventas',
        badge: 'Modo Gerencia',
        icon: '📊',
        welcome:
          '¡Hola Administrador! 📊 Soy tu asistente analítico de Sistema Café. Puedo ayudarte con métricas de ventas en tiempo real, alertas de stock crítico y recomendaciones de reabastecimiento.',
        chips: [
          'Reporte de stock crítico',
          'Resumen de ventas',
          'Clientes más fieles',
          'Rotación de lotes',
        ],
      }
    : isBarista
    ? {
        title: 'Copiloto Técnico de Barra',
        badge: 'Modo Estación',
        icon: '⏱️',
        welcome:
          '¡Hola Barista! ☕ Estoy a tu disposición en la barra para guiarte en recetas de extracción (ratios, clicks de molienda, agua a 93°C), calibración de espresso y órdenes en preparación.',
        chips: [
          'Receta V60 15g',
          'Calibración de Espresso 1:2',
          'Pedidos en preparación',
          'Extracción Chemex',
        ],
      }
    : {
        title: 'Sommelier & Asistente de Compra',
        badge: 'Asesor de Café',
        icon: '☕',
        welcome:
          '¡Hola! ☕ Bienvenido a nuestra tostaduría de especialidad. Cuéntame qué perfil de sabor prefieres (frutal, floral, achocolatado) y te recomendaré el café ideal para tu método favorito.',
        chips: [
          'Recomiéndame un café',
          'Café con notas de chocolate',
          'Cómo preparo en V60',
          'Beneficios del café en grano',
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

  // Actualizar mensaje de bienvenida si cambia el rol
  useEffect(() => {
    setMessages([
      {
        id: `float-welcome-${userRole}`,
        sender: 'assistant',
        text: roleConfig.welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        riskLevel: 'SAFE',
      },
    ])
  }, [userRole])

  useEffect(() => {
    if (isOpen && typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isOpen, messages, loading])

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

      // 2. Execute Sommelier AI Real-Time Visual Co-Navigation Commands
      if (response.ui_actions && response.ui_actions.length > 0) {
        dispatchActions(response.ui_actions)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Error al conectar con el servidor de IA.',
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
        id: `float-welcome-${Date.now()}`,
        sender: 'assistant',
        text: roleConfig.welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        riskLevel: 'SAFE',
      },
    ])
  }

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {/* Botón flotante estilizado */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderRadius: '30px',
            backgroundColor: 'var(--accent-gold)',
            color: '#140e0a',
            border: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.92rem',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          data-testid="floating-chat-trigger"
        >
          <Bot size={20} />
          <span>{roleConfig.title.split(' ')[0]} AI</span>
          <Sparkles size={16} />
        </button>
      )}

      {/* Ventana de chat adaptada al rol */}
      {isOpen && (
        <div
          style={{
            width: '390px',
            height: '540px',
            backgroundColor: '#140e0a',
            borderRadius: '16px',
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
              <span style={{ fontSize: '1.2rem' }}>{roleConfig.icon}</span>
              <div>
                <div style={{ color: 'var(--accent-gold)', fontSize: '0.88rem', fontWeight: 700 }}>
                  {roleConfig.title}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {roleConfig.badge} • Gemini 3 AI
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

          {/* Action Dispatcher Status Banner */}
          {isExecuting && (
            <div
              style={{
                backgroundColor: 'rgba(217, 119, 6, 0.15)',
                borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.75rem',
                color: 'var(--accent-gold)',
                fontWeight: 600,
              }}
            >
              <Sparkles size={13} />
              <span>{statusMessage || 'Co-Navegando y actuando en la interfaz...'}</span>
            </div>
          )}

          {/* Area de Mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user'
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                    <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      backgroundColor: isUser ? 'var(--accent-gold)' : 'var(--bg-card)',
                      color: isUser ? '#140e0a' : 'var(--text-primary)',
                      fontSize: '0.84rem',
                      lineHeight: '1.45',
                      border: isUser ? 'none' : '1px solid var(--border-color)',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {m.text.split('\n').map((line, lIdx, arr) => {
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
                  {m.toolUsed && (
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--accent-gold)',
                        marginTop: '3px',
                      }}
                    >
                      ⚡ {m.toolUsed}
                    </div>
                  )}
                </div>
              )
            })}
            {loading && (
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', padding: '6px' }}>
                Preparando respuesta sensorial...
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
                  ? 'Pide una receta o calibración...'
                  : 'Pide una recomendación de café...'
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
