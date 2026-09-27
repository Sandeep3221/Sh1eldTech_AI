import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as ChatPOST } from '../app/api/chat/route';
import { POST as ItiPOST } from '../app/api/itinerary/route';
import { NextRequest } from 'next/server';

vi.mock('../app/lib/db', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('../app/lib/rate-limit', () => ({
  chatRateLimiter: { check: vi.fn(() => true) },
  itineraryRateLimiter: { check: vi.fn(() => true) },
}));

const mockClient = {
  _id: '123',
  clientId: 'shd_test',
  chatbotEnabled: true,
  itineraryEnabled: true,
  allowedDomains: [],
  name: 'Test Agency',
  currency: 'USD',
  status: 'active'
};

vi.mock('../app/model/client.model', () => ({
  Client: {
    findOne: vi.fn(({ clientId }) => {
      let res = null;
      if (clientId === 'shd_test') res = mockClient;
      if (clientId === 'shd_disabled') res = { ...mockClient, chatbotEnabled: false, itineraryEnabled: false };
      return {
        lean: vi.fn().mockResolvedValue(res),
        then: function(resolve: any) { resolve(res); }
      };
    })
  }
}));

vi.mock('../app/model/package.model', () => ({
  Package: { find: vi.fn(async () => []) }
}));

vi.mock('../app/model/faq.model', () => ({
  Faq: { find: vi.fn(async () => []) }
}));

vi.mock('../app/model/policy.model', () => ({
  Policy: { find: vi.fn(async () => []) }
}));

vi.mock('../app/model/lead.model', () => ({
  Lead: { create: vi.fn(async () => ({})) }
}));

vi.mock('../app/model/ai-usage.model', () => ({
  AIUsage: { create: vi.fn(async () => ({})) }
}));

vi.mock('../app/lib/ai/service', () => ({
  generateChatResponse: vi.fn(async () => ({ text: 'AI response', usage: {} })),
  generateItinerary: vi.fn(async () => {
    // We can simulate malformed data in a specific test if needed, but default to success
    return { data: { title: 'Test', summary: 'Sum', days: [], note: 'Note' }, usage: {} };
  })
}));

describe('API Route Logic', () => {
  describe('Chat API', () => {
    it('should reject requests with invalid client ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'shd_invalid', message: 'Hello' })
      });
      const res = await ChatPOST(req);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Client not found');
    });

    it('should reject requests if chatbot is disabled', async () => {
      const req = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'shd_disabled', message: 'Hello' })
      });
      const res = await ChatPOST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('Chatbot is disabled for this client');
    });

    it('should handle request validation (too long)', async () => {
      const longMessage = 'A'.repeat(3000);
      const req = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'shd_test', message: longMessage })
      });
      const res = await ChatPOST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('Itinerary API', () => {
    it('should reject requests if itinerary planner is disabled', async () => {
      const req = new NextRequest('http://localhost:3000/api/itinerary', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'shd_disabled', destination: 'Paris', days: 5, name: 'John', email: 'j@j.com' })
      });
      const res = await ItiPOST(req);
      expect(res.status).toBe(404); // returns 404 for disabled in the code 
      const data = await res.json();
      expect(data.error).toBe('Itinerary planning not available');
    });
  });
});
