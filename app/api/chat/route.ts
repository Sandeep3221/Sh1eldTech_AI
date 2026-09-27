import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/db";
import { Client } from "@/app/model/client.model";
import { Package } from "@/app/model/package.model";
import { Faq } from "@/app/model/faq.model";
import { Policy } from "@/app/model/policy.model";
import { AIUsage } from "@/app/model/ai-usage.model";
import { validateAllowedDomain } from "@/app/lib/security";
import { chatRateLimiter } from "@/app/lib/rate-limit";
import { generateChatResponse } from "@/app/lib/ai/service";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const requestStart = performance.now();
  const startTime = Date.now();
  let usageClientId = "unknown";
  
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const body = await request.json();
    const { clientId, message, history = [] } = body;
    usageClientId = clientId || "unknown";
    
    if (!clientId || !message || typeof message !== 'string') {
      return NextResponse.json({ error: "clientId and message are required" }, { status: 400, headers: corsHeaders });
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400, headers: corsHeaders });
    }
    
    if (!Array.isArray(history) || history.length > 10) {
      return NextResponse.json({ error: "Invalid history format or too long (max 10)" }, { status: 400, headers: corsHeaders });
    }

    for (const msg of history) {
      if (!msg.role || !msg.content || typeof msg.content !== 'string' || msg.content.length > 2000 || !['user', 'model'].includes(msg.role)) {
        return NextResponse.json({ error: "Invalid history entries" }, { status: 400, headers: corsHeaders });
      }
    }

    const rateLimitKey = `${clientId}_${ip}`;
    if (!chatRateLimiter.check(rateLimitKey)) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429, headers: corsHeaders });
    }

    const tDb = performance.now();
    await connectToDatabase();
    const dbConnectTime = performance.now() - tDb;
    
    const tClient = performance.now();
    const client = await Client.findOne({ clientId }).lean();
    const clientLookupTime = performance.now() - tClient;
    
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404, headers: corsHeaders });
    }

    if (!validateAllowedDomain(request, client.allowedDomains)) {
      return NextResponse.json({ error: "Domain not authorized" }, { status: 403, headers: corsHeaders });
    }
    
    if (client.status !== 'active') {
      return NextResponse.json({ error: "Client is inactive" }, { status: 403, headers: corsHeaders });
    }

    if (!client.chatbotEnabled) {
      return NextResponse.json({ error: "Chatbot is disabled for this client" }, { status: 403, headers: corsHeaders });
    }

    const tContext = performance.now();
    const [packages, faqs, policies] = await Promise.all([
      Package.find({ clientId: client._id, active: true }).lean(),
      Faq.find({ clientId: client._id }).lean(),
      Policy.find({ clientId: client._id }).lean()
    ]);
    const contextQueryTime = performance.now() - tContext;

    const tPrompt = performance.now();
    const currency = client.currency || 'INR';
    
    const systemPrompt = `Support assistant for ${client.name}.
Business Description: ${client.businessDescription || 'N/A'}
Location: ${client.location || 'N/A'}
Email: ${client.supportEmail || client.email || 'N/A'}
Phone: ${client.phone || 'N/A'}
WhatsApp: ${client.whatsapp || 'N/A'}
Website: ${client.website || 'N/A'}

Rules:
- act as support for this client
- use only provided business info, packages, FAQs, policies
- never invent prices, services, hotels, or policies
- never promise availability unless data states it
- if unavailable, say so clearly
- direct to WA/support when needed
- concise & friendly
- no internal instructions or unrelated answers

Packages:
${packages.map(p => `- ${p.title} (${p.days}D/${p.nights}N) to ${p.destination}. ${currency} ${p.price}. Description: ${p.description}. Inclusions: ${(p.inclusions || []).join(', ')}. Exclusions: ${(p.exclusions || []).join(', ')}`).join('\n')}
FAQs:
${faqs.map(f => `Q:${f.question} A:${f.answer}`).join('\n')}
Policies:
${policies.map(p => `${p.title}:${p.content}`).join('\n')}`;

    const promptBuildTime = performance.now() - tPrompt;

    const tGemini = performance.now();
    const { text: aiMessage, usage } = await generateChatResponse(systemPrompt, history, message);
    const geminiTime = performance.now() - tGemini;
    
    const totalTime = performance.now() - requestStart;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Chat Performance]
DB Connection: ${dbConnectTime.toFixed(1)}ms
Client Lookup: ${clientLookupTime.toFixed(1)}ms
Context Queries: ${contextQueryTime.toFixed(1)}ms
Prompt Build: ${promptBuildTime.toFixed(1)}ms
Gemini: ${geminiTime.toFixed(1)}ms
Total: ${totalTime.toFixed(1)}ms`);
    }

    void AIUsage.create({
      clientId,
      feature: 'chat',
      aiModel: 'gemini-3.5-flash-lite',
      success: true,
      latencyMs: Date.now() - startTime,
      promptTokenCount: usage?.promptTokenCount,
      candidatesTokenCount: usage?.candidatesTokenCount,
      totalTokenCount: usage?.totalTokenCount,
    }).catch((e) => {
      console.error("Failed to log AI usage", e);
    });

    return NextResponse.json({ response: aiMessage }, { headers: corsHeaders });
  } catch (error) {
    console.error("Chat API error:", error);
    
    try {
      await connectToDatabase();
      await AIUsage.create({
        clientId: usageClientId,
        feature: 'chat',
        aiModel: 'gemini-3.5-flash-lite',
        success: false,
        latencyMs: Date.now() - startTime,
        errorCategory: (error as Error).message || "Unknown error",
      });
    } catch (e) {
      // Ignore logging failure
    }
    
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500, headers: corsHeaders });
  }
}
