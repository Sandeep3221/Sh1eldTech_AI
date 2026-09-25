import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { connectToDatabase } from "@/app/lib/db";
import { Client } from "@/app/model/client.model";
import { Package } from "@/app/model/package.model";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, destination, days, budget, travellers, travelDate, interests } = body;

    if (!clientId || !destination || !days) {
      return NextResponse.json({ error: "clientId, destination, and days are required" }, { status: 400, headers: corsHeaders });
    }

    await connectToDatabase();
    
    const client = await Client.findOne({ clientId });
    if (!client || !client.itineraryEnabled) {
      return NextResponse.json({ error: "Itinerary planning not available" }, { status: 404, headers: corsHeaders });
    }

    const packages = await Package.find({ clientId: client._id, active: true });

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
${packages.map((p: any) => `- ${p.title} to ${p.destination}. Price: $${p.price}. ${p.description}`).join('\n')}

Rules:
- Act as a travel itinerary assistant for this specific agency.
- Primarily use that client's available travel data if relevant to the destination.
- Respect the requested number of days (${days}).
- Respect the budget direction.
- Never invent exact package prices.
- Never claim confirmed booking.
- Never claim confirmed availability.
- Create a practical day-by-day plan.
- Finish with a note that final quotation/availability must be confirmed with the agency via WhatsApp/Email.

Respond strictly in valid JSON format matching this structure:
{
  "title": "Title of the itinerary",
  "summary": "Brief summary",
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "activities": ["Activity 1", "Activity 2"]
    }
  ],
  "note": "Closing note about confirming availability"
}
`;

    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
    });

    const aiText = response.text || "{}";
    
    let parsedJson;
    try {
      const jsonStr = aiText.replace(/```json\n?|```/g, "").trim();
      parsedJson = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", aiText);
      return NextResponse.json({ error: "Failed to generate a valid itinerary format." }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ ...parsedJson, whatsapp: client.whatsapp || client.phone }, { headers: corsHeaders });

  } catch (error) {
    console.error("Itinerary API error:", error);
    return NextResponse.json({ error: "Failed to generate itinerary" }, { status: 500, headers: corsHeaders });
  }
}
