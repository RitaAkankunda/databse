"use client"

import { useEffect, useState, useRef } from "react"
import { mapServerErrorsToFieldErrors, friendlySummary } from "@/lib/formUtils"
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

export interface LocationRecord {
  id: string
  building?: string
  postal_address?: string
  geographical_location?: string
}

interface LocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  location?: LocationRecord | null
  onSave: (loc: Omit<LocationRecord, 'id'>) => void
  onUpdate: (id: string, loc: Omit<LocationRecord, 'id'>) => void
}

export function LocationDialog({ open, onOpenChange, location, onSave, onUpdate }: LocationDialogProps) {
  const isEdit = !!location
  const [formData, setFormData] = useState<Omit<LocationRecord, 'id'>>({
    building: "",
    postal_address: "",
    geographical_location: "",
  })
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string,string[]>>({})
  const buildingRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (location) {
      setFormData({
        building: location.building || "",
        postal_address: location.postal_address || "",
        geographical_location: location.geographical_location || "",
      })
    } else {
      setFormData({ building: "", postal_address: "", geographical_location: "" })
    }
  }, [location, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (isEdit && location) {
        await onUpdate(location.id, formData)
      } else {
        await onSave(formData)
      }
      onOpenChange(false)
    } catch (err) {
      // attach inline errors if present
      const parsed = (err as any)?.serverErrors
      if (parsed) {
        const map = mapServerErrorsToFieldErrors(parsed)
        setFieldErrors(map)
        setServerError(friendlySummary(parsed))
        setTimeout(() => { if (map['building'] && buildingRef.current) buildingRef.current.focus() }, 0)
      } else {
        console.error('Save failed', err)
      }
    }
  }

  function onChange(field: keyof Omit<LocationRecord, 'id'>, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Location" : "Add New Location"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the location details below." : "Fill in the details to add a new location."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="building">Building</Label>
              <Input ref={buildingRef} id="building" value={formData.building} onChange={(e) => onChange('building', e.target.value)} placeholder="Enter building (e.g., Block A)" />
              {fieldErrors['building'] && <div className="text-sm text-destructive">{fieldErrors['building'].join(' ')}</div>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal">Postal Address</Label>
              <Input id="postal" value={formData.postal_address} onChange={(e) => onChange('postal_address', e.target.value)} placeholder="Enter postal address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="geo">Geographical Location</Label>
              <Input id="geo" value={formData.geographical_location} onChange={(e) => onChange('geographical_location', e.target.value)} placeholder="Enter geographical location" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEdit ? "Update Location" : "Add Location"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


