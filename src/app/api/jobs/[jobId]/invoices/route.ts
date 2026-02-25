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

  const invoices = await prisma.invoice.findMany({
    where: { jobId },
    include: {
      uploadedBy: { select: { id: true, name: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
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

    const invoice = await prisma.invoice.create({
      data: {
        jobId,
        uploadedById: session.user.id!,
        vendorName: body.vendorName,
        invoiceNumber: body.invoiceNumber,
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : null,
        totalAmount: body.totalAmount,
        taxAmount: body.taxAmount,
        status: body.status || "PENDING",
        fileUrl: body.fileUrl,
        fileName: body.fileName,
        rawText: body.rawText,
        aiExtracted: body.aiExtracted,
        notes: body.notes,
        items: body.items
          ? {
              create: body.items.map((item: { description?: string; quantity?: number; unitPrice?: number; totalPrice?: number; jobMaterialId?: string }) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                jobMaterialId: item.jobMaterialId,
              })),
            }
          : undefined,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        items: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
