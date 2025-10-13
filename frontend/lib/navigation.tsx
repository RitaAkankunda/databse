"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"

const NavigationContext = createContext<{ isNavigating: boolean }>({ isNavigating: false })

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    // When pathname changes, mark navigating briefly so hooks/components can pause work
    setIsNavigating(true)
    const t = window.setTimeout(() => setIsNavigating(false), 600)
    return () => clearTimeout(t)
  }, [pathname])

  const value = useMemo(() => ({ isNavigating }), [isNavigating])
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export function useIsNavigating() {
  const ctx = useContext(NavigationContext)
  return ctx?.isNavigating ?? false
}
