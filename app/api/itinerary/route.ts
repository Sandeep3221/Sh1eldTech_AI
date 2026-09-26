import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Client } from "@/app/model/client.model";
import { Package } from "@/app/model/package.model";
import { Lead } from "@/app/model/lead.model";
import { AIUsage } from "@/app/model/ai-usage.model";
import { validateAllowedDomain } from "@/app/lib/security";
import { itineraryRateLimiter } from "@/app/lib/rate-limit";
import { generateItinerary } from "@/app/lib/ai/service";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let usageClientId = "unknown";
  
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const body = await request.json();
    const { clientId, name, phone, email, destination, days, budget, travellers, travelDate, interests, source } = body;
    usageClientId = clientId || "unknown";

    if (!clientId || !destination || !days || !name || (!phone && !email)) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400, headers: corsHeaders });
    }

    if (typeof name !== 'string' || name.length > 100 || typeof destination !== 'string' || destination.length > 100) {
      return NextResponse.json({ error: "Invalid field length" }, { status: 400, headers: corsHeaders });
    }
    
    if (typeof days !== 'number' || days < 1 || days > 30) {
      return NextResponse.json({ error: "Days must be between 1 and 30" }, { status: 400, headers: corsHeaders });
    }

    const rateLimitKey = `${clientId}_${ip}`;
    if (!itineraryRateLimiter.check(rateLimitKey)) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429, headers: corsHeaders });
    }

    await connectToDatabase();
    
    const client = await Client.findOne({ clientId });
    if (!client || !client.itineraryEnabled) {
      return NextResponse.json({ error: "Itinerary planning not available" }, { status: 404, headers: corsHeaders });
    }

    if (client.status !== 'active') {
      return NextResponse.json({ error: "Client is inactive" }, { status: 403, headers: corsHeaders });
    }

    if (!validateAllowedDomain(request, client.allowedDomains)) {
      return NextResponse.json({ error: "Domain not authorized" }, { status: 403, headers: corsHeaders });
    }

    // Create the lead
    try {
      await Lead.create({
        clientId,
        name,
        phone: phone || '',
        email: email || '',
        destination,
        days,
        travellers: typeof travellers === 'number' && travellers > 0 ? travellers : undefined,
        budget: typeof budget === 'string' ? budget.substring(0, 50) : undefined,
        interests: typeof interests === 'string' ? interests.substring(0, 200) : undefined,
        travelDate: typeof travelDate === 'string' ? travelDate.substring(0, 50) : undefined,
        source: source || 'Itinerary Widget',
        status: 'new'
      });
    } catch (e) {
      console.error("Failed to create lead:", e);
      return NextResponse.json({ error: "Unable to save your request. Please try again." }, { status: 500, headers: corsHeaders });
    }

    const packages = await Package.find({ clientId: client._id, active: true });
    
    const currency = client.currency || 'INR';

    const prompt = `
You are a travel itinerary assistant for ${client.name}.
Create a practical day-by-day plan for a customer.

Customer Details:
Destination: ${destination}
Days: ${days}
Budget: ${budget || 'Not specified'}
Travellers: ${travellers || 'Not specified'}
Travel Date: ${travelDate || 'Not specified'}
Interests: ${interests || 'Not specified'}

Available Agency Packages to reference (if relevant):
${packages.map((p: Record<string, unknown>) => `- ${p.title} to ${p.destination}. Price: ${currency} ${p.price}. ${p.description}`).join('\n')}

Rules:
- Act as a travel itinerary assistant for this specific agency.
- Primarily use that client's available travel data if relevant to the destination.
- Respect the requested number of days (${days}).
- Respect the budget direction.
- Never invent exact package prices.
- Never claim confirmed booking.
- Never claim confirmed availability.
- Create a practical day-by-day plan.
- AI ITINERARY SAFETY / GROUNDING: Note that AI-generated suggestions are just ideas. Final pricing, bookings, and availability of actual agency services must be confirmed directly with the agency.
- Finish with a note that final quotation/availability must be confirmed with the agency via WhatsApp/Email.
`;

    const { data: parsedJson, usage } = await generateItinerary(prompt);

    try {
      await AIUsage.create({
        clientId,
        feature: 'itinerary',
        aiModel: 'gemini-3.5-flash-lite',
        success: true,
        latencyMs: Date.now() - startTime,
        promptTokenCount: usage?.promptTokenCount,
        candidatesTokenCount: usage?.candidatesTokenCount,
        totalTokenCount: usage?.totalTokenCount,
      });
    } catch (e) {
      console.error("Failed to log AI usage", e);
    }

    return NextResponse.json({ ...parsedJson, whatsapp: client.whatsapp || client.phone }, { headers: corsHeaders });

  } catch (error) {
    console.error("Itinerary API error:", error);
    
    try {
      await connectToDatabase();
      await AIUsage.create({
        clientId: usageClientId,
        feature: 'itinerary',
        aiModel: 'gemini-3.5-flash-lite',
        success: false,
        latencyMs: Date.now() - startTime,
        errorCategory: (error as Error).message || "Unknown error",
      });
    } catch (e) {
      // Ignore logging failure
    }
    
    return NextResponse.json({ error: "Failed to generate itinerary" }, { status: 500, headers: corsHeaders });
  }
}
