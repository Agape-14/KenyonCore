"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { Download, BarChart3, TrendingUp } from "lucide-react";

interface JobSummary {
  id: string;
  name: string;
  jobNumber: string;
  status: string;
  budget: number;
  totalInvoiced: number;
  materialCount: number;
  invoiceCount: number;
  estimatedCost: number;
}

export default function ReportsPage() {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports?type=summary")
      .then((r) => r.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    const headers = ["Job #", "Name", "Status", "Budget", "Invoiced", "Estimated Cost", "Materials", "Invoices"];
    const rows = jobs.map((j) => [
      j.jobNumber,
      j.name,
      j.status,
      j.budget.toFixed(2),
      j.totalInvoiced.toFixed(2),
      j.estimatedCost.toFixed(2),
      j.materialCount,
      j.invoiceCount,
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kenyoncore-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalBudget = jobs.reduce((s, j) => s + j.budget, 0);
  const totalInvoiced = jobs.reduce((s, j) => s + j.totalInvoiced, 0);
  const totalEstimated = jobs.reduce((s, j) => s + j.estimatedCost, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Financial overview across all jobs</p>
        </div>
        <Button variant="secondary" onClick={exportCSV}>
          <Download size={16} className="mr-2" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-5 text-center">
            <BarChart3 size={24} className="mx-auto text-blue-500 mb-2" />
            <p className="text-sm text-gray-500">Total Budget</p>
            <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 text-center">
            <TrendingUp size={24} className="mx-auto text-amber-500 mb-2" />
            <p className="text-sm text-gray-500">Total Invoiced</p>
            <p className="text-2xl font-bold">{formatCurrency(totalInvoiced)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 text-center">
            <BarChart3 size={24} className="mx-auto text-green-500 mb-2" />
            <p className="text-sm text-gray-500">Est. Material Cost</p>
            <p className="text-2xl font-bold">{formatCurrency(totalEstimated)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Job-by-Job Breakdown</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Job #</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Budget</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Invoiced</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Est. Cost</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Variance</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const variance = job.budget - job.totalInvoiced;
                return (
                  <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-primary">{job.jobNumber}</td>
                    <td className="px-4 py-3 font-medium">{job.name}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={job.status} /></td>
                    <td className="px-4 py-3 text-right">{formatCurrency(job.budget)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(job.totalInvoiced)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(job.estimatedCost)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${variance < 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(variance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {jobs.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3" colSpan={3}>Totals</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totalBudget)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totalInvoiced)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totalEstimated)}</td>
                  <td className={`px-4 py-3 text-right ${totalBudget - totalInvoiced < 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(totalBudget - totalInvoiced)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
