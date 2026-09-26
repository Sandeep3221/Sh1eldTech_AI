import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Client } from "@/app/model/client.model";
import { validateAllowedDomain } from "@/app/lib/security";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400, headers: corsHeaders });
    }

    await connectToDatabase();
    
    const client = await Client.findOne({ clientId });
    if (!client || client.status !== 'active') {
      return NextResponse.json({ error: "Client not found or inactive" }, { status: 404, headers: corsHeaders });
    }

    if (!validateAllowedDomain(request, client.allowedDomains)) {
      return NextResponse.json({ error: "Domain not authorized" }, { status: 403, headers: corsHeaders });
    }

    // Return ONLY public information
    const publicConfig = {
      chatbotEnabled: client.chatbotEnabled,
      itineraryEnabled: client.itineraryEnabled,
      currency: client.currency || 'INR',
      branding: {
        primaryColor: client.branding?.primaryColor || '#000000',
        chatbotTitle: client.branding?.chatbotTitle || 'AI Assistant',
        chatbotWelcomeMessage: client.branding?.chatbotWelcomeMessage || 'Hi there! How can I help you today?',
        itineraryTitle: client.branding?.itineraryTitle || 'Plan Your Trip',
        itineraryLauncherText: client.branding?.itineraryLauncherText || 'Plan Itinerary',
        logoUrl: client.branding?.logoUrl || ''
      }
    };

    return NextResponse.json(publicConfig, { headers: corsHeaders });

  } catch (error) {
    console.error("Widget config API error:", error);
    return NextResponse.json({ error: "Failed to load configuration" }, { status: 500, headers: corsHeaders });
  }
}
