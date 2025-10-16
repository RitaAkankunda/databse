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
  const fetchOnceRef = useRef<(() => Promise<void>) | null>(null)
  const isNavigating = useIsNavigating()
  const isLive = useIsLive()

  // fetchOnce defined once and stored on a ref so callers can trigger it manually
  const fetchOnce = async () => {
    if (!enabled) return
    if (!isLive) return
    if (isNavigating) return
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return

    // mark loading only for the first fetch
    if (data === null) setLoading(true)
    const controller = new AbortController()
    const signal = controller.signal
    try {
      const res = await fetch(savedUrl.current, { signal })
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return
      setError(err)
    } finally {
      setLoading(false)
    }
  }
  fetchOnceRef.current = fetchOnce

  useEffect(() => {
    let mounted = true
    savedUrl.current = url

    // Small deferral to reduce work during immediate route transitions and improve perceived responsiveness
    if (enabled) {
      // delay the first fetch to let the page render (reduces jank when many pages mount simultaneously)
      initialTimeoutRef.current = window.setTimeout(() => {
        fetchOnceRef.current && fetchOnceRef.current()
        timerRef.current = window.setInterval(() => { fetchOnceRef.current && fetchOnceRef.current() }, intervalMs) as unknown as number
      }, 80) as unknown as number
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      if (initialTimeoutRef.current) { clearTimeout(initialTimeoutRef.current); initialTimeoutRef.current = null }
      setLoading(false)
    }

    return () => {
      mounted = false
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      if (initialTimeoutRef.current) { clearTimeout(initialTimeoutRef.current); initialTimeoutRef.current = null }
    }
  }, [url, intervalMs, enabled, isNavigating])

  // expose a refresh function that callers can await
  const refresh = async () => {
    if (fetchOnceRef.current) await fetchOnceRef.current()
  }

  return { data, loading, error, refresh }
}

export default usePolling
