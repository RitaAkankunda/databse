"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginByIdentifier } from "@/lib/auth";
import { toast } from "sonner";
import Link from "next/link";
// Eye and Eye-slash SVG icons
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
);
const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592M6.634 6.634A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.96 9.96 0 01-4.293 5.066M3 3l18 18"/></svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !password) {
      setError("Full name and password are required");
      return;
    }
    setSubmitting(true);
  const res = loginByIdentifier(fullName, password);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || "Login failed");
      toast.error(res.error || "Login failed")
      return;
    }
  // on success show notification and go to dashboard
  toast.success("Login successful")
  router.push("/dashboard");
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 route-container">
      <div className="landing-card grid grid-cols-1 md:grid-cols-2 w-full max-w-4xl bg-transparent shadow-lg rounded-lg overflow-hidden">
        {/* left gradient welcome panel */}
        <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-green-600 to-teal-500 p-12 text-white">
          <div className="max-w-sm">
            <h2 className="text-4xl font-extrabold tracking-tight mb-3">Welcome back</h2>
            <p className="opacity-90">Sign in to continue managing your assets.</p>
          </div>
        </div>
        {/* right white form panel */}
        <div className="p-8 md:p-10 bg-white text-foreground">
          <h2 className="mb-2 text-2xl font-semibold text-foreground">Login</h2>
          <p className="mb-6 text-sm text-muted-foreground">Enter your credentials to access the dashboard.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm text-foreground">Full name</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="bg-input/50 text-foreground placeholder:text-muted-foreground border border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-input/50 text-foreground placeholder:text-muted-foreground border border-input pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground px-2 py-1 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe((v) => !v)}
                  className="accent-primary"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">Forgot password?</Link>
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} variant="success" className="w-full">
              {submitting ? "Signing in..." : "Login"}
            </Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account? <Link href="/register" className="text-primary underline-offset-4 hover:underline">Register</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
 
