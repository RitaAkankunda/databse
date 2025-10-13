"use client"

import { useEffect, useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, UserCog } from "lucide-react"
import { MaintenanceStaffDialog, type MaintenanceStaffRecord } from "@/components/maintenance-staff-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useNotificationActions } from "@/components/notification-system"
import StatsCards from "@/components/stats-cards"
import usePolling from "@/lib/usePolling"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"

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
    <div className="flex">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Maintenance Staff</h1>
            <p className="text-muted-foreground">Manage technicians who service assets</p>
          </div>
          <Button onClick={handleAdd} className="gap-2"><Plus className="h-4 w-4"/>Add Staff</Button>
        </div>

        <StatsCards stats={[
          { title: 'Total Staff', value: <span className="text-purple-600">{totalStaff}</span>, subtitle: 'All technicians' },
          { title: 'Specializations', value: <span className="text-green-600">{uniqueSpecializations}</span>, subtitle: 'Unique skills' },
          { title: 'Upcoming Tasks', value: <span className="text-blue-600">{upcomingTasks}</span>, subtitle: 'Assigned soon' },
          { title: 'Assigned Maint.', value: <span className="text-purple-600">{assignedMaintenances}</span>, subtitle: 'Total assigned' },
        ]} />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search staff by name, phone, or specialization" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.phone || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.email || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.specialization || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(r)} title="Edit"><Edit className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(r)} title="Delete" className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4"/></Button>
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
          </CardContent>
        </Card>

        <MaintenanceStaffDialog open={open} onOpenChange={setOpen} staff={selected} onSave={onSave} onUpdate={onUpdate} />
        <ConfirmationDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete Staff" description={`Are you sure you want to delete "${selected?.name || ''}"? This cannot be undone.`} confirmText="Delete" cancelText="Cancel" onConfirm={confirmDelete} variant="destructive" />
      </main>
    </div>
  )
}





