import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { budgetTotal: true, name: true, jobNumber: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Get all invoices for this job
  const invoices = await prisma.invoice.findMany({
    where: { jobId },
    select: {
      id: true,
      vendorName: true,
      totalAmount: true,
      status: true,
      invoiceDate: true,
      createdAt: true,
    },
  });

  // Get materials with costs
  const materials = await prisma.jobMaterial.findMany({
    where: { jobId },
    select: {
      id: true,
      customName: true,
      trade: true,
      unitCost: true,
      quantityNeeded: true,
      quantityOrdered: true,
      status: true,
    },
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const approvedInvoiced = invoices
    .filter((inv) => inv.status === "APPROVED" || inv.status === "PAID")
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  const estimatedMaterialCost = materials.reduce(
    (sum, m) => sum + (m.unitCost || 0) * m.quantityNeeded,
    0
  );

  // Spending by vendor
  const vendorSpending: Record<string, number> = {};
  invoices.forEach((inv) => {
    const vendor = inv.vendorName || "Unknown";
    vendorSpending[vendor] = (vendorSpending[vendor] || 0) + (inv.totalAmount || 0);
  });

  // Spending by trade
  const tradeSpending: Record<string, number> = {};
  materials.forEach((m) => {
    tradeSpending[m.trade] = (tradeSpending[m.trade] || 0) + (m.unitCost || 0) * m.quantityNeeded;
  });

  return NextResponse.json({
    budgetTotal: job.budgetTotal,
    totalInvoiced,
    approvedInvoiced,
    estimatedMaterialCost,
    remaining: job.budgetTotal - approvedInvoiced,
    percentUsed: job.budgetTotal > 0 ? (approvedInvoiced / job.budgetTotal) * 100 : 0,
    vendorSpending,
    tradeSpending,
    invoiceCount: invoices.length,
    materialCount: materials.length,
  });
}
