import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string; materialId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { materialId } = await params;

  try {
    const body = await req.json();

    const material = await prisma.jobMaterial.update({
      where: { id: materialId },
      data: {
        ...(body.customName !== undefined && { customName: body.customName }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.quantityNeeded !== undefined && { quantityNeeded: body.quantityNeeded }),
        ...(body.quantityOrdered !== undefined && { quantityOrdered: body.quantityOrdered }),
        ...(body.quantityOnSite !== undefined && { quantityOnSite: body.quantityOnSite }),
        ...(body.unitCost !== undefined && { unitCost: body.unitCost }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.vendor !== undefined && { vendor: body.vendor }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.trade !== undefined && { trade: body.trade }),
      },
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error("Update material error:", error);
    return NextResponse.json({ error: "Failed to update material" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string; materialId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { materialId } = await params;

  try {
    await prisma.jobMaterial.delete({ where: { id: materialId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete material error:", error);
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
  }
}
