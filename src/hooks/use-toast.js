import { useState, useCallback, useEffect } from 'react'

// Global toast store — allows triggering toasts from anywhere (contexts, utils, etc.)
let listeners = []
let toastCount = 0
let memoryQueue = []

function emitToast(t) {
  if (listeners.length === 0) {
    // No listener yet (component not mounted), queue it
    memoryQueue.push(t)
  } else {
    listeners.forEach(fn => fn(t))
  }
}

// Call this from anywhere — no hook needed
export function toast({ title, description, variant = 'default', duration = 3000 }) {
  const id = ++toastCount
  emitToast({ id, title, description, variant, duration })
  return id
}

// React hook — use inside components that render toasts
export function useToast() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = (t) => {
      setToasts(prev => [...prev, t])
    }
    listeners.push(handler)

    // Flush queued toasts
    if (memoryQueue.length > 0) {
      memoryQueue.forEach(handler)
      memoryQueue = []
    }

    return () => {
      listeners = listeners.filter(fn => fn !== handler)
    }
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, toast, dismiss }
}
