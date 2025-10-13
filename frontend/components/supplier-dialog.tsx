"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { mapServerErrorsToFieldErrors, friendlySummary } from "@/lib/formUtils"
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

interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier?: any
  onSave?: (payload: any) => Promise<void>
  onUpdate?: (id: any, payload: any) => Promise<void>
}

export function SupplierDialog({ open, onOpenChange, supplier, onSave, onUpdate }: SupplierDialogProps) {
  const isEdit = !!supplier
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string,string[]>>({})
  const nameRef = useRef<HTMLInputElement | null>(null)

  const handleSubmit = async () => {
    const name = (document.getElementById('name') as HTMLInputElement).value
    const contactPerson = (document.getElementById('contactPerson') as HTMLInputElement).value
    const email = (document.getElementById('email') as HTMLInputElement).value
    const phone = (document.getElementById('phone') as HTMLInputElement).value
    const address = (document.getElementById('address') as HTMLTextAreaElement).value
    const website = (document.getElementById('website') as HTMLInputElement).value

    const payload = { name, contactPerson, email, phone, address, website }
    try {
      setServerError(null)
      setFieldErrors({})
      if (isEdit && supplier && (supplier.supplier_id || supplier.supplier_id_num)) {
        const id = supplier.supplier_id ?? supplier.supplier_id_num
        if (onUpdate) await onUpdate(id, payload)
      } else {
        if (onSave) await onSave(payload)
      }
      onOpenChange(false)
    } catch (e: any) {
      const parsed = e?.serverErrors
      if (parsed) {
        const map = mapServerErrorsToFieldErrors(parsed)
        setFieldErrors(map)
        const summary = friendlySummary(parsed)
        setServerError(summary)
        setTimeout(() => { if (map['name'] && nameRef.current) nameRef.current.focus() }, 0)
      }
      return
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the supplier information below." : "Fill in the details to add a new supplier."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name</Label>
              <Input id="name" placeholder="Dell Inc." defaultValue={supplier?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input id="contactPerson" placeholder="John Doe" defaultValue={supplier?.contactPerson} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="contact@supplier.com" defaultValue={supplier?.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+1-555-0100" defaultValue={supplier?.phone} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" placeholder="Enter full address..." defaultValue={supplier?.address} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" placeholder="www.supplier.com" defaultValue={supplier?.website} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{isEdit ? "Update Supplier" : "Add Supplier"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
