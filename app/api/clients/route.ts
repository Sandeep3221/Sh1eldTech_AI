import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Client } from "@/app/model/client.model";
import crypto from "crypto";
import { pickAndValidateClient } from "@/app/lib/validation";

export async function GET() {
  try {
    await connectToDatabase();
    const clients = await Client.find({}).sort({ createdAt: -1 });
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Failed to fetch clients", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    if (!body.name || !body.email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const safeBody = pickAndValidateClient(body);
    safeBody.clientId = `shd_${crypto.randomBytes(8).toString('hex')}`;

    const newClient = await Client.create(safeBody);
    return NextResponse.json(newClient, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create client", error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
