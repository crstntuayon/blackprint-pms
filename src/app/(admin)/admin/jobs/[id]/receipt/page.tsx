"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReceiptView } from "@/components/receipt-view";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminReceiptPage() {
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/receipts/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load receipt");
        return r.json();
      })
      .then((data) => setJob(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Receipt</h1>
        <p className="text-muted-foreground">View and print client receipt</p>
      </div>

      {loading && (
        <div className="space-y-4 max-w-[600px] mx-auto">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-destructive">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && job && <ReceiptView job={job} />}
    </div>
  );
}
