"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCards from "@/components/stats-cards";
import usePolling from "@/lib/usePolling";
import { SidebarNav } from "@/components/sidebar-nav";
import { getCurrentUser, type UserRecord } from "@/lib/auth";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
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

const COLORS = ["#4f46e5", "#06b6d4", "#f97316", "#10b981", "#ef4444", "#a78bfa"];

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
  // Reports polling
  const { data: assetsByCategory } = usePolling<any[]>(`${API_BASE_URL}/api/reports/assets-by-category/`, 15000, true);
  const { data: valuationHistogram } = usePolling<any[]>(`${API_BASE_URL}/api/reports/valuation-histogram/?bucket=1000`, 15000, true);
  // Local fallback state for cases when polling is disabled or delayed
  const [assetsByCategoryFallback, setAssetsByCategoryFallback] = useState<any[] | null>(null);
  const [valuationHistogramFallback, setValuationHistogramFallback] = useState<any[] | null>(null);

  // Helper to normalize different possible response shapes (array or { value: [...] })
  const normalizeList = (raw: any, fallback: any[] | null) => {
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.value)) return raw.value;
    return fallback ?? [];
  };

  const assetsData = normalizeList(assetsByCategory, assetsByCategoryFallback);
  const valuationData = normalizeList(valuationHistogram, valuationHistogramFallback);

  // If polling hasn't returned yet (null), attempt a one-off fetch so charts can render immediately
  useEffect(() => {
    let mounted = true;
    async function fetchFallback() {
      try {
        if (assetsByCategory === null && assetsByCategoryFallback === null) {
          const r = await fetch(`${API_BASE_URL}/api/reports/assets-by-category/`);
          const j = await r.json();
          if (!mounted) return;
          setAssetsByCategoryFallback(Array.isArray(j) ? j : (j && Array.isArray(j.value) ? j.value : []));
        }
        if (valuationHistogram === null && valuationHistogramFallback === null) {
          const r2 = await fetch(`${API_BASE_URL}/api/reports/valuation-histogram/?bucket=1000`);
          const j2 = await r2.json();
          if (!mounted) return;
          setValuationHistogramFallback(Array.isArray(j2) ? j2 : (j2 && Array.isArray(j2.value) ? j2.value : []));
        }
      } catch (e) {
        // ignore fetch errors here; polling will surface them via hook
      }
    }
    fetchFallback();
    return () => { mounted = false };
  }, [assetsByCategory, valuationHistogram]);

  // manual refresh helper for the debug panel
  async function refreshReports() {
    try {
      const r = await fetch(`${API_BASE_URL}/api/reports/assets-by-category/`);
      const j = await r.json();
      setAssetsByCategoryFallback(Array.isArray(j) ? j : (j && Array.isArray(j.value) ? j.value : []));
    } catch (e) {
      // ignore
    }
    try {
      const r2 = await fetch(`${API_BASE_URL}/api/reports/valuation-histogram/?bucket=1000`);
      const j2 = await r2.json();
      setValuationHistogramFallback(Array.isArray(j2) ? j2 : (j2 && Array.isArray(j2.value) ? j2.value : []));
    } catch (e) {
      // ignore
    }
  }
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
          {/* Recent Assets removed per user request */}

          {/* Right column: Reports and debug panels (Quick Actions & System Health removed) */}
          <div className="space-y-6">
            {/* Reports debug card removed per user request */}
            {/* Reports: Assets by Category (Pie) */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Assets by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(assetsData) && assetsData.length > 0 ? (
                  <div style={{ width: '100%', height: 220 }} className="mx-auto">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={assetsData.map((r: any) => ({ name: r.category, value: r.count }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          innerRadius={30}
                          label
                        >
                          {assetsData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ReTooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No category data yet</div>
                )}
              </CardContent>
            </Card>

            {/* Reports: Valuation histogram (Bar) */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Valuation Histogram</CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(valuationData) && valuationData.length > 0 ? (
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={valuationData.map((b: any) => ({ bucket: String(b.bucket), count: b.count }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="bucket" />
                        <YAxis />
                        <ReTooltip />
                        <Bar dataKey="count" fill={COLORS[0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No valuation data yet</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
