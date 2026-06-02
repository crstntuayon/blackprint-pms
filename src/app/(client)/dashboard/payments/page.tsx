"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, CreditCard, FileText } from "lucide-react";

interface PrintJob {
  id: string;
  fileName: string;
  pages: number;
  copies: number;
  totalCost: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  createdAt: string;
}

export default function PaymentsPage() {
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

  const pendingPayments = jobs.filter((j) => j.paymentStatus === "PENDING");
  const paidJobs = jobs.filter((j) => j.paymentStatus === "PAID");
  const totalPending = pendingPayments.reduce((sum, j) => sum + Number(j.totalCost), 0);
  const totalPaid = paidJobs.reduce((sum, j) => sum + Number(j.totalCost), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">View and manage your print charges</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <Banknote className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalPending.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jobs Awaiting Payment</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All charges for your print jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment history yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Document</th>
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-left py-3 px-2">Amount</th>
                    <th className="text-left py-3 px-2">Method</th>
                    <th className="text-left py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{job.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 font-medium">₱{Number(job.totalCost).toFixed(2)}</td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">
                          {job.paymentMethod === "E_WALLET" ? "E-Wallet" : job.paymentMethod === "CASH" ? "Cash" : "—"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={job.paymentStatus === "PAID" ? "default" : "secondary"}>
                          {job.paymentStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Awaiting Payment</CardTitle>
            <CardDescription>Jobs ready for pickup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingPayments.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{job.fileName}</p>
                      <p className="text-xs text-muted-foreground">{job.pages} pages × {job.copies} copies</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">₱{Number(job.totalCost).toFixed(2)}</span>
                    <Badge variant="secondary">PENDING</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 mt-4">
              {pendingPayments.some((j) => j.paymentMethod === "E_WALLET") && (
                <p className="text-sm text-muted-foreground">
                  <strong>E-Wallet payments:</strong> Please send your payment via GCash/Maya to the shop number and include your job ID as reference. Admin will confirm once received.
                </p>
              )}
              {pendingPayments.some((j) => j.paymentMethod === "CASH" || !j.paymentMethod) && (
                <p className="text-sm text-muted-foreground">
                  <strong>Cash payments:</strong> Payment is collected at the print shop counter when you pick up your documents.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
