import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await params; // consume params

  try {
    const body = await req.json();
    const { text, fileName } = body;

    if (!text) {
      return NextResponse.json({ error: "No text to extract from" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are extracting structured data from a construction materials invoice or receipt. The file is named "${fileName || "unknown"}".

Extract the following information from this invoice text and return it as JSON:

{
  "vendorName": "string or null",
  "invoiceNumber": "string or null",
  "invoiceDate": "YYYY-MM-DD or null",
  "totalAmount": number or null,
  "taxAmount": number or null,
  "items": [
    {
      "description": "string",
      "quantity": number or null,
      "unitPrice": number or null,
      "totalPrice": number or null
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no other text.

Invoice text:
${text}`,
        },
      ],
    });

    const content = message.content[0];
    const responseText = content.type === "text" ? content.text : "";

    // Parse the JSON from Claude's response
    let extracted;
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      extracted = { raw: responseText, parseError: true };
    }

    return NextResponse.json({ extracted });
  } catch (error) {
    console.error("AI extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract invoice data" },
      { status: 500 }
    );
  }
}
