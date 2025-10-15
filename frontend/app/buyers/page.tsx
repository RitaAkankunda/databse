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
    <div className="flex">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Buyers</h1>
            <p className="text-muted-foreground">
              Manage buyers and disposal recipients
            </p>
          </div>
          <Button
            variant="success"
            onClick={() => {
              setSelectedBuyer(null);
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Buyer
          </Button>
        </div>

        <StatsCards stats={[
          { title: 'Total Buyers', value: <span className="text-purple-600">{totalBuyers} <span className="text-sm text-muted-foreground">(showing {shownBuyers})</span></span>, subtitle: 'All buyers' },
          { title: 'With Email', value: <span className="text-green-600">{buyersWithEmail} <span className="text-sm text-muted-foreground">(showing {shownWithEmail})</span></span>, subtitle: 'Buyers with contact email' },
        ]} />

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search buyers by name or email..."
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
                    <TableRow key={buyer.buyer_id ?? buyer.buyer_id_num}>
                      <TableCell className="font-medium">
                        {buyer.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {buyer.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {buyer.phone}
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
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(buyer)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
