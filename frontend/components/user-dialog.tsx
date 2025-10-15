"use client"

import { useState, useEffect, useRef } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export interface User {
  id: string
  name: string
  email: string
  phone: string
  department: string
  position: string
  nin?: string
  status: "Active" | "Inactive"
  notes?: string
  createdAt: string
  updatedAt: string
}

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  onSave: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdate: (id: string, user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void
}

export function UserDialog({ open, onOpenChange, user, onSave, onUpdate }: UserDialogProps) {
  const isEdit = !!user
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    nin: "",
    status: "Active" as "Active" | "Inactive",
    notes: ""
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        position: user.position,
        nin: user.nin || "",
        status: user.status,
        notes: user.notes || ""
      })
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        department: "",
        position: "",
        nin: "",
        status: "Active",
        notes: ""
      })
    }
  }, [user, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setServerError(null)
    if (!formData.name.trim() || !formData.email.trim()) {
      setServerError('Please fill in all required fields')
      return
    }
    ;(async () => {
      try {
        if (isEdit && user) await onUpdate(user.id, formData)
        else await onSave(formData)
        onOpenChange(false)
      } catch (e: any) {
        const parsed = e?.serverErrors
        if (parsed) {
          const map = mapServerErrorsToFieldErrors(parsed)
          setFieldErrors(map)
          setTimeout(() => {
            if (map['name'] && nameRef.current) { nameRef.current.focus(); return }
            if (map['email'] && emailRef.current) { emailRef.current.focus(); return }
          }, 0)
          const summary = friendlySummary(parsed)
          setServerError(summary)
        } else {
          setServerError(e?.message || 'Save failed')
        }
      }
    })()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string,string[]>>({})
  const nameRef = useRef<HTMLInputElement | null>(null)
  const emailRef = useRef<HTMLInputElement | null>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the user information below." : "Fill in the details to add a new user."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input 
                  id="name" 
                  ref={nameRef}
                  placeholder="Enter full name" 
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
                {fieldErrors['name'] && <div className="text-sm text-destructive">{fieldErrors['name'].join(' ')}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  ref={emailRef}
                  type="email" 
                  placeholder="Enter email address" 
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
                {fieldErrors['email'] && <div className="text-sm text-destructive">{fieldErrors['email'].join(' ')}</div>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  placeholder="Enter phone number" 
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input 
                  id="department" 
                  placeholder="Enter department" 
                  value={formData.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
              <Label htmlFor="position">Occupation</Label>
                <Input 
                  id="position" 
                  placeholder="Enter occupation" 
                  value={formData.position}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                />
              </div>
              <div className="space-y-2">
              <Label htmlFor="nin">NIN</Label>
              <Input 
                id="nin" 
                placeholder="Enter NIN" 
                value={formData.nin}
                onChange={(e) => handleInputChange("nin", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: "Active" | "Inactive") => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Enter additional notes (optional)"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>
          {serverError && <div className="mb-2 rounded-md bg-destructive/10 border border-destructive p-2 text-destructive text-sm">{serverError}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success">{isEdit ? "Update User" : "Add User"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


