import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Client } from "@/app/model/client.model";
import { Lead } from "@/app/model/lead.model";
import { AIUsage } from "@/app/model/ai-usage.model";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    const totalClients = await Client.countDocuments();
    const totalLeads = await Lead.countDocuments();
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const leadsThisMonth = await Lead.countDocuments({ createdAt: { $gte: startOfMonth } });

    const aiRequests = await AIUsage.countDocuments();
    const chatRequests = await AIUsage.countDocuments({ feature: 'chat' });
    const itineraryRequests = await AIUsage.countDocuments({ feature: 'itinerary' });
    const aiFailures = await AIUsage.countDocuments({ success: false });

    return NextResponse.json({
      totalClients,
      totalLeads,
      leadsThisMonth,
      aiRequests,
      chatRequests,
      itineraryRequests,
      aiFailures
    });

  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
