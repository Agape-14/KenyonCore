import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string; invoiceId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invoiceId } = await params;

  try {
    const body = await req.json();

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ...(body.vendorName !== undefined && { vendorName: body.vendorName }),
        ...(body.invoiceNumber !== undefined && { invoiceNumber: body.invoiceNumber }),
        ...(body.invoiceDate !== undefined && { invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : null }),
        ...(body.totalAmount !== undefined && { totalAmount: body.totalAmount }),
        ...(body.taxAmount !== undefined && { taxAmount: body.taxAmount }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        items: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Update invoice error:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string; invoiceId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invoiceId } = await params;

  try {
    await prisma.invoice.delete({ where: { id: invoiceId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete invoice error:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
