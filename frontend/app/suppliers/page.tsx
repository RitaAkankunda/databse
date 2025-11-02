"use client";

import { useEffect, useState } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { formatPhone } from "@/lib/utils";
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
import { Plus, Search, Edit, Trash2, Package, Truck } from "lucide-react";
import { SupplierDialog } from "@/components/supplier-dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useNotificationActions } from "@/components/notification-system";
import StatsCards from "@/components/stats-cards"
import usePolling from "@/lib/usePolling"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Supplier = {
  supplier_id?: number | string;
  supplier_id_num?: number; // fallback
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  created_at?: string | null;
  created?: string | null;
  added_at?: string | null;
};

const mockSuppliers: any[] = [];

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { showSuccess, showError } = useNotificationActions();

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      (supplier.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.contactPerson || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/suppliers/`);
        if (!res.ok) throw new Error(`Failed to load suppliers: ${res.status}`);
        const data = await res.json();
        if (mounted) setSuppliers(data || []);
      } catch (e) {
        console.error(e);
        showError("Load Failed", "Unable to load suppliers from server");
      }
    }
    load();
    return () => { mounted = false };
  }, []);

  

  const totalSuppliers = suppliers.length
  const suppliersWithEmail = suppliers.filter(s => s.email).length

  const handleCreate = async (payload: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/suppliers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create supplier');
      const created = await res.json();
      setSuppliers(prev => [...prev, created]);
      showSuccess('Supplier Added', `${created.name} added successfully`);
    } catch (err) {
      console.error(err);
      showError('Create Failed', 'Unable to save supplier to server');
      throw err;
    }
  };

  const handleUpdate = async (id: number | string, payload: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/suppliers/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update supplier');
      const updated = await res.json();
      setSuppliers(prev => prev.map(s => (s.supplier_id === id || s.supplier_id_num === id ? updated : s)));
      showSuccess('Supplier Updated', `${updated.name} updated`);
    } catch (err) {
      console.error(err);
      showError('Update Failed', 'Unable to update supplier on server');
      throw err;
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    const id = supplier.supplier_id ?? supplier.supplier_id_num;
    if (!id) return;
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Poll suppliers for live stats and table updates (disabled while dialogs are open)
  const { data: polledSuppliers } = usePolling<any[]>(`${API_BASE_URL}/api/suppliers/`, 30000, !isDialogOpen && !deleteDialogOpen)
  const { data: polledAssets } = usePolling<any[]>(`${API_BASE_URL}/api/assets/`, 30000, !isDialogOpen && !deleteDialogOpen)
  useEffect(() => { if (Array.isArray(polledSuppliers)) setSuppliers(polledSuppliers) }, [polledSuppliers])

  // assume assets include 'supplier' or 'supplier_id' to link to suppliers
  const supplierIdsWithAssets = new Set((Array.isArray(polledAssets) ? polledAssets : []).map(a => String(a.supplier ?? a.supplier_id ?? '')).filter(Boolean))
  const suppliersWithAssets = Array.from(new Set(Array.from(supplierIdsWithAssets))).length
  const recentSuppliers = suppliers.filter(s => {
    const t = s.created_at ?? s.created ?? s.added_at ?? null
    if (!t) return false
    const d = new Date(t)
    if (Number.isNaN(d.getTime())) return false
    return d >= new Date(Date.now() - 30*24*60*60*1000)
  }).length

  async function confirmDeleteSupplier() {
    if (!supplierToDelete) return;
    const id = supplierToDelete.supplier_id ?? supplierToDelete.supplier_id_num;
    try {
      const res = await fetch(`${API_BASE_URL}/api/suppliers/${id}/`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete supplier');
      setSuppliers(prev => prev.filter(s => (s.supplier_id ?? s.supplier_id_num) !== id));
      showSuccess('Supplier Deleted', `${supplierToDelete.name} removed`);
    } catch (err) {
      console.error(err);
      showError('Delete Failed', 'Unable to delete supplier from server');
    } finally {
      setSupplierToDelete(null);
      setDeleteDialogOpen(false);
    }
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
                Suppliers Management
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage supplier information and contacts
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedSupplier(null);
                setIsDialogOpen(true);
              }}
              className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Add Supplier
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
                  <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Total Suppliers</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{totalSuppliers}</p>
                  <p className="text-xs text-muted-foreground mt-1">All suppliers</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Truck className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">With Email</p>
                  <p className="text-3xl font-extrabold text-green-600 mt-2">{suppliersWithEmail}</p>
                  <p className="text-xs text-muted-foreground mt-1">Contact email available</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Truck className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">With Assets</p>
                  <p className="text-3xl font-extrabold text-blue-600 mt-2">{suppliersWithAssets}</p>
                  <p className="text-xs text-muted-foreground mt-1">Referenced by assets</p>
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
                  <p className="text-3xl font-extrabold text-orange-600 mt-2">{recentSuppliers}</p>
                  <p className="text-xs text-muted-foreground mt-1">Added last 30 days</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Truck className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-modern hover:shadow-xl transition-all duration-300 border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
          <CardHeader className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name or contact person..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 text-base border-2 focus:border-primary transition-all"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 hover:bg-slate-100/50">
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      No suppliers yet. Click "Add Supplier" to add the first
                      supplier.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.supplier_id ?? supplier.supplier_id_num} className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-colors duration-200">
                      <TableCell className="font-medium">
                        {supplier.name}
                      </TableCell>
                      <TableCell>{supplier.contactPerson}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {supplier.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatPhone(supplier.phone)}
                      </TableCell>
                      <TableCell>{supplier.address}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setIsDialogOpen(true);
                            }}
                            className="hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(supplier)} 
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

        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title={`Delete supplier "${supplierToDelete?.name || ''}"`}
          description={`Are you sure you want to delete "${supplierToDelete?.name || ''}"?`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteSupplier}
          variant="destructive"
        />

        <SupplierDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          supplier={selectedSupplier}
          onSave={async (payload: any) => { await handleCreate(payload); setIsDialogOpen(false); setSelectedSupplier(null); }}
          onUpdate={async (id: any, payload: any) => { await handleUpdate(id, payload); setIsDialogOpen(false); setSelectedSupplier(null); }}
        />
      </main>
    </div>
  );
}
