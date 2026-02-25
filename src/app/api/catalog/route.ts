import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const trade = searchParams.get("trade");
  const search = searchParams.get("search");

  const categories = await prisma.catalogCategory.findMany({
    where: {
      ...(trade ? { trade: trade as "PLUMBING" | "ELECTRICAL" | "HVAC" | "GENERAL" | "CARPENTRY" | "PAINTING" | "ROOFING" | "FLOORING" | "CONCRETE" | "LANDSCAPING" } : {}),
    },
    include: {
      subcategories: {
        include: {
          items: {
            where: search
              ? {
                  OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { description: { contains: search, mode: "insensitive" as const } },
                  ],
                }
              : {},
            orderBy: { name: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type } = body;

    if (type === "category") {
      const category = await prisma.catalogCategory.create({
        data: {
          name: body.name,
          trade: body.trade,
          sortOrder: body.sortOrder || 0,
        },
      });
      return NextResponse.json(category, { status: 201 });
    }

    if (type === "subcategory") {
      const subcategory = await prisma.catalogSubcategory.create({
        data: {
          name: body.name,
          categoryId: body.categoryId,
          sortOrder: body.sortOrder || 0,
        },
      });
      return NextResponse.json(subcategory, { status: 201 });
    }

    if (type === "item") {
      const item = await prisma.catalogItem.create({
        data: {
          name: body.name,
          description: body.description,
          defaultUnit: body.defaultUnit || "each",
          estimatedPrice: body.estimatedPrice,
          subcategoryId: body.subcategoryId,
        },
      });
      return NextResponse.json(item, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Catalog create error:", error);
    return NextResponse.json({ error: "Failed to create catalog entry" }, { status: 500 });
  }
}
