"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getCurrentUser, type UserRecord } from "@/lib/auth"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const [user, setUser] = useState<UserRecord | null>(null)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  return (
    <div className="min-h-screen grid place-items-center p-6 route-container">
      <div className="landing-card grid grid-cols-1 md:grid-cols-2 w-full max-w-4xl bg-card">
        <div className="landing-left p-10 text-white flex items-center justify-center">
          <div className="welcome-blob max-w-sm text-center md:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Hello, Welcome!</h2>
            <p className="opacity-90 mb-6">Don't have an account?</p>
            <Button asChild className="bg-white text-foreground hover:bg-white/90">
              <Link href="/register" prefetch>
                Register
              </Link>
            </Button>
          </div>
        </div>
        <div className="p-8 md:p-10">
          <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
          <div className="space-y-3 text-sm text-muted-foreground text-center">
            <p>Use the Login button below to go to the sign in form.</p>
          </div>
          <div className="mt-6 flex items-center justify-center">
            <Button asChild variant="success" className="px-6">
              <Link href="/login" prefetch>
                Login
              </Link>
            </Button>
          </div>
          {/* Signed-in info removed per request; landing page shows only Login */}

        </div>
      </div>
    </div>
  )
}
