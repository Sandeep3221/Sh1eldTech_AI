export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function checkString(val: unknown, name: string, maxLen = 1000) {
  if (val !== undefined && val !== null) {
    if (typeof val !== 'string') throw new ValidationError(`${name} must be a string`);
    if (val.length > maxLen) throw new ValidationError(`${name} is too long`);
  }
}

function checkUrl(val: unknown, name: string) {
  if (val !== undefined && val !== null && val !== '') {
    checkString(val, name, 500);
    try {
      new URL(val as string);
    } catch {
      throw new ValidationError(`Invalid ${name} URL`);
    }
  }
}

function checkEmail(val: unknown, name: string) {
  if (val !== undefined && val !== null && val !== '') {
    checkString(val, name, 255);
    if (!(val as string).includes('@')) throw new ValidationError(`Invalid ${name}`);
  }
}

function checkNumber(val: unknown, name: string, min = 0) {
  if (val !== undefined && val !== null) {
    if (typeof val !== 'number' || isNaN(val)) throw new ValidationError(`${name} must be a number`);
    if (val < min) throw new ValidationError(`${name} must be at least ${min}`);
  }
}

function checkBoolean(val: unknown, name: string) {
  if (val !== undefined && val !== null) {
    if (typeof val !== 'boolean') throw new ValidationError(`${name} must be a boolean`);
  }
}

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

  checkString(result.name, 'name', 100);
  checkEmail(result.email, 'email');
  checkString(result.phone, 'phone', 50);
  checkString(result.whatsapp, 'whatsapp', 50);
  checkUrl(result.website, 'website');
  checkString(result.location, 'location', 200);
  checkString(result.businessDescription, 'businessDescription', 2000);
  checkEmail(result.supportEmail, 'supportEmail');
  checkBoolean(result.chatbotEnabled, 'chatbotEnabled');
  checkBoolean(result.itineraryEnabled, 'itineraryEnabled');
  
  if (result.allowedDomains !== undefined) {
    if (!Array.isArray(result.allowedDomains)) throw new ValidationError('allowedDomains must be an array');
    for (const d of result.allowedDomains) {
      if (typeof d !== 'string') throw new ValidationError('allowedDomains items must be strings');
      if (d.length > 255) throw new ValidationError('allowedDomains item too long');
    }
  }

  if (result.currency !== undefined) {
    if (typeof result.currency !== 'string' || !['INR', 'USD', 'NPR', 'EUR'].includes(result.currency)) {
      throw new ValidationError('Invalid currency');
    }
  }

  if (result.status !== undefined) {
    if (typeof result.status !== 'string' || !['active', 'suspended', 'archived'].includes(result.status)) {
      throw new ValidationError('Invalid status');
    }
  }

  if (result.branding !== undefined && result.branding !== null) {
    if (typeof result.branding !== 'object' || Array.isArray(result.branding)) {
      throw new ValidationError('branding must be an object');
    }
    const b = result.branding as Record<string, unknown>;
    if (b.primaryColor !== undefined) {
      if (typeof b.primaryColor !== 'string' || !/^#[0-9A-Fa-f]{3,6}$/.test(b.primaryColor)) {
        throw new ValidationError('Invalid primaryColor');
      }
    }
    checkString(b.chatbotTitle, 'chatbotTitle', 50);
    checkString(b.chatbotWelcomeMessage, 'chatbotWelcomeMessage', 200);
    checkString(b.itineraryTitle, 'itineraryTitle', 50);
    checkString(b.itineraryLauncherText, 'itineraryLauncherText', 50);
    checkUrl(b.logoUrl, 'logoUrl');
  }
  
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

  checkString(result.clientId, 'clientId', 50);
  checkString(result.title, 'title', 200);
  checkString(result.destination, 'destination', 200);
  checkNumber(result.days, 'days', 0);
  checkNumber(result.nights, 'nights', 0);
  
  if (result.price !== undefined) {
    if (typeof result.price !== 'number' || result.price < 0) {
      // If it's passed as a string, check if it's a valid non-negative number
      if (typeof result.price === 'string') {
        const p = parseFloat(result.price);
        if (isNaN(p) || p < 0) throw new ValidationError('price must be a non-negative number');
      } else {
        throw new ValidationError('price must be a non-negative number');
      }
    }
  }

  checkString(result.description, 'description', 5000);
  
  if (result.inclusions !== undefined) {
    if (!Array.isArray(result.inclusions)) throw new ValidationError('inclusions must be an array');
    for (const item of result.inclusions) {
      if (typeof item !== 'string' || item.length > 500) throw new ValidationError('invalid inclusion item');
    }
  }
  
  if (result.exclusions !== undefined) {
    if (!Array.isArray(result.exclusions)) throw new ValidationError('exclusions must be an array');
    for (const item of result.exclusions) {
      if (typeof item !== 'string' || item.length > 500) throw new ValidationError('invalid exclusion item');
    }
  }

  checkBoolean(result.active, 'active');
  
  return result;
}

export function pickAndValidateFaq(body: Record<string, unknown>) {
  const allowed = ['clientId', 'question', 'answer'];
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) result[key] = body[key];
  }
  
  checkString(result.clientId, 'clientId', 50);
  checkString(result.question, 'question', 1000);
  checkString(result.answer, 'answer', 5000);
  
  return result;
}

export function pickAndValidatePolicy(body: Record<string, unknown>) {
  const allowed = ['clientId', 'title', 'content'];
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) result[key] = body[key];
  }
  
  checkString(result.clientId, 'clientId', 50);
  checkString(result.title, 'title', 200);
  checkString(result.content, 'content', 10000);
  
  return result;
}

export function pickAndValidateLeadUpdate(body: Record<string, unknown>) {
  const allowed = ['status', 'notes'];
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) result[key] = body[key];
  }
  
  if (result.status !== undefined) {
    const validStatuses = ['new', 'contacted', 'interested', 'quotation_sent', 'won', 'lost'];
    if (typeof result.status !== 'string' || !validStatuses.includes(result.status)) {
      throw new ValidationError('Invalid status');
    }
  }
  checkString(result.notes, 'notes', 2000);
  
  return result;
}
