"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Plus, Trash2, Pencil, AlertTriangle } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  cost: number;
  supplier: string | null;
}

const categories = ["PAPER", "INK", "TONER", "OTHER"];

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    category: "PAPER",
    quantity: "",
    unit: "",
    minStock: "",
    cost: "",
    supplier: "",
  });

  const fetchItems = () => {
    setLoading(true);
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setItems(data);
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Error", description: "Failed to load inventory" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm({ name: "", category: "PAPER", quantity: "", unit: "", minStock: "", cost: "", supplier: "" });
    setEditing(null);
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      minStock: String(item.minStock),
      cost: String(item.cost),
      supplier: item.supplier || "",
    });
    setDialogOpen(true);
  };

  const saveItem = async () => {
    try {
      const url = editing ? `/api/inventory/${editing.id}` : "/api/inventory";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: editing ? "Item updated" : "Item added" });
        setDialogOpen(false);
        resetForm();
        fetchItems();
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
    } catch (e: unknown) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this inventory item?")) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Item deleted" });
        fetchItems();
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete item" });
    }
  };

  const lowStockItems = items.filter((i) => i.quantity <= i.minStock);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage supplies, paper, ink, and stock levels</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-red-500/30 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold">{lowStockItems.length} item(s) low on stock</h3>
              <p className="text-sm text-muted-foreground">
                {lowStockItems.map((i) => i.name).join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{items.reduce((sum, i) => sum + i.quantity * i.cost, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Inventory Items</CardTitle>
          <CardDescription>{items.length} items in stock</CardDescription>
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
                    <th className="text-left py-3 px-2">Item</th>
                    <th className="text-left py-3 px-2">Category</th>
                    <th className="text-left py-3 px-2">Stock</th>
                    <th className="text-left py-3 px-2">Min Stock</th>
                    <th className="text-left py-3 px-2">Unit Cost</th>
                    <th className="text-left py-3 px-2">Supplier</th>
                    <th className="text-right py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isLow = item.quantity <= item.minStock;
                    return (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="secondary">{item.category}</Badge>
                        </td>
                        <td className="py-3 px-2">
                          <span className={isLow ? "text-red-600 font-semibold" : ""}>
                            {item.quantity} {item.unit}
                          </span>
                          {isLow && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Low
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {item.minStock} {item.unit}
                        </td>
                        <td className="py-3 px-2">₱{Number(item.cost).toFixed(2)}</td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {item.supplier || "—"}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Item" : "Add Inventory Item"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update stock levels and details." : "Add a new supply or material to inventory."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. A4 Paper"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) => setForm({ ...form, category: val })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="sheets"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Min Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Unit Cost (₱)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveItem} disabled={!form.name || !form.unit}>
              {editing ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
