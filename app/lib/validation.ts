export function pickAndValidateClient(body: Record<string, unknown>) {
  const allowed = [
    'name', 'email', 'phone', 'whatsapp', 'website', 'location',
    'businessDescription', 'supportEmail', 'chatbotEnabled',
    'itineraryEnabled', 'allowedDomains', 'currency', 'status', 'branding'
  ];
  
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) result[key] = body[key];
  }

  if (result.name && typeof result.name !== 'string') throw new Error('Invalid name');
  if (result.email && typeof result.email !== 'string') throw new Error('Invalid email');
  if (result.allowedDomains && !Array.isArray(result.allowedDomains)) throw new Error('allowedDomains must be an array');
  
  return result;
}

export function pickAndValidatePackage(body: Record<string, unknown>) {
  const allowed = [
    'clientId', 'title', 'destination', 'days', 'nights', 'price', 
    'description', 'inclusions', 'exclusions', 'active'
  ];
  
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) result[key] = body[key];
  }

  if (result.title && typeof result.title !== 'string') throw new Error('Invalid title');
  
  return result;
}

export function pickAndValidateFaq(body: Record<string, unknown>) {
  const allowed = ['clientId', 'question', 'answer'];
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) result[key] = body[key];
  }
  return result;
}

export function pickAndValidatePolicy(body: Record<string, unknown>) {
  const allowed = ['clientId', 'title', 'content'];
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) result[key] = body[key];
  }
  return result;
}

export function pickAndValidateLeadUpdate(body: Record<string, unknown>) {
  const allowed = ['status', 'notes'];
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) result[key] = body[key];
  }
  return result;
}
