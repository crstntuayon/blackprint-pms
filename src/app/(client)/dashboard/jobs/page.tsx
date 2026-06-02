"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Upload, Eye, Clock, Receipt } from "lucide-react";

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
}

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/print")
      .then((r) => r.json())
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
          <h1 className="text-3xl font-bold tracking-tight">My Print Jobs</h1>
          <p className="text-muted-foreground">Track and manage your print requests</p>
        </div>
        <Link href="/dashboard/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            New Print Job
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Print History</CardTitle>
          <CardDescription>All your print jobs and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-10 w-10 mb-3 opacity-50" />
              <p className="text-lg font-medium">No print jobs yet</p>
              <p className="text-sm mb-4">Upload your first document to get started</p>
              <Link href="/dashboard/upload">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Document</th>
                    <th className="text-left py-3 px-2">Details</th>
                    <th className="text-left py-3 px-2">Paper</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Pickup</th>
                    <th className="text-left py-3 px-2">Payment</th>
                    <th className="text-left py-3 px-2">Method</th>
                    <th className="text-left py-3 px-2">Cost</th>
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-right py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate max-w-[150px]">{job.fileName}</span>
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
                        <Badge variant={getStatusColor(job.status)}>{job.status}</Badge>
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        {job.pickupAt ? (
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <Clock className="h-3 w-3" />
                            {new Date(job.pickupAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={job.paymentStatus === "PAID" ? "default" : "secondary"}>
                          {job.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">
                          {job.paymentMethod === "E_WALLET" ? "E-Wallet" : job.paymentMethod === "CASH" ? "Cash" : "—"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 font-medium">₱{Number(job.totalCost).toFixed(2)}</td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/dashboard/jobs/${job.id}/receipt`}>
                              <Receipt className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={job.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={job.fileUrl} download={job.fileName}>
                              <Download className="h-4 w-4" />
                            </a>
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
