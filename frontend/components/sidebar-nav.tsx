"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  Building2,
  FolderTree,
  Warehouse,
  Wrench,
  Trash2,
  LogIn,
  UserPlus,
  ClipboardList,
  UserCog,
  ReceiptText,
  BarChart3,
} from "lucide-react";
import { getCurrentUser, logout, type UserRecord } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useIsLive, useSetLive } from "@/lib/live"

const navItems = [
  // 1) Entry
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  // 2) Masters that assets depend on
  { title: "Categories", href: "/categories", icon: FolderTree },
  { title: "Suppliers", href: "/suppliers", icon: Building2 },
  { title: "Buyers", href: "/buyers", icon: ReceiptText },
  { title: "Locations", href: "/locations", icon: Warehouse },
  { title: "Users", href: "/users", icon: Users },
  // 3) Core operations
  { title: "Assets", href: "/assets", icon: Package },
  { title: "Assignments", href: "/assignments", icon: ClipboardList },
  { title: "Maintenance", href: "/maintenance", icon: Wrench },
  { title: "Maintenance Staff", href: "/maintenance-staff", icon: UserCog },
  { title: "Asset Valuation", href: "/valuations", icon: ReceiptText },
  { title: "Disposal", href: "/disposal", icon: Trash2 },
  { title: "Statistics", href: "/statistics", icon: BarChart3 },
  // 4) Auth
  { title: "Login", href: "/login", icon: LogIn },
  { title: "Register", href: "/register", icon: UserPlus },
];

export function SidebarNav() {
  const pathname = usePathname();
  // initialize synchronously to avoid a brief empty placeholder and reduce re-renders
  const [user, setUser] = useState<UserRecord | null>(() => getCurrentUser());
  const isLive = useIsLive()
  const setLive = useSetLive()


  // Filter nav items by role: hide admin-only items for staff users
  const allowedNav = (() => {
    if (!user) return navItems.filter((i) => ["/login", "/register", "/"].includes(i.href));
    if (user.role === 'admin') return navItems;
    // staff: hide Users and Disposal pages (admin-only)
    const adminOnly = new Set(['/users', '/disposal']);
    return navItems.filter((i) => !adminOnly.has(i.href));
  })();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-white/80 backdrop-blur-sm shadow-lg">
      <div className="flex h-24 items-center border-b border-border px-4">
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Asset Manager</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{user?.full_name || 'Guest'}</p>
                {user?.role && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{String(user.role).toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-medium">Live</label>
            <button onClick={() => setLive(!isLive)} className={`h-6 w-10 rounded-full p-0.5 transition-all duration-300 ${isLive ? 'bg-green-500 shadow-lg' : 'bg-gray-300'}`} aria-pressed={isLive} title="Toggle Live Polling">
              <div className={`h-5 w-5 rounded-full bg-white shadow transform transition-all duration-300 ${isLive ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </button>
            <button
              aria-label="Toggle theme"
              title="Toggle theme"
              onClick={() => {
                if (document.documentElement.classList.contains('dark')) {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('theme', 'light');
                } else {
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('theme', 'dark');
                }
              }}
              className="h-8 w-8 rounded-md flex items-center justify-center bg-muted/60 hover:bg-muted/80"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/></svg>
            </button>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {allowedNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 hover-lift group",
                isActive
                  ? "bg-gradient-primary text-white shadow-lg"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-all duration-300",
                isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.title}
            </Link>
          );
        })}
        {user && (
          <div className="mt-6 pt-4 border-t border-border">
            <button
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 hover-lift group",
                "text-muted-foreground hover:bg-red-50 hover:text-red-600"
              )}
            >
              <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <span className="text-xs text-red-600">×</span>
              </div>
              Logout
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}
