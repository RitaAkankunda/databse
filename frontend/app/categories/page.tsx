"use client"

import { useEffect, useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Search, Edit, Trash2, Package } from "lucide-react"
import CategoryDialog, { Category as CategoryType } from "@/components/category-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { useNotificationActions } from "@/components/notification-system"
import StatsCards from "@/components/stats-cards"
import usePolling from "@/lib/usePolling"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

type Category = { category_id: number; category_name: string; description?: string | null; created?: string | null }

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

useEffect(() => {
	if (Array.isArray(polledCategories)) {
		setCategories(polledCategories.map(d => ({ id: String(d.category_id), category_name: d.category_name, description: d.description || '', created: d.created_at ?? d.created ?? null })))
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
									const normalized = data.map(d => ({ id: String(d.category_id), category_name: d.category_name, description: d.description || '', created: d.created_at ?? d.created ?? null }))
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
		<div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
			<SidebarNav />
			<main className="flex-1 p-8 bg-gradient-to-br from-white/40 to-transparent">
				{/* Enhanced Header */}
				<div className="mb-8">
					<div className="flex items-center justify-between relative">
						<div>
							<h1 className="text-4xl font-bold text-foreground mb-2">
								Categories Management
							</h1>
							<p className="text-lg text-muted-foreground">
								Manage categories and their descriptions
							</p>
						</div>
						<div className="flex items-center gap-2">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
								<Input 
									className="pl-11 h-12 text-base border-2 focus:border-primary transition-all" 
									placeholder="Search categories" 
									value={search} 
									onChange={(e) => { setSearch(e.target.value) }} 
								/>
							</div>
							<Button 
								variant="success" 
								onClick={() => { setSelectedCategory(null); setIsDialogOpen(true) }} 
								className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
								size="lg"
							>
								<Plus className="h-5 w-5"/>
								Add Category
							</Button>
						</div>
					</div>
				</div>
				{/* Enhanced Stats cards */}
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
					<Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
						<div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full blur-3xl"></div>
						<CardContent className="p-6 relative">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Total Categories</p>
									<p className="text-3xl font-extrabold text-gray-900 mt-2">{totalCategories}</p>
									<p className="text-xs text-muted-foreground mt-1">All categories</p>
								</div>
								<div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
									<Package className="h-7 w-7 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
						<div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full blur-3xl"></div>
						<CardContent className="p-6 relative">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-green-700 uppercase tracking-wide">With Assets</p>
									<p className="text-3xl font-extrabold text-green-600 mt-2">{categoriesWithAssets}</p>
									<p className="text-xs text-muted-foreground mt-1">Referenced by assets</p>
								</div>
								<div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
									<Package className="h-7 w-7 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
						<div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl"></div>
						<CardContent className="p-6 relative">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Empty</p>
									<p className="text-3xl font-extrabold text-blue-600 mt-2">{emptyCategories}</p>
									<p className="text-xs text-muted-foreground mt-1">No assets</p>
								</div>
								<div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
									<Package className="h-7 w-7 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
						<div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl"></div>
						<CardContent className="p-6 relative">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Recent (30d)</p>
									<p className="text-3xl font-extrabold text-orange-600 mt-2">{recentCategories}</p>
									<p className="text-xs text-muted-foreground mt-1">Added last 30 days</p>
								</div>
								<div className="h-14 w-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
									<Package className="h-7 w-7 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<Card className="card-modern hover:shadow-xl transition-all duration-300 border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
					<CardHeader className="pb-4">
						<h3 className="text-lg font-bold text-foreground">Categories List</h3>
					</CardHeader>
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
								<div className="grid gap-3">
									{pageItems.map(c => (
										<div key={c.id} className="flex items-center justify-between border-2 border-slate-200 rounded-lg p-4 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent hover:border-primary/30 transition-all duration-200 bg-white">
											<div>
												<div className="font-medium">{c.category_name}</div>
												<div className="text-muted-foreground text-sm">{c.description || '-'}</div>
											</div>
											<div className="flex items-center gap-2">
												<Button 
													variant="ghost" 
													size="icon" 
													onClick={() => { setSelectedCategory({ id: c.id, category_name: c.category_name, description: c.description || '' }); setIsDialogOpen(true) }} 
													title="Edit"
													className="hover:bg-blue-100 hover:text-blue-600 transition-colors"
												>
													<Edit className="h-4 w-4"/>
												</Button>
												<Button 
													variant="ghost" 
													size="icon" 
													onClick={() => { setCategoryToDelete({ id: c.id, category_name: c.category_name, description: c.description || '' }); setDeleteConfirmOpen(true) }} 
													title="Delete" 
													className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
												>
													<Trash2 className="h-4 w-4"/>
												</Button>
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





