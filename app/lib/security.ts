import { NextRequest } from "next/server";

export function validateAllowedDomain(request: NextRequest, allowedDomains: string[]): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return true; // Backward compatibility if no domains are configured
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  let requestDomain = "";

  try {
    if (origin) {
      requestDomain = new URL(origin).hostname;
    } else if (referer) {
      requestDomain = new URL(referer).hostname;
    }
  } catch (e) {
    return false; // Malformed URL
  }

  if (!requestDomain) {
    return false; // No origin or referer provided
  }

  // Allow localhost during development
  if (process.env.NODE_ENV !== "production" && (requestDomain === "localhost" || requestDomain === "127.0.0.1")) {
    return true;
  }

  // Normalize request domain (remove www.)
  const normalizedRequestDomain = requestDomain.replace(/^www\./, "").toLowerCase();

  for (const domain of allowedDomains) {
    let normalizedAllowed = domain.trim().toLowerCase();
    try {
      // If they entered a full URL, parse it
      if (normalizedAllowed.startsWith("http")) {
        normalizedAllowed = new URL(normalizedAllowed).hostname;
      }
      normalizedAllowed = normalizedAllowed.replace(/^www\./, "");
      
      if (normalizedAllowed === normalizedRequestDomain) {
        return true;
      }
    } catch (e) {
      // Invalid domain configured, skip
      continue;
    }
  }

  return false;
}
