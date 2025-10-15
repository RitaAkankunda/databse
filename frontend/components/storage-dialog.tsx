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

export interface Storage {
  id: string
  name: string
  description: string
  address: string
  capacity: number
  currentAssets: number
  type: string
  manager: string
  contactInfo: string
  createdAt: string
  updatedAt: string
}

interface StorageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storage?: Storage | null
  onSave: (storage: Omit<Storage, 'id' | 'currentAssets' | 'createdAt' | 'updatedAt'>) => void
  onUpdate: (id: string, storage: Omit<Storage, 'id' | 'currentAssets' | 'createdAt' | 'updatedAt'>) => void
}

export function StorageDialog({ open, onOpenChange, storage, onSave, onUpdate }: StorageDialogProps) {
  const isEdit = !!storage
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    capacity: 0,
    type: "Office",
    manager: "",
    contactInfo: ""
  })

  useEffect(() => {
    if (storage) {
      setFormData({
        name: storage.name,
        description: storage.description,
        address: storage.address,
        capacity: storage.capacity,
        type: storage.type,
        manager: storage.manager,
        contactInfo: storage.contactInfo
      })
    } else {
      setFormData({
        name: "",
        description: "",
        address: "",
        capacity: 0,
        type: "Office",
        manager: "",
        contactInfo: ""
      })
    }
  }, [storage, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.address.trim() || formData.capacity <= 0) {
      alert("Please fill in all required fields")
      return
    }

    if (isEdit && storage) {
      onUpdate(storage.id, formData)
    } else {
      onSave(formData)
    }
    onOpenChange(false)
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Storage Location" : "Add New Storage Location"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the storage location information below."
              : "Fill in the details to add a new storage location."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Location Name *</Label>
                <Input 
                  id="name" 
                  placeholder="Office Floor 2" 
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Storage Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                    <SelectItem value="Server Room">Server Room</SelectItem>
                    <SelectItem value="Lab">Lab</SelectItem>
                    <SelectItem value="Garage">Garage</SelectItem>
                    <SelectItem value="Storage Unit">Storage Unit</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter location description..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input 
                id="address" 
                placeholder="Building A, Floor 2" 
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <Input 
                  id="capacity" 
                  type="number" 
                  placeholder="50" 
                  value={formData.capacity}
                  onChange={(e) => handleInputChange("capacity", parseInt(e.target.value) || 0)}
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager">Manager</Label>
                <Input 
                  id="manager" 
                  placeholder="John Smith" 
                  value={formData.manager}
                  onChange={(e) => handleInputChange("manager", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactInfo">Contact Information</Label>
              <Input 
                id="contactInfo" 
                placeholder="Phone: +1-555-0123, Email: manager@company.com" 
                value={formData.contactInfo}
                onChange={(e) => handleInputChange("contactInfo", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success">{isEdit ? "Update Location" : "Add Location"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
