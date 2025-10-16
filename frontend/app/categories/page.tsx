"use client"

import { useEffect, useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import CategoryDialog, { Category as CategoryType } from "@/components/category-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useNotificationActions } from "@/components/notification-system"
import StatsCards from "@/components/stats-cards"
import usePolling from "@/lib/usePolling"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

type Category = { category_id: number; category_name: string; description?: string | null; created?: string | null }

export default function CategoriesPage() {
		const [categories, setCategories] = useState<CategoryType[]>([{ id: String(-1), category_name: 'Others', description: 'Uncategorized / Other' } as CategoryType])
	const [search, setSearch] = useState("")
	const [isDialogOpen, setIsDialogOpen] = useState(false)
		const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null)
		const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
		const [categoryToDelete, setCategoryToDelete] = useState<CategoryType | null>(null)
	const { showSuccess, showError } = useNotificationActions()

	// pagination removed — show full filtered list

// poll categories and assets for live stats
const { data: polledCategories } = usePolling<any[]>(`${API_BASE_URL}/api/categories/`, 30000, !isDialogOpen && !deleteConfirmOpen)
const { data: polledAssets } = usePolling<any[]>(`${API_BASE_URL}/api/assets/`, 30000, !isDialogOpen && !deleteConfirmOpen)

// Ensure there's always an "Others" category in the UI so users can assign uncategorized assets
function ensureOthersCategory(list: any[]) {
	if (!Array.isArray(list)) return list
	const hasOthers = list.some((c: any) => (c.category_name || c.name || '').toLowerCase() === 'others')
	if (hasOthers) return list
	// prepend a synthetic Others entry using the same shape the backend returns so it appears at the top
	return [{ category_id: -1, category_name: 'Others', description: 'Uncategorized / Other', created_at: null }, ...list]
}

useEffect(() => {
	if (Array.isArray(polledCategories)) {
		const withOthers = ensureOthersCategory(polledCategories)
		setCategories(withOthers.map(d => ({ id: String(d.category_id), category_name: d.category_name, description: d.description || '', created: d.created_at ?? d.created ?? null })))
	}
}, [polledCategories])

const categoriesList = Array.isArray(polledCategories) ? polledCategories : categories
const totalCategories = (categoriesList || []).length
// count categories referenced by assets via category or category_id
const categoryIdsWithAssets = new Set((Array.isArray(polledAssets) ? polledAssets : []).map(a => String(a.category ?? a.category_id ?? '')).filter(Boolean))
const categoriesWithAssets = categoryIdsWithAssets.size
const emptyCategories = Math.max(0, totalCategories - categoriesWithAssets)
const recentCategories = (categoriesList || []).filter((c:any) => {
	const t = c.created_at ?? c.created ?? null
	if (!t) return false
	const d = new Date(t); if (Number.isNaN(d.getTime())) return false
	return d >= new Date(Date.now() - 30*24*60*60*1000)
}).length

	useEffect(() => {
			(async () => {
				try {
					const res = await fetch(`${API_BASE_URL}/api/categories/`)
					if (!res.ok) throw new Error('Failed to load categories')
							const data: Array<{ category_id: number; category_name: string; description?: string | null; created_at?: string | null; created?: string | null }> = await res.json()
							const withOthers = ensureOthersCategory(data)
							const normalized = withOthers.map(d => ({ id: String(d.category_id), category_name: d.category_name, description: d.description || '', created: d.created_at ?? d.created ?? null }))
					setCategories(normalized)
				} catch (e) {
					console.error(e)
					showError('Load Failed', 'Unable to load categories')
				}
			})()
	}, [])

		const filtered = categories.filter(c => [String(c.id), c.category_name, c.description || ''].join(' ').toLowerCase().includes(search.toLowerCase()))
	// Keep a reference to the synthetic Others (category_id -1) and ensure it's included at the top of the results
	const others = categories.find(c => String(c.id) === String(-1) || (c.category_name || '').toLowerCase() === 'others')
		const pageItems = others ? [others, ...filtered.filter(c => String(c.id) !== String(others.id))] : filtered

		// inline dropdown filter state
		const [dropdownFilter, setDropdownFilter] = useState('')
		const dropdownFiltered = dropdownFilter
			? pageItems.filter(c => [String(c.id), c.category_name, c.description || ''].join(' ').toLowerCase().includes(dropdownFilter.toLowerCase()) || (c.category_name || '').toLowerCase() === 'others')
			: pageItems

	async function handleSave(data: { category_name: string; description?: string }) {
		try {
			const payload: any = { category_name: data.category_name, description: data.description };
			const res = await fetch(`${API_BASE_URL}/api/categories/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
			if (!res.ok) throw new Error('Create failed')
			const created = await res.json()
			// backend returns category object; normalize id field to string for our dialog usage
			const normalized = { id: String(created.category_id), category_name: created.category_name, description: created.description }
			setCategories(prev => [...prev, normalized])
			showSuccess('Category Added', `${data.category_name} added`)
		} catch (e:any) { console.error(e); showError('Create Failed', e?.message || 'Unable to create category') }
	}

	async function handleUpdate(id: string, data: { category_name: string; description?: string }) {
		try {
			const payload: any = { category_name: data.category_name, description: data.description };
			const res = await fetch(`${API_BASE_URL}/api/categories/${id}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
			if (!res.ok) throw new Error('Update failed')
			const updated = await res.json()
			const normalized = { id: String(updated.category_id), category_name: updated.category_name, description: updated.description }
			setCategories(prev => prev.map(c => c.id === String(updated.category_id) ? normalized : c))
			showSuccess('Category Updated', `${data.category_name} updated`)
		} catch (e:any) { console.error(e); showError('Update Failed', e?.message || 'Unable to update category') }
	}

	const confirmDelete = async () => {
			if (!categoryToDelete) return
		try {
				const res = await fetch(`${API_BASE_URL}/api/categories/${categoryToDelete.id}/`, { method: 'DELETE' })
				if (!res.ok && res.status !== 204) throw new Error('Delete failed')
				setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id))
			showSuccess('Category Deleted', `${categoryToDelete.category_name} deleted`)
		} catch (e:any) { console.error(e); showError('Delete Failed', e?.message || 'Unable to delete category') }
		finally { setCategoryToDelete(null); setDeleteConfirmOpen(false) }
	}

	return (
		<div className="flex">
			<SidebarNav />
			<main className="flex-1 p-8">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-foreground">Categories</h1>
						<p className="text-muted-foreground">Manage categories (category_id, category_name, description)</p>
					</div>
					<div className="flex items-center gap-2">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
							<Input className="pl-10" placeholder="Search categories" value={search} onChange={(e) => { setSearch(e.target.value) }} />
						</div>
						<Button variant="success" onClick={() => { setSelectedCategory(null); setIsDialogOpen(true) }} className="gap-2"><Plus className="h-4 w-4"/>Add Category</Button>
					</div>
				</div>
				{/* Stats cards */}
				<StatsCards stats={[
					{ title: 'Total Categories', value: <span className="text-purple-600">{totalCategories}</span>, subtitle: 'All categories' },
					{ title: 'With Assets', value: <span className="text-green-600">{categoriesWithAssets}</span>, subtitle: 'Referenced by assets' },
					{ title: 'Empty', value: <span className="text-blue-600">{emptyCategories}</span>, subtitle: 'No assets' },
					{ title: 'Recent (30d)', value: <span className="text-purple-600">{recentCategories}</span>, subtitle: 'Added last 30 days' },
				]} />

				<Card>
					<CardHeader />
					<CardContent>
							<div className="space-y-4">
								<div className="flex items-center gap-4">
									<Select value={selectedCategory?.id ?? ""} onValueChange={(val) => {
										const found = categories.find(x => x.id === val)
										if (found) setSelectedCategory(found)
										else setSelectedCategory(null)
									}}>
										<SelectTrigger className="w-80">
											<SelectValue placeholder="Select a category..." />
										</SelectTrigger>
										<SelectContent>
											<div className="p-2">
												<Input placeholder="Filter categories..." value={dropdownFilter} onChange={(e) => setDropdownFilter(e.target.value)} className="mb-2" />
											</div>
											{dropdownFiltered.map(c => (
												<SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>
											))}
										</SelectContent>
									</Select>
									<div className="flex items-center gap-2">
										<Button variant="ghost" size="sm" onClick={() => { if (selectedCategory) { setSelectedCategory({ id: selectedCategory.id, category_name: selectedCategory.category_name, description: selectedCategory.description || '' }); setIsDialogOpen(true) } }} title="Edit">Edit</Button>
										<Button variant="ghost" size="sm" onClick={() => { if (selectedCategory) { setCategoryToDelete({ id: selectedCategory.id, category_name: selectedCategory.category_name, description: selectedCategory.description || '' }); setDeleteConfirmOpen(true) } }} className="text-red-600 hover:text-red-700 hover:bg-red-50">Delete</Button>
									</div>
								</div>
								{pageItems.length === 0 && <div className="text-muted-foreground">No categories found.</div>}
								<div className="grid gap-2">
									{pageItems.map(c => (
										<div key={c.id} className="flex items-center justify-between border rounded p-2">
											<div>
												<div className="font-medium">{c.category_name}</div>
												<div className="text-muted-foreground text-sm">{c.description || '-'}</div>
											</div>
											<div className="flex items-center gap-2">
												<Button variant="ghost" size="icon" onClick={() => { setSelectedCategory({ id: c.id, category_name: c.category_name, description: c.description || '' }); setIsDialogOpen(true) }} title="Edit"><Edit className="h-4 w-4"/></Button>
												<Button variant="ghost" size="icon" onClick={() => { setCategoryToDelete({ id: c.id, category_name: c.category_name, description: c.description || '' }); setDeleteConfirmOpen(true) }} title="Delete" className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4"/></Button>
											</div>
										</div>
									))}
								</div>
							</div>

						{/* pagination removed: showing full filtered list */}
					</CardContent>
				</Card>

				<CategoryDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} category={selectedCategory} onSave={handleSave} onUpdate={handleUpdate} />

				<ConfirmationDialog open={deleteConfirmOpen} onOpenChange={(v) => { if (!v) { setCategoryToDelete(null); setDeleteConfirmOpen(false) } else setDeleteConfirmOpen(true) }} title="Delete Category" description={`Are you sure you want to delete "${categoryToDelete?.category_name}"? This cannot be undone.`} confirmText="Delete" cancelText="Cancel" onConfirm={confirmDelete} variant="destructive" />
			</main>
		</div>
	)
}





