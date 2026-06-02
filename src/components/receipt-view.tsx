"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

interface ReceiptJob {
  id: string;
  fileName: string;
  fileUrl: string;
  pages: number;
  copies: number;
  color: boolean;
  duplex: boolean;
  paperSize: string;
  totalCost: number | string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  pickupAt: string | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
    username: string;
  };
}

interface ReceiptViewProps {
  job: ReceiptJob;
}

export function ReceiptView({ job }: ReceiptViewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString([], {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return `₱${num.toFixed(2)}`;
  };

  const receiptNumber = job.id.slice(-8).toUpperCase();

  return (
    <div className="space-y-4">
      {/* Action buttons - hidden when printing */}
      <div className="flex gap-2 print:hidden">
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
        <Button variant="outline" asChild>
          <a href={job.fileUrl} download={job.fileName}>
            <Download className="mr-2 h-4 w-4" />
            Download File
          </a>
        </Button>
      </div>

      {/* Receipt - this is what gets printed */}
      <div
        ref={receiptRef}
        className="bg-white text-black p-8 max-w-[600px] mx-auto border shadow-sm print:shadow-none print:border-none print:max-w-none print:p-0"
      >
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-2xl font-bold tracking-tight">BLACK PRINT</h1>
          <p className="text-sm text-gray-600">Fast & Affordable Printing Services</p>
          <p className="text-xs text-gray-500 mt-1">Official Receipt</p>
        </div>

        {/* Receipt Meta */}
        <div className="flex justify-between text-sm mb-4">
          <div>
            <p className="font-semibold">Receipt No:</p>
            <p>#{receiptNumber}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Date:</p>
            <p>{formatDate(job.createdAt)}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
          <p className="font-semibold mb-1">Customer:</p>
          <p>{job.user.name || job.user.username || "—"}</p>
          <p className="text-gray-600">{job.user.email}</p>
        </div>

        {/* Job Details Table */}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-2">
                <p className="font-medium">{job.fileName}</p>
                <p className="text-xs text-gray-600">
                  {job.pages} pages × {job.copies} copies
                </p>
                <p className="text-xs text-gray-600">
                  {job.paperSize} · {job.color ? "Color" : "B&W"}
                  {job.duplex ? " · Duplex" : ""}
                </p>
              </td>
              <td className="text-right py-2 align-top">{job.copies}</td>
              <td className="text-right py-2 align-top font-medium">
                {formatCurrency(job.totalCost)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t-2 border-black pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(job.totalCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Payment Method</span>
            <span className="font-medium">
              {job.paymentMethod === "E_WALLET" ? "E-Wallet" : job.paymentMethod === "CASH" ? "Cash" : "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Payment Status</span>
            <span className="font-medium">{job.paymentStatus}</span>
          </div>
          {job.pickupAt && (
            <div className="flex justify-between text-sm">
              <span>Pickup Schedule</span>
              <span className="font-medium">{formatDate(job.pickupAt)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>{formatCurrency(job.totalCost)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
          <p>Thank you for choosing Black Print!</p>
          <p className="mt-1">This is a computer-generated receipt.</p>
          <p className="mt-1">For inquiries, contact us through the messaging system.</p>
        </div>
      </div>
    </div>
  );
}
