"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface MaintenanceStaffRecord {
  id: string
  name: string
  phone?: string
  email?: string
  specialization?: string
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  staff?: MaintenanceStaffRecord | null
  onSave: (data: Omit<MaintenanceStaffRecord, 'id'>) => void
  onUpdate: (id: string, data: Omit<MaintenanceStaffRecord, 'id'>) => void
}

export function MaintenanceStaffDialog({ open, onOpenChange, staff, onSave, onUpdate }: Props) {
  const isEdit = !!staff
  const [form, setForm] = useState<Omit<MaintenanceStaffRecord, 'id'>>({ name: "", phone: "", email: "", specialization: "" })

  useEffect(() => {
    if (staff) setForm({ name: staff.name || "", phone: staff.phone || "", email: staff.email || "", specialization: staff.specialization || "" })
    else setForm({ name: "", phone: "", email: "", specialization: "" })
  }, [staff, open])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (isEdit && staff) onUpdate(staff.id, form)
    else onSave(form)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Maintenance Staff" : "Add Maintenance Staff"}</DialogTitle>
          <DialogDescription>Enter staff details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="Enter full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="Enter phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spec">Specialization</Label>
              <Input id="spec" placeholder="Enter specialization (e.g., HVAC)" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="success">{isEdit ? "Update" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}





