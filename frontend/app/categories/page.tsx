"use client"

import { useEffect, useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import CategoryDialog, { Category as CategoryType } from "@/components/category-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useNotificationActions } from "@/components/notification-system"
import StatsCards from "@/components/stats-cards"
import usePolling from "@/lib/usePolling"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

type Category = { category_id: number; category_name: string; description?: string | null }

export default function CategoriesPage() {
		const [categories, setCategories] = useState<CategoryType[]>([])
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

useEffect(() => { if (Array.isArray(polledCategories)) setCategories(polledCategories.map(d => ({ id: String(d.category_id), category_name: d.category_name, description: d.description || '' }))) }, [polledCategories])

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
					const data: Array<{ category_id: number; category_name: string; description?: string | null }> = await res.json()
					const normalized = data.map(d => ({ id: String(d.category_id), category_name: d.category_name, description: d.description || '' }))
					setCategories(normalized)
				} catch (e) {
					console.error(e)
					showError('Load Failed', 'Unable to load categories')
				}
			})()
	}, [])

		const filtered = categories.filter(c => [String(c.id), c.category_name, c.description || ''].join(' ').toLowerCase().includes(search.toLowerCase()))
	const pageItems = filtered

	async function handleSave(data: { category_name: string; description?: string }) {
		try {
			const res = await fetch(`${API_BASE_URL}/api/categories/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category_name: data.category_name, description: data.description }) })
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
			const res = await fetch(`${API_BASE_URL}/api/categories/${id}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category_name: data.category_name, description: data.description }) })
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
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Category ID</TableHead>
									<TableHead>Category Name</TableHead>
									<TableHead>Description</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
												<TableBody>
													{pageItems.map(c => (
														<TableRow key={c.id}>
															<TableCell className="font-medium">{c.id}</TableCell>
															<TableCell>{c.category_name}</TableCell>
															<TableCell className="text-muted-foreground">{c.description || '-'}</TableCell>
															<TableCell className="text-right">
																<div className="flex justify-end gap-2">
																	<Button variant="ghost" size="icon" onClick={() => { setSelectedCategory({ id: c.id, category_name: c.category_name, description: c.description || '' }); setIsDialogOpen(true) }} title="Edit"><Edit className="h-4 w-4"/></Button>
																	<Button variant="ghost" size="icon" onClick={() => { setCategoryToDelete({ id: c.id, category_name: c.category_name, description: c.description || '' }); setDeleteConfirmOpen(true) }} title="Delete" className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4"/></Button>
																</div>
															</TableCell>
														</TableRow>
													))}
								{pageItems.length === 0 && (
									<TableRow>
										<TableCell colSpan={4} className="text-center text-muted-foreground py-8">No categories found.</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>

						{/* pagination removed: showing full filtered list */}
					</CardContent>
				</Card>

				<CategoryDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} category={selectedCategory} onSave={handleSave} onUpdate={handleUpdate} />

				<ConfirmationDialog open={deleteConfirmOpen} onOpenChange={(v) => { if (!v) { setCategoryToDelete(null); setDeleteConfirmOpen(false) } else setDeleteConfirmOpen(true) }} title="Delete Category" description={`Are you sure you want to delete "${categoryToDelete?.category_name}"? This cannot be undone.`} confirmText="Delete" cancelText="Cancel" onConfirm={confirmDelete} variant="destructive" />
			</main>
		</div>
	)
}





