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
import { Plus, Search, Edit, Trash2, ShoppingCart, Package } from "lucide-react";
import { BuyerDialog } from "@/components/buyer-dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useNotificationActions } from "@/components/notification-system";
import StatsCards from "@/components/stats-cards";
import usePolling from "@/lib/usePolling";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Buyer = {
  buyer_id?: number | string;
  buyer_id_num?: number; // fallback
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  tin?: string;
  created_at?: string | null;
};

export default function BuyersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const { showSuccess, showError } = useNotificationActions();

  const filteredBuyers = buyers.filter(
    (b) => (b.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (b.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/buyers/`);
        if (!res.ok) throw new Error(`Failed to load buyers: ${res.status}`);
        const data = await res.json();
        if (mounted) setBuyers(data || []);
      } catch (e) {
        console.error(e);
        showError("Load Failed", "Unable to load buyers from server");
      }
    }
    load();
    return () => { mounted = false };
  }, []);

  const totalBuyers = buyers.length;
  const buyersWithEmail = buyers.filter(b => b.email).length;
  const shownBuyers = filteredBuyers.length;
  const shownWithEmail = filteredBuyers.filter(b => b.email).length;

  const handleCreate = async (payload: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/buyers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create buyer');
      const created = await res.json();
      setBuyers(prev => [...prev, created]);
      showSuccess('Buyer Added', `${created.name} added successfully`);
    } catch (err) {
      console.error(err);
      showError('Create Failed', 'Unable to save buyer to server');
      throw err;
    }
  };

  const handleUpdate = async (id: number | string, payload: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/buyers/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update buyer');
      const updated = await res.json();
      setBuyers(prev => prev.map(b => (b.buyer_id === id || b.buyer_id_num === id ? updated : b)));
      showSuccess('Buyer Updated', `${updated.name} updated`);
    } catch (err) {
      console.error(err);
      showError('Update Failed', 'Unable to update buyer on server');
      throw err;
    }
  };

  const handleDelete = async (buyer: Buyer) => {
    const id = buyer.buyer_id ?? buyer.buyer_id_num;
    if (!id) return;
    setBuyerToDelete(buyer);
    setDeleteDialogOpen(true);
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState<Buyer | null>(null);

  const { data: polledBuyers } = usePolling<any[]>(`${API_BASE_URL}/api/buyers/`, 30000, !isDialogOpen && !deleteDialogOpen)
  useEffect(() => { if (Array.isArray(polledBuyers)) setBuyers(polledBuyers) }, [polledBuyers])

  async function confirmDeleteBuyer() {
    if (!buyerToDelete) return;
    const id = buyerToDelete.buyer_id ?? buyerToDelete.buyer_id_num;
    try {
      const res = await fetch(`${API_BASE_URL}/api/buyers/${id}/`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete buyer');
      setBuyers(prev => prev.filter(b => (b.buyer_id ?? b.buyer_id_num) !== id));
      showSuccess('Buyer Deleted', `${buyerToDelete.name} removed`);
    } catch (err) {
      console.error(err);
      showError('Delete Failed', 'Unable to delete buyer from server');
    } finally {
      setBuyerToDelete(null);
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
                Buyers Management
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage buyers and disposal recipients
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedBuyer(null);
                setIsDialogOpen(true);
              }}
              className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Add Buyer
            </Button>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-8">
          <Card className="card-modern hover-lift group relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Total Buyers</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{totalBuyers}</p>
                  <p className="text-xs text-muted-foreground mt-1">Showing {shownBuyers} filtered</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ShoppingCart className="h-7 w-7 text-white" />
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
                  <p className="text-3xl font-extrabold text-green-600 mt-2">{buyersWithEmail}</p>
                  <p className="text-xs text-muted-foreground mt-1">Showing {shownWithEmail} filtered</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="h-7 w-7 text-white" />
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
                placeholder="Search buyers by name or email..."
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
                  <TableHead>Buyer Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>TIN</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuyers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      No buyers yet. Click "Add Buyer" to add the first
                      buyer.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBuyers.map((buyer) => (
                    <TableRow key={buyer.buyer_id ?? buyer.buyer_id_num} className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-colors duration-200">
                      <TableCell className="font-medium">
                        {buyer.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {buyer.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatPhone(buyer.phone)}
                      </TableCell>
                      <TableCell>{buyer.address}</TableCell>
                      <TableCell>{buyer.tin}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedBuyer(buyer);
                              setIsDialogOpen(true);
                            }}
                            className="hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(buyer)} 
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
          title={`Delete buyer "${buyerToDelete?.name || ''}"`}
          description={`Are you sure you want to delete "${buyerToDelete?.name || ''}"?`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteBuyer}
          variant="destructive"
        />

        <BuyerDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          buyer={selectedBuyer}
          onSave={async (payload: any) => { await handleCreate(payload); setIsDialogOpen(false); setSelectedBuyer(null); }}
          onUpdate={async (id: any, payload: any) => { await handleUpdate(id, payload); setIsDialogOpen(false); setSelectedBuyer(null); }}
        />
      </main>
    </div>
  );
}
