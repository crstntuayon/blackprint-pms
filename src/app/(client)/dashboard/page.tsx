"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Upload,
  Clock,
  DollarSign,
  Printer,
  ArrowRight,
  CheckCircle2,
  Package,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface PrintJob {
  id: string;
  fileName: string;
  pages: number;
  copies: number;
  color: boolean;
  duplex: boolean;
  paperSize: string;
  totalCost: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

const statusOrder = ["PENDING", "QUEUED", "PRINTING", "COMPLETED"];

function getStatusProgress(status: string) {
  const idx = statusOrder.indexOf(status);
  if (idx === -1) return 0;
  return ((idx + 1) / statusOrder.length) * 100;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING": return "Awaiting Review";
    case "QUEUED": return "In Queue";
    case "PRINTING": return "Printing Now";
    case "COMPLETED": return "Ready for Pickup";
    case "FAILED": return "Failed";
    case "CANCELLED": return "Cancelled";
    default: return status;
  }
}

export default function DashboardPage() {
  const { data: session } = useSession();
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

  const activeJobs = jobs.filter((j) =>
    ["PENDING", "QUEUED", "PRINTING"].includes(j.status)
  );
  const completedJobs = jobs.filter((j) => j.status === "COMPLETED");
  const totalSpent = jobs
    .filter((j) => j.paymentStatus === "PAID")
    .reduce((sum, j) => sum + Number(j.totalCost), 0);

  const recentActive = activeJobs.slice(0, 3);
  const recentCompleted = completedJobs.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {session?.user?.name || session?.user?.username || "Client"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Submit your documents for printing and track their progress
        </p>
      </div>

      {/* Upload CTA */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                  Get Started
                </span>
              </div>
              <h2 className="text-2xl font-bold">Upload Your Document</h2>
              <p className="text-muted-foreground max-w-md">
                Upload PDFs, Word documents, or images. Configure your print settings and we&apos;ll handle the rest.
              </p>
            </div>
            <Link href="/dashboard/upload">
              <Button size="lg" className="gap-2">
                <Zap className="h-4 w-4" />
                Upload & Print Now
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeJobs.length > 0 ? "Being processed" : "Nothing in queue"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for pickup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalSpent.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Jobs Tracker */}
      {recentActive.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" />
                Active Print Jobs
              </CardTitle>
              <CardDescription>Track the progress of your current print requests</CardDescription>
            </div>
            <Link href="/dashboard/jobs">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActive.map((job) => (
              <div key={job.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{job.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.pages} pages × {job.copies} {job.color ? "· Color" : "· B&W"} {job.duplex ? "· Duplex" : ""} · {job.paperSize}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      job.status === "PRINTING"
                        ? "destructive"
                        : job.status === "QUEUED"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {getStatusLabel(job.status)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Progress value={getStatusProgress(job.status)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Submitted</span>
                    <span>Queued</span>
                    <span>Printing</span>
                    <span>Done</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Completed */}
      {recentCompleted.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-500" />
                Recently Completed
              </CardTitle>
              <CardDescription>Your latest finished print jobs</CardDescription>
            </div>
            <Link href="/dashboard/jobs">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCompleted.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-green-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{job.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.pages} pages × {job.copies} · {job.paperSize} · {job.paymentStatus === "PAID" ? "Paid" : "Payment pending"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium shrink-0">₱{Number(job.totalCost).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No print jobs yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Get started by uploading your first document. We support PDF, Word, and image files.
            </p>
            <Link href="/dashboard/upload">
              <Button size="lg">
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First Document
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}
    </div>
  );
}
