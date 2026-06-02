"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Users, Mail, AtSign, UserPlus, Shield, Pencil, KeyRound } from "lucide-react";

interface UserData {
  id: string;
  name: string | null;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "ADMIN",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    email: "",
  });

  useEffect(() => {
    let mounted = true;
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setUsers(data);
      })
      .catch(() => {
        if (mounted) toast({ variant: "destructive", title: "Error", description: "Failed to load users" });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to refresh users" });
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id: string, role: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        toast({ title: "User role updated" });
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, role } : u))
        );
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update role" });
    }
  };

  const openEdit = (user: UserData) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      username: user.username,
      email: user.email,
    });
    setEditDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        toast({ title: "User updated" });
        setEditDialogOpen(false);
        setEditingUser(null);
        refreshUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
    } catch (e: unknown) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const resetPassword = async (id: string, name: string) => {
    if (!confirm(`Reset password for ${name || "this user"} to "userpassword"?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: true }),
      });
      if (res.ok) {
        toast({ title: "Password reset", description: `Default password set to "userpassword"` });
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to reset password" });
    }
  };

  const createUser = async () => {
    if (!form.name || !form.username || !form.email || !form.password) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all required fields" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match" });
      return;
    }

    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });

      if (res.ok) {
        toast({ title: `${form.role === "ADMIN" ? "Admin" : "User"} account created` });
        setAddDialogOpen(false);
        setForm({ name: "", username: "", email: "", password: "", confirmPassword: "", role: "ADMIN" });
        refreshUsers();
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
    } catch (e: unknown) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const clientCount = users.filter((u) => u.role === "CLIENT").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and roles</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>{users.length} registered users</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">User</th>
                    <th className="text-left py-3 px-2">Username</th>
                    <th className="text-left py-3 px-2">Email</th>
                    <th className="text-left py-3 px-2">Role</th>
                    <th className="text-left py-3 px-2">Joined</th>
                    <th className="text-right py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{user.name || "Unnamed"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <AtSign className="h-3 w-3" />
                          {user.username}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Select
                          value={user.role}
                          onValueChange={(val) => updateRole(user.id, val)}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                              {user.role}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CLIENT">CLIENT</SelectItem>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(user)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => resetPassword(user.id, user.name || user.username)} title="Reset Password">
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
            <DialogDescription>Create a new admin or client account.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Full Name</Label>
                <Input id="add-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-role">Role</Label>
                <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val })}>
                  <SelectTrigger id="add-role"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="CLIENT">CLIENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-username">Username</Label>
              <Input id="add-username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="johndoe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input id="add-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-password">Password</Label>
                <Input id="add-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-confirm">Confirm Password</Label>
                <Input id="add-confirm" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="••••••••" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={createUser} disabled={!form.name || !form.username || !form.email || !form.password}>Create Account</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user profile information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input id="edit-username" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} placeholder="johndoe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="john@example.com" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
