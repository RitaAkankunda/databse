"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface Maintenance {
  id: string
  asset_id: string
  // canonical date for the maintenance event
  maintenance_date: string
  description: string
  cost: number
  staff_id?: string
  performed_by?: string
  notes?: string
  createdAt: string
  updatedAt: string
  // legacy/backwards-compatible fields (optional)
  asset?: string
  assetId?: string
  maintenanceType?: string
  scheduledDate?: string
  completedDate?: string
  performedBy?: string
  status?: string
}

interface MaintenanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  maintenance?: Maintenance | null
  onSave: (maintenance: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdate: (id: string, maintenance: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>) => void
}

export function MaintenanceDialog({ open, onOpenChange, maintenance, onSave, onUpdate }: MaintenanceDialogProps) {
  const isEdit = !!maintenance
  const [formData, setFormData] = useState<any>({
    asset_id: "",
    maintenance_date: "",
    description: "",
    cost: 0,
    staff_id: "",
    performed_by: "",
    notes: ""
  })

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  const [assets, setAssets] = useState<any[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [staff, setStaff] = useState<any[]>([])

  useEffect(() => {
    if (maintenance) {
      setFormData({
        asset_id: maintenance.asset_id ?? maintenance.assetId ?? maintenance.asset ?? "",
        maintenance_date: maintenance.maintenance_date ?? maintenance.scheduledDate ?? "",
        description: maintenance.description ?? maintenance.notes ?? "",
        cost: maintenance.cost ?? 0,
  staff_id: maintenance.staff_id ?? maintenance.performedBy ?? maintenance.performed_by ?? "",
  performed_by: maintenance.performed_by ?? maintenance.performedBy ?? "",
        notes: maintenance.notes || ""
      })
    } else {
      setFormData({
        asset_id: "",
        maintenance_date: "",
        description: "",
        cost: 0,
        staff_id: "",
        performed_by: "",
        notes: ""
      })
    }
  }, [maintenance, open])

  // Load assets for the dropdown so it matches the Assets page
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setAssetsLoading(true)
        const res = await fetch(`${API_BASE_URL}/api/assets/`)
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        if (Array.isArray(data)) setAssets(data.map((x:any) => ({ id: String(x.asset_id ?? x.id ?? ''), name: x.asset_name ?? x.name ?? `Asset ${x.asset_id ?? x.id ?? ''}` })))
      } catch (e) { /* ignore */ } finally { setAssetsLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  // Load maintenance staff for the staff select
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/maintenance-staff/`)
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        if (Array.isArray(data)) setStaff(data.map((s:any) => ({ id: String(s.m_staff_id ?? s.id ?? ''), name: s.name })))
      } catch (e) { /* ignore */ }
    })()
    return () => { mounted = false }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!String(formData.asset_id || '').trim() || !String(formData.maintenance_date || '').trim()) {
      alert("Please fill in required fields: Asset and Maintenance Date")
      return
    }

    const maintenanceData = {
      asset_id: String(formData.asset_id),
      maintenance_date: String(formData.maintenance_date),
      description: String(formData.description || ''),
      cost: Number(formData.cost || 0),
      staff_id: String(formData.staff_id || ''),
      performed_by: String(formData.performed_by || ''),
      notes: formData.notes || undefined
    }

    if (isEdit && maintenance) {
      onUpdate(maintenance.id, maintenanceData)
    } else {
      onSave(maintenanceData)
    }
    onOpenChange(false)
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev:any) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAssetChange = (value: string) => {
    // value is expected to be the asset id (e.g. AST-001)
    setFormData((prev:any) => ({ ...prev, asset_id: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Maintenance Record" : "Schedule New Maintenance"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the maintenance record below."
              : "Fill in the details to schedule a new maintenance task."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="asset">Asset ID *</Label>
                <Select value={formData.asset_id || ""} onValueChange={handleAssetChange}>
                  <SelectTrigger>
                    <div className="flex items-center justify-between">
                      <SelectValue placeholder="Select asset" />
                      {assetsLoading ? (
                        <svg className="animate-spin h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                      ) : null}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {assets.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">No assets available</div>
                    ) : (
                      assets.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name} ({a.id})</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance_date">Maintenance Date *</Label>
                <Input id="maintenance_date" type="date" value={formData.maintenance_date || ''} onChange={(e) => handleInputChange('maintenance_date', e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter maintenance description..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staff_id">Staff</Label>
                <Select value={formData.staff_id || ''} onValueChange={(v) => handleInputChange('staff_id', v)}>
                  <SelectTrigger>
                    <div className="flex items-center justify-between">
                      <SelectValue placeholder="Select staff" />
                      {assetsLoading ? (
                        <svg className="animate-spin h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                      ) : null}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {staff.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">No staff available</div>
                    ) : (
                      staff.map(s => (<SelectItem key={s.id} value={s.id}>{s.name} ({s.id})</SelectItem>))
                    )}
                  </SelectContent>
                </Select>
                <div>
                  <Label htmlFor="performed_by">Performed By</Label>
                  <Input id="performed_by" placeholder="Technician name" value={formData.performed_by || ''} onChange={(e) => handleInputChange('performed_by', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (UGX)</Label>
                <Input id="cost" type="number" step="0.01" placeholder="0.00" value={formData.cost} onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Additional notes about the maintenance..." value={formData.notes || ''} onChange={(e) => handleInputChange('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success">{isEdit ? "Update Maintenance" : "Schedule Maintenance"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
