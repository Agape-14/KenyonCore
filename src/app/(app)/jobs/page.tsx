"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Search, MapPin, User } from "lucide-react";

interface Job {
  id: string;
  name: string;
  jobNumber: string;
  address?: string;
  clientName?: string;
  status: string;
  budgetTotal: number;
  startDate?: string;
  updatedAt: string;
  projectManager?: { id: string; name: string };
  _count: { materials: number; invoices: number };
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "PLANNING", label: "Planning" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    clientName: "",
    address: "",
    description: "",
    budgetTotal: "",
    status: "PLANNING",
  });

  const fetchJobs = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/jobs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        budgetTotal: parseFloat(form.budgetTotal) || 0,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: "", clientName: "", address: "", description: "", budgetTotal: "", status: "PLANNING" });
      fetchJobs();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">{jobs.length} total jobs</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" />
          New Job
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </form>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusOptions}
          className="w-full sm:w-48"
        />
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-mono text-gray-400">{job.jobNumber}</p>
                      <h3 className="font-semibold text-gray-900 mt-1">{job.name}</h3>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  {job.clientName && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User size={14} />
                      {job.clientName}
                    </div>
                  )}

                  {job.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin size={14} />
                      {job.address}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-sm">
                      <span className="text-gray-500">Budget: </span>
                      <span className="font-medium">{formatCurrency(job.budgetTotal)}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>{job._count.materials} materials</span>
                      <span>{job._count.invoices} invoices</span>
                    </div>
                  </div>

                  {job.projectManager && (
                    <p className="text-xs text-gray-400">PM: {job.projectManager.name}</p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
          {jobs.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              No jobs found. Create your first job to get started.
            </div>
          )}
        </div>
      )}

      {/* Create Job Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Job" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Job Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="e.g., Smith Residence Renovation"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Client Name"
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              placeholder="e.g., John Smith"
            />
            <Input
              label="Budget"
              type="number"
              value={form.budgetTotal}
              onChange={(e) => setForm({ ...form, budgetTotal: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="123 Main St, City, State"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="Job description..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Job</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
