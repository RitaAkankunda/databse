"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const NavigationContext = createContext<{ isNavigating: boolean }>({ isNavigating: false })

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const prev = useRef<string | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (prev.current === null) {
      prev.current = pathname
      return
    }
    if (pathname !== prev.current) {
      setIsNavigating(true)
      // keep navigating state for a short window; this can be tuned
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
      timerRef.current = window.setTimeout(() => { setIsNavigating(false); timerRef.current = null }, 700) as unknown as number
      prev.current = pathname
    }
  }, [pathname])

  useEffect(() => {
    return () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } }
  }, [])

  return (
    <NavigationContext.Provider value={{ isNavigating }}>{children}</NavigationContext.Provider>
  )
}

export function useIsNavigating() {
  const ctx = useContext(NavigationContext)
  return ctx?.isNavigating ?? false
}

export default NavigationProvider
