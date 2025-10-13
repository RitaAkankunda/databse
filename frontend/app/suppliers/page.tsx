"use client";

import { useEffect, useState } from "react";
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
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { SupplierDialog } from "@/components/supplier-dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useNotificationActions } from "@/components/notification-system";
import StatsCards from "@/components/stats-cards"
import usePolling from "@/lib/usePolling"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

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
    <div className="flex">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
            <p className="text-muted-foreground">
              Manage supplier information and contacts
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedSupplier(null);
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Supplier
          </Button>
        </div>

        <StatsCards stats={[
          { title: 'Total Suppliers', value: <span className="text-purple-600">{totalSuppliers}</span>, subtitle: 'All suppliers' },
          { title: 'With Email', value: <span className="text-green-600">{suppliersWithEmail}</span>, subtitle: 'Suppliers with contact email' },
          { title: 'With Assets', value: <span className="text-blue-600">{suppliersWithAssets}</span>, subtitle: 'Suppliers referenced by assets' },
          { title: 'Recent (30d)', value: <span className="text-purple-600">{recentSuppliers}</span>, subtitle: 'Added last 30 days' },
        ]} />

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name or contact person..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableRow key={supplier.supplier_id ?? supplier.supplier_id_num}>
                      <TableCell className="font-medium">
                        {supplier.name}
                      </TableCell>
                      <TableCell>{supplier.contactPerson}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {supplier.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {supplier.phone}
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
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
