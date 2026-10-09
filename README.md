# Shield AI


A premium B2B SaaS dashboard and AI toolkit designed for travel agencies. Shield AI allows you to manage agency profiles, travel packages, FAQs, and policies, while instantly providing embeddable AI Chatbots and Itinerary Planners for client websites.

## 🚀 Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** MongoDB (via Mongoose)
- **AI Engine:** Google Gemini (`@google/genai`)

## 📂 Project Structure

The project follows a direct, readable full-stack Next.js architecture (no unnecessary abstraction layers).

- `app/api/` - Backend API routes (direct DB/Gemini access).
- `app/dashboard/` - Admin dashboard UI pages.
- `app/components/ui.tsx` - Lightweight, reusable design system.
- `app/model/` - Mongoose database schemas.
- `public/` - Standalone vanilla JS embed widgets (`chatbot.js`, `itinerary.js`).
- `proxy.ts` - Edge middleware protecting the dashboard via simple cookie auth.

- 
## 🔑 Environment Variables
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/shield-ai
GEMINI_API_KEY=your_gemini_api_key_here
ADMIN_EMAIL=admin@shield.local
ADMIN_PASSWORD=secret
JWT_SECRET=your_long_random_jwt_secret_here
```

## 🛠️ Setup & Run
```bash
npm install
npm run dev
```

---

## 📡 API Endpoints Reference

All endpoints return standard JSON. The public AI/Lead endpoints have permissive CORS headers to support cross-origin widget embeds.

### Auth
- `POST /api/auth/login` - Authenticates using the configured admin email and password, then sets an HTTP-only JWT cookie.
- `POST /api/auth/logout` - Clears the auth cookie.

### Clients (Agencies)
- `GET /api/clients` - List all clients.
- `POST /api/clients` - Create a new client.
- `GET /api/clients/[id]` - Get single client details.
- `PUT /api/clients/[id]` - Update client details.
- `DELETE /api/clients/[id]` - Delete client.

### Client Data (Packages, FAQs, Policies)
*Replace `<resource>` with `packages`, `faqs`, or `policies`.*
- `GET /api/<resource>?clientId=123` - List items belonging to a specific client.
- `POST /api/<resource>` - Create a new item (requires `clientId` in body).
- `PUT /api/<resource>/[id]` - Update an item.
- `DELETE /api/<resource>/[id]` - Delete an item.

### Leads
- `GET /api/leads` - List leads (optional filter: `?clientId=123`).
- `POST /api/leads` - Create a new lead (typically called directly by the Itinerary widget).

### Public AI Features (CORS Enabled)
- `POST /api/chat`
  - **Body:** `{ clientId, message }`
  - **Behavior:** Fetches client data (packages, faqs, policies), builds a strict system prompt, and calls Gemini to answer as an agency support assistant.
  - **Returns:** `{ response: "..." }`

- `POST /api/itinerary`
  - **Body:** `{ clientId, destination, days, budget, travellers, travelDate, interests }`
  - **Behavior:** Calls Gemini to build a structured, day-by-day travel plan avoiding false promises, referencing actual agency packages if relevant.
  - **Returns:** Structured JSON `{ title, summary, days: [...], note, whatsapp }`

---

## 🧩 Public Embed Widgets
The platform provides two zero-dependency, vanilla JS widgets designed to be embedded on any third-party host website without breaking their layout. 

Embed via HTML `<script>` tags using the specific `clientId`:

**1. Chatbot Assistant**
```html
<script src="https://your-domain.com/chatbot.js" data-client-id="CLIENT_ID"></script>
```

**2. Itinerary Planner**
```html
<script src="https://your-domain.com/itinerary.js" data-client-id="CLIENT_ID"></script>
```
*Note: Both widgets use fixed positioning and scoped CSS to ensure seamless integration.*
