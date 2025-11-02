"use client"

import { useEffect, useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { formatPhone } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, UserCog, Users, Briefcase, Calendar, Wrench } from "lucide-react"
import { MaintenanceStaffDialog, type MaintenanceStaffRecord } from "@/components/maintenance-staff-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useNotificationActions } from "@/components/notification-system"
import StatsCards from "@/components/stats-cards"
import usePolling from "@/lib/usePolling"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export default function MaintenanceStaffPage() {
  const [items, setItems] = useState<MaintenanceStaffRecord[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<MaintenanceStaffRecord | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { showSuccess, showError } = useNotificationActions()

  useEffect(() => {
    (async () => {
  const res = await fetch(`${API_BASE_URL}/api/maintenance-staff/`)
      const data = await res.json()
      setItems(data.map((r: any) => ({ id: String(r.m_staff_id), name: r.name, phone: r.phone || '', email: r.email || '', specialization: r.specialization || '' })))
    })()
  }, [])

  function handleAdd() { setSelected(null); setOpen(true) }
  function handleEdit(r: MaintenanceStaffRecord) { setSelected(r); setOpen(true) }
  function handleDelete(r: MaintenanceStaffRecord) { setSelected(r); setConfirmOpen(true) }

  async function onSave(data: Omit<MaintenanceStaffRecord,'id'>) {
  const res = await fetch(`${API_BASE_URL}/api/maintenance-staff/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  if (!res.ok) { showError('Create Failed', 'Unable to create staff'); throw new Error('Create failed') }
    const created = await res.json()
    setItems(prev => [...prev, { id: String(created.m_staff_id), name: created.name, phone: created.phone || '', email: created.email || '', specialization: created.specialization || '' }])
  showSuccess('Staff Added', `${created.name} added`)
  }
  async function onUpdate(id: string, data: Omit<MaintenanceStaffRecord,'id'>) {
  const res = await fetch(`${API_BASE_URL}/api/maintenance-staff/${id}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  if (!res.ok) { showError('Update Failed', 'Unable to update staff'); throw new Error('Update failed') }
    const updated = await res.json()
    setItems(prev => prev.map(x => x.id === id ? { id, name: updated.name, phone: updated.phone || '', email: updated.email || '', specialization: updated.specialization || '' } : x))
  showSuccess('Staff Updated', `${updated.name} updated`)
  }
  async function confirmDelete() {
    if (!selected) return
  const res = await fetch(`${API_BASE_URL}/api/maintenance-staff/${selected.id}/`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) { showError('Delete Failed', 'Unable to delete staff'); throw new Error('Delete failed') }
  setItems(prev => prev.filter(x => x.id !== selected.id))
  setSelected(null)
  showSuccess('Staff Deleted', `Staff removed`)
  }

  const filtered = items.filter(i => [i.name, i.phone, i.email, i.specialization].join(' ').toLowerCase().includes(search.toLowerCase()))

  // stats
  const totalStaff = items.length
  const uniqueSpecializations = new Set(items.map(i => (i.specialization || '').trim())).size
  // fetch maintenance tasks and compute counts
  const { data: maintenanceData, loading: maintenanceLoading } = usePolling<any[]>(`${API_BASE_URL}/api/maintenance/`, 15000, !open && !confirmOpen)

  // maintenanceData expected shape: array of maintenance records with fields like { id, scheduled_date, assigned_to (m_staff_id), status }
  const maintenance = Array.isArray(maintenanceData) ? maintenanceData : []

  // upcoming tasks: scheduled_date within next 7 days and status not completed
  const now = new Date()
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingTasks = maintenance.filter(m => {
    if (!m || !m.scheduled_date) return false
    const d = new Date(m.scheduled_date)
    const status = (m.status || "").toLowerCase()
    return d >= now && d <= in7d && status !== 'completed' && status !== 'done'
  }).length

  // assigned maintenances: tasks that have an assigned technician
  const assignedMaintenances = maintenance.filter(m => m && (m.assigned_to || m.assigned_to_id || m.m_staff_id)).length

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <SidebarNav />
      <main className="flex-1 p-8 bg-gradient-to-br from-white/40 to-transparent">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
          <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Maintenance Staff Management
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage technicians who service assets
              </p>
            </div>
            <Button 
              onClick={handleAdd} 
              className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="lg"
            >
              <Plus className="h-5 w-5"/>Add Staff
            </Button>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Total Staff</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{totalStaff}</p>
                  <p className="text-xs text-muted-foreground mt-1">All technicians</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Specializations</p>
                  <p className="text-3xl font-extrabold text-green-600 mt-2">{uniqueSpecializations}</p>
                  <p className="text-xs text-muted-foreground mt-1">Unique skills</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Upcoming Tasks</p>
                  <p className="text-3xl font-extrabold text-blue-600 mt-2">{upcomingTasks}</p>
                  <p className="text-xs text-muted-foreground mt-1">Assigned soon</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Assigned Maint.</p>
                  <p className="text-3xl font-extrabold text-orange-600 mt-2">{assignedMaintenances}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total assigned</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wrench className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-modern hover:shadow-xl transition-all duration-300 border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search staff by name, phone, or specialization" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="pl-11 h-12 text-base border-2 focus:border-primary transition-all" 
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 hover:bg-slate-100/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-colors duration-200">
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatPhone(r.phone)}</TableCell>
                    <TableCell className="text-muted-foreground">{r.email || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.specialization || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(r)} 
                          title="Edit"
                          className="hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="h-4 w-4"/>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(r)} 
                          title="Delete" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4"/>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No staff yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <MaintenanceStaffDialog open={open} onOpenChange={setOpen} staff={selected} onSave={onSave} onUpdate={onUpdate} />
        <ConfirmationDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete Staff" description={`Are you sure you want to delete "${selected?.name || ''}"? This cannot be undone.`} confirmText="Delete" cancelText="Cancel" onConfirm={confirmDelete} variant="destructive" />
      </main>
    </div>
  )
}





