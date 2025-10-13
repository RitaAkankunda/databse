"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

// Very small route progress indicator that grows while the pathname changes.
export default function RouteProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    // on pathname change, show progress and animate width
    if (!pathname) return
    setVisible(true)
    setWidth(10)
    const t1 = window.setTimeout(() => setWidth(50), 200)
    const t2 = window.setTimeout(() => setWidth(80), 500)
    const t3 = window.setTimeout(() => setWidth(95), 1200)
    // hide after a short delay so fast navigations snap to done
    const tHide = window.setTimeout(() => {
      setWidth(100)
      // allow animation to finish before hiding
      window.setTimeout(() => { setVisible(false); setWidth(0) }, 160)
    }, 800)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(tHide) }
  }, [pathname])

  if (!visible) return null

  return (
    <div aria-hidden className="fixed left-0 top-0 z-50 h-0.5 w-full pointer-events-none">
      <div className="h-0.5 bg-primary transition-all" style={{ width: `${width}%` }} />
    </div>
  )
}
