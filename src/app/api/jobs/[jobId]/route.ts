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
    include: {
      projectManager: {
        select: { id: true, name: true, email: true },
      },
      assignments: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
      materials: {
        include: { catalogItem: true },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        include: {
          uploadedBy: { select: { id: true, name: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { materials: true, invoices: true, notifications: true },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}

export async function PATCH(
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
    const { name, address, clientName, description, status, startDate, endDate, budgetTotal, projectManagerId } = body;

    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(clientName !== undefined && { clientName }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(budgetTotal !== undefined && { budgetTotal }),
        ...(projectManagerId !== undefined && { projectManagerId }),
      },
      include: {
        projectManager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Update job error:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    await prisma.job.delete({ where: { id: jobId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete job error:", error);
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}
