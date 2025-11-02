"use client";

import { useState, useEffect } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, Calendar, Filter, Wrench } from "lucide-react";
import { MaintenanceDialog, Maintenance } from "@/components/maintenance-dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useNotificationActions } from "@/components/notification-system";

const STORAGE_KEY = "database_maintenance";

// Generate a simple ID
function generateId(): string {
  return `maintenance_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export default function MaintenancePage() {
  // New maintenance record shape aligns with backend table:
  // { id, asset_id, maintenance_date, description, cost, staff_id, performed_by, createdAt, updatedAt }
  const [maintenanceRecords, setMaintenanceRecords] = useState<Maintenance[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [maintenanceToDelete, setMaintenanceToDelete] = useState<Maintenance | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const { showSuccess, showError } = useNotificationActions();

  // Load maintenance records from localStorage on component mount
  useEffect(() => {
    const savedMaintenance = localStorage.getItem(STORAGE_KEY);
    if (savedMaintenance) {
      try {
        console.debug('maintenance: raw saved payload', savedMaintenance)
        let raw = JSON.parse(savedMaintenance)
        // Accept either an array or an object map (legacy)
        if (!Array.isArray(raw) && raw && typeof raw === 'object') {
          // convert object map to array of values
          raw = Object.values(raw)
        }
        // Normalize older/demo shapes into the canonical maintenance shape
        const normalized = Array.isArray(raw) ? raw.map((r:any) => {
          const asset_id = r.assetId ?? r.asset_id ?? (r.assetId ? String(r.assetId) : (r.assetId || ''))
          const maintenance_date = r.maintenance_date ?? r.scheduledDate ?? r.maintenanceDate ?? r.completedDate ?? r.maintenance_date ?? ''
          const description = r.description ?? r.notes ?? ''
          const cost = typeof r.cost === 'number' ? r.cost : (parseFloat(r.cost) || 0)
          const staff_id = r.staff_id ?? r.staffId ?? ''
          const performed_by = r.performedBy ?? r.performed_by ?? ''
          return {
            id: r.id ?? `m_${Math.random().toString(36).slice(2,9)}`,
            asset_id: asset_id ? String(asset_id) : '',
            maintenance_date: maintenance_date ? String(maintenance_date).slice(0,10) : '',
            description,
            cost,
            staff_id: staff_id ? String(staff_id) : '',
            performed_by,
            createdAt: r.createdAt ?? new Date().toISOString(),
            updatedAt: r.updatedAt ?? new Date().toISOString(),
          }
        }) : []
        // Persist the cleaned normalized array back to localStorage so any
        // legacy `priority` values are removed immediately for all clients.
        try {
          console.debug('maintenance: persisting normalized payload', normalized)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
        } catch (e) { console.warn('maintenance: failed to persist normalized payload', e) }
        setMaintenanceRecords(normalized)
      } catch (error) {
        console.error("Error loading maintenance records from localStorage:", error);
      }
    }
  }, []);

  // Save maintenance records to localStorage whenever maintenance state changes
  useEffect(() => {
    // Strip legacy fields (like `priority`) before persisting so the
    // stored migration shape remains canonical and smaller.
    try {
      const cleaned = maintenanceRecords.map((r:any) => {
        // strip known legacy priority keys (various casings/forms)
        const { Priority, priority, priorityLevel, ...rest } = r as any
        delete (rest as any).priority
        delete (rest as any).priorityLevel
        return rest
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
    } catch (e) {
      // fallback: write raw if something unexpected happens
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(maintenanceRecords)) } catch { /* ignore */ }
    }
  }, [maintenanceRecords]);

  const filteredMaintenance = maintenanceRecords.filter((m) => {
    const q = searchQuery.toLowerCase()
    return (
      String(m.asset_id || '').toLowerCase().includes(q) ||
      String(m.description || '').toLowerCase().includes(q) ||
      String(m.performed_by || '').toLowerCase().includes(q)
    )
  })

  const handleAddMaintenance = (maintenanceData: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMaintenance: Maintenance = {
      ...maintenanceData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMaintenanceRecords(prev => [...prev, newMaintenance]);
    showSuccess("Maintenance Scheduled", `Maintenance for ${maintenanceData.asset_id} has been successfully scheduled.`);
  };

  const handleUpdateMaintenance = (id: string, maintenanceData: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>) => {
    setMaintenanceRecords(prev => prev.map(maintenance => 
      maintenance.id === id 
        ? { ...maintenance, ...maintenanceData, updatedAt: new Date().toISOString() }
        : maintenance
    ));
    showSuccess("Maintenance Updated", `Maintenance record for ${maintenanceData.asset_id} has been successfully updated.`);
  };

  const handleDeleteMaintenance = (maintenance: Maintenance) => {
    setMaintenanceToDelete(maintenance);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (maintenanceToDelete) {
      setMaintenanceRecords(prev => prev.filter(maintenance => maintenance.id !== maintenanceToDelete.id));
      showSuccess("Maintenance Deleted", `Maintenance record for ${maintenanceToDelete.asset_id || maintenanceToDelete.asset || maintenanceToDelete.id} has been successfully deleted.`);
      setMaintenanceToDelete(null);
    }
  };

  const handleEditMaintenance = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsDialogOpen(true);
  };

  const handleAddNewMaintenance = () => {
    setSelectedMaintenance(null);
    setIsDialogOpen(true);
  };

  // Calculate simple statistics based on canonical fields
  const totalCount = maintenanceRecords.length
  const totalCost = maintenanceRecords.reduce((sum, m) => sum + Number(m.cost || 0), 0)
  const scheduledCount = maintenanceRecords.filter(m => (m.status ?? '').toLowerCase() === 'scheduled' || !m.status).length
  const completedCount = maintenanceRecords.filter(m => (m.status ?? '').toLowerCase() === 'completed').length
  const overdueCount = maintenanceRecords.filter(m => {
    try {
      if (!m.maintenance_date) return false
      const d = new Date(m.maintenance_date)
      return d < new Date() && ((m.status || '').toLowerCase() !== 'completed')
    } catch { return false }
  }).length

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <SidebarNav />
      <main className="flex-1 p-8 bg-gradient-to-br from-white/40 to-transparent">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Maintenance Tracking
              </h1>
              <p className="text-lg text-muted-foreground">
                Schedule and track asset maintenance activities
              </p>
            </div>
            <Button 
              onClick={handleAddNewMaintenance} 
              className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Schedule Maintenance
            </Button>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Scheduled</p>
                  <p className="text-3xl font-extrabold text-blue-600 mt-2">{scheduledCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Upcoming tasks</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Completed</p>
                  <p className="text-3xl font-extrabold text-green-600 mt-2">{completedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed tasks</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">Overdue</p>
                  <p className="text-3xl font-extrabold text-red-600 mt-2">{overdueCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Past due date</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Total Cost</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">UGX {totalCost.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">All maintenance</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wrench className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-modern hover:shadow-xl transition-all duration-300 border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search maintenance records by asset, type, or performer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 text-base border-2 focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 h-12 border-2 border-input bg-background rounded-lg text-sm font-medium focus:border-primary transition-all"
                >
                  <option value="All">All Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 hover:bg-slate-100/50">
                  <TableHead>Asset ID</TableHead>
                  <TableHead>Maintenance Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaintenance.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground py-8"
                    >
                      {maintenanceRecords.length === 0 
                        ? "No maintenance records yet. Click 'Schedule Maintenance' to create one."
                        : "No maintenance records match your search criteria."
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaintenance.map((m) => (
                    <TableRow key={m.id} className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-colors duration-200">
                      <TableCell className="font-medium">{m.asset_id}</TableCell>
                      <TableCell>{m.maintenance_date ? String(m.maintenance_date).slice(0,10) : '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.description || '-'}</TableCell>
                      <TableCell>UGX {Number(m.cost || 0).toLocaleString()}</TableCell>
                      <TableCell>{m.staff_id || '-'}</TableCell>
                      <TableCell>{m.performed_by || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditMaintenance(m)}
                            title="Edit maintenance record"
                            className="hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteMaintenance(m)}
                            title="Delete maintenance record"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
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
            </div>
          </CardContent>
        </Card>

        <MaintenanceDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          maintenance={selectedMaintenance}
          onSave={handleAddMaintenance}
          onUpdate={handleUpdateMaintenance}
        />

        <ConfirmationDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete Maintenance Record"
          description={`Are you sure you want to delete the maintenance record for "${maintenanceToDelete?.asset}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </main>
    </div>
  );
}
