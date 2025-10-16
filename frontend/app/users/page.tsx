"use client";

import { useState, useEffect } from "react";

import { SidebarNav } from "@/components/sidebar-nav";
import { formatPhone, formatNin } from "@/lib/utils";
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
import { Plus, Search, Edit, Trash2, Users, Filter } from "lucide-react";
import { UserDialog, User } from "../../components/user-dialog";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useNotificationActions } from "@/components/notification-system";
 
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type ApiUser = {
  user_id: number;
  name: string;
  department?: string | null;
  occupation?: string | null;
  email?: string | null;
  phone?: string | null;
  nin?: string | null;
  status?: string | null;
};

function mapApiUserToUi(u: ApiUser): User {
  return {
    id: String(u.user_id),
    name: u.name,
    email: u.email || "",
    phone: u.phone || "",
    department: u.department || "",
    position: u.occupation || "",
    nin: u.nin || "",
    status: (u.status as any) || "Active",
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mapUiToApi(user: Omit<User, "id" | "createdAt" | "updatedAt">): Omit<ApiUser, "user_id"> {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone,
    department: user.department,
    occupation: user.position,
    nin: user.nin || null,
    status: user.status,
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { showSuccess, showError } = useNotificationActions()
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  useEffect(() => {
    async function load() {
      try {
    const res = await fetch(`${API_BASE_URL}/api/users/`);
        if (!res.ok) throw new Error("Failed to load users");
        const data: ApiUser[] = await res.json();
        setUsers(data.map(mapApiUserToUi));
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.department || "").toLowerCase().includes(query) ||
      (user.position || "").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(filteredUsers.map(a => a.id))
    else setSelectedIds([])
  }

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(x => x !== id))
  }

  const exportSelected = () => {
    const rows = users.filter(a => selectedIds.includes(a.id))
    if (rows.length === 0) return
    const headers = ['id','name','email','phone','department','position','status']
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => `"${String((r as any)[h] ?? '')}"`).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users_export_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function performBulkDelete() {
    if (selectedIds.length === 0) return
    try {
      await Promise.all(selectedIds.map(id => fetch(`${API_BASE_URL}/api/users/${id}/`, { method: 'DELETE' })))
      setUsers(prev => prev.filter(a => !selectedIds.includes(a.id)))
      showSuccess('Users Deleted', `${selectedIds.length} users removed`)
      setSelectedIds([])
    } catch (e) {
      console.error(e)
      showError('Bulk Delete Failed', 'Unable to delete some users')
    } finally {
      setBulkDeleteOpen(false)
    }
  }

  const handleAddUser = async (userData: Omit<User, "id" | "createdAt" | "updatedAt">) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapUiToApi(userData)),
      });
      if (!res.ok) { showError('Create Failed', 'Unable to create user'); throw new Error('Failed to create user') }
      const created: ApiUser = await res.json();
      setUsers((prev) => [...prev, mapApiUserToUi(created)]);
      showSuccess('User Added', `${created.name} added`)
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUser = async (
    id: string,
    userData: Omit<User, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapUiToApi(userData)),
      });
      if (!res.ok) { showError('Update Failed', 'Unable to update user'); throw new Error('Failed to update user') }
      const updated: ApiUser = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? mapApiUserToUi(updated) : u)));
      showSuccess('User Updated', `${updated.name} updated`)
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userToDelete.id}/`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        showError('Delete Failed', 'Unable to delete user');
        throw new Error('Failed to delete user');
      }
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      showSuccess('User Deleted', `${userToDelete.name} removed`);
    } catch (err) {
      console.error(err);
    } finally {
      setUserToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleAddNewUser = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const activeUsersCount = users.filter((u) => u.status === "Active").length;
  const inactiveUsersCount = users.filter((u) => u.status === "Inactive").length;

  return (
    <div className="flex">
      <SidebarNav />
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground">Manage users and their information</p>
          </div>
          <Button variant="success" onClick={handleAddNewUser} className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">{activeUsersCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/20">
                  <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inactive Users</p>
                  <p className="text-2xl font-bold text-red-600">{inactiveUsersCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, department, or position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "All" | "Active" | "Inactive")}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                  aria-label="Status filter"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
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
                    <input role="checkbox" type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === filteredUsers.length} onChange={(e) => toggleSelectAll(e.target.checked)} className="accent-primary" />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Occupation</TableHead>
                  <TableHead>NIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {users.length === 0
                        ? "No users yet. Click 'Add User' to create your first user."
                        : "No users match your search criteria."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="w-12"><input role="checkbox" type="checkbox" checked={selectedIds.includes(user.id)} onChange={(e) => toggleSelectOne(user.id, e.target.checked)} className="accent-primary" /></TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{formatPhone(user.phone)}</TableCell>
                      <TableCell>{user.department || "-"}</TableCell>
                      <TableCell>{user.position || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatNin((user as any).nin)}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)} title="Edit user">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user)}
                            title="Delete user"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          </CardContent>
        </Card>

        <UserDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          user={selectedUser}
          onSave={handleAddUser}
          onUpdate={handleUpdateUser}
        />

        <ConfirmationDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete User"
          description={`Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          variant="destructive"
        />
        <ConfirmationDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} title="Delete Users" description={`Are you sure you want to delete ${selectedIds.length} selected users? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" onConfirm={performBulkDelete} variant="destructive" />
      </main>
    </div>
  );
}


