"use client";

import { useEffect, useState } from "react";
import usePolling from "@/lib/usePolling";
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
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import StatsCards from "@/components/stats-cards";
import { Package, Users, Activity, Wrench, Clock, RefreshCw } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const COLORS = ["#4f46e5", "#06b6d4", "#f97316", "#10b981", "#ef4444", "#a78bfa"];

export default function StatisticsPage() {
  const { data: assetsByCategory, refresh: refreshAssetsByCategory } = usePolling<any[]>(`${API_BASE_URL}/api/reports/assets-by-category/`, 10000, true);
  const { data: valuationHistogram, refresh: refreshValuationHistogram } = usePolling<any[]>(`${API_BASE_URL}/api/reports/valuation-histogram/?bucket=1000`, 10000, true);
  // additional polling for live metrics
  const { data: polledAssets, refresh: refreshAssets } = usePolling<any[]>(`${API_BASE_URL}/api/assets/`, 10000, true);
  const { data: polledAssignments, refresh: refreshAssignments } = usePolling<any[]>(`${API_BASE_URL}/api/assignments/`, 10000, true);
  const { data: polledMaintenance, refresh: refreshMaintenance } = usePolling<any[]>(`${API_BASE_URL}/api/maintenance/`, 10000, true);
  const { data: polledValuations, refresh: refreshValuations } = usePolling<any[]>(`${API_BASE_URL}/api/valuations/`, 30000, true);
  const [assetsByCategoryFallback, setAssetsByCategoryFallback] = useState<any[] | null>(null);
  const [valuationHistogramFallback, setValuationHistogramFallback] = useState<any[] | null>(null);

  const normalizeList = (raw: any, fallback: any[] | null) => {
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.value)) return raw.value;
    return fallback ?? [];
  };

  const assetsData = normalizeList(assetsByCategory, assetsByCategoryFallback);
  const valuationData = normalizeList(valuationHistogram, valuationHistogramFallback);

  // derived metrics
  const totalAssets = Array.isArray(polledAssets) ? polledAssets.length : (Array.isArray(assetsData) ? assetsData.reduce((s:any, a:any)=> s + (a.count||0), 0) : "-");
  const activeAssets = Array.isArray(polledAssets) ? polledAssets.filter(a => (a.status||'').toLowerCase() === 'active').length : '-';
  const inactiveAssets = Array.isArray(polledAssets) ? polledAssets.filter(a => (a.status||'').toLowerCase() !== 'active').length : '-';
  const openAssignments = Array.isArray(polledAssignments) ? polledAssignments.filter(a => { const s = (a.status||'').toLowerCase(); return s !== 'returned' && s !== 'completed' }).length : '-';
  // prefer explicit status set by users as the primary overdue count, compute date-based overdue for context
  const overdueByStatus = Array.isArray(polledAssignments) ? polledAssignments.filter(a => (a.status||'').toLowerCase() === 'overdue').length : '-';
  const overdueByDate = Array.isArray(polledAssignments) ? polledAssignments.filter(a => a.return_date && new Date(a.return_date) < new Date() && ((a.status||'').toLowerCase() !== 'returned')).length : '-';
  const openMaintenance = Array.isArray(polledMaintenance) ? polledMaintenance.length : '-';
  const avgValuation = Array.isArray(polledValuations) && polledValuations.length > 0 ? Math.round(polledValuations.reduce((s:any,v:any)=> s + (v.current_value||v.current_value===0 ? Number(v.current_value) : 0),0) / polledValuations.length) : '-';

  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // helpers for time-series aggregation (last 12 months)
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

  // compute assignments by status (pie)
  const assignmentsByStatus = Array.isArray(polledAssignments)
    ? Object.entries(polledAssignments.reduce((acc: any, a: any) => {
        const s = (a.status || 'Unknown').toString();
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {})).map(([name, value]) => ({ name, value }))
    : [];

  // assets created over last 12 months (line)
  const months = getLastNMonths(12);
  const assetsOverTime = months.map(m => ({ month: m.label, key: m.key, count: 0 }));
  if (Array.isArray(polledAssets)) {
    const map = new Map(assetsOverTime.map(a => [a.key, a]));
    for (const a of polledAssets) {
      const k = monthKeyFromDate(a.purchase_date || a.created_at || a.created);
      if (k && map.has(k)) map.get(k)!.count += 1;
    }
  }

  // maintenance cost per month (bar)
  const maintenanceByMonth = months.map(m => ({ month: m.label, key: m.key, total: 0 }));
  if (Array.isArray(polledMaintenance)) {
    const map = new Map(maintenanceByMonth.map(a => [a.key, a]));
    for (const m of polledMaintenance) {
      const k = monthKeyFromDate(m.maintenance_date || m.date);
      const cost = m.cost ? Number(m.cost) : 0;
      if (k && map.has(k)) map.get(k)!.total += cost;
    }
  }

  // valuation trend: average current_value per month (sparkline)
  const valuationTrend = months.map(m => ({ month: m.label, key: m.key, avg: 0 }));
  if (Array.isArray(polledValuations)) {
    const sums = new Map<string, { sum: number; count: number }>();
    for (const v of polledValuations) {
      const k = monthKeyFromDate(v.valuation_date || v.valuationDate);
      const val = v.current_value !== undefined && v.current_value !== null ? Number(v.current_value) : NaN;
      if (!k || Number.isNaN(val)) continue;
      const cur = sums.get(k) || { sum: 0, count: 0 };
      cur.sum += val;
      cur.count += 1;
      sums.set(k, cur);
    }
    for (const item of valuationTrend) {
      const s = sums.get(item.key);
      if (s) item.avg = Math.round(s.sum / s.count);
    }
  }

  // update last-updated timestamp whenever polled data changes
  useEffect(() => {
    if (polledAssets || polledAssignments || polledMaintenance || polledValuations || assetsByCategory || valuationHistogram) {
      setLastUpdated(new Date().toLocaleString());
    }
  }, [polledAssets, polledAssignments, polledMaintenance, polledValuations, assetsByCategory, valuationHistogram]);

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
        // ignore
      }
    }
    fetchFallback();
    return () => { mounted = false };
  }, [assetsByCategory, valuationHistogram]);

  // manual refresh helper for all reports and lists
  async function refreshAll() {
    try {
      // trigger the polling hooks' refresh helpers so we get immediate updates
      await Promise.allSettled([
        refreshAssets?.(),
        refreshAssignments?.(),
        refreshMaintenance?.(),
        refreshValuations?.(),
        refreshAssetsByCategory?.(),
        refreshValuationHistogram?.(),
      ]);
      setLastUpdated(new Date().toLocaleString());
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Statistics</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">{lastUpdated ? `Last updated: ${lastUpdated}` : 'No data yet'}</div>
          <button onClick={refreshAll} className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm hover:bg-slate-50"><RefreshCw className="w-4 h-4" /> Refresh now</button>
        </div>
      </div>

      {/* Top stats cards (live) */}
      <StatsCards stats={[
        { title: 'Total Assets', value: <span className="text-2xl font-bold">{totalAssets}</span>, subtitle: 'All registered assets', icon: <Package className="h-4 w-4 text-primary" /> },
        { title: 'Active Assets', value: <span className="text-2xl font-bold text-green-600">{activeAssets}</span>, subtitle: 'Available for use', icon: <Users className="h-4 w-4 text-green-600" /> },
  { title: 'Open Assignments', value: <span className="text-2xl font-bold text-orange-600">{openAssignments}</span>, subtitle: `${overdueByStatus} overdue (date-overdue: ${overdueByDate})`, icon: <Activity className="h-4 w-4 text-orange-600" /> },
        { title: 'Open Maintenance', value: <span className="text-2xl font-bold text-red-600">{openMaintenance}</span>, subtitle: 'Service tickets', icon: <Wrench className="h-4 w-4 text-red-600" /> },
      ]} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(assetsData) && assetsData.length > 0 ? (
              <div style={{ width: '100%', height: 360 }}>
                <ResponsiveContainer width="100%" height={360}>
                  <PieChart>
                    <Pie
                      data={assetsData.map((r: any) => ({ name: r.category, value: r.count }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={60}
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
  <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Valuation Histogram</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Inactive</div>
                  <div className="text-xl font-bold text-red-600">{inactiveAssets}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Avg Valuation</div>
                  <div className="text-xl font-bold">{avgValuation === '-' ? '-' : `UGX ${avgValuation}`}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Overdue Assignments</div>
                  <div className="text-xl font-bold text-orange-600">{overdueByStatus} <span className="text-xs text-muted-foreground">(date: {overdueByDate})</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional charts */}
      <div className="grid gap-6 mt-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Assignments by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {assignmentsByStatus.length === 0 ? (
              <div className="text-sm text-muted-foreground">No assignments yet</div>
            ) : (
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={assignmentsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {assignmentsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <ReTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets Created (last 12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={assetsOverTime.map(a => ({ month: a.month, count: a.count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ReTooltip />
                  <Line type="monotone" dataKey="count" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Cost (last 12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={maintenanceByMonth.map(m => ({ month: m.month, total: Math.round(m.total) }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ReTooltip />
                  <Bar dataKey="total" fill={COLORS[2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Valuation Trend (avg per month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 120 }}>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={valuationTrend.map(v => ({ month: v.month, avg: v.avg }))}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ReTooltip />
                  <Line type="monotone" dataKey="avg" stroke={COLORS[1]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
