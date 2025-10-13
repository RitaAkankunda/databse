"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCards from "@/components/stats-cards";
import usePolling from "@/lib/usePolling";
import { SidebarNav } from "@/components/sidebar-nav";
import { getCurrentUser, type UserRecord } from "@/lib/auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  Package, 
  Wrench, 
  Plus, 
  BarChart3, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from "lucide-react";

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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SidebarNav />
      <main className="flex-1 p-8 animate-fade-in-up">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                     Welcome back, {user?.full_name || 'User'}! 👋
              </h1>
              <p className="text-lg text-muted-foreground">
                Here's what's happening with your assets today
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="card-modern hover-lift group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{totalAssets}</p>
                  <p className="text-xs text-muted-foreground mt-1">All registered assets</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{activeUsers}</p>
                  <p className="text-xs text-muted-foreground mt-1">Available for assignment</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>+5% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Assignments</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{openAssignments}</p>
                  <p className="text-xs text-muted-foreground mt-1">Assets currently assigned</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm text-orange-600">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                <span>-2% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Maintenance</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{openMaintenance}</p>
                  <p className="text-xs text-muted-foreground mt-1">Service tickets</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <Wrench className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm text-red-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>+3% from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Assets */}
          <div className="lg:col-span-2">
            <Card className="card-modern">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Recent Assets</CardTitle>
                  <Button variant="outline" size="sm" className="btn-secondary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAssets.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No assets yet. Add your first asset to get started!</p>
                    </div>
                  )}
                  {recentAssets.map((a: any, index) => (
                    <div key={a.asset_id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in-up" style={{animationDelay: `${index * 100}ms`}}>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{a.asset_name}</p>
                          <p className="text-sm text-muted-foreground">Serial: {a.serial_number || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`badge-${a.status === 'Active' ? 'success' : a.status === 'Maintenance' ? 'warning' : 'error'}`}>
                          {a.status || 'Unknown'}
                        </span>
                        <Button variant="ghost" size="sm">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Analytics */}
          <div className="space-y-6">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full btn-primary justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Asset
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Wrench className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Database Status</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-600">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">API Response</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-600">Fast</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Backup</span>
                    <span className="text-sm text-muted-foreground">2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
