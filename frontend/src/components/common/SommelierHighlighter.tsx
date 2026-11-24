import React, { useEffect, useState, useRef } from 'react'
import { Navigation, X } from 'lucide-react'

interface HighlightDetail {
  targetId: string
  animation?: string
  badgeText?: string
  durationMs?: number
}

interface SpotlightState {
  x: number
  y: number
  width: number
  height: number
  visible: boolean
  badgeText?: string
}

interface CursorState {
  x: number
  y: number
  visible: boolean
  label: string
}

export const SommelierHighlighter: React.FC = () => {
  const [spotlight, setSpotlight] = useState<SpotlightState>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  })

  const [cursor, setCursor] = useState<CursorState>({
    x: -100,
    y: -100,
    visible: false,
    label: 'Asistente',
  })

  const [isTyping, setIsTyping] = useState(false)

  const targetElementRef = useRef<HTMLElement | null>(null)
  const timerRef = useRef<number | null>(null)
  const cursorTimerRef = useRef<number | null>(null)
  const isVisibleRef = useRef<boolean>(false)

  // 1. Loop 60 FPS con requestAnimationFrame activo ÚNICAMENTE mientras el spotlight esté visible
  useEffect(() => {
    let animId: number

    const tick = () => {
      if (isVisibleRef.current && targetElementRef.current) {
        const r = targetElementRef.current.getBoundingClientRect()
        // getBoundingClientRect da coordenadas exactas relativas al viewport fixed
        setSpotlight((prev) => ({
          ...prev,
          x: r.left - 4,
          y: r.top - 4,
          width: r.width + 8,
          height: r.height + 8,
          visible: true,
        }))
      }
      if (isVisibleRef.current) {
        animId = requestAnimationFrame(tick)
      }
    }

    if (spotlight.visible) {
      isVisibleRef.current = true
      animId = requestAnimationFrame(tick)
    } else {
      isVisibleRef.current = false
    }

    return () => {
      isVisibleRef.current = false
      if (animId) cancelAnimationFrame(animId)
    }
  }, [spotlight.visible])

  // 2. Manejo de eventos sommelier:highlight, sommelier:cursor-move y sommelier:typing-status
  useEffect(() => {
    const handleHighlight = (e: Event) => {
      const customEvent = e as CustomEvent<HighlightDetail>
      const detail = customEvent.detail
      if (!detail?.targetId) return

      const el =
        (document.querySelector(`[data-sommelier-id="${detail.targetId}"]`) as HTMLElement) ||
        (document.getElementById(detail.targetId) as HTMLElement)

      if (el) {
        targetElementRef.current = el
        const r = el.getBoundingClientRect()

        setSpotlight({
          x: r.left - 4,
          y: r.top - 4,
          width: r.width + 8,
          height: r.height + 8,
          visible: true,
          badgeText: detail.badgeText,
        })
        isVisibleRef.current = true

        if (timerRef.current) clearTimeout(timerRef.current)
        const duration = detail.durationMs || 4000
        timerRef.current = window.setTimeout(() => {
          setSpotlight((prev) => ({ ...prev, visible: false }))
          isVisibleRef.current = false
          targetElementRef.current = null
        }, duration)
      }
    }

    const handleCursorMove = (e: Event) => {
      const customEvent = e as CustomEvent<{ targetId: string; label?: string }>
      const targetId = customEvent.detail?.targetId
      if (!targetId) return

      const el =
        (document.querySelector(`[data-sommelier-id="${targetId}"]`) as HTMLElement) ||
        (document.getElementById(targetId) as HTMLElement)

      if (el) {
        const r = el.getBoundingClientRect()
        // Centrar cursor suavemente en el cuadrante del elemento objetivo
        const destX = r.left + Math.min(r.width * 0.35, 70)
        const destY = r.top + Math.min(r.height * 0.35, 30)

        setCursor({
          x: destX,
          y: destY,
          visible: true,
          label: customEvent.detail?.label || 'Asistente',
        })

        if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current)
        cursorTimerRef.current = window.setTimeout(() => {
          setCursor((prev) => ({ ...prev, visible: false }))
        }, 2800)
      }
    }

    const handleTypingStatus = (e: Event) => {
      const customEvent = e as CustomEvent<{ isTyping: boolean; text?: string }>
      setIsTyping(Boolean(customEvent.detail?.isTyping))
    }

    window.addEventListener('sommelier:highlight', handleHighlight)
    window.addEventListener('sommelier:cursor-move', handleCursorMove)
    window.addEventListener('sommelier:typing-status', handleTypingStatus)

    return () => {
      window.removeEventListener('sommelier:highlight', handleHighlight)
      window.removeEventListener('sommelier:cursor-move', handleCursorMove)
      window.removeEventListener('sommelier:typing-status', handleTypingStatus)
      if (timerRef.current) clearTimeout(timerRef.current)
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current)
    }
  }, [])

  return (
    <>
      {/* 1. Mini Cursor Virtual Flotante y Moderno tipo Figma/Linear ("Sommelier AI ✨") */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
          transition: 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease',
          pointerEvents: 'none',
          zIndex: 10001,
          opacity: cursor.visible ? 1 : 0,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          willChange: 'transform',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="#f59e0b"
          stroke="#1a120c"
          strokeWidth="1.5"
          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}
        >
          <polygon points="3 3 10 21 14 14 21 10 3 3" />
        </svg>
        <div
          style={{
            backgroundColor: 'rgba(26, 18, 12, 0.95)',
            border: '1px solid rgba(245, 158, 11, 0.85)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
            color: '#f59e0b',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          <Navigation size={10} />
          <span>{cursor.label}</span>
        </div>
      </div>

      {/* 2. Typing Indicator Pill Minimalista */}
      {isTyping && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: 'rgba(26, 18, 12, 0.94)',
            border: '1px solid rgba(245, 158, 11, 0.8)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(245, 158, 11, 0.3)',
            backdropFilter: 'blur(8px)',
            borderRadius: '20px',
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#f59e0b',
            fontWeight: 700,
            fontSize: '0.82rem',
            animation: 'fadeIn 0.2s ease-out',
            pointerEvents: 'none',
          }}
        >
          <Navigation size={14} className="animate-pulse" />
          <span>Actualizando visualización del catálogo...</span>
        </div>
      )}

      {/* 3. Spotlight 60 FPS Overlay con transform: translate3d fixed */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          transform: `translate3d(${spotlight.x}px, ${spotlight.y}px, 0)`,
          width: `${spotlight.width}px`,
          height: `${spotlight.height}px`,
          pointerEvents: 'none',
          zIndex: 9998,
          borderRadius: '12px',
          border: '2px solid rgba(245, 158, 11, 0.9)',
          boxShadow:
            '0 0 0 3px rgba(245, 158, 11, 0.45), 0 0 25px rgba(245, 158, 11, 0.65), inset 0 0 15px rgba(245, 158, 11, 0.15)',
          willChange: 'transform, width, height',
          transition:
            'opacity 200ms ease, transform 120ms cubic-bezier(0.22, 1, 0.36, 1), width 120ms cubic-bezier(0.22, 1, 0.36, 1), height 120ms cubic-bezier(0.22, 1, 0.36, 1)',
          opacity: spotlight.visible ? 1 : 0,
          visibility: spotlight.visible ? 'visible' : 'hidden',
        }}
      >
        {/* Floating Badge Tag */}
        {spotlight.visible && (
          <div
            style={{
              position: 'absolute',
              top: '-34px',
              right: '8px',
              backgroundColor: '#f59e0b',
              color: '#1a120c',
              fontWeight: 800,
              fontSize: '0.74rem',
              padding: '4px 10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              animation: 'bounceIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
            onClick={() => {
              setSpotlight((prev) => ({ ...prev, visible: false }))
              isVisibleRef.current = false
            }}
          >
            <Navigation size={11} />
            <span>{spotlight.badgeText || 'Recomendación'}</span>
            <X size={12} style={{ marginLeft: '2px', opacity: 0.7 }} />
          </div>
        )}
      </div>
    </>
  )
}

export default SommelierHighlighter
