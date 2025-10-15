"use client";

import { useState, useEffect } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, AlertCircle, Filter, Trash, DollarSign } from "lucide-react";
import { DisposalDialog, Disposal } from "@/components/disposal-dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useNotificationActions } from "@/components/notification-system";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export default function DisposalPage() {
  const [disposalRecords, setDisposalRecords] = useState<Disposal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDisposal, setSelectedDisposal] = useState<Disposal | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [disposalToDelete, setDisposalToDelete] = useState<Disposal | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [methodFilter, setMethodFilter] = useState<string>("All");
  const { showSuccess, showError } = useNotificationActions();

  // Load disposals, assets and buyers from the backend so records persist across reloads
  const [assetsLookup, setAssetsLookup] = useState<Record<string,string>>({})
  const [buyersList, setBuyersList] = useState<Array<{ id: string, name: string }>>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [dRes, aRes, bRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/disposals/`),
          fetch(`${API_BASE_URL}/api/assets/`),
          fetch(`${API_BASE_URL}/api/buyers/`),
        ])
        if (!dRes.ok) { console.error('Failed to load disposals', dRes.status); return }
        if (!aRes.ok) { console.error('Failed to load assets', aRes.status); }
        if (!bRes.ok) { console.error('Failed to load buyers', bRes.status); }

        const [dData, aData, bData] = await Promise.all([dRes.json(), aRes.json().catch(() => []), bRes.json().catch(() => [])])
        if (!mounted) return

        // build asset lookup map
        const aMap: Record<string,string> = {}
        if (Array.isArray(aData)) aData.forEach((x:any) => { aMap[String(x.asset_id ?? x.id ?? '')] = x.asset_name ?? x.name ?? `Asset ${x.asset_id ?? x.id ?? ''}` })
        setAssetsLookup(aMap)

        // buyers list for name matching
        const bList: Array<{ id: string, name: string }> = []
        if (Array.isArray(bData)) bData.forEach((x:any) => { bList.push({ id: String(x.buyer_id ?? x.id ?? ''), name: x.name ?? String(x.buyer_id ?? x.id ?? '') }) })
        setBuyersList(bList)

        // map disposals into the UI shape expected by this page
        if (Array.isArray(dData)) {
          const mapped = dData.map((r:any) => {
            const assetId = r.asset ?? r.asset_id
            const buyerId = r.buyer ?? r.buyer_id
            const salePrice = Number(r.disposal_value ?? 0)
            return {
              id: String(r.disposal_id ?? r.id ?? ''),
              asset: aMap[String(assetId)] ?? `Asset ${assetId}`,
              assetId: String(assetId ?? ''),
              disposalDate: r.disposal_date ?? '',
              disposalMethod: salePrice > 0 ? 'Sale' : 'Other',
              reason: r.reason ?? '',
              buyer: (bList.find(b => b.id === String(buyerId))?.name) ?? '',
              salePrice: salePrice,
              status: (r.disposal_date ? 'Completed' : 'Pending') as Disposal['status'],
              environmentalImpact: '' ,
              approvedBy: r.approved_by ?? r.approvedBy ?? '',
              certificateNumber: r.certificate_number ?? r.certificateNumber ?? undefined,
              createdAt: r.created_at ?? r.createdAt ?? '',
              updatedAt: r.updated_at ?? r.updatedAt ?? ''
            }
          })
          setDisposalRecords(mapped)
        }
      } catch (e) { console.error('Failed to load disposal data', e) }
    })()
    return () => { mounted = false }
  }, [])

  const filteredDisposals = disposalRecords.filter((disposal) => {
    const matchesSearch = 
      disposal.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      disposal.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      disposal.disposalMethod.toLowerCase().includes(searchQuery.toLowerCase()) ||
      disposal.buyer.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "All" || disposal.status === statusFilter
    const matchesMethod = methodFilter === "All" || disposal.disposalMethod === methodFilter
    
    return matchesSearch && matchesStatus && matchesMethod
  });

  const handleAddDisposal = async (disposalData: Omit<Disposal, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Build payload matching backend serializer: asset (pk), disposal_date, disposal_value, reason, buyer (optional pk)
    const payload: any = {
      asset: disposalData.assetId ? Number(disposalData.assetId) : null,
      disposal_date: disposalData.disposalDate || null,
      disposal_value: disposalData.salePrice != null ? String(disposalData.salePrice) : null,
      reason: disposalData.reason || ''
    }
    // attempt to map buyer name to an existing buyer id
    if (disposalData.buyer) {
      const match = buyersList.find(b => b.name === disposalData.buyer)
      if (match) payload.buyer = Number(match.id)
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/disposals/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        showError('Create Failed', body || 'Unable to create disposal')
        return
      }
      const created = await res.json()
      // map server object into current UI shape
      const assetId = created.asset ?? created.asset_id
      const buyerId = created.buyer ?? created.buyer_id
      const salePrice = Number(created.disposal_value ?? 0)
      const mapped: Disposal = {
        id: String(created.disposal_id ?? created.id ?? ''),
        asset: assetsLookup[String(assetId)] ?? `Asset ${assetId}`,
        assetId: String(assetId ?? ''),
        disposalDate: created.disposal_date ?? '',
        disposalMethod: salePrice > 0 ? 'Sale' : 'Other',
        reason: created.reason ?? '',
        buyer: buyersList.find(b => b.id === String(buyerId))?.name ?? '',
        salePrice: salePrice,
  status: (created.disposal_date ? 'Completed' : 'Pending') as Disposal['status'],
        environmentalImpact: '',
        approvedBy: created.approved_by ?? created.approvedBy ?? '',
        certificateNumber: created.certificate_number ?? created.certificateNumber ?? undefined,
        createdAt: created.created_at ?? created.createdAt ?? '',
        updatedAt: created.updated_at ?? created.updatedAt ?? ''
      }
      setDisposalRecords(prev => [...prev, mapped])
      showSuccess("Disposal Recorded", `Disposal of ${mapped.asset} has been successfully recorded.`)
    } catch (e) {
      console.error('Failed to create disposal', e)
      showError('Create Failed', String(e))
    }
  };

  const handleUpdateDisposal = async (id: string, disposalData: Omit<Disposal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const payload: any = {
      asset: disposalData.assetId ? Number(disposalData.assetId) : null,
      disposal_date: disposalData.disposalDate || null,
      disposal_value: disposalData.salePrice != null ? String(disposalData.salePrice) : null,
      reason: disposalData.reason || ''
    }
    if (disposalData.buyer) {
      const match = buyersList.find(b => b.name === disposalData.buyer)
      if (match) payload.buyer = Number(match.id)
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/disposals/${id}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        showError('Update Failed', body || 'Unable to update disposal')
        return
      }
      const updated = await res.json()
      const assetId = updated.asset ?? updated.asset_id
      const buyerId = updated.buyer ?? updated.buyer_id
      const salePrice = Number(updated.disposal_value ?? 0)
      const mapped: Disposal = {
        id: String(updated.disposal_id ?? updated.id ?? ''),
        asset: assetsLookup[String(assetId)] ?? `Asset ${assetId}`,
        assetId: String(assetId ?? ''),
        disposalDate: updated.disposal_date ?? '',
        disposalMethod: salePrice > 0 ? 'Sale' : 'Other',
        reason: updated.reason ?? '',
        buyer: buyersList.find(b => b.id === String(buyerId))?.name ?? '',
        salePrice: salePrice,
  status: (updated.disposal_date ? 'Completed' : 'Pending') as Disposal['status'],
        environmentalImpact: '',
        approvedBy: updated.approved_by ?? updated.approvedBy ?? '',
        certificateNumber: updated.certificate_number ?? updated.certificateNumber ?? undefined,
        createdAt: updated.created_at ?? updated.createdAt ?? '',
        updatedAt: updated.updated_at ?? updated.updatedAt ?? ''
      }
      setDisposalRecords(prev => prev.map(d => d.id === id ? mapped : d))
      showSuccess("Disposal Updated", `Disposal record for ${mapped.asset} has been successfully updated.`)
    } catch (e) {
      console.error('Failed to update disposal', e)
      showError('Update Failed', String(e))
    }
  };

  const handleDeleteDisposal = (disposal: Disposal) => {
    setDisposalToDelete(disposal);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (disposalToDelete) {
      (async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/disposals/${disposalToDelete.id}/`, { method: 'DELETE' })
          if (!res.ok && res.status !== 204) { showError('Delete Failed', 'Unable to delete disposal'); return }
          setDisposalRecords(prev => prev.filter(disposal => disposal.id !== disposalToDelete.id))
          showSuccess("Disposal Deleted", `Disposal record for ${disposalToDelete.asset} has been successfully deleted.`)
          setDisposalToDelete(null)
        } catch (e) { console.error('Failed to delete disposal', e); showError('Delete Failed', String(e)) }
      })()
    }
  };

  const handleEditDisposal = (disposal: Disposal) => {
    setSelectedDisposal(disposal);
    setIsDialogOpen(true);
  };

  const handleAddNewDisposal = () => {
    setSelectedDisposal(null);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "Sale":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "Recycling":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Donation":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "Destruction":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "Trade-in":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "Scrap":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getEnvironmentalColor = (impact: string) => {
    switch (impact) {
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "Controlled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // Calculate statistics
  const totalDisposals = disposalRecords.length;
  const pendingCount = disposalRecords.filter(d => d.status === "Pending").length;
  const completedCount = disposalRecords.filter(d => d.status === "Completed").length;
  const totalRevenue = disposalRecords
    .filter(d => d.disposalMethod === "Sale")
    .reduce((sum, d) => sum + d.salePrice, 0);
  const methods = [...new Set(disposalRecords.map(d => d.disposalMethod))];

  return (
    <div className="flex">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Disposal Management
            </h1>
            <p className="text-muted-foreground">
              Track asset disposal and end-of-life processes
            </p>
          </div>
          <Button variant="success" onClick={handleAddNewDisposal} className="gap-2">
            <Plus className="h-4 w-4" />
            Record Disposal
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Disposals
              </h3>
              <Trash className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalDisposals}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Pending
              </h3>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting completion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Completed
              </h3>
              <AlertCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <p className="text-xs text-muted-foreground">Completed disposals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Revenue
              </h3>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">UGX {totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From sales</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search disposal records by asset, method, or buyer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="All">All Methods</option>
                  {methods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Disposal Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Buyer/Recipient</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Environmental Impact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDisposals.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      {disposalRecords.length === 0 
                        ? "No disposal records yet. Click 'Record Disposal' to add one."
                        : "No disposal records match your search criteria."
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDisposals.map((disposal) => (
                    <TableRow key={disposal.id}>
                      <TableCell className="font-medium">
                        {disposal.asset}
                        <div className="text-xs text-muted-foreground font-mono">
                          {disposal.assetId}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(disposal.disposalDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getMethodColor(disposal.disposalMethod)}`}>
                          {disposal.disposalMethod}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(disposal.status)}`}>
                          {disposal.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {disposal.buyer || "-"}
                      </TableCell>
                      <TableCell>
                        {disposal.salePrice > 0 ? `UGX ${disposal.salePrice.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getEnvironmentalColor(disposal.environmentalImpact)}`}>
                          {disposal.environmentalImpact}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditDisposal(disposal)}
                            title="Edit disposal record"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteDisposal(disposal)}
                            title="Delete disposal record"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
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

        <DisposalDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          disposal={selectedDisposal}
          onSave={handleAddDisposal}
          onUpdate={handleUpdateDisposal}
        />

        <ConfirmationDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete Disposal Record"
          description={`Are you sure you want to delete the disposal record for "${disposalToDelete?.asset}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </main>
    </div>
  );
}
