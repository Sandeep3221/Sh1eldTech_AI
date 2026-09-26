import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Faq } from "@/app/model/faq.model";
import { pickAndValidateFaq } from "@/app/lib/validation";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    
    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }
    
    const faqs = await Faq.find({ clientId }).sort({ createdAt: -1 });
    return NextResponse.json(faqs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch faqs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    if (!body.clientId || !body.question || !body.answer) {
      return NextResponse.json({ error: "clientId, question, and answer are required" }, { status: 400 });
    }

    const safeBody = pickAndValidateFaq(body);
    const newFaq = await Faq.create(safeBody);
    return NextResponse.json(newFaq, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create faq" }, { status: 500 });
  }
}
