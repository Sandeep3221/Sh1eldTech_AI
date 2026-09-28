import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Package } from "@/app/model/package.model";
import { pickAndValidatePackage } from "@/app/lib/validation";
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
    
    const packages = await Package.find({ clientId }).sort({ createdAt: -1 });
    return NextResponse.json(packages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDatabase();
    const body = await request.json();
    
    if (!body.clientId || !body.title) {
      return NextResponse.json({ error: "clientId and title are required" }, { status: 400 });
    }

    const safeBody = pickAndValidatePackage(body);
    const newPackage = await Package.create(safeBody);
    return NextResponse.json(newPackage, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
