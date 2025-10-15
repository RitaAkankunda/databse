"use client"

import { useState, useEffect } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, Warehouse, Filter } from "lucide-react"
import { StorageDialog, Storage } from "@/components/storage-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useNotificationActions } from "@/components/notification-system"

const STORAGE_KEY = "database_storage"

// Generate a simple ID
function generateId(): string {
  return `storage_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export default function StoragePage() {
  const [storageLocations, setStorageLocations] = useState<Storage[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [storageToDelete, setStorageToDelete] = useState<Storage | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>("All")
  const { showSuccess, showError } = useNotificationActions()

  // Load storage locations from localStorage on component mount
  useEffect(() => {
    const savedStorage = localStorage.getItem(STORAGE_KEY)
    if (savedStorage) {
      try {
        setStorageLocations(JSON.parse(savedStorage))
      } catch (error) {
        console.error("Error loading storage locations from localStorage:", error)
      }
    }
  }, [])

  // Save storage locations to localStorage whenever storage state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageLocations))
  }, [storageLocations])

  const filteredStorage = storageLocations.filter((storage) => {
    const matchesSearch = 
      storage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      storage.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      storage.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      storage.manager.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = typeFilter === "All" || storage.type === typeFilter
    
    return matchesSearch && matchesType
  })

  const handleAddStorage = (storageData: Omit<Storage, 'id' | 'currentAssets' | 'createdAt' | 'updatedAt'>) => {
    const newStorage: Storage = {
      ...storageData,
      id: generateId(),
      currentAssets: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setStorageLocations(prev => [...prev, newStorage])
    showSuccess("Storage Location Added", `${storageData.name} has been successfully added.`)
  }

  const handleUpdateStorage = (id: string, storageData: Omit<Storage, 'id' | 'currentAssets' | 'createdAt' | 'updatedAt'>) => {
    setStorageLocations(prev => prev.map(storage => 
      storage.id === id 
        ? { ...storage, ...storageData, updatedAt: new Date().toISOString() }
        : storage
    ))
    showSuccess("Storage Location Updated", `${storageData.name} has been successfully updated.`)
  }

  const handleDeleteStorage = (storage: Storage) => {
    setStorageToDelete(storage)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (storageToDelete) {
      setStorageLocations(prev => prev.filter(storage => storage.id !== storageToDelete.id))
      showSuccess("Storage Location Deleted", `${storageToDelete.name} has been successfully deleted.`)
      setStorageToDelete(null)
    }
  }

  const handleEditStorage = (storage: Storage) => {
    setSelectedStorage(storage)
    setIsDialogOpen(true)
  }

  const handleAddNewStorage = () => {
    setSelectedStorage(null)
    setIsDialogOpen(true)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Office":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "Warehouse":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "Server Room":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case "Lab":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "Garage":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      case "Storage Unit":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      default:
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400"
    }
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return "bg-red-500"
    if (utilization >= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const totalStorage = storageLocations.length
  const totalCapacity = storageLocations.reduce((sum, s) => sum + s.capacity, 0)
  const totalAssets = storageLocations.reduce((sum, s) => sum + s.currentAssets, 0)
  const types = [...new Set(storageLocations.map(s => s.type))]

  return (
    <div className="flex">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Storage Locations</h1>
            <p className="text-muted-foreground">Manage storage locations and capacity</p>
          </div>
          <Button variant="success" onClick={handleAddNewStorage} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                  <Warehouse className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Locations</p>
                  <p className="text-2xl font-bold">{totalStorage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                  <Warehouse className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Capacity</p>
                  <p className="text-2xl font-bold text-green-600">{totalCapacity}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/20">
                  <Warehouse className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assets Stored</p>
                  <p className="text-2xl font-bold text-purple-600">{totalAssets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/20">
                  <Warehouse className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Utilization</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {totalCapacity > 0 ? Math.round((totalAssets / totalCapacity) * 100) : 0}%
                  </p>
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
                  placeholder="Search storage locations by name, description, address, or manager..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="All">All Types</option>
                  {types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Current Assets</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStorage.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      {storageLocations.length === 0 
                        ? "No storage locations yet. Click 'Add Location' to create your first storage location."
                        : "No storage locations match your search criteria."
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStorage.map((storage) => {
                    const utilization = storage.capacity > 0 ? Math.round((storage.currentAssets / storage.capacity) * 100) : 0
                    return (
                      <TableRow key={storage.id}>
                        <TableCell className="font-medium">{storage.name}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${getTypeColor(storage.type)}`}>
                            {storage.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{storage.address}</TableCell>
                        <TableCell>{storage.capacity}</TableCell>
                        <TableCell>{storage.currentAssets}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                              <div 
                                className={`h-full ${getUtilizationColor(utilization)}`} 
                                style={{ width: `${utilization}%` }} 
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">{utilization}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {storage.manager || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditStorage(storage)}
                              title="Edit storage location"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteStorage(storage)}
                              title="Delete storage location"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <StorageDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          storage={selectedStorage}
          onSave={handleAddStorage}
          onUpdate={handleUpdateStorage}
        />

        <ConfirmationDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete Storage Location"
          description={`Are you sure you want to delete "${storageToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </main>
    </div>
  )
}
