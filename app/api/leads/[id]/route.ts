import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Lead } from "@/app/model/lead.model";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const body = await request.json();
    
    const validStatuses = ['new', 'contacted', 'interested', 'quotation_sent', 'won', 'lost'];
    const updateData: Record<string, unknown> = {};
    
    if (body.status && validStatuses.includes(body.status)) {
      updateData.status = body.status;
    }
    
    if (body.notes !== undefined) {
      updateData.notes = typeof body.notes === 'string' ? body.notes.substring(0, 1000) : '';
    }
    
    updateData.updatedAt = new Date();

    const lead = await Lead.findByIdAndUpdate(resolvedParams.id, updateData, { new: true });
    
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Failed to update lead", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
