"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import {
  Briefcase,
  Package,
  FileText,
  DollarSign,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface JobSummary {
  id: string;
  name: string;
  jobNumber: string;
  status: string;
  budget: number;
  totalInvoiced: number;
  materialCount: number;
  invoiceCount: number;
}

export default function DashboardPage() {
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

  const activeJobs = jobs.filter((j) => j.status === "IN_PROGRESS").length;
  const totalBudget = jobs.reduce((s, j) => s + j.budget, 0);
  const totalSpent = jobs.reduce((s, j) => s + j.totalInvoiced, 0);
  const totalMaterials = jobs.reduce((s, j) => s + j.materialCount, 0);
  const overBudgetJobs = jobs.filter((j) => j.totalInvoiced > j.budget && j.budget > 0);

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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of all jobs and materials</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-blue-50 p-3">
              <Briefcase className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Jobs</p>
              <p className="text-2xl font-bold">{activeJobs}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-green-50 p-3">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Budget</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-amber-50 p-3">
              <TrendingUp className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="rounded-lg bg-purple-50 p-3">
              <Package className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Materials Tracked</p>
              <p className="text-2xl font-bold">{totalMaterials}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Over Budget Alerts */}
      {overBudgetJobs.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle size={18} />
              <h3 className="font-semibold">Budget Alerts</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overBudgetJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <span className="text-sm font-medium text-red-900">
                    {job.jobNumber} - {job.name}
                  </span>
                  <span className="text-sm text-red-700">
                    {formatCurrency(job.totalInvoiced - job.budget)} over budget
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">All Jobs</h3>
            <Link href="/jobs" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left font-medium text-gray-500">Job #</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">Budget</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">Spent</th>
                <th className="px-6 py-3 text-center font-medium text-gray-500">
                  <Package size={14} className="inline" />
                </th>
                <th className="px-6 py-3 text-center font-medium text-gray-500">
                  <FileText size={14} className="inline" />
                </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link href={`/jobs/${job.id}`} className="font-mono text-primary hover:underline">
                      {job.jobNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3 font-medium">{job.name}</td>
                  <td className="px-6 py-3"><StatusBadge status={job.status} /></td>
                  <td className="px-6 py-3 text-right">{formatCurrency(job.budget)}</td>
                  <td className="px-6 py-3 text-right">{formatCurrency(job.totalInvoiced)}</td>
                  <td className="px-6 py-3 text-center">{job.materialCount}</td>
                  <td className="px-6 py-3 text-center">{job.invoiceCount}</td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No jobs yet. Create your first job to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
