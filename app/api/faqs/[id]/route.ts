import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Faq } from "@/app/model/faq.model";
import { pickAndValidateFaq } from "@/app/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    
    const safeBody = pickAndValidateFaq(body);
    const updatedFaq = await Faq.findByIdAndUpdate(id, safeBody, { new: true, runValidators: true });
    if (!updatedFaq) return NextResponse.json({ error: "Faq not found" }, { status: 404 });
    
    return NextResponse.json(updatedFaq);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update faq" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const deletedFaq = await Faq.findByIdAndDelete(id);
    if (!deletedFaq) return NextResponse.json({ error: "Faq not found" }, { status: 404 });
    
    return NextResponse.json({ message: "Faq deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete faq" }, { status: 500 });
  }
}
