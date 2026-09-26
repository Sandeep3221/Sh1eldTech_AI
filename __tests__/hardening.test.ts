import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as chatPOST } from '../app/api/chat/route';
import { POST as itineraryPOST } from '../app/api/itinerary/route';
import { GET as widgetConfigGET } from '../app/api/widget-config/route';
import { pickAndValidateClient, pickAndValidatePackage, pickAndValidateFaq, pickAndValidatePolicy } from '../app/lib/validation';
import { NextRequest } from 'next/server';

vi.mock('../app/lib/db', () => ({ connectToDatabase: vi.fn() }));

vi.mock('../app/lib/rate-limit', () => ({
  chatRateLimiter: { check: vi.fn(() => true) },
  itineraryRateLimiter: { check: vi.fn(() => true) },
}));

vi.mock('../app/lib/security', () => ({
  validateAllowedDomain: vi.fn(() => true),
}));

vi.mock('../app/model/package.model', () => ({
  Package: { find: vi.fn(async () => []) },
}));

vi.mock('../app/model/ai-usage.model', () => ({
  AIUsage: { create: vi.fn(async () => ({})) },
}));

vi.mock('../app/lib/ai/service', () => ({
  generateItinerary: vi.fn(async () => ({ data: { title: 'Test', days: [] }, usage: {} })),
  generateChatResponse: vi.fn(async () => ({ text: 'Test', usage: {} })),
}));

vi.mock('../app/model/client.model', () => ({
  Client: {
    findOne: vi.fn(),
  },
}));

vi.mock('../app/model/lead.model', () => ({
  Lead: {
    create: vi.fn(),
  },
}));

import { Client } from '../app/model/client.model';
import { Lead } from '../app/model/lead.model';

const mockClientFindOne = vi.mocked(Client.findOne);
const mockLeadCreate = vi.mocked(Lead.create);

describe('Hardening Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Client Lifecycle Enforcement', () => {
    it('rejects chat for suspended client', async () => {
      mockClientFindOne.mockResolvedValueOnce({
        _id: 'client123',
        status: 'suspended',
        chatbotEnabled: true,
        allowedDomains: ['test.com'],
      });

      const req = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: { origin: 'https://test.com' },
        body: JSON.stringify({ clientId: 'test-client', message: 'Hello' }),
      });

      const res = await chatPOST(req);
      const json = await res.json();
      expect(res.status).toBe(403);
      expect(json.error).toBe('Client is inactive');
    });

    it('rejects itinerary for archived client', async () => {
      mockClientFindOne.mockResolvedValueOnce({
        _id: 'client123',
        status: 'archived',
        itineraryEnabled: true,
        allowedDomains: ['test.com'],
      });

      const req = new NextRequest('http://localhost/api/itinerary', {
        method: 'POST',
        headers: { origin: 'https://test.com' },
        body: JSON.stringify({ 
          clientId: 'test-client', 
          destination: 'Paris', 
          days: 3, 
          name: 'John', 
          email: 'john@test.com' 
        }),
      });

      const res = await itineraryPOST(req);
      const json = await res.json();
      expect(res.status).toBe(403);
      expect(json.error).toBe('Client is inactive');
    });
  });

  describe('Lead Persistence', () => {
    it('returns error if lead creation fails and does not call Gemini', async () => {
      mockClientFindOne.mockResolvedValueOnce({
        _id: 'client123',
        status: 'active',
        itineraryEnabled: true,
        allowedDomains: ['test.com'],
      });
      mockLeadCreate.mockRejectedValueOnce(new Error('DB Error'));

      const req = new NextRequest('http://localhost/api/itinerary', {
        method: 'POST',
        headers: { origin: 'https://test.com' },
        body: JSON.stringify({ 
          clientId: 'test-client', 
          destination: 'Paris', 
          days: 3, 
          name: 'John', 
          email: 'john@test.com' 
        }),
      });

      const res = await itineraryPOST(req);
      const json = await res.json();
      
      expect(res.status).toBe(500);
      expect(json.error).toBe('Unable to save your request. Please try again.');
    });
  });

  describe('Validation', () => {
    it('strips unknown fields from client update', () => {
      const body = {
        name: 'Valid Name',
        email: 'valid@test.com',
        adminAccess: true, // Should be stripped
        status: 'active'
      };
      
      const safe = pickAndValidateClient(body);
      expect(safe.name).toBe('Valid Name');
      expect(safe.status).toBe('active');
      expect(safe).not.toHaveProperty('adminAccess');
    });

    it('throws on invalid client fields', () => {
      expect(() => pickAndValidateClient({ name: 123 })).toThrow('name must be a string');
      expect(() => pickAndValidateClient({ email: 'notanemail' })).toThrow('Invalid email');
      expect(() => pickAndValidateClient({ currency: 'GBP' })).toThrow('Invalid currency');
      expect(() => pickAndValidateClient({ status: 'invalid_status' })).toThrow('Invalid status');
      expect(() => pickAndValidateClient({ allowedDomains: 'not_an_array' })).toThrow('allowedDomains must be an array');
      expect(() => pickAndValidateClient({ website: 'not_a_url' })).toThrow('Invalid website URL');
    });

    it('allows partial updates for client', () => {
      const body = { status: 'suspended' };
      const safe = pickAndValidateClient(body);
      expect(safe).toEqual({ status: 'suspended' });
    });

    it('throws on invalid package fields', () => {
      expect(() => pickAndValidatePackage({ title: 123 })).toThrow('title must be a string');
      expect(() => pickAndValidatePackage({ price: -10 })).toThrow('price must be a non-negative number');
      expect(() => pickAndValidatePackage({ price: 'invalid' })).toThrow('price must be a non-negative number');
      expect(() => pickAndValidatePackage({ inclusions: 'not_an_array' })).toThrow('inclusions must be an array');
      expect(() => pickAndValidatePackage({ days: -1 })).toThrow('days must be at least 0');
    });

    it('allows partial updates for package', () => {
      const body = { price: 150 };
      const safe = pickAndValidatePackage(body);
      expect(safe).toEqual({ price: 150 });
    });

    it('validates FAQ and Policy fields', () => {
      expect(() => pickAndValidateFaq({ question: 123 })).toThrow('question must be a string');
      expect(() => pickAndValidatePolicy({ title: 123 })).toThrow('title must be a string');
      
      const safeFaq = pickAndValidateFaq({ question: 'How?' });
      expect(safeFaq).toEqual({ question: 'How?' });
      
      const safePolicy = pickAndValidatePolicy({ title: 'Refunds' });
      expect(safePolicy).toEqual({ title: 'Refunds' });
    });
  });

  describe('Widget Config', () => {
    it('only returns safe public fields', async () => {
      mockClientFindOne.mockResolvedValueOnce({
        _id: 'client123',
        name: 'Secret Agency',
        email: 'admin@secret.com',
        status: 'active',
        businessDescription: 'Very secret info',
        chatbotEnabled: true,
        itineraryEnabled: true,
        branding: { primaryColor: '#FF0000' }
      });

      const req = new NextRequest('http://localhost/api/widget-config?clientId=test-client');
      const res = await widgetConfigGET(req);
      const json = await res.json();
      
      expect(json).toHaveProperty('branding');
      expect(json.chatbotEnabled).toBe(true);
      expect(json).not.toHaveProperty('email');
      expect(json).not.toHaveProperty('businessDescription');
      expect(json).not.toHaveProperty('_id');
    });
  });
});
