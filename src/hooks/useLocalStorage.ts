import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        return JSON.parse(stored) as T
      } catch {
        // fall through to initialValue
      }
    }
    return initialValue instanceof Function ? initialValue() : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}
