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
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const COLORS = ["#4f46e5", "#06b6d4", "#f97316", "#10b981", "#ef4444", "#a78bfa"];

export default function StatisticsPage() {
  const { data: assetsByCategory } = usePolling<any[]>(`${API_BASE_URL}/api/reports/assets-by-category/`, 15000, true);
  const { data: valuationHistogram } = usePolling<any[]>(`${API_BASE_URL}/api/reports/valuation-histogram/?bucket=1000`, 15000, true);
  const [assetsByCategoryFallback, setAssetsByCategoryFallback] = useState<any[] | null>(null);
  const [valuationHistogramFallback, setValuationHistogramFallback] = useState<any[] | null>(null);

  const normalizeList = (raw: any, fallback: any[] | null) => {
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.value)) return raw.value;
    return fallback ?? [];
  };

  const assetsData = normalizeList(assetsByCategory, assetsByCategoryFallback);
  const valuationData = normalizeList(valuationHistogram, valuationHistogramFallback);

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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Statistics</h1>
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

        <Card>
          <CardHeader>
            <CardTitle>Valuation Histogram</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(valuationData) && valuationData.length > 0 ? (
              <div style={{ width: '100%', height: 360 }}>
                <ResponsiveContainer width="100%" height={360}>
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
  );
}
