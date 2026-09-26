import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Client } from "@/app/model/client.model";
import crypto from "crypto";

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

    if (!body.clientId) {
      body.clientId = `shd_${crypto.randomBytes(8).toString('hex')}`;
    }

    const newClient = await Client.create(body);
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error("Failed to create client", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
