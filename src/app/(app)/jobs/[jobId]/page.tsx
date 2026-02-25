"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  FileText,
  DollarSign,
  Plus,
  Upload,
  ArrowLeft,
  Edit3,
  Trash2,
} from "lucide-react";
import Link from "next/link";

interface Material {
  id: string;
  customName?: string;
  catalogItem?: { name: string };
  unit: string;
  quantityNeeded: number;
  quantityOrdered: number;
  quantityOnSite: number;
  unitCost?: number;
  status: string;
  vendor?: string;
  trade: string;
  notes?: string;
}

interface Invoice {
  id: string;
  vendorName?: string;
  invoiceNumber?: string;
  totalAmount?: number;
  status: string;
  createdAt: string;
  uploadedBy: { name: string };
}

interface JobDetail {
  id: string;
  name: string;
  jobNumber: string;
  address?: string;
  clientName?: string;
  description?: string;
  status: string;
  budgetTotal: number;
  startDate?: string;
  endDate?: string;
  projectManager?: { id: string; name: string };
  materials: Material[];
  invoices: Invoice[];
  _count: { materials: number; invoices: number };
}

const materialStatusOptions = [
  { value: "NEEDED", label: "Needed" },
  { value: "ORDERED", label: "Ordered" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "INSTALLED", label: "Installed" },
  { value: "RETURNED", label: "Returned" },
];

const tradeOptions = [
  { value: "GENERAL", label: "General" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "HVAC", label: "HVAC" },
  { value: "CARPENTRY", label: "Carpentry" },
  { value: "PAINTING", label: "Painting" },
  { value: "ROOFING", label: "Roofing" },
  { value: "FLOORING", label: "Flooring" },
  { value: "CONCRETE", label: "Concrete" },
  { value: "LANDSCAPING", label: "Landscaping" },
];

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"materials" | "invoices" | "budget">("materials");
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [budget, setBudget] = useState<Record<string, unknown> | null>(null);
  const [materialForm, setMaterialForm] = useState({
    customName: "",
    unit: "each",
    quantityNeeded: "",
    unitCost: "",
    trade: "GENERAL",
    vendor: "",
    notes: "",
  });

  const fetchJob = () => {
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((data) => {
        setJob(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  useEffect(() => {
    if (tab === "budget") {
      fetch(`/api/jobs/${jobId}/budget`)
        .then((r) => r.json())
        .then(setBudget)
        .catch(() => {});
    }
  }, [tab, jobId]);

  const addMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/jobs/${jobId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...materialForm,
        quantityNeeded: parseFloat(materialForm.quantityNeeded) || 0,
        unitCost: parseFloat(materialForm.unitCost) || undefined,
      }),
    });
    if (res.ok) {
      setShowAddMaterial(false);
      setMaterialForm({ customName: "", unit: "each", quantityNeeded: "", unitCost: "", trade: "GENERAL", vendor: "", notes: "" });
      fetchJob();
    }
  };

  const updateMaterialStatus = async (materialId: string, status: string) => {
    await fetch(`/api/jobs/${jobId}/materials/${materialId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchJob();
  };

  const deleteMaterial = async (materialId: string) => {
    if (!confirm("Delete this material?")) return;
    await fetch(`/api/jobs/${jobId}/materials/${materialId}`, { method: "DELETE" });
    fetchJob();
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    if (!fileInput.files?.[0]) return;

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const res = await fetch(`/api/jobs/${jobId}/materials/import`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Imported ${data.imported} materials`);
      setShowImport(false);
      fetchJob();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!job) {
    return <div className="text-center py-12 text-gray-400">Job not found</div>;
  }

  const totalMaterialCost = job.materials.reduce(
    (s, m) => s + (m.unitCost || 0) * m.quantityNeeded,
    0
  );
  const totalInvoiced = job.invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/jobs" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} className="mr-1" /> Back to Jobs
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{job.name}</h1>
            <StatusBadge status={job.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1 font-mono">{job.jobNumber}</p>
          {job.clientName && <p className="text-sm text-gray-500">{job.clientName}</p>}
          {job.address && <p className="text-sm text-gray-400">{job.address}</p>}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <Package size={20} className="mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{job.materials.length}</p>
            <p className="text-xs text-gray-500">Materials</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <FileText size={20} className="mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold">{job.invoices.length}</p>
            <p className="text-xs text-gray-500">Invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <DollarSign size={20} className="mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{formatCurrency(job.budgetTotal)}</p>
            <p className="text-xs text-gray-500">Budget</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <DollarSign size={20} className="mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{formatCurrency(totalInvoiced)}</p>
            <p className="text-xs text-gray-500">Invoiced</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {(["materials", "invoices", "budget"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Materials Tab */}
      {tab === "materials" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={() => setShowAddMaterial(true)}>
              <Plus size={16} className="mr-2" /> Add Material
            </Button>
            <Button variant="secondary" onClick={() => setShowImport(true)}>
              <Upload size={16} className="mr-2" /> Import CSV
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Material</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Trade</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Qty Needed</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">On Site</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Unit Cost</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Vendor</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {job.materials.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {m.customName || m.catalogItem?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{m.trade}</td>
                      <td className="px-4 py-3 text-center">{m.quantityNeeded} {m.unit}</td>
                      <td className="px-4 py-3 text-center">{m.quantityOnSite}</td>
                      <td className="px-4 py-3 text-right">
                        {m.unitCost ? formatCurrency(m.unitCost) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={m.status}
                          onChange={(e) => updateMaterialStatus(m.id, e.target.value)}
                          className="text-xs rounded border border-gray-200 px-2 py-1"
                        >
                          {materialStatusOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{m.vendor || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => deleteMaterial(m.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {job.materials.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                        No materials added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {job.materials.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm text-right">
                <span className="text-gray-500">Estimated Total: </span>
                <span className="font-semibold">{formatCurrency(totalMaterialCost)}</span>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Invoices Tab */}
      {tab === "invoices" && (
        <div className="space-y-4">
          <Link href={`/jobs/${jobId}/invoices/upload`}>
            <Button>
              <Upload size={16} className="mr-2" /> Upload Invoice
            </Button>
          </Link>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Invoice #</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Vendor</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Uploaded By</th>
                  </tr>
                </thead>
                <tbody>
                  {job.invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono">{inv.invoiceNumber || "—"}</td>
                      <td className="px-4 py-3">{inv.vendorName || "—"}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {inv.totalAmount ? formatCurrency(inv.totalAmount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={inv.status} /></td>
                      <td className="px-4 py-3 text-gray-500">{inv.uploadedBy.name}</td>
                    </tr>
                  ))}
                  {job.invoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                        No invoices uploaded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Budget Tab */}
      {tab === "budget" && budget && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Budget Summary</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Budget</span>
                <span className="font-semibold">{formatCurrency(budget.budgetTotal as number)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Invoiced</span>
                <span className="font-semibold">{formatCurrency(budget.totalInvoiced as number)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Approved/Paid</span>
                <span className="font-semibold">{formatCurrency(budget.approvedInvoiced as number)}</span>
              </div>
              <div className="border-t border-gray-100 pt-4 flex justify-between">
                <span className="text-gray-700 font-medium">Remaining</span>
                <span className={`font-bold ${(budget.remaining as number) < 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(budget.remaining as number)}
                </span>
              </div>
              {(budget.budgetTotal as number) > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Budget Used</span>
                    <span>{(budget.percentUsed as number).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${(budget.percentUsed as number) > 100 ? "bg-red-500" : (budget.percentUsed as number) > 80 ? "bg-amber-500" : "bg-green-500"}`}
                      style={{ width: `${Math.min(budget.percentUsed as number, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold">Spending by Vendor</h3>
            </CardHeader>
            <CardContent>
              {Object.entries(budget.vendorSpending as Record<string, number>).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(budget.vendorSpending as Record<string, number>).map(([vendor, amount]) => (
                    <div key={vendor} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{vendor}</span>
                      <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No vendor data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Material Modal */}
      <Modal open={showAddMaterial} onClose={() => setShowAddMaterial(false)} title="Add Material" size="lg">
        <form onSubmit={addMaterial} className="space-y-4">
          <Input
            label="Material Name"
            value={materialForm.customName}
            onChange={(e) => setMaterialForm({ ...materialForm, customName: e.target.value })}
            required
            placeholder="e.g., 1/2 inch Copper Pipe"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Trade"
              value={materialForm.trade}
              onChange={(e) => setMaterialForm({ ...materialForm, trade: e.target.value })}
              options={tradeOptions}
            />
            <Input
              label="Unit"
              value={materialForm.unit}
              onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
              placeholder="each, ft, lbs, box"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity Needed"
              type="number"
              value={materialForm.quantityNeeded}
              onChange={(e) => setMaterialForm({ ...materialForm, quantityNeeded: e.target.value })}
            />
            <Input
              label="Unit Cost ($)"
              type="number"
              step="0.01"
              value={materialForm.unitCost}
              onChange={(e) => setMaterialForm({ ...materialForm, unitCost: e.target.value })}
            />
          </div>
          <Input
            label="Vendor"
            value={materialForm.vendor}
            onChange={(e) => setMaterialForm({ ...materialForm, vendor: e.target.value })}
            placeholder="e.g., Home Depot, Ferguson"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddMaterial(false)}>Cancel</Button>
            <Button type="submit">Add Material</Button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import Materials from CSV">
        <form onSubmit={handleImport} className="space-y-4">
          <p className="text-sm text-gray-500">
            Upload a CSV file with columns: name, quantity, unit, cost, trade, vendor
          </p>
          <input
            type="file"
            accept=".csv,.txt"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowImport(false)}>Cancel</Button>
            <Button type="submit">Import</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
