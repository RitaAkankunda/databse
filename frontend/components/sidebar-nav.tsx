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
  { title: "Locations", href: "/locations", icon: Warehouse },
  { title: "Users", href: "/users", icon: Users },
  // 3) Core operations
  { title: "Assets", href: "/assets", icon: Package },
  { title: "Assignments", href: "/assignments", icon: ClipboardList },
  { title: "Maintenance", href: "/maintenance", icon: Wrench },
  { title: "Maintenance Staff", href: "/maintenance-staff", icon: UserCog },
  { title: "Asset Valuation", href: "/valuations", icon: ReceiptText },
  { title: "Disposal", href: "/disposal", icon: Trash2 },
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


  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-xl font-bold text-foreground">Asset Manager</h1>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Live</label>
            <button onClick={() => setLive(!isLive)} className={`h-6 w-10 rounded-full p-0.5 transition ${isLive ? 'bg-green-500' : 'bg-gray-300'}`} aria-pressed={isLive} title="Toggle Live Polling">
              <div className={`h-5 w-5 rounded-full bg-white shadow transform transition ${isLive ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {(user
          ? navItems
          : navItems.filter((i) =>
              ["/login", "/register", "/"].includes(i.href)
            )
        ).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
        {user && (
          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className={cn(
              "mt-4 w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Logout
          </button>
        )}
      </nav>
    </div>
  );
}
