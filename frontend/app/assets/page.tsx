"use client";

import { useState, useEffect } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useNotificationActions } from "@/components/notification-system";
import StatsCards from "@/components/stats-cards"
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AssetDialog } from "@/components/asset-dialog";
import usePolling from "@/lib/usePolling"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
type ApiAsset = {
  asset_id: number;
  asset_name: string;
  serial_number?: string | null;
  status?: string | null;
  purchase_cost?: number | null;
  category_id?: number | null;
  category_name?: string | null;
  category?: { category_name?: string | null } | null;
  location_id?: number | null;
  supplier_id?: number | null;
  purchase_date?: string | null;
  warranty_expiry?: string | null;
};

export default function AssetsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const { showSuccess, showError } = useNotificationActions()
 
  const [assets, setAssets] = useState<any[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([])
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<any | null>(null)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [assignedMap, setAssignedMap] = useState<Record<string,string>>({})
  const [assignedMapReady, setAssignedMapReady] = useState(false)

  // Helper to map a user id (string or number) to a display name using
  // the most recently polled users. Falls back to null when unknown.
  const userNameFromId = (id?: string | number | null) => {
    if (!id) return null
    const sid = String(id)
    const users = Array.isArray(polledUsers) ? polledUsers : []
    const u = users.find((x:any) => String(x.user_id ?? x.id ?? x.pk ?? '') === sid)
  if (u) return u.name ?? u.full_name ?? u.username ?? String(u.user_id ?? u.id ?? '')
    return null
  }

  // Poll assets for live updates
  const { data: polledAssets } = usePolling<any[]>(`${API_BASE_URL}/api/assets/`, 15000, !isDialogOpen && !deleteConfirmOpen)
  useEffect(() => {
    if (Array.isArray(polledAssets)) {
      setAssets(polledAssets.map(a => ({
        id: String(a.asset_id),
        name: a.asset_name,
        serialNumber: a.serial_number ?? '',
        status: a.status ?? 'Active',
        purchasePrice: a.purchase_cost ?? 0,
        currentValue: a.purchase_cost ?? 0,
        classification: a.category_id ?? null,
        assignedUser: '-',
        categoryId: a.category_id ?? null,
        categoryName: a.category_name ?? (a.category ? (a.category.category_name || null) : null) ?? null,
        locationId: a.location_id ?? null,
        supplierId: a.supplier_id ?? null,
        purchaseDate: a.purchase_date ? String(a.purchase_date).slice(0, 10) : '',
        warrantyExpiry: a.warranty_expiry ? String(a.warranty_expiry).slice(0, 10) : '',
      })))
    }
  }, [polledAssets])

  // Poll lookups so names are kept in sync (less frequent)
  const { data: polledCategories } = usePolling<any[]>(`${API_BASE_URL}/api/categories/`, 60000, !isDialogOpen && !deleteConfirmOpen)
  const { data: polledLocations } = usePolling<any[]>(`${API_BASE_URL}/api/locations/`, 60000, !isDialogOpen && !deleteConfirmOpen)
  const { data: polledSuppliers } = usePolling<any[]>(`${API_BASE_URL}/api/suppliers/`, 60000, !isDialogOpen && !deleteConfirmOpen)
  // Poll assignments and users so we can show current assignee in the Assets table
  const { data: polledAssignments } = usePolling<any[]>(`${API_BASE_URL}/api/assignments/`, 15000, !isDialogOpen && !deleteConfirmOpen)
  const { data: polledUsers } = usePolling<any[]>(`${API_BASE_URL}/api/users/`, 60000, !isDialogOpen && !deleteConfirmOpen)
  useEffect(() => { if (Array.isArray(polledCategories)) setCategories(polledCategories.map((x:any) => ({ id: x.category_id, name: x.category_name }))) }, [polledCategories])
  useEffect(() => { if (Array.isArray(polledLocations)) setLocations(polledLocations.map((x:any) => ({ id: x.location_id, name: x.building || x.geographical_location || `Loc ${x.location_id}` }))) }, [polledLocations])
  useEffect(() => { if (Array.isArray(polledSuppliers)) setSuppliers(polledSuppliers.map((x:any) => ({ id: x.supplier_id, name: x.name }))) }, [polledSuppliers])

  // Build a map assetId -> current assignee name (choose latest non-returned assignment)
  useEffect(() => {
    setAssignedMapReady(false)
    try {
      const assignments = Array.isArray(polledAssignments) ? polledAssignments : []
      const users = Array.isArray(polledUsers) ? polledUsers : []
      const userMap: Record<string,string> = {}
      users.forEach((u:any) => {
        const uid = String(u.user_id ?? u.id ?? (typeof u === 'object' && (u.pk ?? u.pk) ? u.pk : ''))
  userMap[uid] = u.name ?? u.full_name ?? u.username ?? (`User ${uid}`)
      })

      const normalizeAssetId = (a: any) => {
        if (!a) return ''
        if (typeof a === 'string' || typeof a === 'number') return String(a)
        if (typeof a === 'object') return String(a.asset_id ?? a.id ?? a.pk ?? '')
        return ''
      }
      const normalizeUserId = (u: any) => {
        if (!u) return ''
        if (typeof u === 'string' || typeof u === 'number') return String(u)
        if (typeof u === 'object') return String(u.user_id ?? u.id ?? u.pk ?? '')
        return ''
      }

      const byAsset: Record<string, any[]> = {}
      assignments.forEach((a:any) => {
        const aid = normalizeAssetId(a.asset ?? a.asset_id ?? a)
        if (!aid) return
        byAsset[aid] = byAsset[aid] || []
        byAsset[aid].push(a)
      })

      const map: Record<string,string> = {}
      Object.entries(byAsset).forEach(([assetId, arr]) => {
        // prefer assignments not marked 'returned' and pick latest by assigned_date
        const candidates = arr.filter((it:any) => String((it.status||'').toLowerCase()) !== 'returned')
        const pick = (candidates.length ? candidates : arr).sort((x:any,y:any) => {
          const tx = x.assigned_date ? new Date(x.assigned_date).getTime() : 0
          const ty = y.assigned_date ? new Date(y.assigned_date).getTime() : 0
          return ty - tx
        })[0]
        if (pick) {
          const uid = normalizeUserId(pick.user ?? pick.user_id ?? pick.user_id ?? pick.user)
          map[assetId] = userMap[uid] ?? (`User ${uid}`)
        }
      })
      setAssignedMap(map)
      // dev helper: briefly log the map so you can inspect it in the console
      try { console.debug('assignedMap', map) } catch {}
      setAssignedMapReady(true)
    } catch (e) { console.error(e); setAssignedMapReady(true) }
  }, [polledAssignments, polledUsers])

  const filteredAssets = assets.filter((asset) => {
    const q = searchQuery.toLowerCase();
    return (
      String(asset.name || "").toLowerCase().includes(q) ||
      String(asset.serialNumber || "").toLowerCase().includes(q)
    );
  });

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(filteredAssets.map(a => a.id))
    else setSelectedIds([])
  }

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id))
  }

  const exportSelected = () => {
    const rows = assets.filter(a => selectedIds.includes(a.id))
    if (rows.length === 0) return
    const headers = ['id','name','serialNumber','categoryName','status','purchasePrice']
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => `"${String((r as any)[h] ?? '')}"`).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assets_export_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function performBulkDelete() {
    if (selectedIds.length === 0) return
    try {
      await Promise.all(selectedIds.map(id => fetch(`${API_BASE_URL}/api/assets/${id}/`, { method: 'DELETE' })))
      setAssets(prev => prev.filter(a => !selectedIds.includes(a.id)))
      showSuccess('Assets Deleted', `${selectedIds.length} assets removed`)
      setSelectedIds([])
    } catch (e) {
      console.error(e)
      showError('Bulk Delete Failed', 'Unable to delete some assets')
    } finally {
      setBulkDeleteConfirmOpen(false)
    }
  }




  // Removed duplicate filteredAssets declaration for mockAssets


  const handleEdit = (asset: any) => {
    setSelectedAsset(asset);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedAsset(null);
    setIsDialogOpen(true);
  };

  // Prompt the user before deleting an asset
  function handleDelete(asset: any) {
    setAssetToDelete(asset)
    setDeleteConfirmOpen(true)
  }

  // Perform deletion after user confirms
  async function performDelete(asset: any) {
    if (!asset) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/assets/${asset.id}/`, { method: 'DELETE' })
    // compute summary stats
    const totalAssets = assets.length;
    const activeAssets = assets.filter(a => (a.status || '').toLowerCase() === 'active').length;
    const inactiveAssets = totalAssets - activeAssets;
    const assetsTotalCost = assets.reduce((sum, a) => sum + Number(a.purchasePrice || 0), 0);
      if (!res.ok && res.status !== 204) { showError('Delete Failed', 'Unable to delete asset'); return }
      setAssets(prev => prev.filter(a => a.id !== asset.id))
      showSuccess('Asset Deleted', `${asset.name} removed`)
    } catch (e) {
      console.error(e)
      showError('Delete Failed', 'Unable to delete asset')
    } finally {
      setAssetToDelete(null)
      setDeleteConfirmOpen(false)
    }
  }

  useEffect(() => {
    function onSubmit(e: any) {
  const detail = e.detail || {}
  // DRF DateField expects 'YYYY-MM-DD'. The dialog supplies a date
  // input value in that format already; ensure we send only the date
  // portion (no timezone/ISO time) to avoid "Date has wrong format" errors.
  const toIsoDate = (d?: string | null) => (d ? String(d).slice(0, 10) : null)
  if (selectedAsset) {
        // Update
  fetch(`${API_BASE_URL}/api/assets/${selectedAsset.id}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset_name: detail.name,
            serial_number: detail.serialNumber,
            purchase_cost: detail.purchasePrice,
            status: detail.status,
            category_id: detail.categoryId,
            location_id: detail.locationId,
            supplier_id: detail.supplierId,
            purchase_date: toIsoDate(detail.purchaseDate),
            warranty_expiry: toIsoDate(detail.warrantyExpiry),
          })
        }).then(async (res) => {
          if (!res.ok) {
            // Try to read JSON error body, fall back to text
            let bodyText = ''
            try {
              const json = await res.json()
              bodyText = typeof json === 'string' ? json : JSON.stringify(json)
            } catch {
              bodyText = await res.text().catch(() => '')
            }
            console.error('Update asset failed', res.status, bodyText)
            showError('Update Failed', bodyText || 'Unable to update asset')
            // Inform dialog about error so it can display inline messages
            window.dispatchEvent(new CustomEvent('asset:submit:error', { detail: { message: bodyText } }))
            return
          }
          const updated: ApiAsset = await res.json()
          setAssets(prev => prev.map(a => a.id === String(updated.asset_id) ? {
            ...a,
            name: updated.asset_name,
            serialNumber: updated.serial_number ?? '',
            status: updated.status ?? 'Active',
            purchasePrice: updated.purchase_cost ?? 0,
            currentValue: updated.purchase_cost ?? 0,
            categoryId: updated.category_id ?? null,
            categoryName: updated.category_name ?? (updated.category ? (updated.category.category_name || null) : null) ?? null,
          } : a))
          // Close dialog on success and clear selection
          setIsDialogOpen(false)
          setSelectedAsset(null)
          showSuccess('Asset Updated', `${updated.asset_name} updated`)
        }).catch((err) => {
          console.error(err)
        })
      } else {
        // Create
  fetch(`${API_BASE_URL}/api/assets/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset_name: detail.name,
            serial_number: detail.serialNumber,
            purchase_cost: detail.purchasePrice,
            status: detail.status,
            category_id: detail.categoryId,
            location_id: detail.locationId,
            supplier_id: detail.supplierId,
            purchase_date: toIsoDate(detail.purchaseDate),
            warranty_expiry: toIsoDate(detail.warrantyExpiry),
            // accept optional assignedTo id from dialog (frontend will
            // send `assignedTo` as user id string when the select is used)
            assigned_to: detail.assignedTo ?? null,
          })
        }).then(async (res) => {
          if (!res.ok) {
            let bodyText = ''
            try {
              const json = await res.json()
              bodyText = typeof json === 'string' ? json : JSON.stringify(json)
            } catch {
              bodyText = await res.text().catch(() => '')
            }
            console.error('Create asset failed', res.status, bodyText)
            showError('Create Failed', bodyText || 'Unable to create asset')
            window.dispatchEvent(new CustomEvent('asset:submit:error', { detail: { message: bodyText } }))
            return
          }
          const created: ApiAsset = await res.json()
          // If the dialog supplied an assignedTo id, create an Assignment
          // linking the newly created asset to that user. This is optimistic
          // and non-transactional; backend nested-create would be better but
          // requires serializer changes server-side.
          if (detail.assignedTo) {
            try {
              const payload = {
                asset: created.asset_id,
                user: Number(detail.assignedTo),
                assigned_date: new Date().toISOString().slice(0,10),
                status: 'Active'
              }
              const ares = await fetch(`${API_BASE_URL}/api/assignments/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
              if (!ares.ok) {
                // ignore assignment failures but log for debugging
                let atxt = ''
                try { const j = await ares.json(); atxt = JSON.stringify(j) } catch { atxt = await ares.text().catch(()=>'') }
                console.warn('Assignment create failed', ares.status, atxt)
              } else {
                // injection: keep assets list in sync by setting assignedUser
                const asum = await ares.json()
                setAssets(prev => prev.map(a => a.id === String(created.asset_id) ? ({ ...a, assignedUser: (asum.user_name || asum.user || String(detail.assigned || detail.user || detail.assignedTo || detail.user_id || detail.user)) }) : a))
              }
            } catch (err) {
              console.error('Failed to create assignment after asset create', err)
            }
          }
          setAssets(prev => [...prev, {
            id: String(created.asset_id),
            name: created.asset_name,
            serialNumber: created.serial_number ?? '',
            status: created.status ?? 'Active',
            purchasePrice: created.purchase_cost ?? 0,
            currentValue: created.purchase_cost ?? 0,
            classification: '-',
            categoryId: created.category_id ?? null,
            categoryName: created.category_name ?? (created.category ? (created.category.category_name || null) : null) ?? null,
            assignedUser: detail.assignedTo ? (userNameFromId(detail.assignedTo) || '-') : '-',
          }])
          setIsDialogOpen(false)
          setSelectedAsset(null)
          showSuccess('Asset Added', `${created.asset_name} added`)
        }).catch((err) => {
          console.error(err)
        })
      }
    }
    window.addEventListener('asset:submit', onSubmit as any)
    return () => window.removeEventListener('asset:submit', onSubmit as any)
  }, [selectedAsset])
  return (
    <div className="flex">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assets</h1>
            <p className="text-muted-foreground">
              Manage and track all your assets
            </p>
          </div>
          <Button variant="success" onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </div>
        {/* Top statistics cards */}
        <StatsCards stats={[
          { title: 'Total Assets', value: <span className="text-purple-600">{assets.length}</span>, subtitle: 'All assets' },
          { title: 'Active', value: <span className="text-green-600">{assets.filter(a => (a.status || '').toLowerCase() === 'active').length}</span>, subtitle: 'Active assets' },
          { title: 'Inactive', value: <span className="text-red-600">{assets.filter(a => (a.status || '').toLowerCase() !== 'active').length}</span>, subtitle: 'Inactive assets' },
          { title: 'Total Cost', value: <span className="text-purple-600">UGX {assets.reduce((s,a) => s + Number(a.purchasePrice||0), 0).toLocaleString()}</span>, subtitle: 'All assets' },
        ]} />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search assets by name or serial number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
              {selectedIds.length > 0 && (
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="text-sm text-foreground">{selectedIds.length} selected</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={exportSelected}>Export</Button>
                    <Button variant="destructive" onClick={() => setBulkDeleteConfirmOpen(true)}>Delete</Button>
                  </div>
                </div>
              )}

              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      role="checkbox"
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredAssets.length}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="accent-primary"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Warranty Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center text-muted-foreground"
                    >
                      No assets yet. Click "Add Asset" to create your first
                      record.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="w-12">
                        <input role="checkbox" type="checkbox" checked={selectedIds.includes(asset.id)} onChange={(e) => toggleSelectOne(asset.id, e.target.checked)} className="accent-primary" />
                      </TableCell>
                      <TableCell className="font-medium">
                        {asset.name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {asset.categoryName ?? '-' }
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {asset.serialNumber}
                      </TableCell>
                      <TableCell>{locations.find(l => l.id === asset.locationId)?.name ?? '-'}</TableCell>
                      <TableCell>{suppliers.find(s => s.id === asset.supplierId)?.name ?? '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{asset.purchaseDate || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{asset.warrantyExpiry || '-'}</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {asset.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        UGX {asset.purchasePrice.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        UGX {asset.currentValue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(asset)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(asset)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <AssetDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          asset={selectedAsset}
          categories={categories}
          locations={locations}
          suppliers={suppliers}

        />
        <ConfirmationDialog open={bulkDeleteConfirmOpen} onOpenChange={(open) => { if (!open) setBulkDeleteConfirmOpen(false) }} title="Delete assets" description={`Are you sure you want to delete ${selectedIds.length} selected assets? This action cannot be undone.`} confirmText="Delete" variant="destructive" onConfirm={performBulkDelete} />
        <ConfirmationDialog
          open={deleteConfirmOpen}
          onOpenChange={(open) => { if (!open) { setAssetToDelete(null); setDeleteConfirmOpen(false) } else setDeleteConfirmOpen(open) }}
          title="Delete asset"
          description={assetToDelete ? `Are you sure you want to delete "${assetToDelete.name}"? This action cannot be undone.` : 'Are you sure?'}
          confirmText="Delete"
          variant="destructive"
          onConfirm={() => performDelete(assetToDelete)}
        />
      </main>
    </div>
  );
}
