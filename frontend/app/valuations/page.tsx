"use client"

import { useEffect, useState, useRef } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, ReceiptText, DollarSign, Package, TrendingUp } from "lucide-react"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useNotificationActions } from "@/components/notification-system"
import StatsCards from "@/components/stats-cards"
import usePolling from "@/lib/usePolling"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

type Valuation = { id: string; asset_id: number; valuation_date?: string | null; method?: string | null; initial_value?: number | null; current_value?: number | null }

export default function ValuationsPage() {
  const [items, setItems] = useState<Valuation[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Valuation | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { showSuccess, showError } = useNotificationActions()

  // Poll valuations for live updates
  const { data: polledValuations } = usePolling<any[]>(`${API_BASE_URL}/api/valuations/`, 15000, !open)
  useEffect(() => {
    if (Array.isArray(polledValuations)) {
      setItems(polledValuations.map((r: any) => ({ id: String(r.valuation_id), asset_id: (r.asset ?? r.asset_id), valuation_date: r.valuation_date, method: r.method, initial_value: Number(r.initial_value ?? 0), current_value: Number(r.current_value ?? 0) })))
    }
  }, [polledValuations])

  function handleAdd() { setSelected(null); setOpen(true) }
  function handleEdit(r: Valuation) { setSelected(r); setOpen(true) }
  function handleDelete(r: Valuation) { setSelected(r); setConfirmOpen(true) }

  async function onSave(data: Omit<Valuation,'id'>) {
    const payload: any = { ...data }
    // send FK as `asset` to match DRF serializer expectation
    payload.asset = data.asset_id
    if (payload.initial_value != null) payload.initial_value = String(payload.initial_value)
    if (payload.current_value != null) payload.current_value = String(payload.current_value)
  const res = await fetch(`${API_BASE_URL}/api/valuations/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) {
      // try to parse validation errors
      let parsed: any = null
      let bodyText = ''
      try { parsed = await res.json(); bodyText = JSON.stringify(parsed) } catch { bodyText = await res.text().catch(() => '') }
      if (parsed && typeof parsed === 'object') {
        const summary = Object.entries(parsed).map(([k,v]: any) => `${k}: ${Array.isArray(v) ? v.join('; ') : v}`).join(' — ')
        showError('Create Failed', summary)
        const err: any = new Error('Create failed')
        err.serverErrors = parsed
        throw err
      }
      showError('Create Failed', bodyText || 'Unable to create valuation')
      throw new Error('Create failed')
    }
    const created = await res.json()
    const assetId = created.asset ?? created.asset_id
    setItems(prev => [...prev, { id: String(created.valuation_id), asset_id: assetId, valuation_date: created.valuation_date, method: created.method, initial_value: Number(created.initial_value ?? 0), current_value: Number(created.current_value ?? 0) }])
    showSuccess('Valuation Added', `Valuation for asset ${assetId} added`)
  }
  async function onUpdate(id: string, data: Omit<Valuation,'id'>) {
    const payload: any = { ...data }
    // send FK as `asset` to match DRF serializer expectation
    payload.asset = data.asset_id
    if (payload.initial_value != null) payload.initial_value = String(payload.initial_value)
    if (payload.current_value != null) payload.current_value = String(payload.current_value)
  const res = await fetch(`${API_BASE_URL}/api/valuations/${id}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) {
      let parsed: any = null
      let bodyText = ''
      try { parsed = await res.json(); bodyText = JSON.stringify(parsed) } catch { bodyText = await res.text().catch(() => '') }
      if (parsed && typeof parsed === 'object') {
        const summary = Object.entries(parsed).map(([k,v]: any) => `${k}: ${Array.isArray(v) ? v.join('; ') : v}`).join(' — ')
        showError('Update Failed', summary)
        const err: any = new Error('Update failed')
        err.serverErrors = parsed
        throw err
      }
      showError('Update Failed', bodyText || 'Unable to update valuation')
      throw new Error('Update failed')
    }
    const updated = await res.json()
    const assetId = updated.asset ?? updated.asset_id
    setItems(prev => prev.map(x => x.id === id ? { id, asset_id: assetId, valuation_date: updated.valuation_date, method: updated.method, initial_value: Number(updated.initial_value ?? 0), current_value: Number(updated.current_value ?? 0) } : x))
    showSuccess('Valuation Updated', `Valuation ${id} updated`)
  }
  async function confirmDelete() {
    if (!selected) return
  const res = await fetch(`${API_BASE_URL}/api/valuations/${selected.id}/`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) { showError('Delete Failed', 'Unable to delete valuation'); return }
    setItems(prev => prev.filter(x => x.id !== selected.id))
    setSelected(null)
    showSuccess('Valuation Deleted', `Valuation removed`)
  }

  const filtered = items.filter(i => [i.asset_id, i.method || ''].join(' ').toLowerCase().includes(search.toLowerCase()))

  function ValuationForm() {
    const isEdit = !!selected
    const [form, setForm] = useState<Omit<Valuation,'id'>>({ asset_id: selected?.asset_id || 0, valuation_date: selected?.valuation_date || '', method: selected?.method || '', initial_value: selected?.initial_value ?? 0, current_value: selected?.current_value ?? 0 })
  const [assets, setAssets] = useState<any[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string,string[]>>({})
  const assetRef = useRef<HTMLButtonElement | null>(null)
  const dateRef = useRef<HTMLInputElement | null>(null)
    useEffect(() => {
      (async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/assets/`)
          const data = await res.json()
          setAssets(data.map((x: any) => ({ id: x.asset_id, name: x.asset_name })))
        } catch (e) { /* ignore */ }
      })()
    }, [])
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center" onClick={() => setOpen(false)}>
        <div className="bg-card border border-border rounded-md p-6 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-lg font-semibold mb-4">{isEdit ? 'Edit Valuation' : 'Add Valuation'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Asset</label>
              <Select value={String(form.asset_id || '')} onValueChange={(val) => setForm({ ...form, asset_id: Number(val) || 0 })}>
                <SelectTrigger ref={assetRef}>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name} ({a.id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors['asset'] && (<div className="text-sm text-destructive mt-1">{fieldErrors['asset'].join(' ')}</div>)}
            </div>
            <div>
              <label className="text-sm">Valuation Date</label>
              <Input type="date" value={form.valuation_date || ''} onChange={(e) => setForm({ ...form, valuation_date: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="text-sm">Method</label>
              <Input placeholder="Enter valuation method (e.g., Straight-line)" value={form.method || ''} onChange={(e) => setForm({ ...form, method: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Initial Value</label>
              <Input type="number" step="0.01" placeholder="Enter initial value" value={form.initial_value ?? 0} onChange={(e) => setForm({ ...form, initial_value: Number(e.target.value || 0) })} />
            </div>
            <div>
              <label className="text-sm">Current Value</label>
              <Input type="number" step="0.01" placeholder="Enter current value" value={form.current_value ?? 0} onChange={(e) => setForm({ ...form, current_value: Number(e.target.value || 0) })} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="success" onClick={async () => {
              setServerError(null)
              setFieldErrors({})
              try {
                if (isEdit) await onUpdate(selected!.id, form)
                else await onSave(form)
                setOpen(false)
              } catch (e: any) {
                // parse server errors if present
                const msg = e?.message || 'Save failed'
                if (e?.serverErrors && typeof e.serverErrors === 'object') {
                  const map: Record<string,string[]> = {}
                  Object.entries(e.serverErrors).forEach(([k,v]) => { map[k] = Array.isArray(v) ? v.map(String) : [String(v)] })
                  setFieldErrors(map)
                  setTimeout(() => {
                    if (map['asset'] && assetRef.current) { assetRef.current.focus(); return }
                    if (map['valuation_date'] && dateRef.current) { dateRef.current.focus(); return }
                  }, 0)
                }
                setServerError(String(msg))
              }
            }}>{isEdit ? 'Update' : 'Add'}</Button>
          </div>
          {serverError && (<div className="mt-4 rounded-md bg-destructive/10 border border-destructive p-3 text-destructive text-sm">{serverError}</div>)}
        </div>
      </div>
    )
  }

  const totalValuations = items.length;
  const assetsValued = new Set(items.map(i => i.asset_id)).size;
  const recent30d = items.filter(i => i.valuation_date && (new Date(i.valuation_date) >= new Date(Date.now() - 1000*60*60*24*30))).length;
  const latestByAsset: Record<number, Valuation> = {};
  items.forEach(i => {
    const aid = Number(i.asset_id);
    if (!aid && aid !== 0) return;
    const existing = latestByAsset[aid];
    const tExisting = existing && existing.valuation_date ? new Date(existing.valuation_date).getTime() : 0;
    const tThis = i.valuation_date ? new Date(i.valuation_date).getTime() : 0;
    if (!existing || tThis >= tExisting) latestByAsset[aid] = i;
  });
  const totalCurrentValue = Object.values(latestByAsset).reduce((s, v) => s + Number(v.current_value ?? v.initial_value ?? 0), 0);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <SidebarNav />
      <main className="flex-1 p-8 bg-gradient-to-br from-white/40 to-transparent">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Asset Valuations
              </h1>
              <p className="text-lg text-muted-foreground">
                Track value changes for assets
              </p>
            </div>
            <Button 
              onClick={handleAdd} 
              className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="lg"
            >
              <Plus className="h-5 w-5"/>Add Valuation
            </Button>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Total Valuations</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{totalValuations}</p>
                  <p className="text-xs text-muted-foreground mt-1">All valuations</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ReceiptText className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Assets Valued</p>
                  <p className="text-3xl font-extrabold text-green-600 mt-2">{assetsValued}</p>
                  <p className="text-xs text-muted-foreground mt-1">Unique assets</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Recent (30d)</p>
                  <p className="text-3xl font-extrabold text-blue-600 mt-2">{recent30d}</p>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Total Current Value</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">UGX {totalCurrentValue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Sum of latest per asset</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-modern hover:shadow-xl transition-all duration-300 border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search valuations by asset or method" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="pl-11 h-12 text-base border-2 focus:border-primary transition-all" 
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 hover:bg-slate-100/50">
                  <TableHead>Asset ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Initial Value</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-colors duration-200">
                    <TableCell>{r.asset_id}</TableCell>
                    <TableCell className="text-muted-foreground">{r.valuation_date ? String(r.valuation_date).slice(0,10) : '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.method || '-'}</TableCell>
                    <TableCell>UGX {Number(r.initial_value ?? 0).toLocaleString()}</TableCell>
                    <TableCell>UGX {Number(r.current_value ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(r)} 
                          title="Edit"
                          className="hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="h-4 w-4"/>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(r)} 
                          title="Delete" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4"/>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No valuations yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        {open && <ValuationForm />}
        <ConfirmationDialog
          open={confirmOpen}
          onOpenChange={(open) => { if (!open) { setSelected(null); setConfirmOpen(false) } else setConfirmOpen(open) }}
          title="Delete Valuation"
          description={`Are you sure you want to delete this valuation?`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </main>
    </div>
  )
}





