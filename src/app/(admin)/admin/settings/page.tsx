"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Banknote, Printer, Plus, Trash2 } from "lucide-react";

interface SizeRates {
  bwSingle: number;
  bwDouble: number;
  colorSingle: number;
  colorDouble: number;
  photoSingle: number;
  photoDouble: number;
}

interface PricingConfig {
  short: SizeRates;
  long: SizeRates;
  a4: SizeRates;
}

interface PrinterData {
  id: string;
  name: string;
  model: string;
  location: string;
  ipAddress: string | null;
  isActive: boolean;
}

const defaultSizeRates: SizeRates = {
  bwSingle: 5.0,
  bwDouble: 3.0,
  colorSingle: 20.0,
  colorDouble: 15.0,
  photoSingle: 20.0,
  photoDouble: 50.0,
};

const defaultPricing: PricingConfig = {
  short: { ...defaultSizeRates },
  long: { ...defaultSizeRates, bwSingle: 7.0, bwDouble: 5.0, colorSingle: 25.0, colorDouble: 20.0, photoSingle: 40.0, photoDouble: 80.0 },
  a4: { ...defaultSizeRates },
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [pricing, setPricing] = useState<PricingConfig>(defaultPricing);
  const [printers, setPrinters] = useState<PrinterData[]>([]);
  const [newPrinter, setNewPrinter] = useState({ name: "", model: "", location: "", ipAddress: "" });

  const fetchPrinters = () => {
    fetch("/api/printers")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setPrinters(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch("/api/settings/pricing")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setPricing(data);
      })
      .catch(() => {});

    fetchPrinters();
  }, []);

  const updateRate = (size: keyof PricingConfig, field: keyof SizeRates, value: number) => {
    setPricing((prev) => ({
      ...prev,
      [size]: { ...prev[size], [field]: value },
    }));
  };

  const savePricing = async () => {
    try {
      const res = await fetch("/api/settings/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricing),
      });
      if (res.ok) {
        toast({ title: "Pricing updated successfully" });
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to save pricing" });
    }
  };

  const addPrinter = async () => {
    try {
      const res = await fetch("/api/printers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrinter),
      });
      if (res.ok) {
        toast({ title: "Printer added" });
        setNewPrinter({ name: "", model: "", location: "", ipAddress: "" });
        fetchPrinters();
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to add printer" });
    }
  };

  const deletePrinter = async (id: string) => {
    if (!confirm("Delete this printer?")) return;
    try {
      const res = await fetch(`/api/printers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Printer deleted" });
        fetchPrinters();
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete printer" });
    }
  };

  const sizeLabels: Record<keyof PricingConfig, string> = {
    short: "Short (Letter)",
    long: "Long (Legal)",
    a4: "A4",
  };

  const rateLabels: Record<keyof SizeRates, string> = {
    bwSingle: "B&W Print",
    bwDouble: "Xerox B&W",
    colorSingle: "Colored Print",
    colorDouble: "Colored Xerox",
    photoSingle: "Photo Print (Standard)",
    photoDouble: "Photo Print (Premium / Glossy)",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure pricing, printers, and system options</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Pricing Rates
          </CardTitle>
          <CardDescription>Per-page printing costs by paper size (in Philippine Pesos)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(Object.keys(sizeLabels) as (keyof PricingConfig)[]).map((size) => (
            <div key={size} className="space-y-3">
              <h3 className="font-semibold text-sm border-b pb-1">{sizeLabels[size]}</h3>
              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(rateLabels) as (keyof SizeRates)[]).map((rate) => (
                  <div className="space-y-1.5" key={`${size}-${rate}`}>
                    <Label htmlFor={`${size}-${rate}`} className="text-xs text-muted-foreground">
                      {rateLabels[rate]}
                    </Label>
                    <Input
                      id={`${size}-${rate}`}
                      type="number"
                      step="0.01"
                      value={pricing[size][rate]}
                      onChange={(e) => updateRate(size, rate, parseFloat(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button onClick={savePricing}>Save Pricing</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Printers
          </CardTitle>
          <CardDescription>Manage available printers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {printers.length > 0 && (
            <div className="space-y-2">
              {printers.map((printer) => (
                <div key={printer.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{printer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {printer.model} · {printer.location}
                      {printer.ipAddress ? ` · ${printer.ipAddress}` : ""}
                      {printer.isActive ? "" : " · Inactive"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deletePrinter(printer.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Add New Printer</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Name"
                value={newPrinter.name}
                onChange={(e) => setNewPrinter({ ...newPrinter, name: e.target.value })}
              />
              <Input
                placeholder="Model"
                value={newPrinter.model}
                onChange={(e) => setNewPrinter({ ...newPrinter, model: e.target.value })}
              />
              <Input
                placeholder="Location"
                value={newPrinter.location}
                onChange={(e) => setNewPrinter({ ...newPrinter, location: e.target.value })}
              />
              <Input
                placeholder="IP Address (optional)"
                value={newPrinter.ipAddress}
                onChange={(e) => setNewPrinter({ ...newPrinter, ipAddress: e.target.value })}
              />
            </div>
            <Button onClick={addPrinter} disabled={!newPrinter.name || !newPrinter.model || !newPrinter.location}>
              <Plus className="mr-2 h-4 w-4" />
              Add Printer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
