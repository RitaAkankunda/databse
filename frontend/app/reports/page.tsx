"use client"
import React, { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts'

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFF", "#FF6B6B"]

async function fetchJson(path: string) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  return res.json()
}

export default function ReportsPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [histogram, setHistogram] = useState<any[]>([])
  const [salesYearly, setSalesYearly] = useState<any[]>([])
  const [salesQuarterly, setSalesQuarterly] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    Promise.all([
      fetchJson('/api/reports/assets-by-category/'),
      fetchJson('/api/reports/valuation-histogram/'),
      fetchJson('/api/reports/sales/'),
    ])
      .then(([cat, hist, sales]) => {
        if (!mounted) return
        setCategories(cat || [])
        setHistogram(hist || [])
        // sales endpoint shape: { yearly: [...], quarterly: [...] }
        setSalesYearly((sales && sales.yearly) || [])
        setSalesQuarterly((sales && sales.quarterly) || [])
      })
      .catch((err) => {
        console.error(err)
        if (mounted) setError(String(err))
      })
      .finally(() => mounted && setLoading(false))

    return () => { mounted = false }
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 8 }}>Reports</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: 18 }}>Textual and graphical reports from server-side aggregates.</p>

      {loading && <div>Loading reports…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <section style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h3 style={{ marginTop: 0 }}>Assets by Category</h3>
            {categories.length === 0 ? (
              <div>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={categories} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div style={{ marginTop: 8 }}>
              <strong>Raw</strong>
              <pre style={{ maxHeight: 140, overflow: 'auto', background: '#f7f7f7', padding: 8, borderRadius: 6 }}>{JSON.stringify(categories, null, 2)}</pre>
            </div>
          </section>

          <section style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h3 style={{ marginTop: 0 }}>Valuation Histogram</h3>
            {histogram.length === 0 ? (
              <div>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={histogram}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" />
                  <YAxis />
                  <ReTooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div style={{ marginTop: 8 }}>
              <strong>Raw</strong>
              <pre style={{ maxHeight: 140, overflow: 'auto', background: '#f7f7f7', padding: 8, borderRadius: 6 }}>{JSON.stringify(histogram, null, 2)}</pre>
            </div>
          </section>

          <section style={{ gridColumn: '1 / -1', background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h3 style={{ marginTop: 0 }}>Sales Report — Yearly & Quarterly</h3>
            {salesYearly.length === 0 && salesQuarterly.length === 0 ? (
              <div>No sales data</div>
            ) : (
              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minHeight: 220 }}>
                  <h4 style={{ marginBottom: 6 }}>Yearly</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={salesYearly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <ReTooltip />
                      <Bar dataKey="total" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ flex: 1, minHeight: 220 }}>
                  <h4 style={{ marginBottom: 6 }}>Quarterly</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={salesQuarterly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Legend />
                      <ReTooltip />
                      <Line type="monotone" dataKey="total" stroke="#FF8042" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <strong>Raw</strong>
              <pre style={{ maxHeight: 140, overflow: 'auto', background: '#f7f7f7', padding: 8, borderRadius: 6 }}>{JSON.stringify({ yearly: salesYearly, quarterly: salesQuarterly }, null, 2)}</pre>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
