"use client"

import { useEffect, useState } from 'react'
import { SidebarNav } from '@/components/sidebar-nav'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { API_BASE_URL } from '@/lib/config'

function formatCurrency(n:number){ return `UGX ${n.toLocaleString()}` }

export default function SalesReportsPage(){
  const [data, setData] = useState<any|null>(null)
  const [error, setError] = useState<string| null>(null)

  useEffect(()=>{
    (async ()=>{
      try{
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/reports/sales/`)
        if(!res.ok){ setError('Failed to load report'); return }
        const j = await res.json()
        setData(j)
      }catch(e:any){ setError(String(e)) }
    })()
  },[])

  if(error) return (<div className="flex"><SidebarNav/><main className="flex-1 p-8">Error: {error}</main></div>)
  if(!data) return (<div className="flex"><SidebarNav/><main className="flex-1 p-8">Loading...</main></div>)

  const yearly = data.yearly || []
  const quarterly = data.quarterly || []
  const total = yearly.reduce((s:any,i:any)=>s + Number(i.total||0),0)

  // simple histogram: quarterly totals grouped by year
  const quartersByYear: Record<number, number[]> = {}
  quarterly.forEach((q:any)=>{ quartersByYear[q.year] = quartersByYear[q.year] || [0,0,0,0]; quartersByYear[q.year][Number(q.quarter)-1] = Number(q.total||0) })

  return (
    <div className="flex">
      <SidebarNav />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-4">Sales Reports (Disposals)</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-medium text-muted-foreground">Summary</h3>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Total Sales: {formatCurrency(total)}</div>
              <div className="mt-4">
                {yearly.map((y:any)=> (
                  <div key={y.year} className="flex justify-between py-1 border-b border-border">
                    <div>{y.year}</div>
                    <div className="font-medium">{formatCurrency(Number(y.total||0))}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-medium text-muted-foreground">Quarterly histogram</h3>
            </CardHeader>
            <CardContent>
              {/* simple svg histogram */}
              <svg width="100%" height={150} viewBox={`0 0 400 150`} className="w-full">
                {/* compute bars */}
                {Object.keys(quartersByYear).map((yrIdx, idx)=>{
                  const qvals = quartersByYear[Number(yrIdx)]
                  const maxVal = Math.max(...qvals,1)
                  return qvals.map((v:any, qi:number)=>{
                    const barH = Math.round((v / maxVal) * 100)
                    const x = idx*110 + qi*25 + 20
                    const y = 130 - barH
                    return (<rect key={`${yrIdx}-${qi}`} x={x} y={y} width={18} height={barH} fill="#34D399" />)
                  })
                })}
              </svg>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-medium text-muted-foreground">Yearly share (pie)</h3>
            </CardHeader>
            <CardContent>
              <svg viewBox="0 0 200 200" width={200} height={200} className="mx-auto">
                {(() => {
                  const cx=100, cy=100, r=80
                  const totalSum = Number(yearly.reduce((s:any,i:any)=>s + Number(i.total||0),0)) || 1
                  let start= -Math.PI/2
                  return yearly.map((y:any, i:number)=>{
                    const frac = Number(y.total||0)/totalSum
                    const end = start + frac*2*Math.PI
                    const x1 = cx + r*Math.cos(start)
                    const y1 = cy + r*Math.sin(start)
                    const x2 = cx + r*Math.cos(end)
                    const y2 = cy + r*Math.sin(end)
                    const large = frac > 0.5 ? 1 : 0
                    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
                    start = end
                    const colors = ['#34D399','#60A5FA','#F472B6','#F59E0B','#A78BFA']
                    return (<path d={path} fill={colors[i % colors.length]} key={y.year}></path>)
                  })
                })()}
              </svg>
              <div className="mt-4">
                {yearly.map((y:any)=> (<div key={y.year} className="flex justify-between py-1"><div>{y.year}</div><div>{formatCurrency(Number(y.total||0))}</div></div>))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-medium text-muted-foreground">Raw quarterly data</h3>
            </CardHeader>
            <CardContent>
              <pre className="text-xs">{JSON.stringify(quarterly, null, 2)}</pre>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
