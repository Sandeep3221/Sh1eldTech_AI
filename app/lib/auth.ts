import { cookies } from "next/headers";

const getSecret = () => process.env.AUTH_SECRET || "fallback_secret_for_dev_only";

async function getCryptoKey() {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bufferToBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function signSessionToken(payload: object): Promise<string> {
  const encoder = new TextEncoder();
  const dataString = JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const data = btoa(dataString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );
  
  const signature = bufferToBase64Url(signatureBuffer);
  return `${data}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;
    
    const key = await getCryptoKey();
    const encoder = new TextEncoder();
    
    let base64 = signature.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    
    const binary = atob(base64);
    const signatureBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      signatureBytes[i] = binary.charCodeAt(i);
    }
    
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(data)
    );
    
    if (!isValid) return null;
    
    let dataBase64 = data.replace(/-/g, '+').replace(/_/g, '/');
    while (dataBase64.length % 4) dataBase64 += '=';
    const payload = JSON.parse(atob(dataBase64));
    
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("shield_auth")?.value;
  
  if (!token) return false;
  
  const payload = await verifySessionToken(token);
  if (!payload || payload.role !== "admin") return false;
  
  return true;
}
