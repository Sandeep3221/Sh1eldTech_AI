import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Policy } from "@/app/model/policy.model";
import { pickAndValidatePolicy } from "@/app/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    
    const safeBody = pickAndValidatePolicy(body);
    const updatedPolicy = await Policy.findByIdAndUpdate(id, safeBody, { new: true, runValidators: true });
    if (!updatedPolicy) return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    
    return NextResponse.json(updatedPolicy);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const deletedPolicy = await Policy.findByIdAndDelete(id);
    if (!deletedPolicy) return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    
    return NextResponse.json({ message: "Policy deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete policy" }, { status: 500 });
  }
}
