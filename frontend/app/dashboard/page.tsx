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
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import { 
  Users, 
  Package, 
  Wrench, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  Clock,
  MapPin,
  BarChart3,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const COLORS = ["#10b981", "#06b6d4", "#f97316", "#8b5cf6", "#ef4444", "#f59e0b", "#ec4899", "#6366f1"];
const CHART_COLORS = {
  primary: "#10b981",
  secondary: "#06b6d4",
  warning: "#f97316",
  danger: "#ef4444",
  purple: "#8b5cf6",
  amber: "#f59e0b",
};

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
  const { data: polledDisposals } = usePolling<any[]>(`${API_BASE_URL}/api/disposals/`, 15000, true);
  const { data: polledValuations } = usePolling<any[]>(`${API_BASE_URL}/api/valuations/`, 15000, true);
  const { data: polledSales } = usePolling<any>(`${API_BASE_URL}/api/reports/sales/`, 15000, true);
  // Reports polling
  const { data: assetsByCategory } = usePolling<any[]>(`${API_BASE_URL}/api/reports/assets-by-category/`, 15000, true);
  const { data: valuationHistogram } = usePolling<any[]>(`${API_BASE_URL}/api/reports/valuation-histogram/?bucket=1000`, 15000, true);
  // Local fallback state for cases when polling is disabled or delayed
  const [assetsByCategoryFallback, setAssetsByCategoryFallback] = useState<any[] | null>(null);
  const [valuationHistogramFallback, setValuationHistogramFallback] = useState<any[] | null>(null);
  const [salesReportFallback, setSalesReportFallback] = useState<any>(null);

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
        if (polledSales === null && salesReportFallback === null) {
          const r3 = await fetch(`${API_BASE_URL}/api/reports/sales/`);
          const j3 = await r3.json();
          if (!mounted) return;
          setSalesReportFallback(j3);
        }
      } catch (e) {
        // ignore fetch errors here; polling will surface them via hook
      }
    }
    fetchFallback();
    return () => { mounted = false };
  }, [assetsByCategory, valuationHistogram, polledSales]);

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
  // prefer explicit 'Overdue' status for the main count; compute date-based overdue for context
  const overdueByStatus = Array.isArray(polledAssignments) ? polledAssignments.filter(a => (a.status||"").toLowerCase() === 'overdue').length : '-'
  const overdueByDate = Array.isArray(polledAssignments) ? polledAssignments.filter(a => a.return_date && new Date(a.return_date) < new Date() && ((a.status||"").toLowerCase() !== 'returned')).length : '-'
  const openMaintenance = Array.isArray(polledMaintenance) ? polledMaintenance.length : "-";

  useEffect(() => { if (Array.isArray(polledAssets)) setRecentAssets(polledAssets.slice(-3).reverse()) }, [polledAssets]);

  // --- Additional charts data (reuse helpers similar to statistics page)
  function getLastNMonths(n = 12) {
    const months: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.toLocaleString(undefined, { month: 'short' })} ${d.getFullYear().toString().slice(-2)}`;
      months.push({ key, label });
    }
    return months;
  }

  function monthKeyFromDate(dateStr: string | null | undefined) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  const months = getLastNMonths(12);

  // assignments by status
  const assignmentsByStatus = Array.isArray(polledAssignments)
    ? Object.entries(polledAssignments.reduce((acc: any, a: any) => { const s = (a.status || 'Unknown').toString(); acc[s] = (acc[s] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value }))
    : [];

  // assets over time
  const assetsOverTime = months.map(m => ({ month: m.label, key: m.key, count: 0 }));
  if (Array.isArray(polledAssets)) {
    const map = new Map(assetsOverTime.map(a => [a.key, a]));
    for (const a of polledAssets) {
      const k = monthKeyFromDate(a.purchase_date || a.created_at || a.created);
      if (k && map.has(k)) map.get(k)!.count += 1;
    }
  }

  // maintenance cost per month
  const maintenanceByMonth = months.map(m => ({ month: m.label, key: m.key, total: 0 }));
  if (Array.isArray(polledMaintenance)) {
    const map = new Map(maintenanceByMonth.map(a => [a.key, a]));
    for (const m of polledMaintenance) {
      const k = monthKeyFromDate(m.maintenance_date || m.date);
      const cost = m.cost ? Number(m.cost) : 0;
      if (k && map.has(k)) map.get(k)!.total += cost;
    }
  }

  // valuation trend average per month
  const valuationTrend = months.map(m => ({ month: m.label, key: m.key, avg: 0 }));
  if (Array.isArray(polledValuations)) {
    const map = new Map(valuationTrend.map(a => [a.key, a]));
    let totalValue = 0;
    let count = 0;
    for (const v of polledValuations) {
      const k = monthKeyFromDate(v.valuation_date);
      const value = v.current_value ? Number(v.current_value) : 0;
      if (k && map.has(k)) {
        map.get(k)!.avg += value;
        totalValue += value;
        count += 1;
      }
    }
    // Calculate average per month
    map.forEach((entry) => {
      entry.avg = count > 0 ? totalValue / count : 0;
    });
  }

  // Assets by Status
  const assetsByStatus = Array.isArray(polledAssets)
    ? Object.entries(polledAssets.reduce((acc: any, a: any) => {
        const s = (a.status || 'Unknown').toString();
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {})).map(([name, value]) => ({ name, value }))
    : [];

  // Disposals/Sales trend
  const salesData = polledSales || salesReportFallback;
  const disposalsByMonth = months.map(m => ({ month: m.label, key: m.key, total: 0 }));
  if (salesData && salesData.quarterly && Array.isArray(salesData.quarterly)) {
    const map = new Map(disposalsByMonth.map(a => [a.key, a]));
    for (const sale of salesData.quarterly) {
      if (sale.year && sale.quarter && sale.total) {
        const monthIndex = (sale.quarter - 1) * 3;
        const yearKey = `${sale.year}-${String(monthIndex + 1).padStart(2, '0')}`;
        if (map.has(yearKey)) {
          map.get(yearKey)!.total += Number(sale.total);
        }
      }
    }
  } else if (Array.isArray(polledDisposals)) {
    const map = new Map(disposalsByMonth.map(a => [a.key, a]));
    for (const d of polledDisposals) {
      const k = monthKeyFromDate(d.disposal_date);
      const value = d.disposal_value ? Number(d.disposal_value) : 0;
      if (k && map.has(k)) map.get(k)!.total += value;
    }
  }

  // Asset age distribution (years since purchase)
  const assetAgeGroups = [
    { name: '0-1 yrs', min: 0, max: 1, count: 0 },
    { name: '1-3 yrs', min: 1, max: 3, count: 0 },
    { name: '3-5 yrs', min: 3, max: 5, count: 0 },
    { name: '5-10 yrs', min: 5, max: 10, count: 0 },
    { name: '10+ yrs', min: 10, max: 999, count: 0 },
  ];
  if (Array.isArray(polledAssets)) {
    const now = new Date();
    for (const a of polledAssets) {
      if (a.purchase_date) {
        const purchaseDate = new Date(a.purchase_date);
        const ageYears = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        for (const group of assetAgeGroups) {
          if (ageYears >= group.min && ageYears < group.max) {
            group.count += 1;
            break;
          }
        }
      }
    }
  }

  // Top assets by assignment frequency
  const topAssetsByAssignments = Array.isArray(polledAssignments) && Array.isArray(polledAssets)
    ? (() => {
        const assignmentCounts = new Map<number, number>();
        for (const assignment of polledAssignments) {
          const assetId = assignment.asset || assignment.asset_id;
          if (assetId) {
            assignmentCounts.set(assetId, (assignmentCounts.get(assetId) || 0) + 1);
          }
        }
        const assetMap = new Map(polledAssets.map((a: any) => [a.asset_id || a.id, a]));
        return Array.from(assignmentCounts.entries())
          .map(([assetId, count]) => ({
            name: (assetMap.get(assetId)?.asset_name || assetMap.get(assetId)?.name || `Asset ${assetId}`).substring(0, 20),
            count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      })()
    : [];

  // Maintenance cost vs purchase cost comparison
  const maintenanceVsPurchase = months.map(m => ({
    month: m.label,
    key: m.key,
    maintenance: 0,
    purchase: 0,
  }));
  if (Array.isArray(polledMaintenance)) {
    const map = new Map(maintenanceVsPurchase.map(a => [a.key, a]));
    for (const m of polledMaintenance) {
      const k = monthKeyFromDate(m.maintenance_date);
      const cost = m.cost ? Number(m.cost) : 0;
      if (k && map.has(k)) map.get(k)!.maintenance += cost;
    }
  }
  if (Array.isArray(polledAssets)) {
    const map = new Map(maintenanceVsPurchase.map(a => [a.key, a]));
    for (const a of polledAssets) {
      const k = monthKeyFromDate(a.purchase_date);
      const cost = a.purchase_cost ? Number(a.purchase_cost) : 0;
      if (k && map.has(k)) map.get(k)!.purchase += cost;
    }
  }

  // Department/User activity
  const userActivity = Array.isArray(polledAssignments) && Array.isArray(polledUsers)
    ? (() => {
        const userCounts = new Map<number, number>();
        for (const assignment of polledAssignments) {
          const userId = assignment.user || assignment.user_id;
          if (userId) {
            userCounts.set(userId, (userCounts.get(userId) || 0) + 1);
          }
        }
        const userMap = new Map(polledUsers.map((u: any) => [u.user_id || u.id, u]));
        return Array.from(userCounts.entries())
          .map(([userId, count]) => ({
            name: (userMap.get(userId)?.name || userMap.get(userId)?.department || `User ${userId}`).substring(0, 15),
            assignments: count,
          }))
          .sort((a, b) => b.assignments - a.assignments)
          .slice(0, 6);
      })()
    : [];

  if (!ready) return <div className="min-h-screen" />;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <SidebarNav />
      <main className="flex-1 p-8 animate-fade-in-up bg-gradient-to-br from-white/40 to-transparent">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                     Welcome back, {user?.name || 'User'}! 👋
              </h1>
              <p className="text-lg text-muted-foreground">
                Here's what's happening with your assets today
              </p>
            </div>
            {/* Right-side header info removed per user request */}

            {/* Decorative hero behind header on the right */}
            <div className="absolute right-0 top-0 h-32 w-72 opacity-80 pointer-events-none -translate-y-4 translate-x-6 hidden md:block">
              <img src="/dash-hero.svg" alt="decor" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
        {/* Enhanced Charts Grid */}
        <div className="grid gap-6 mt-6 lg:grid-cols-2 xl:grid-cols-3">
          {/* Assets by Status - Pie Chart */}
          <Card className="card-modern hover:shadow-2xl transition-all duration-300 border-2 border-green-200 bg-gradient-to-br from-white to-green-50/30 hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-200/20 rounded-full blur-2xl"></div>
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                  </div>
                  Assets by Status
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              {assetsByStatus.length === 0 ? (
                <div className="text-sm text-muted-foreground flex items-center justify-center h-48">No asset status data</div>
              ) : (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie 
                        data={assetsByStatus} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={80} 
                        innerRadius={40}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {assetsByStatus.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip formatter={(value) => [value, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disposals/Sales Trend - Area Chart */}
          <Card className="card-modern hover:shadow-2xl transition-all duration-300 border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50/30 hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/20 rounded-full blur-2xl"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  Sales & Disposals Trend
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={disposalsByMonth.map(d => ({ month: d.month, total: Math.round(d.total) }))}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.purple} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.purple} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip 
                      formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Total Value']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke={CHART_COLORS.purple} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Asset Age Distribution */}
          <Card className="card-modern hover:shadow-2xl transition-all duration-300 border-2 border-amber-200 bg-gradient-to-br from-white to-amber-50/30 hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/20 rounded-full blur-2xl"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Asset Age Distribution
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={assetAgeGroups.map(g => ({ name: g.name, count: g.count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip 
                      formatter={(value: any) => [value, 'Assets']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="count" fill={CHART_COLORS.amber} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Assets by Assignment Frequency */}
          <Card className="card-modern hover:shadow-2xl transition-all duration-300 border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50/30 hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/20 rounded-full blur-2xl"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Most Assigned Assets
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {topAssetsByAssignments.length === 0 ? (
                <div className="text-sm text-muted-foreground flex items-center justify-center h-48">No assignment data</div>
              ) : (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart 
                      data={topAssetsByAssignments} 
                      layout="vertical"
                      margin={{ left: 20, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={80}
                        tick={{ fontSize: 10 }}
                      />
                      <ReTooltip 
                        formatter={(value: any) => [value, 'Assignments']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                      <Bar dataKey="count" fill={CHART_COLORS.secondary} radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Maintenance vs Purchase Cost */}
          <Card className="card-modern hover:shadow-2xl transition-all duration-300 border-2 border-orange-200 bg-gradient-to-br from-white to-orange-50/30 hover:scale-[1.01] relative overflow-hidden lg:col-span-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/20 rounded-full blur-2xl"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  Cost Analysis: Maintenance vs Purchase (12mo)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={maintenanceVsPurchase.map(m => ({ 
                    month: m.month, 
                    maintenance: Math.round(m.maintenance),
                    purchase: Math.round(m.purchase)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip 
                      formatter={(value: any, name: string) => [
                        `$${Number(value).toLocaleString()}`,
                        name === 'maintenance' ? 'Maintenance Cost' : 'Purchase Cost'
                      ]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Legend />
                    <Bar dataKey="purchase" fill={CHART_COLORS.warning} name="Purchase Cost" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="maintenance" fill={CHART_COLORS.danger} name="Maintenance Cost" radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Assets by Category - Fill blank space */}
        <div className="grid gap-6 mt-6 lg:grid-cols-3">
          {/* Assets by Category */}
          <Card className="card-modern hover:shadow-2xl transition-all duration-300 border-2 border-teal-200 bg-gradient-to-br from-white to-teal-50/30 hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-200/20 rounded-full blur-2xl"></div>
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Package className="h-5 w-5 text-teal-600" />
                  </div>
                  Assets by Category
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              {Array.isArray(assetsData) && assetsData.length > 0 ? (
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={assetsData.map((r: any) => ({ name: r.category || 'Uncategorized', value: r.count }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={40}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {assetsData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip 
                        formatter={(value: any) => [value, 'Assets']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground flex items-center justify-center h-48">No category data yet</div>
              )}
            </CardContent>
          </Card>

          {/* Valuation Distribution */}
          <Card className="card-modern hover:shadow-2xl transition-all duration-300 border-2 border-violet-200 bg-gradient-to-br from-white to-violet-50/30 hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-200/20 rounded-full blur-2xl"></div>
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-violet-600" />
                  </div>
                  Valuation Distribution
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              {Array.isArray(valuationData) && valuationData.length > 0 ? (
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={valuationData.map((b: any) => ({ bucket: `$${(b.bucket || 0).toLocaleString()}`, count: b.count }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="bucket" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ReTooltip 
                        formatter={(value: any) => [value, 'Assets']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground flex items-center justify-center h-48">No valuation data yet</div>
              )}
            </CardContent>
          </Card>

          {/* Maintenance Frequency by Asset */}
          <Card className="card-modern hover:shadow-2xl transition-all duration-300 border-2 border-cyan-200 bg-gradient-to-br from-white to-cyan-50/30 hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-200/20 rounded-full blur-2xl"></div>
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <Wrench className="h-5 w-5 text-cyan-600" />
                  </div>
                  Maintenance Frequency
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              {(() => {
                const maintenanceFrequency = Array.isArray(polledMaintenance) && Array.isArray(polledAssets)
                  ? (() => {
                      const freq = new Map<number, number>();
                      for (const m of polledMaintenance) {
                        const assetId = m.asset || m.asset_id;
                        if (assetId) {
                          freq.set(assetId, (freq.get(assetId) || 0) + 1);
                        }
                      }
                      const assetMap = new Map(polledAssets.map((a: any) => [a.asset_id || a.id, a]));
                      return Array.from(freq.entries())
                        .map(([assetId, count]) => ({
                          name: (assetMap.get(assetId)?.asset_name || assetMap.get(assetId)?.name || `Asset ${assetId}`).substring(0, 15),
                          count,
                        }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5);
                    })()
                  : [];
                return maintenanceFrequency.length === 0 ? (
                  <div className="text-sm text-muted-foreground flex items-center justify-center h-48">No maintenance data</div>
                ) : (
                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart 
                        data={maintenanceFrequency} 
                        layout="vertical"
                        margin={{ left: 20, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={80}
                          tick={{ fontSize: 10 }}
                        />
                        <ReTooltip 
                          formatter={(value: any) => [value, 'Maintenance Records']}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                        <Bar dataKey="count" fill="#06b6d4" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Additional Chart Row */}
        <div className="grid gap-6 mt-6 lg:grid-cols-3">
          {/* Assignments by Status */}
          <Card className="card-modern hover:shadow-2xl transition-all duration-300 border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50/30 hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-200/20 rounded-full blur-xl"></div>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Assignments by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {assignmentsByStatus.length === 0 ? (
                <div className="text-sm text-muted-foreground flex items-center justify-center h-48">No assignment data</div>
              ) : (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie 
                        data={assignmentsByStatus} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={70} 
                        innerRadius={30}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {assignmentsByStatus.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip formatter={(value) => [value, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assets Created Over Time */}
          <Card className="card-modern hover:shadow-2xl transition-all duration-300 border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/20 rounded-full blur-xl"></div>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Assets Created (12mo)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={assetsOverTime.map(a => ({ month: a.month, count: a.count }))}>
                    <defs>
                      <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip 
                      formatter={(value: any) => [value, 'Assets']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke={CHART_COLORS.primary} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorAssets)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Cost Over Time */}
          <Card className="card-modern hover:shadow-2xl transition-all duration-300 border-2 border-rose-200 bg-gradient-to-br from-white to-rose-50/30 hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-200/20 rounded-full blur-xl"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Wrench className="h-5 w-5 text-red-600" />
                </div>
                Maintenance Cost (12mo)
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={maintenanceByMonth.map(m => ({ month: m.month, total: Math.round(m.total) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ReTooltip 
                      formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Cost']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="total" fill={CHART_COLORS.danger} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Eye-Catching KPI Cards with Donut Charts */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Assets - Donut Chart KPI */}
          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Total Assets</p>
                  <p className="text-4xl font-extrabold text-gray-900 mt-2">{totalAssets}</p>
                </div>
                <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Package className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <div style={{ width: '100%', height: 120 }}>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={[{ name: 'Assets', value: Number(totalAssets) || 0 }, { name: 'Target', value: (Number(totalAssets) || 0) * 0.15 }]}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={50}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-gray-600">All registered assets</span>
                  <div className="flex items-center text-sm font-bold text-green-600">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    <span>+12%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Users - Donut Chart KPI */}
          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Active Users</p>
                  <p className="text-4xl font-extrabold text-gray-900 mt-2">{activeUsers}</p>
                </div>
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <div style={{ width: '100%', height: 120 }}>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={[{ name: 'Users', value: Number(activeUsers) || 0 }, { name: 'Target', value: (Number(activeUsers) || 0) * 0.2 }]}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={50}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell fill="#06b6d4" />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-gray-600">Available for assignment</span>
                  <div className="flex items-center text-sm font-bold text-green-600">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    <span>+5%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Open Assignments - Donut Chart KPI */}
          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Open Assignments</p>
                  <p className="text-4xl font-extrabold text-gray-900 mt-2">{openAssignments}</p>
                </div>
                <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Activity className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <div style={{ width: '100%', height: 120 }}>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={[{ name: 'Open', value: Number(openAssignments) || 0 }, { name: 'Overdue', value: Number(overdueByStatus) || 0 }]}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={50}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell fill="#f97316" />
                        <Cell fill="#ef4444" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-gray-600">{overdueByStatus} overdue</span>
                  <div className="flex items-center text-sm font-bold text-orange-600">
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                    <span>-2%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Open Maintenance - Donut Chart KPI */}
          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">Open Maintenance</p>
                  <p className="text-4xl font-extrabold text-gray-900 mt-2">{openMaintenance}</p>
                </div>
                <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <div style={{ width: '100%', height: 120 }}>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={[{ name: 'Open', value: Number(openMaintenance) || 0 }, { name: 'Target', value: (Number(openMaintenance) || 0) * 0.25 }]}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={50}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell fill="#ef4444" />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-gray-600">Service tickets</span>
                  <div className="flex items-center text-sm font-bold text-red-600">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    <span>+3%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
