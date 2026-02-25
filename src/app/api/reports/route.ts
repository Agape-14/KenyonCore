import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "summary";
  const jobId = searchParams.get("jobId");

  if (type === "summary") {
    const jobs = await prisma.job.findMany({
      include: {
        _count: { select: { materials: true, invoices: true } },
        invoices: { select: { totalAmount: true, status: true } },
        materials: { select: { status: true, unitCost: true, quantityNeeded: true } },
      },
    });

    const summary = jobs.map((job) => ({
      id: job.id,
      name: job.name,
      jobNumber: job.jobNumber,
      status: job.status,
      budget: job.budgetTotal,
      totalInvoiced: job.invoices.reduce((s, i) => s + (i.totalAmount || 0), 0),
      materialCount: job._count.materials,
      invoiceCount: job._count.invoices,
      estimatedCost: job.materials.reduce(
        (s, m) => s + (m.unitCost || 0) * m.quantityNeeded,
        0
      ),
    }));

    return NextResponse.json(summary);
  }

  if (type === "materials" && jobId) {
    const materials = await prisma.jobMaterial.findMany({
      where: { jobId },
      include: { catalogItem: true },
      orderBy: [{ trade: "asc" }, { status: "asc" }],
    });

    return NextResponse.json(materials);
  }

  if (type === "vendors") {
    const invoices = await prisma.invoice.findMany({
      where: jobId ? { jobId } : {},
      select: {
        vendorName: true,
        totalAmount: true,
        status: true,
        invoiceDate: true,
        job: { select: { name: true, jobNumber: true } },
      },
      orderBy: { vendorName: "asc" },
    });

    // Group by vendor
    const vendors: Record<string, { total: number; count: number; jobs: Set<string> }> = {};
    invoices.forEach((inv) => {
      const name = inv.vendorName || "Unknown";
      if (!vendors[name]) vendors[name] = { total: 0, count: 0, jobs: new Set() };
      vendors[name].total += inv.totalAmount || 0;
      vendors[name].count += 1;
      vendors[name].jobs.add(inv.job.jobNumber);
    });

    const vendorReport = Object.entries(vendors).map(([name, data]) => ({
      vendorName: name,
      totalSpent: data.total,
      invoiceCount: data.count,
      jobCount: data.jobs.size,
    }));

    return NextResponse.json(vendorReport);
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
