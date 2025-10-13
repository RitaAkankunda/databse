"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCards from "@/components/stats-cards";
import usePolling from "@/lib/usePolling";
import { SidebarNav } from "@/components/sidebar-nav";
import { getCurrentUser, type UserRecord } from "@/lib/auth";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [recentAssets, setRecentAssets] = useState<any[]>([]);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    setReady(true);
  }, []);

  const { data: polledAssets } = usePolling<any[]>(`${API_BASE_URL}/api/assets/`, 15000, true);
  const { data: polledUsers } = usePolling<any[]>(`${API_BASE_URL}/api/users/`, 15000, true);
  const { data: polledMaintenance } = usePolling<any[]>(`${API_BASE_URL}/api/maintenance/`, 15000, true);
  const { data: polledAssignments } = usePolling<any[]>(`${API_BASE_URL}/api/assignments/`, 15000, true);

  const totalAssets = Array.isArray(polledAssets) ? polledAssets.length : "-";
  const activeUsers = Array.isArray(polledUsers) ? polledUsers.filter((u:any) => (u.status||"").toLowerCase() === "active").length : "-";
  const openAssignments = Array.isArray(polledAssignments) ? polledAssignments.filter(a => { const s = (a.status||"").toLowerCase(); return s !== 'returned' && s !== 'returned_on' && s !== 'completed' }).length : "-";
  const openMaintenance = Array.isArray(polledMaintenance) ? polledMaintenance.length : "-";

  useEffect(() => { if (Array.isArray(polledAssets)) setRecentAssets(polledAssets.slice(-3).reverse()) }, [polledAssets]);

  if (!ready) return <div className="min-h-screen" />;

  return (
    <div className="flex">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your asset management system</p>
        </div>

        <StatsCards stats={[
          { title: 'Total Assets', value: <span className="text-2xl font-bold text-foreground">{totalAssets}</span>, subtitle: 'All registered assets' },
          { title: 'Active Users', value: <span className="text-2xl font-bold text-foreground">{activeUsers}</span>, subtitle: 'Available for assignment' },
          { title: 'Open Assignments', value: <span className="text-2xl font-bold text-foreground">{openAssignments}</span>, subtitle: 'Assets currently assigned' },
          { title: 'Open Maintenance', value: <span className="text-2xl font-bold text-foreground">{openMaintenance}</span>, subtitle: 'Service tickets' },
        ]} />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentAssets.length === 0 && (
                    <div className="text-sm text-muted-foreground">No assets yet.</div>
                  )}
                  {recentAssets.map((a: any) => (
                    <div key={a.asset_id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{a.asset_name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{a.status || 'Unknown'}</span>
                      </div>
                      <span className="text-muted-foreground">{a.serial_number || "-"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
