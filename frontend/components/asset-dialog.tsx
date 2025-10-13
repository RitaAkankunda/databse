"use client"

import { useEffect, useState } from "react"
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

interface AssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: any
  categories?: Array<{ id: number; name: string }>
  suppliers?: Array<{ id: number; name: string }>
  locations?: Array<{ id: number; name: string }>
}

const USERS_STORAGE_KEY = "ams.usersDirectory";
function getUserNames(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((u: any) => String(u.name || "")).filter(Boolean)
  } catch { return [] }
}

export function AssetDialog({ open, onOpenChange, asset, categories = [], suppliers = [], locations = [] }: AssetDialogProps) {
  const isEdit = !!asset
  const [userOptions, setUserOptions] = useState<string[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [serialNumber, setSerialNumber] = useState("")
  const [purchasePrice, setPurchasePrice] = useState("")
  const [status, setStatus] = useState("Active")
  const [categoryId, setCategoryId] = useState<string>("")
  const [locationId, setLocationId] = useState<string>("")
  const [supplierId, setSupplierId] = useState<string>("")
  const [purchaseDate, setPurchaseDate] = useState("")
  const [warrantyExpiry, setWarrantyExpiry] = useState("")
  const [currentValue, setCurrentValue] = useState("")

  useEffect(() => {
    setUserOptions(getUserNames())
    if (asset) {
      setName(asset.name ?? "")
      setSerialNumber(asset.serialNumber ?? "")
      setPurchasePrice(String(asset.purchasePrice ?? ""))
      setStatus(asset.status ?? "Active")
      setCategoryId(asset.categoryId ? String(asset.categoryId) : "")
      setLocationId(asset.locationId ? String(asset.locationId) : "")
      setSupplierId(asset.supplierId ? String(asset.supplierId) : "")
      const fmt = (d?: string) => (d ? String(d).slice(0, 10) : "")
      setPurchaseDate(fmt(asset.purchaseDate))
      setWarrantyExpiry(fmt(asset.warrantyExpiry))
      setCurrentValue(String(asset.currentValue ?? ""))
    } else {
      setName("")
      setSerialNumber("")
      setPurchasePrice("")
      setStatus("Active")
      setCategoryId("")
      setLocationId("")
      setSupplierId("")
      setPurchaseDate("")
      setWarrantyExpiry("")
      setCurrentValue("")
    }
  }, [asset, open])

  useEffect(() => {
    function onError(e: any) {
      setServerError(e?.detail?.message || String(e?.detail || 'Server error'))
    }
    window.addEventListener('asset:submit:error', onError as any)
    return () => window.removeEventListener('asset:submit:error', onError as any)
  }, [])

  function handleSubmit() {
    const result = {
      name: name.trim(),
      serialNumber: serialNumber.trim(),
      purchasePrice: Number(purchasePrice || 0),
      currentValue: Number(currentValue || purchasePrice || 0),
      status,
      categoryId: categoryId ? Number(categoryId) : null,
      locationId: locationId ? Number(locationId) : null,
      supplierId: supplierId ? Number(supplierId) : null,
      purchaseDate: purchaseDate || null,
      warrantyExpiry: warrantyExpiry || null,
    }
    // Bubble result via custom event on dialog element for parent to capture
    const evt = new CustomEvent("asset:submit", { detail: result })
    window.dispatchEvent(evt)
      // Do not close the dialog here; the parent component should close the
      // dialog only after the API call succeeds so the user sees validation
      // errors when they occur. This lets the parent await the network result
      // and call `onOpenChange(false)` when appropriate.
      // onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Asset" : "Add New Asset"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the asset information below." : "Fill in the details to add a new asset to the system."}
          </DialogDescription>
        </DialogHeader>
        {serverError ? (
          <div className="mx-6 -mt-4 mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
            {serverError}
          </div>
        ) : null}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name</Label>
              <Input id="name" placeholder="Enter asset name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input id="serialNumber" placeholder="Enter serial number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input id="purchasePrice" type="number" step="0.01" placeholder="Enter purchase price" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Value</Label>
              <Input id="currentValue" type="number" step="0.01" placeholder="Enter current value" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input id="purchaseDate" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
              <Input id="warrantyExpiry" type="date" value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Disposed">Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{isEdit ? "Update Asset" : "Add Asset"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
