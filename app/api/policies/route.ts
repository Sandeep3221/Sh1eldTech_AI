import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Policy } from "@/app/model/policy.model";
import { pickAndValidatePolicy } from "@/app/lib/validation";
import { requireAdmin } from "@/app/lib/auth";

export async function GET(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    
    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }
    
    const policies = await Policy.find({ clientId }).sort({ createdAt: -1 });
    return NextResponse.json(policies);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDatabase();
    const body = await request.json();
    
    if (!body.clientId || !body.title || !body.content) {
      return NextResponse.json({ error: "clientId, title, and content are required" }, { status: 400 });
    }

    const safeBody = pickAndValidatePolicy(body);
    const newPolicy = await Policy.create(safeBody);
    return NextResponse.json(newPolicy, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create policy" }, { status: 500 });
  }
}
