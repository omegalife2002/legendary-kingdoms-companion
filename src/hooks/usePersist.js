import { useState, useEffect } from 'react'

/**
 * usePersist(key, defaultValue)
 *
 * A drop-in replacement for useState that automatically:
 *   - Reads the initial value from localStorage on first render
 *   - Writes back to localStorage whenever the value changes
 *
 * Usage:
 *   const [chars, setChars] = usePersist('lkc-chars', DEFAULT_CHARS)
 */
export function usePersist(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch {
      // If JSON is corrupt or localStorage is unavailable, fall back to default
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // localStorage can be full or blocked in private browsing — fail silently
    }
  }, [key, state])

  return [state, setState]
}
