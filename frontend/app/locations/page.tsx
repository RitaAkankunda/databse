"use client"

import { useEffect, useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, MapPin, Package } from "lucide-react"
import { LocationDialog, type LocationRecord } from "@/components/location-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useNotificationActions } from "@/components/notification-system"
import StatsCards from "@/components/stats-cards"
import usePolling from "@/lib/usePolling"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export default function LocationsPage() {
  const [items, setItems] = useState<LocationRecord[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<LocationRecord | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { showSuccess, showError } = useNotificationActions()

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/locations/`)
        const data = await res.json()
        setItems(data.map((r: any) => ({ id: String(r.location_id), building: r.building || "", postal_address: r.postal_address || "", geographical_location: r.geographical_location || "" })))
      } catch (e) { console.error(e) }
    })()
  }, [])

  function handleAdd() { setSelected(null); setOpen(true) }
  function handleEdit(r: LocationRecord) { setSelected(r); setOpen(true) }
  function handleDelete(r: LocationRecord) { setSelected(r); setConfirmOpen(true) }

  async function onSave(data: Omit<LocationRecord,'id'>) {
    const res = await fetch(`${API_BASE_URL}/api/locations/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) { showError('Create Failed', 'Unable to create location'); throw new Error('Create failed') }
    const created = await res.json()
    setItems(prev => [...prev, { id: String(created.location_id), building: created.building || "", postal_address: created.postal_address || "", geographical_location: created.geographical_location || "" }])
    showSuccess('Location Added', `Location ${created.building || ''} added`)
  }
  async function onUpdate(id: string, data: Omit<LocationRecord,'id'>) {
    const res = await fetch(`${API_BASE_URL}/api/locations/${id}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) { showError('Update Failed', 'Unable to update location'); throw new Error('Update failed') }
    const updated = await res.json()
    setItems(prev => prev.map(x => x.id === id ? { id, building: updated.building || "", postal_address: updated.postal_address || "", geographical_location: updated.geographical_location || "" } : x))
    showSuccess('Location Updated', `Location ${updated.building || ''} updated`)
  }
  async function confirmDelete() {
    if (!selected) return
    const res = await fetch(`${API_BASE_URL}/api/locations/${selected.id}/`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) { showError('Delete Failed', 'Unable to delete location'); throw new Error('Delete failed') }
    setItems(prev => prev.filter(x => x.id !== selected.id))
    setSelected(null)
    showSuccess('Location Deleted', `Location deleted`)
  }

  const filtered = items.filter(i => [i.building, i.postal_address, i.geographical_location].join(' ').toLowerCase().includes(search.toLowerCase()))

  // Live stats: poll locations and assets to compute counts
  const { data: polledLocations } = usePolling<any[]>(`${API_BASE_URL}/api/locations/`, 30000, !open && !confirmOpen)
  const { data: polledAssets } = usePolling<any[]>(`${API_BASE_URL}/api/assets/`, 30000, !open && !confirmOpen)

  const locationsList: any[] = Array.isArray(polledLocations) ? polledLocations : items
  // if polledLocations is available, keep `items` in sync so the table auto-refreshes
  useEffect(() => {
    if (Array.isArray(polledLocations)) {
      setItems(polledLocations.map((r: any) => ({ id: String(r.location_id), building: r.building || "", postal_address: r.postal_address || "", geographical_location: r.geographical_location || "", created_at: r.created_at || r.created || null })))
    }
  }, [polledLocations])
  const assetsList: any[] = Array.isArray(polledAssets) ? polledAssets : []

  const totalLocations = (locationsList || []).length
  // assume assets have a 'location' or 'location_id' field referencing location_id
  const countByLocation = new Map<string, number>()
  assetsList.forEach((a: any) => {
    const lid = String(a.location ?? a.location_id ?? '')
    if (!lid) return
    countByLocation.set(lid, (countByLocation.get(lid) || 0) + 1)
  })
  const locationsWithAssets = Array.from(countByLocation.keys()).length
  const emptyLocations = Math.max(0, totalLocations - locationsWithAssets)
  // recent additions: locations created in the last 30 days (assume 'created_at' field)
  const now = new Date()
  const in30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const recentAdditions = (locationsList || []).filter((l: any) => {
    const t = l.created_at ?? l.created ?? null
    if (!t) return false
    const d = new Date(t)
    if (Number.isNaN(d.getTime())) return false
    return d >= in30d && d <= now
  }).length

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <SidebarNav />
      <main className="flex-1 p-8 bg-gradient-to-br from-white/40 to-transparent">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Locations Management
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage physical locations where assets reside
              </p>
            </div>
            <Button 
              onClick={handleAdd} 
              className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="lg"
            >
              <Plus className="h-5 w-5"/>Add Location
            </Button>
          </div>
        </div>

        {/* Enhanced Stats cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Total Locations</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{totalLocations}</p>
                  <p className="text-xs text-muted-foreground mt-1">All locations</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MapPin className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">With Assets</p>
                  <p className="text-3xl font-extrabold text-green-600 mt-2">{locationsWithAssets}</p>
                  <p className="text-xs text-muted-foreground mt-1">Locations with assets</p>
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
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Empty</p>
                  <p className="text-3xl font-extrabold text-blue-600 mt-2">{emptyLocations}</p>
                  <p className="text-xs text-muted-foreground mt-1">No assets</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MapPin className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Recent (30d)</p>
                  <p className="text-3xl font-extrabold text-orange-600 mt-2">{recentAdditions}</p>
                  <p className="text-xs text-muted-foreground mt-1">Added last 30 days</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MapPin className="h-7 w-7 text-white" />
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
                  placeholder="Search by building, postal, or geographic..." 
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
                  <TableHead>Building</TableHead>
                  <TableHead>Postal Address</TableHead>
                  <TableHead>Geographical Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-colors duration-200">
                    <TableCell>{r.building || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.postal_address || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.geographical_location || '-'}</TableCell>
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
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">No locations yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <LocationDialog open={open} onOpenChange={setOpen} location={selected} onSave={onSave} onUpdate={onUpdate} />
        <ConfirmationDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete Location" description={`Are you sure you want to delete "${selected?.building || ''}"? This cannot be undone.`} confirmText="Delete" cancelText="Cancel" onConfirm={confirmDelete} variant="destructive" />
      </main>
    </div>
  )
}





