import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { parse } from "csv-parse/sync";

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
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    let materials: Array<{
      customName: string;
      description?: string;
      unit?: string;
      quantityNeeded?: number;
      unitCost?: number;
      trade?: string;
      vendor?: string;
    }> = [];

    if (file.name.endsWith(".csv")) {
      const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      materials = (records as Record<string, string>[]).map((row) => ({
        customName: row.name || row.material || row.item || row.Name || row.Material || row.Item || "Unknown",
        description: row.description || row.Description || undefined,
        unit: row.unit || row.Unit || "each",
        quantityNeeded: parseFloat(row.quantity || row.qty || row.Quantity || row.Qty || "0") || 0,
        unitCost: parseFloat(row.cost || row.price || row.Cost || row.Price || row.unit_cost || "0") || undefined,
        trade: (row.trade || row.Trade || "GENERAL").toUpperCase(),
        vendor: row.vendor || row.Vendor || undefined,
      }));
    } else {
      // For text/other files, try to parse line by line
      const lines = text.split("\n").filter((l) => l.trim());
      materials = lines.map((line) => ({
        customName: line.trim(),
        quantityNeeded: 1,
      }));
    }

    if (materials.length === 0) {
      return NextResponse.json({ error: "No materials found in file" }, { status: 400 });
    }

    const created = await prisma.$transaction(
      materials.map((m) =>
        prisma.jobMaterial.create({
          data: {
            jobId,
            customName: m.customName,
            description: m.description,
            unit: m.unit || "each",
            quantityNeeded: m.quantityNeeded || 0,
            unitCost: m.unitCost,
            trade: (m.trade as "GENERAL") || "GENERAL",
            vendor: m.vendor,
            status: "NEEDED",
          },
        })
      )
    );

    return NextResponse.json(
      { imported: created.length, materials: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Failed to import materials" }, { status: 500 });
  }
}
