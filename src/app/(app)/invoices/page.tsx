"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";

interface VendorReport {
  vendorName: string;
  totalSpent: number;
  invoiceCount: number;
  jobCount: number;
}

export default function InvoicesPage() {
  const [vendors, setVendors] = useState<VendorReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports?type=vendors")
      .then((r) => r.json())
      .then((data) => {
        setVendors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalSpent = vendors.reduce((s, v) => s + v.totalSpent, 0);
  const totalInvoices = vendors.reduce((s, v) => s + v.invoiceCount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoices & Vendors</h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalInvoices} invoices across {vendors.length} vendors &middot; {formatCurrency(totalSpent)} total
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map((v) => (
          <Card key={v.vendorName} className="hover:shadow-md transition-shadow">
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-50 p-2">
                  <FileText className="text-purple-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{v.vendorName}</h3>
                  <p className="text-xs text-gray-400">{v.invoiceCount} invoices</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">{v.jobCount} jobs</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(v.totalSpent)}</span>
              </div>
            </div>
          </Card>
        ))}
        {vendors.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            No invoices uploaded yet. Upload invoices from a job detail page.
          </div>
        )}
      </div>
    </div>
  );
}
