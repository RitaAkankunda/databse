"use client"

import { useEffect, useState, useRef } from "react"
import { useIsNavigating } from "@/lib/navigation"
import { useIsLive } from "./live"

export function usePolling<T = any>(url: string, intervalMs: number = 15000, enabled: boolean = true) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const savedUrl = useRef(url)
  const timerRef = useRef<number | null>(null)
  const initialTimeoutRef = useRef<number | null>(null)
  const isNavigating = useIsNavigating()
  const isLive = useIsLive()

  useEffect(() => {
    let mounted = true
    savedUrl.current = url
    const controller = new AbortController()
    const signal = controller.signal

    async function fetchOnce() {
      // if navigation is in progress, skip fetching to reduce work during route transitions
  if (!enabled) return
  if (!isLive) return
  if (isNavigating) return
      // if the document/tab is not visible, skip fetching to save work
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      // mark loading only for the first fetch
      if (data === null) setLoading(true)
      try {
        const res = await fetch(savedUrl.current, { signal })
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
        const json = await res.json()
        if (!mounted) return
        setData(json)
        setError(null)
      } catch (err) {
        if (!mounted) return
        // if aborted, don't treat as an error
        if ((err as any)?.name === 'AbortError') return
        setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    // Small deferral to reduce work during immediate route transitions and improve perceived responsiveness
    if (enabled) {
      // delay the first fetch to let the page render (reduces jank when many pages mount simultaneously)
      initialTimeoutRef.current = window.setTimeout(() => {
        fetchOnce()
        timerRef.current = window.setInterval(fetchOnce, intervalMs) as unknown as number
      }, 80) as unknown as number
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      if (initialTimeoutRef.current) { clearTimeout(initialTimeoutRef.current); initialTimeoutRef.current = null }
      setLoading(false)
    }

    return () => {
      mounted = false
      controller.abort()
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      if (initialTimeoutRef.current) { clearTimeout(initialTimeoutRef.current); initialTimeoutRef.current = null }
    }
  }, [url, intervalMs, enabled, isNavigating])

  return { data, loading, error }
}

export default usePolling
