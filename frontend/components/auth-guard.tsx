"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const PUBLIC_ROUTES = new Set(["/login", "/register"]);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Allow public routes without auth
    if (PUBLIC_ROUTES.has(pathname)) return;
    const user = getCurrentUser();
    if (!user) {
      router.replace("/register");
    }
  }, [pathname, router]);

  return children as unknown as React.ReactElement;
}
