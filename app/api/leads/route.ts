import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Lead } from "@/app/model/lead.model";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    
    const filter = clientId ? { clientId } : {};
    const leads = await Lead.find(filter).sort({ createdAt: -1 });
    
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    if (!body.clientId || !body.name || !body.source) {
      return NextResponse.json({ error: "clientId, name, and source are required" }, { status: 400 });
    }

    const newLead = await Lead.create(body);
    return NextResponse.json(newLead, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
