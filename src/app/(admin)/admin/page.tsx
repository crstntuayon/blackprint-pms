import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  FileText,
  Banknote,
  Clock,
  AlertCircle,
  Printer,
  CheckCircle2,
  ArrowRight,
  List,
  Settings,
  BarChart3,
  Package,
  Wallet,
} from "lucide-react";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const totalUsers = await prisma.user.count();
  const totalJobs = await prisma.printJob.count();

  const pendingJobs = await prisma.printJob.count({ where: { status: "PENDING" } });
  const queuedJobs = await prisma.printJob.count({ where: { status: "QUEUED" } });
  const printingJobs = await prisma.printJob.count({ where: { status: "PRINTING" } });
  const completedJobs = await prisma.printJob.count({ where: { status: "COMPLETED" } });

  const jobsNeedingAttention = pendingJobs + queuedJobs;

  const recentJobs = await prisma.printJob.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, username: true } } },
  });

  const eWalletJobs = await prisma.printJob.count({ where: { paymentMethod: "E_WALLET" } });
  const cashJobs = await prisma.printJob.count({ where: { paymentMethod: "CASH" } });

  const revenue = await prisma.printJob.aggregate({
    where: { paymentStatus: "PAID" },
    _sum: { totalCost: true },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED": return <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "PENDING": return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "QUEUED": return <Badge variant="secondary"><List className="h-3 w-3 mr-1" />Queued</Badge>;
      case "PRINTING": return <Badge variant="destructive"><Printer className="h-3 w-3 mr-1" />Printing</Badge>;
      case "FAILED": return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "CANCELLED": return <Badge variant="outline">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Print Shop Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage client print requests, track queue status, and monitor operations
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/jobs">
            <Button variant="outline" className="gap-2">
              <List className="h-4 w-4" />
              Open Queue
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button className="gap-2">
              <Users className="h-4 w-4" />
              Manage Users
            </Button>
          </Link>
        </div>
      </div>

      {/* Attention Banner */}
      {jobsNeedingAttention > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">
                {jobsNeedingAttention} job{jobsNeedingAttention > 1 ? "s" : ""} need{jobsNeedingAttention === 1 ? "s" : ""} attention
              </h3>
              <p className="text-sm text-muted-foreground">
                {pendingJobs} pending review · {queuedJobs} in queue
              </p>
            </div>
            <Link href="/admin/jobs">
              <Button size="sm" variant="outline">
                Review Queue
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Printer className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queuedJobs + printingJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {queuedJobs} queued · {printingJobs} printing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{revenue._sum.totalCost?.toString() || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">E-Wallet Jobs</span>
              <Wallet className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">{eWalletJobs}</div>
            <Progress
              value={totalJobs > 0 ? (eWalletJobs / totalJobs) * 100 : 0}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Cash Jobs</span>
              <Banknote className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold">{cashJobs}</div>
            <Progress
              value={totalJobs > 0 ? (cashJobs / totalJobs) * 100 : 0}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Pending Review</span>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold">{pendingJobs}</div>
            <Progress
              value={totalJobs > 0 ? (pendingJobs / totalJobs) * 100 : 0}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">In Queue</span>
              <List className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">{queuedJobs}</div>
            <Progress
              value={totalJobs > 0 ? (queuedJobs / totalJobs) * 100 : 0}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Printing</span>
              <Printer className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-3xl font-bold">{printingJobs}</div>
            <Progress
              value={totalJobs > 0 ? (printingJobs / totalJobs) * 100 : 0}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Completed</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold">{completedJobs}</div>
            <Progress
              value={totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Print Requests</CardTitle>
            <CardDescription>Latest jobs submitted by clients</CardDescription>
          </div>
          <Link href="/admin/jobs">
            <Button variant="ghost" size="sm">
              View Queue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Client</th>
                  <th className="text-left py-3 px-2">Document</th>
                  <th className="text-left py-3 px-2">Details</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Cost</th>
                  <th className="text-left py-3 px-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium">{job.user.name || job.user.username || "Unknown"}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[150px]">{job.fileName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {job.pages}p × {job.copies}
                    </td>
                    <td className="py-3 px-2">{getStatusBadge(job.status)}</td>
                    <td className="py-3 px-2 font-medium">₱{job.totalCost.toString()}</td>
                    <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleDateString()} {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/jobs">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <List className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Manage Print Queue</h3>
                <p className="text-sm text-muted-foreground">Review and process client jobs</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/sales">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Sales & Reports</h3>
                <p className="text-sm text-muted-foreground">Track revenue and job trends</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/inventory">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Inventory</h3>
                <p className="text-sm text-muted-foreground">Manage supplies and stock levels</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Manage Users</h3>
                <p className="text-sm text-muted-foreground">View and manage accounts & roles</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/settings">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Shop Settings</h3>
                <p className="text-sm text-muted-foreground">Pricing, printers, and configuration</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
