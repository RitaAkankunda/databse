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

export interface Classification {
  id: string
  name: string
  description: string
  category: string
  assetCount: number
  createdAt: string
  updatedAt: string
}

interface ClassificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classification?: Classification | null
  onSave: (classification: Omit<Classification, 'id' | 'assetCount' | 'createdAt' | 'updatedAt'>) => void
  onUpdate: (id: string, classification: Omit<Classification, 'id' | 'assetCount' | 'createdAt' | 'updatedAt'>) => void
}

export function ClassificationDialog({ open, onOpenChange, classification, onSave, onUpdate }: ClassificationDialogProps) {
  const isEdit = !!classification
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "General"
  })

  useEffect(() => {
    if (classification) {
      setFormData({
        name: classification.name,
        description: classification.description,
        category: classification.category
      })
    } else {
      setFormData({
        name: "",
        description: "",
        category: "General"
      })
    }
  }, [classification, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert("Please fill in all required fields")
      return
    }

    if (isEdit && classification) {
      onUpdate(classification.id, formData)
    } else {
      onSave(formData)
    }
    onOpenChange(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Classification" : "Add New Classification"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the classification information below."
              : "Fill in the details to add a new classification."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Classification Name *</Label>
              <Input 
                id="name" 
                placeholder="Electronics" 
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Vehicles">Vehicles</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter classification description..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success">{isEdit ? "Update Classification" : "Add Classification"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
