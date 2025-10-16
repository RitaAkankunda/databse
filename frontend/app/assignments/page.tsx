"use client"

import { useEffect, useState, useRef } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, ClipboardList } from "lucide-react"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useNotificationActions } from "@/components/notification-system"
import StatsCards from "@/components/stats-cards"
import usePolling from "@/lib/usePolling"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

type Assignment = { id: string; asset_id: number; user_id: number; assigned_date?: string | null; return_date?: string | null; status?: string | null; description?: string | null; approved_by?: string | null }

export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Assignment | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [assetsLookup, setAssetsLookup] = useState<Record<string,string>>({})
  const [usersLookup, setUsersLookup] = useState<Record<string,string>>({})
  const { showSuccess, showError } = useNotificationActions()

  // Helpers to normalize date values from the API which may be null,
  // an ISO string, or in some cases nested objects or different key names.
  const normalizeDate = (val: any) => {
    if (!val && val !== 0) return null
    if (typeof val === 'string') return val
    if (val instanceof Date) return val.toISOString().slice(0,10)
    if (typeof val === 'object') {
      // common nested shapes: { date: 'YYYY-MM-DD' } or { value: '...' }
      if (val.date) return String(val.date)
      if (val.value) return String(val.value)
      // fallback to JSON string
      try { return JSON.stringify(val) } catch { return null }
    }
    return String(val)
  }

  const formatDateCell = (v: any) => {
    const d = normalizeDate(v)
    return d ? String(d).slice(0,10) : '-'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Returned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "Overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "Lost":
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  }

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_BASE_URL}/api/assignments/`)
      if (!res.ok) {
        let bodyText = ''
        try { const j = await res.json(); bodyText = JSON.stringify(j) } catch { bodyText = await res.text().catch(() => '') }
        console.error('Failed to load assignments', res.status, bodyText)
        showError('Load Failed', bodyText || 'Unable to load assignments')
        return
      }
  const data = await res.json()
  setItems(data.map((r: any) => ({ id: String(r.assignment_id), asset_id: (r.asset ?? r.asset_id), user_id: (r.user ?? r.user_id), assigned_date: normalizeDate(r.assigned_date ?? r.assignedDate ?? r.assigned_on), return_date: normalizeDate(r.return_date ?? r.returnDate ?? r.returned_on ?? r.returned_date), status: r.status, description: r.description, approved_by: r.approved_by })))
    })()
  }, [])

  function handleAdd() { setSelected(null); setOpen(true) }
  function handleEdit(r: Assignment) { setSelected(r); setOpen(true) }
  function handleDelete(r: Assignment) { setSelected(r); setConfirmOpen(true) }

  async function onSave(data: Omit<Assignment,'id'>) {
    // backend expects 'asset' and 'user' keys (FK fields)
    const payload = { ...data, assigned_date: data.assigned_date || null, return_date: data.return_date || null, asset: data.asset_id, user: data.user_id }
    const res = await fetch(`${API_BASE_URL}/api/assignments/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) {
      // Try to parse validation errors as JSON and attach to the Error object
      let bodyText = ''
      let parsed: any = null
      try { parsed = await res.json(); bodyText = JSON.stringify(parsed) } catch { bodyText = await res.text().catch(() => '') }
      const err: any = new Error('Create failed')
      if (parsed && typeof parsed === 'object') {
        err.serverErrors = parsed
        // show a short toast summary using friendly labels
        const labels: Record<string,string> = { asset: 'Asset', user: 'User', assigned_date: 'Assigned Date', return_date: 'Return Date', status: 'Status', description: 'Description', approved_by: 'Approved By' }
        const summary = Object.entries(parsed).map(([k, v]: any) => `${labels[k] ?? k}: ${Array.isArray(v) ? v.join('; ') : v}`).join(' — ')
        showError('Create Failed', summary)
      } else {
        showError('Create Failed', bodyText || 'Unable to create assignment')
      }
      throw err
    }
    const created = await res.json()
    const assetId = created.asset ?? created.asset_id
    const userId = created.user ?? created.user_id
    setItems(prev => [...prev, { id: String(created.assignment_id), asset_id: assetId, user_id: userId, assigned_date: created.assigned_date, return_date: created.return_date, status: created.status, description: created.description, approved_by: created.approved_by }])
  }
  async function onUpdate(id: string, data: Omit<Assignment,'id'>) {
    const payload = { ...data, assigned_date: data.assigned_date || null, return_date: data.return_date || null, asset: data.asset_id, user: data.user_id }
    const res = await fetch(`${API_BASE_URL}/api/assignments/${id}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) {
      let bodyText = ''
      let parsed: any = null
      try { parsed = await res.json(); bodyText = JSON.stringify(parsed) } catch { bodyText = await res.text().catch(() => '') }
      const err: any = new Error('Update failed')
      if (parsed && typeof parsed === 'object') {
        err.serverErrors = parsed
        const labels: Record<string,string> = { asset: 'Asset', user: 'User', assigned_date: 'Assigned Date', return_date: 'Return Date', status: 'Status', description: 'Description', approved_by: 'Approved By' }
        const summary = Object.entries(parsed).map(([k, v]: any) => `${labels[k] ?? k}: ${Array.isArray(v) ? v.join('; ') : v}`).join(' — ')
        showError('Update Failed', summary)
      } else {
        showError('Update Failed', bodyText || 'Unable to update assignment')
      }
      throw err
    }
    const updated = await res.json()
    const assetId = updated.asset ?? updated.asset_id
    const userId = updated.user ?? updated.user_id
    setItems(prev => prev.map(x => x.id === id ? { id, asset_id: assetId, user_id: userId, assigned_date: updated.assigned_date, return_date: updated.return_date, status: updated.status, description: updated.description, approved_by: updated.approved_by } : x))
  }
  async function confirmDelete() {
    if (!selected) return
    const res = await fetch(`${API_BASE_URL}/api/assignments/${selected.id}/`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) {
      let bodyText = ''
      try { const j = await res.json(); bodyText = JSON.stringify(j) } catch { bodyText = await res.text().catch(() => '') }
      showError('Delete Failed', bodyText || 'Unable to delete assignment')
      throw new Error('Delete failed')
    }
  // refresh server-backed data and local state
  try {
    if (refreshAssignments) await refreshAssignments()
  } catch (e) { /* ignore refresh errors */ }
  setItems(prev => prev.filter(x => x.id !== selected.id))
  setSelected(null)
  showSuccess('Assignment Deleted', `Assignment removed`)
  }

  const filtered = items.filter(i => [i.asset_id, i.user_id, i.status || '', i.description || ''].join(' ').toLowerCase().includes(search.toLowerCase()))

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(filtered.map(a => a.id))
    else setSelectedIds([])
  }

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id))
  }

  const exportSelected = () => {
    const rows = items.filter(a => selectedIds.includes(a.id))
    if (rows.length === 0) return
    const headers = ['id','asset_id','user_id','assigned_date','return_date','status']
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => `"${String((r as any)[h] ?? '')}"`).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assignments_export_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function performBulkDelete() {
    if (selectedIds.length === 0) return
    try {
      await Promise.all(selectedIds.map(id => fetch(`${API_BASE_URL}/api/assignments/${id}/`, { method: 'DELETE' })))
      // refresh server-backed data
      try { if (refreshAssignments) await refreshAssignments() } catch (e) { /* ignore */ }
      setItems(prev => prev.filter(a => !selectedIds.includes(a.id)))
      showSuccess('Assignments Deleted', `${selectedIds.length} assignments removed`)
      setSelectedIds([])
    } catch (e) {
      console.error(e)
      showError('Bulk Delete Failed', 'Unable to delete some assignments')
    } finally {
      setBulkDeleteOpen(false)
    }
  }

  // Load lookup maps for assets and users so we can display names instead of raw IDs
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [aRes, uRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/assets/`),
          fetch(`${API_BASE_URL}/api/users/`)
        ])
        if (!aRes.ok || !uRes.ok) return
        const [aData, uData] = await Promise.all([aRes.json(), uRes.json()])
        if (!mounted) return
        const aMap: Record<string,string> = {}
        const uMap: Record<string,string> = {}
        if (Array.isArray(aData)) aData.forEach((x:any) => { aMap[String(x.asset_id ?? x.id ?? '')] = x.asset_name ?? x.name ?? `Asset ${x.asset_id ?? x.id ?? ''}` })
        if (Array.isArray(uData)) uData.forEach((x:any) => { uMap[String(x.user_id ?? x.id ?? '')] = x.name ?? `User ${x.user_id ?? x.id ?? ''}` })
        setAssetsLookup(aMap)
        setUsersLookup(uMap)
      } catch (e) { /* ignore */ }
    })()
    return () => { mounted = false }
  }, [])

  // Live polling of assignments so stats reflect recent changes
  const { data: polledAssignments, refresh: refreshAssignments } = usePolling<any[]>(`${API_BASE_URL}/api/assignments/`, 15000, !open && !confirmOpen)
  const allAssignments = Array.isArray(polledAssignments) ? polledAssignments.map((r:any) => ({ id: String(r.assignment_id), asset_id: (r.asset ?? r.asset_id), user_id: (r.user ?? r.user_id), assigned_date: normalizeDate(r.assigned_date ?? r.assignedDate ?? r.assigned_on), return_date: normalizeDate(r.return_date ?? r.returnDate ?? r.returned_on ?? r.returned_date), status: r.status })) : items

  // Use polled data as authoritative when available so counts and UI stay in sync
  const assignmentsSource = Array.isArray(polledAssignments) ? allAssignments : items

  const totalAssignments = assignmentsSource.length
  const activeAssignments = assignmentsSource.filter(i => (i.status || '').toLowerCase() === 'active').length
  // count overdue based on explicit status set by user
  const overdueByStatus = assignmentsSource.filter(i => (i.status || '').toLowerCase() === 'overdue').length
  // also compute date-based overdue so we can show both numbers (date-based may be larger if return_date is past)
  const overdueByDate = assignmentsSource.filter(i => i.return_date && (() => { const d = new Date(i.return_date); const today = new Date(); // compare dates only (ignore time)
    const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const td = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return dd < td
  })() && ((i.status || '').toLowerCase() !== 'returned')).length
  const upcomingReturns = assignmentsSource.filter(i => i.return_date && (() => { const d = new Date(i.return_date); const now = new Date(); const in7 = new Date(now.getTime() + 7*24*60*60*1000); const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const td = new Date(now.getFullYear(), now.getMonth(), now.getDate()); return dd >= td && dd <= new Date(in7.getFullYear(), in7.getMonth(), in7.getDate()) })()).length

  // Simple inline form modal replacement to keep code short
  function AssignmentForm() {
    const isEdit = !!selected
    const [form, setForm] = useState<Omit<Assignment,'id'>>({ asset_id: selected?.asset_id || 0, user_id: selected?.user_id || 0, assigned_date: selected?.assigned_date || '', return_date: selected?.return_date || '', status: selected?.status || 'Active', description: selected?.description || '', approved_by: selected?.approved_by || '' })
  const [assets, setAssets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string,string[]>>({})
  const [isSaving, setIsSaving] = useState(false)
  const assetRef = useRef<HTMLSelectElement | null>(null)
  const userRef = useRef<HTMLSelectElement | null>(null)
  const statusRef = useRef<HTMLSelectElement | null>(null)
  const assignedDateRef = useRef<HTMLInputElement | null>(null)
    useEffect(() => {
      (async () => {
        try {
          const [a, u] = await Promise.all([
            fetch(`${API_BASE_URL}/api/assets/`),
            fetch(`${API_BASE_URL}/api/users/`),
          ])
          const aData = await a.json()
          const uData = await u.json()
          setAssets(aData.map((x: any) => ({ id: x.asset_id, name: x.asset_name })))
          setUsers(uData.map((x: any) => ({ id: x.user_id, name: x.name })))
        } catch (e) { /* ignore */ }
      })()
    }, [])
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center" onClick={() => setOpen(false)}>
        <div className="bg-card border border-border rounded-md p-6 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-lg font-semibold mb-4">{isEdit ? 'Edit Assignment' : 'Add Assignment'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Asset</label>
              <select ref={assetRef} className="w-full border border-input rounded-md px-3 py-2" value={form.asset_id} onChange={(e) => setForm({ ...form, asset_id: Number(e.target.value) })} aria-label="Select asset">
                <option value={0}>Select asset</option>
                {assets.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
              {fieldErrors['asset'] && (
                <div className="text-sm text-destructive mt-1">{fieldErrors['asset'].join(' ')}</div>
              )}
            </div>
            <div>
              <label className="text-sm">User</label>
              <select ref={userRef} className="w-full border border-input rounded-md px-3 py-2" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: Number(e.target.value) })} aria-label="Select user">
                <option value={0}>Select user</option>
                {users.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
              </select>
              {fieldErrors['user'] && (
                <div className="text-sm text-destructive mt-1">{fieldErrors['user'].join(' ')}</div>
              )}
            </div>
            <div>
              <label className="text-sm">Assigned Date</label>
              <Input ref={assignedDateRef} type="date" value={form.assigned_date || ''} onChange={(e) => setForm({ ...form, assigned_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm">Return Date</label>
              <Input type="date" value={form.return_date || ''} onChange={(e) => setForm({ ...form, return_date: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="text-sm">Status</label>
              <select ref={statusRef} className={`w-full border border-input rounded-md px-3 py-2 text-sm ${form.status ? getStatusColor(form.status) : ''}`} value={form.status || ''} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="">Select status</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Returned">Returned</option>
                <option value="Overdue">Overdue</option>
                <option value="Lost">Lost</option>
              </select>
              {fieldErrors['status'] && (
                <div className="text-sm text-destructive mt-1">{fieldErrors['status'].join(' ')}</div>
              )}
            </div>
            <div className="col-span-2">
              <label className="text-sm">Description</label>
              <Input placeholder="Enter description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="text-sm">Approved By</label>
              <Input placeholder="Enter approver name" value={form.approved_by || ''} onChange={(e) => setForm({ ...form, approved_by: e.target.value })} />
            </div>
          </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button variant="success" onClick={async () => {
              setServerError(null)
              setFieldErrors({})
              setIsSaving(true)
              try {
                if (isEdit) await onUpdate(selected!.id, form)
                else await onSave(form)
                setOpen(false)
                setSelected(null)
              } catch (e: any) {
                const msg = e?.message || 'Save failed'
                // If serverErrors were attached, render them as fieldErrors
                if (e?.serverErrors && typeof e.serverErrors === 'object') {
                  const map: Record<string,string[]> = {}
                  Object.entries(e.serverErrors).forEach(([k,v]) => { map[k] = Array.isArray(v) ? v.map(String) : [String(v)] })
                  setFieldErrors(map)
                    // autofocus first invalid field in priority order
                    setTimeout(() => {
                      if (map['asset'] && assetRef.current) { assetRef.current.focus(); return }
                      if (map['user'] && userRef.current) { userRef.current.focus(); return }
                      if (map['status'] && statusRef.current) { statusRef.current.focus(); return }
                      if (map['assigned_date'] && assignedDateRef.current) { assignedDateRef.current.focus(); return }
                    }, 0)
                }
                setServerError(String(msg))
              } finally { setIsSaving(false) }
            }} disabled={isSaving}>{isSaving ? (isEdit ? 'Updating…' : 'Adding…') : (isEdit ? 'Update' : 'Add')}</Button>
          </div>
            {serverError && (
              <div className="mt-4 rounded-md bg-destructive/10 border border-destructive p-3 text-destructive text-sm">
                {serverError}
              </div>
            )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
            <p className="text-muted-foreground">Issue assets to users and track returns</p>
          </div>
          <Button variant="success" onClick={handleAdd} className="gap-2"><Plus className="h-4 w-4"/>Add Assignment</Button>
        </div>

        <StatsCards stats={[
          { title: 'Total Assignments', value: <span className="text-purple-600">{totalAssignments}</span>, subtitle: 'All assignments' },
          { title: 'Active', value: <span className="text-green-600">{activeAssignments}</span>, subtitle: 'Currently assigned' },
          { title: 'Overdue', value: <span className="text-red-600">{overdueByStatus}</span>, subtitle: `By status — date-overdue: ${overdueByDate}` },
          { title: 'Upcoming Returns', value: <span className="text-blue-600">{upcomingReturns}</span>, subtitle: 'Next 7 days' },
        ]} />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search assignments by asset, user, status, or notes" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedIds.length > 0 && (
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="text-sm text-foreground">{selectedIds.length} selected</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={exportSelected}>Export</Button>
                  <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>Delete</Button>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input role="checkbox" type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === filtered.length} onChange={(e) => toggleSelectAll(e.target.checked)} className="accent-primary" />
                  </TableHead>
                  <TableHead>Asset ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="w-12"><input role="checkbox" type="checkbox" checked={selectedIds.includes(r.id)} onChange={(e) => toggleSelectOne(r.id, e.target.checked)} className="accent-primary" /></TableCell>
                    <TableCell className="font-medium">{assetsLookup[String(r.asset_id)] ?? String(r.asset_id)}</TableCell>
                    <TableCell>{usersLookup[String(r.user_id)] ?? String(r.user_id)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateCell(r.assigned_date)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateCell(r.return_date)}</TableCell>
                      <TableCell>
                        {r.status ? (
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(r.status)}`}>
                            {r.status}
                          </span>
                        ) : '-'}
                      </TableCell>
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
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No assignments yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {open && <AssignmentForm />}
        <ConfirmationDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete Assignment" description={`Are you sure you want to delete this assignment?`} confirmText="Delete" cancelText="Cancel" onConfirm={confirmDelete} variant="destructive" />
        <ConfirmationDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} title="Delete Assignments" description={`Are you sure you want to delete ${selectedIds.length} selected assignments?`} confirmText="Delete" cancelText="Cancel" onConfirm={performBulkDelete} variant="destructive" />
      </main>
    </div>
  )
}


