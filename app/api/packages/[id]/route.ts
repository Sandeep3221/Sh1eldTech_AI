import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Package } from "@/app/model/package.model";
import { pickAndValidatePackage } from "@/app/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    
    const safeBody = pickAndValidatePackage(body);
    const updatedPackage = await Package.findByIdAndUpdate(id, safeBody, { new: true, runValidators: true });
    if (!updatedPackage) return NextResponse.json({ error: "Package not found" }, { status: 404 });
    
    return NextResponse.json(updatedPackage);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const deletedPackage = await Package.findByIdAndDelete(id);
    if (!deletedPackage) return NextResponse.json({ error: "Package not found" }, { status: 404 });
    
    return NextResponse.json({ message: "Package deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
  }
}
