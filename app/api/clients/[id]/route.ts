import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Client } from "@/app/model/client.model";
import { pickAndValidateClient } from "@/app/lib/validation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error) {
    console.error("Failed to fetch client", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    const safeBody = pickAndValidateClient(body);
    
    const client = await Client.findByIdAndUpdate(id, safeBody, { new: true, runValidators: true });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error: unknown) {
    console.error("Failed to update client", error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const client = await Client.findById(id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { Package } = await import("@/app/model/package.model");
    const { Faq } = await import("@/app/model/faq.model");
    const { Policy } = await import("@/app/model/policy.model");
    const { Lead } = await import("@/app/model/lead.model");
    const { AIUsage } = await import("@/app/model/ai-usage.model");

    await Package.deleteMany({ clientId: id });
    await Faq.deleteMany({ clientId: id });
    await Policy.deleteMany({ clientId: id });
    
    // Also delete using string clientId
    await Lead.deleteMany({ clientId: client.clientId });
    await AIUsage.deleteMany({ clientId: client.clientId });

    await Client.findByIdAndDelete(id);
    
    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Failed to delete client", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
