"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type LiveContextShape = { isLive: boolean; setLive: (v: boolean) => void }

const KEY = "ams.livePolling"
const LiveContext = createContext<LiveContextShape | undefined>(undefined)

export function LivePollingProvider({ children }: { children: React.ReactNode }) {
  const [isLive, setIsLive] = useState<boolean>(true)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY)
      if (raw !== null) setIsLive(raw === "1" || raw === "true")
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, isLive ? "1" : "0")
    } catch (e) {
      // ignore
    }
  }, [isLive])

  return <LiveContext.Provider value={{ isLive, setLive: setIsLive }}>{children}</LiveContext.Provider>
}

export function useIsLive() {
  const ctx = useContext(LiveContext)
  return ctx?.isLive ?? true
}

export function useSetLive() {
  const ctx = useContext(LiveContext)
  return ctx?.setLive ?? (() => {})
}

export default LivePollingProvider
