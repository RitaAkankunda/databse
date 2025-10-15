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

interface BuyerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  buyer?: any
  onSave?: (payload: any) => Promise<void>
  onUpdate?: (id: any, payload: any) => Promise<void>
}

export function BuyerDialog({ open, onOpenChange, buyer, onSave, onUpdate }: BuyerDialogProps) {
  const isEdit = !!buyer
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string,string[]>>({})
  const nameRef = useRef<HTMLInputElement | null>(null)

  const handleSubmit = async () => {
    const name = (document.getElementById('name') as HTMLInputElement).value
    const phone = (document.getElementById('phone') as HTMLInputElement).value
    const email = (document.getElementById('email') as HTMLInputElement).value
    const address = (document.getElementById('address') as HTMLTextAreaElement).value
    const tin = (document.getElementById('tin') as HTMLInputElement).value

    const payload = { name, phone, email, address, tin }
    try {
      setServerError(null)
      setFieldErrors({})
      if (isEdit && buyer && (buyer.buyer_id || buyer.buyer_id_num)) {
        const id = buyer.buyer_id ?? buyer.buyer_id_num
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
          <DialogTitle>{isEdit ? "Edit Buyer" : "Add New Buyer"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the buyer information below." : "Fill in the details to add a new buyer."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Buyer Name</Label>
              <Input id="name" placeholder="Buyer Inc." defaultValue={buyer?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+1-555-0100" defaultValue={buyer?.phone} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="contact@buyer.com" defaultValue={buyer?.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tin">TIN</Label>
              <Input id="tin" placeholder="TIN123" defaultValue={buyer?.tin} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" placeholder="Enter full address..." defaultValue={buyer?.address} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmit}>{isEdit ? "Update Buyer" : "Add Buyer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
