"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { FileText, RefreshCw, Trash2, Receipt } from "lucide-react";
import Link from "next/link";

interface PrintJob {
  id: string;
  fileName: string;
  fileUrl: string;
  pages: number;
  copies: number;
  color: boolean;
  duplex: boolean;
  paperSize: string;
  totalCost: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  pickupAt: string | null;
  createdAt: string;
  user: { name: string | null; email: string };
}

const statusOptions = ["PENDING", "QUEUED", "PRINTING", "COMPLETED", "FAILED", "CANCELLED"];
const paymentOptions = ["PENDING", "PAID", "REFUNDED"];

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    fetch("/api/print?scope=admin")
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setJobs(data);
      })
      .catch(() => {
        if (mounted) toast({ variant: "destructive", title: "Error", description: "Failed to load jobs" });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = () => {
    setLoading(true);
    fetch("/api/print?scope=admin")
      .then((r) => r.json())
      .then((data) => setJobs(data))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to load jobs" }))
      .finally(() => setLoading(false));
  };

  const updateJob = async (id: string, updates: Record<string, string>) => {
    try {
      const res = await fetch(`/api/print/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        toast({ title: "Job updated" });
        refresh();
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update job" });
    }
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      const res = await fetch(`/api/print/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Job deleted" });
        refresh();
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete job" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "default";
      case "PENDING": return "secondary";
      case "QUEUED": return "secondary";
      case "PRINTING": return "destructive";
      case "FAILED": return "destructive";
      case "CANCELLED": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Print Requests</h1>
          <p className="text-muted-foreground">Review, process, and manage all client print jobs</p>
        </div>
        <Button variant="outline" onClick={refresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Jobs</CardTitle>
          <CardDescription>{jobs.length} total print jobs</CardDescription>
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
                    <th className="text-left py-3 px-2">Document</th>
                    <th className="text-left py-3 px-2">Details</th>
                    <th className="text-left py-3 px-2">Paper</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Payment</th>
                    <th className="text-left py-3 px-2">Method</th>
                    <th className="text-left py-3 px-2">Cost</th>
                    <th className="text-left py-3 px-2">Pickup</th>
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-right py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{job.user.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{job.user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <a
                            href={job.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate max-w-[120px] hover:underline text-primary"
                          >
                            {job.fileName}
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {job.pages}p × {job.copies}
                        {job.color ? " · Color" : " · B&W"}
                        {job.duplex ? " · Duplex" : ""}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">{job.paperSize}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Select
                          value={job.status}
                          onValueChange={(val) => updateJob(job.id, { status: val })}
                        >
                          <SelectTrigger className="w-[130px] h-8">
                            <Badge variant={getStatusColor(job.status)} className="mr-1">
                              {job.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-2">
                        <Select
                          value={job.paymentStatus}
                          onValueChange={(val) => updateJob(job.id, { paymentStatus: val })}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <span className="text-xs">{job.paymentStatus}</span>
                          </SelectTrigger>
                          <SelectContent>
                            {paymentOptions.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">
                          {job.paymentMethod === "E_WALLET" ? "E-Wallet" : job.paymentMethod === "CASH" ? "Cash" : "—"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 font-medium">₱{Number(job.totalCost).toFixed(2)}</td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        {job.pickupAt ? (
                          <span className="text-primary font-medium">
                            {new Date(job.pickupAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/jobs/${job.id}/receipt`}>
                              <Receipt className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteJob(job.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
    </div>
  );
}
