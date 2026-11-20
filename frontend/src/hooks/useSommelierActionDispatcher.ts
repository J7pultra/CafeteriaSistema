import { useNavigate } from 'react-router-dom'
import { useCallback, useState } from 'react'
import type { UIAction } from '../services/chatService'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Finds an element by data-sommelier-id or id in DOM, retrying quickly if needed.
 */
async function waitForElement(targetId: string, maxWaitMs = 1000): Promise<HTMLElement | null> {
  const startTime = Date.now()
  while (Date.now() - startTime < maxWaitMs) {
    const el =
      (document.querySelector(`[data-sommelier-id="${targetId}"]`) as HTMLElement) ||
      (document.getElementById(targetId) as HTMLElement)
    if (el) return el
    await sleep(40)
  }
  return null
}

export function useSommelierActionDispatcher() {
  const navigate = useNavigate()
  const [isExecuting, setIsExecuting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const dispatchActions = useCallback(
    async (actions?: UIAction[]) => {
      if (!actions || actions.length === 0) return

      setIsExecuting(true)

      for (const action of actions) {
        // Reducir delays artificiales a máximo 50ms (0ms por defecto)
        const delay = Math.min(action.delayMs ?? 0, 50)
        if (delay > 0) {
          await sleep(delay)
        }

        switch (action.type) {
          case 'NAVIGATE': {
            // Cerrar automáticamente cualquier drawer o panel abierto (como el carrito) antes de navegar
            window.dispatchEvent(new CustomEvent('sommelier:close-cart'))

            if (action.route) {
              const currentPath = window.location.pathname.replace(/\/$/, '') || '/'
              const targetRoute = action.route.replace(/\/$/, '') || '/'

              // Omitir navegación redundante si ya estamos en la ruta objetivo
              const isSameRoute =
                currentPath === targetRoute ||
                ((currentPath === '/' || currentPath === '/store') &&
                  (targetRoute === '/' || targetRoute === '/store'))

              if (!isSameRoute) {
                setStatusMessage(`Navegando a ${action.route}...`)
                navigate(action.route)
                // Breve yield de 50ms para montaje de componentes
                await sleep(50)
              }
            }
            break
          }

          case 'TYPE_AND_SEARCH': {
            const targetId = action.targetId || 'catalog-search-input'
            setStatusMessage('Sommelier AI está buscando...')

            // Notificar al cursor virtual hacia dónde desplazarse
            window.dispatchEvent(
              new CustomEvent('sommelier:cursor-move', {
                detail: { targetId, label: 'Sommelier AI ✨' },
              })
            )

            window.dispatchEvent(
              new CustomEvent('sommelier:typing-status', {
                detail: { isTyping: true, text: action.text },
              })
            )

            const inputEl = (await waitForElement(targetId)) as HTMLInputElement | null
            if (inputEl) {
              inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
              inputEl.focus()

              const textToType = action.text || ''
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value'
              )?.set

              // Typing ultra-fluido a 15ms por carácter sin bloquear el hilo principal
              for (let i = 0; i <= textToType.length; i++) {
                const partial = textToType.slice(0, i)
                nativeInputValueSetter?.call(inputEl, partial)
                // Despacha ÚNICAMENTE 'input' para evitar dobles re-renders por carácter
                inputEl.dispatchEvent(new Event('input', { bubbles: true }))
                await sleep(15)
              }

              // Evento change final una sola vez al culminar el tipeo
              inputEl.dispatchEvent(new Event('change', { bubbles: true }))
            }

            window.dispatchEvent(
              new CustomEvent('sommelier:typing-status', {
                detail: { isTyping: false, text: action.text },
              })
            )
            break
          }

          case 'HIGHLIGHT_ELEMENT': {
            if (action.targetId) {
              // Mover cursor virtual al elemento antes de resaltar
              window.dispatchEvent(
                new CustomEvent('sommelier:cursor-move', {
                  detail: { targetId: action.targetId, label: 'Sommelier AI ✨' },
                })
              )

              const targetEl = await waitForElement(action.targetId)
              if (targetEl && action.scrollIntoView !== false) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }

              // Broadcast highlight event para el seguimiento de 60 FPS en SommelierHighlighter
              window.dispatchEvent(
                new CustomEvent('sommelier:highlight', {
                  detail: {
                    targetId: action.targetId,
                    animation: action.animation || 'pulse-glow',
                    badgeText: action.badgeText || '¡Selección Sommelier AI!',
                    durationMs: action.durationMs || 4000,
                  },
                })
              )
            }
            break
          }

          case 'ADD_TO_CART_VISUAL': {
            window.dispatchEvent(
              new CustomEvent('sommelier:add-to-cart', {
                detail: {
                  product: action.product,
                },
              })
            )
            break
          }

          case 'OPEN_CART_DRAWER': {
            window.dispatchEvent(new CustomEvent('sommelier:open-cart'))
            break
          }

          case 'CLOSE_CART_DRAWER': {
            window.dispatchEvent(new CustomEvent('sommelier:close-cart'))
            break
          }
        }
      }

      setIsExecuting(false)
      setStatusMessage(null)
    },
    [navigate]
  )

  return {
    dispatchActions,
    isExecuting,
    statusMessage,
  }
}

export default useSommelierActionDispatcher
