"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Banknote,
  FileText,
  TrendingUp,
  CreditCard,
  Printer,
  Users,
  Calendar,
  Wallet,
} from "lucide-react";

interface DailySale {
  date: string;
  revenue: number;
  jobs: number;
}

interface OptionBreakdown {
  color: boolean;
  duplex: boolean;
  count: number;
  revenue: number;
}

interface PaymentMethodBreakdown {
  method: string;
  count: number;
  revenue: number;
}

interface TopClient {
  name: string;
  revenue: number;
  jobs: number;
}

interface SalesData {
  summary: {
    allTimeRevenue: number;
    periodRevenue: number;
    totalJobs: number;
    completedJobs: number;
    paidJobs: number;
    periodJobs: number;
  };
  daily: DailySale[];
  optionsBreakdown: OptionBreakdown[];
  paymentMethodBreakdown: PaymentMethodBreakdown[];
  topClients: TopClient[];
}

export default function AdminSalesPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");
  const { toast } = useToast();

  const fetchSales = (days: string) => {
    setLoading(true);
    fetch(`/api/sales?range=${days}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Error", description: "Failed to load sales data" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSales(range);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const maxDailyRevenue = data?.daily.length
    ? Math.max(...data.daily.map((d) => d.revenue), 1)
    : 1;

  const maxOptionCount = data?.optionsBreakdown.length
    ? Math.max(...data.optionsBreakdown.map((o) => o.count), 1)
    : 1;

  const maxPaymentMethodCount = data?.paymentMethodBreakdown.length
    ? Math.max(...data.paymentMethodBreakdown.map((p) => p.count), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales & Reports</h1>
          <p className="text-muted-foreground">Track revenue, job trends, and client spending</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[160px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading || !data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Period Revenue</CardTitle>
                <Banknote className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱{data.summary.periodRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.summary.periodJobs} jobs in period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">All-Time Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱{data.summary.allTimeRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.summary.paidJobs} paid jobs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalJobs}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.summary.completedJobs} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg. Job Value</CardTitle>
                <CreditCard className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₱{data.summary.paidJobs > 0
                    ? (data.summary.allTimeRevenue / data.summary.paidJobs).toFixed(2)
                    : "0.00"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per paid job</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Daily Revenue */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Revenue
                </CardTitle>
                <CardDescription>Revenue and job count per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Date</th>
                        <th className="text-left py-2 px-2">Revenue</th>
                        <th className="text-left py-2 px-2">Jobs</th>
                        <th className="text-left py-2 px-2 w-full">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.daily.map((day) => (
                        <tr key={day.date} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2 px-2 whitespace-nowrap">
                            {new Date(day.date).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-2 font-medium">
                            ₱{day.revenue.toFixed(2)}
                          </td>
                          <td className="py-2 px-2">{day.jobs}</td>
                          <td className="py-2 px-2">
                            <div className="h-2 bg-muted rounded-full overflow-hidden w-full max-w-[200px]">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (day.revenue / maxDailyRevenue) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Top Clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Clients
                </CardTitle>
                <CardDescription>Highest spenders in period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topClients.length === 0 && (
                    <p className="text-sm text-muted-foreground">No paid jobs in this period.</p>
                  )}
                  {data.topClients.map((client, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.jobs} jobs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">₱{client.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Method Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method Breakdown
              </CardTitle>
              <CardDescription>Job distribution by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {data.paymentMethodBreakdown.map((pm, idx) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      {pm.method === "E_WALLET" ? (
                        <Wallet className="h-4 w-4 text-blue-500" />
                      ) : pm.method === "CASH" ? (
                        <Banknote className="h-4 w-4 text-green-500" />
                      ) : null}
                      <Badge variant={pm.method === "E_WALLET" ? "default" : "secondary"}>
                        {pm.method === "E_WALLET" ? "E-Wallet" : pm.method === "CASH" ? "Cash" : pm.method}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{pm.count}</div>
                    <p className="text-xs text-muted-foreground">₱{pm.revenue.toFixed(2)} revenue</p>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${Math.min((pm.count / maxPaymentMethodCount) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {data.paymentMethodBreakdown.length === 0 && (
                  <p className="text-sm text-muted-foreground md:col-span-2 lg:col-span-4">
                    No data available for the selected period.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Print Options Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Print Options Breakdown
              </CardTitle>
              <CardDescription>Job distribution by color and duplex settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {data.optionsBreakdown.map((opt, idx) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={opt.color ? "default" : "secondary"}>
                        {opt.color ? "Color" : "B&W"}
                      </Badge>
                      <Badge variant={opt.duplex ? "outline" : "secondary"}>
                        {opt.duplex ? "Duplex" : "Single"}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{opt.count}</div>
                    <p className="text-xs text-muted-foreground">₱{opt.revenue.toFixed(2)} revenue</p>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${Math.min((opt.count / maxOptionCount) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {data.optionsBreakdown.length === 0 && (
                  <p className="text-sm text-muted-foreground md:col-span-2 lg:col-span-4">
                    No data available for the selected period.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
