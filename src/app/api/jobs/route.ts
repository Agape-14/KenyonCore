import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateJobNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const jobs = await prisma.job.findMany({
    where: {
      ...(status ? { status: status as "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED" } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { jobNumber: { contains: search, mode: "insensitive" as const } },
              { clientName: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      projectManager: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { materials: true, invoices: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, address, clientName, description, status, startDate, endDate, budgetTotal, projectManagerId } = body;

    if (!name) {
      return NextResponse.json({ error: "Job name is required" }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        name,
        jobNumber: generateJobNumber(),
        address,
        clientName,
        description,
        status: status || "PLANNING",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budgetTotal: budgetTotal || 0,
        projectManagerId,
      },
      include: {
        projectManager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Create job error:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
