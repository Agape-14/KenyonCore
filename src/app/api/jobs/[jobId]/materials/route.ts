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
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const trade = searchParams.get("trade");

  const materials = await prisma.jobMaterial.findMany({
    where: {
      jobId,
      ...(status ? { status: status as "NEEDED" | "ORDERED" | "DELIVERED" | "INSTALLED" | "RETURNED" } : {}),
      ...(trade ? { trade: trade as "PLUMBING" | "ELECTRICAL" | "HVAC" | "GENERAL" | "CARPENTRY" | "PAINTING" | "ROOFING" | "FLOORING" | "CONCRETE" | "LANDSCAPING" } : {}),
    },
    include: {
      catalogItem: {
        include: {
          subcategory: {
            include: { category: true },
          },
        },
      },
      invoiceItems: {
        include: { invoice: { select: { vendorName: true, invoiceDate: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(materials);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    const body = await req.json();

    // Support bulk creation
    const items = Array.isArray(body) ? body : [body];

    const materials = await prisma.$transaction(
      items.map((item) =>
        prisma.jobMaterial.create({
          data: {
            jobId,
            catalogItemId: item.catalogItemId || null,
            customName: item.customName || null,
            description: item.description || null,
            unit: item.unit || "each",
            quantityNeeded: item.quantityNeeded || 0,
            quantityOrdered: item.quantityOrdered || 0,
            quantityOnSite: item.quantityOnSite || 0,
            unitCost: item.unitCost || null,
            status: item.status || "NEEDED",
            vendor: item.vendor || null,
            notes: item.notes || null,
            trade: item.trade || "GENERAL",
          },
        })
      )
    );

    return NextResponse.json(materials, { status: 201 });
  } catch (error) {
    console.error("Create material error:", error);
    return NextResponse.json({ error: "Failed to add materials" }, { status: 500 });
  }
}
