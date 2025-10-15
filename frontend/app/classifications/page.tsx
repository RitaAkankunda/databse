"use client"

import { useState, useEffect } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, Tag, Filter } from "lucide-react"
import { ClassificationDialog, Classification } from "@/components/classification-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useNotificationActions } from "@/components/notification-system"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

// Generate a simple ID
function generateId(): string {
  return `classification_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export default function ClassificationsPage() {
  const [classifications, setClassifications] = useState<Classification[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedClassification, setSelectedClassification] = useState<Classification | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [classificationToDelete, setClassificationToDelete] = useState<Classification | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("All")
  const { showSuccess, showError } = useNotificationActions()

  // Load classifications from API on mount
  useEffect(() => {
    async function load() {
      try {
  const res = await fetch(`${API_BASE_URL}/api/categories/`)
        if (!res.ok) throw new Error("Failed to load categories")
        const data: Array<{ category_id: number; category_name: string; description?: string | null; _count?: { assets: number } }> = await res.json()
        setClassifications(
          data.map((c) => ({
            id: String(c.category_id),
            name: c.category_name,
            description: c.description || "",
            category: "General",
            assetCount: c._count?.assets ?? 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
        )
      } catch (e) {
        console.error(e)
        showError("Load Failed", "Unable to load classifications from server")
      }
    }
    load()
  }, [])

  const filteredClassifications = classifications.filter((classification) => {
    const matchesSearch = 
      classification.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classification.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classification.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === "All" || classification.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const handleAddClassification = async (classificationData: Omit<Classification, 'id' | 'assetCount' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_name: classificationData.name, description: classificationData.description })
      })
      if (!res.ok) throw new Error('Failed to create category')
      const created: { category_id: number; category_name: string; description?: string | null; _count?: { assets: number } } = await res.json()
      setClassifications(prev => [...prev, {
        id: String(created.category_id),
        name: created.category_name,
        description: created.description || '',
        category: classificationData.category || 'General',
        assetCount: created._count?.assets ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }])
      showSuccess("Classification Added", `${classificationData.name} has been successfully added.`)
    } catch (e) {
      console.error(e)
      showError("Create Failed", "Unable to save classification to server")
    }
  }

  const handleUpdateClassification = async (id: string, classificationData: Omit<Classification, 'id' | 'assetCount' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_name: classificationData.name, description: classificationData.description })
      })
      if (!res.ok) throw new Error('Failed to update category')
      const updated: { category_id: number; category_name: string; description?: string | null; _count?: { assets: number } } = await res.json()
      setClassifications(prev => prev.map(c => c.id === id ? {
        ...c,
        name: updated.category_name,
        description: updated.description || '',
        category: classificationData.category || c.category,
        assetCount: updated._count?.assets ?? c.assetCount,
        updatedAt: new Date().toISOString(),
      } : c))
      showSuccess("Classification Updated", `${classificationData.name} has been successfully updated.`)
    } catch (e) {
      console.error(e)
      showError("Update Failed", "Unable to update classification on server")
    }
  }

  const handleDeleteClassification = (classification: Classification) => {
    setClassificationToDelete(classification)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!classificationToDelete) return
    try {
  const res = await fetch(`${API_BASE_URL}/api/categories/${classificationToDelete.id}/`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete category')
      setClassifications(prev => prev.filter(classification => classification.id !== classificationToDelete.id))
      showSuccess("Classification Deleted", `${classificationToDelete.name} has been successfully deleted.`)
    } catch (e) {
      console.error(e)
      showError("Delete Failed", "Unable to delete classification from server")
    } finally {
      setClassificationToDelete(null)
    }
  }

  const handleEditClassification = (classification: Classification) => {
    setSelectedClassification(classification)
    setIsDialogOpen(true)
  }

  const handleAddNewClassification = () => {
    setSelectedClassification(null)
    setIsDialogOpen(true)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Electronics":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "Furniture":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "Vehicles":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case "Equipment":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "Software":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const totalClassifications = classifications.length
  const categories = [...new Set(classifications.map(c => c.category))]

  return (
    <div className="flex">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Classifications</h1>
            <p className="text-muted-foreground">Organize assets by category and type</p>
          </div>
          <Button variant="success" onClick={handleAddNewClassification} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Classification
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                  <Tag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Classifications</p>
                  <p className="text-2xl font-bold">{totalClassifications}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                  <Tag className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold text-green-600">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/20">
                  <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold text-purple-600">{classifications.reduce((sum, c) => sum + c.assetCount, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search classifications by name, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                  aria-label="Filter by category"
                >
                  <option value="All">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Classification Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Asset Count</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClassifications.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      {classifications.length === 0 
                        ? "No classifications yet. Click 'Add Classification' to create your first classification."
                        : "No classifications match your search criteria."
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClassifications.map((classification) => (
                    <TableRow key={classification.id}>
                      <TableCell className="font-medium">{classification.name}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getCategoryColor(classification.category)}`}>
                          {classification.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {classification.description || "-"}
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {classification.assetCount} assets
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(classification.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClassification(classification)}
                            title="Edit classification"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteClassification(classification)}
                            title="Delete classification"
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

        <ClassificationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          classification={selectedClassification}
          onSave={handleAddClassification}
          onUpdate={handleUpdateClassification}
        />

        <ConfirmationDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete Classification"
          description={`Are you sure you want to delete "${classificationToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </main>
    </div>
  )
}
