"use client";

import { useState, use } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Upload, Sparkles, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ExtractedItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

interface ExtractedData {
  vendorName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  taxAmount?: number;
  items?: ExtractedItem[];
}

export default function InvoiceUploadPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "review" | "saving">("upload");
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [form, setForm] = useState({
    vendorName: "",
    invoiceNumber: "",
    invoiceDate: "",
    totalAmount: "",
    taxAmount: "",
    notes: "",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // Read file as text
    const text = await file.text();
    setRawText(text);
  };

  const handleExtract = async () => {
    if (!rawText) return;
    setExtracting(true);

    try {
      const res = await fetch(`/api/jobs/${jobId}/invoices/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, fileName }),
      });

      if (res.ok) {
        const data = await res.json();
        const ext = data.extracted as ExtractedData;
        setExtracted(ext);
        setForm({
          vendorName: ext?.vendorName || "",
          invoiceNumber: ext?.invoiceNumber || "",
          invoiceDate: ext?.invoiceDate || "",
          totalAmount: ext?.totalAmount?.toString() || "",
          taxAmount: ext?.taxAmount?.toString() || "",
          notes: "",
        });
        setStep("review");
      }
    } catch (error) {
      console.error("Extraction failed:", error);
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    setStep("saving");

    const res = await fetch(`/api/jobs/${jobId}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorName: form.vendorName,
        invoiceNumber: form.invoiceNumber,
        invoiceDate: form.invoiceDate || null,
        totalAmount: parseFloat(form.totalAmount) || null,
        taxAmount: parseFloat(form.taxAmount) || null,
        rawText,
        fileName,
        aiExtracted: extracted,
        notes: form.notes,
        items: extracted?.items?.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      }),
    });

    if (res.ok) {
      router.push(`/jobs/${jobId}`);
    } else {
      setStep("review");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/jobs/${jobId}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} className="mr-1" /> Back to Job
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">Upload Invoice</h1>

      {step === "upload" && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Upload Invoice File</h3>
            <p className="text-sm text-gray-500 mt-1">
              Upload a text file, CSV, or paste invoice text. AI will extract the details.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              accept=".txt,.csv,.pdf"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            <div className="text-center text-sm text-gray-400 py-2">or paste invoice text below</div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="Paste invoice text here..."
            />

            <div className="flex gap-3">
              <Button onClick={handleExtract} disabled={!rawText || extracting}>
                <Sparkles size={16} className="mr-2" />
                {extracting ? "Extracting with AI..." : "Extract with AI"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setStep("review");
                }}
                disabled={!rawText}
              >
                Skip AI — Enter Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Review Invoice Details</h3>
            <p className="text-sm text-gray-500 mt-1">
              {extracted ? "AI extracted these details. Review and correct as needed." : "Enter the invoice details manually."}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Vendor Name"
                value={form.vendorName}
                onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                placeholder="e.g., Home Depot"
              />
              <Input
                label="Invoice Number"
                value={form.invoiceNumber}
                onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Invoice Date"
                type="date"
                value={form.invoiceDate}
                onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
              />
              <Input
                label="Total Amount"
                type="number"
                step="0.01"
                value={form.totalAmount}
                onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
              />
              <Input
                label="Tax Amount"
                type="number"
                step="0.01"
                value={form.taxAmount}
                onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
              />
            </div>

            {extracted?.items && extracted.items.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Line Items</h4>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-3 py-2 text-left text-gray-500">Description</th>
                        <th className="px-3 py-2 text-right text-gray-500">Qty</th>
                        <th className="px-3 py-2 text-right text-gray-500">Unit Price</th>
                        <th className="px-3 py-2 text-right text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extracted.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="px-3 py-2">{item.description}</td>
                          <td className="px-3 py-2 text-right">{item.quantity ?? "—"}</td>
                          <td className="px-3 py-2 text-right">
                            {item.unitPrice ? formatCurrency(item.unitPrice) : "—"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.totalPrice ? formatCurrency(item.totalPrice) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave}>
                <Check size={16} className="mr-2" /> Save Invoice
              </Button>
              <Button variant="secondary" onClick={() => setStep("upload")}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "saving" && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  );
}
