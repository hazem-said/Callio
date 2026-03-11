# Callio – AI Restaurant Receptionist SaaS

## Quick Start (5 minutes)

### 1. Copy environment file
```bash
cp env.local.example .env.local
```
Fill in your real API keys (see below).

### 2. Install dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Set up the database
```bash
npm run db:push   # Creates SQLite DB
npm run db:seed   # Adds demo data
```

### 4. Start the dev server
```bash
npm run dev
```
Visit **http://localhost:3000**

### Demo login
- Email: `demo@callio.ai`
- Password: `password123`

---

## Required API Keys

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create a key and add it as `OPENAI_API_KEY`

### Twilio (for real phone calls)
1. Create account at https://console.twilio.com
2. Buy a phone number (~$1/month)
3. Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### NextAuth
- Generate a random secret: `openssl rand -base64 32`
- Add as `NEXTAUTH_SECRET`

---

## Connecting Twilio to Your AI

Once deployed (e.g. Vercel):

1. Go to Twilio Console → Phone Numbers → Your number
2. Under **Voice Configuration** → "A call comes in"
3. Set to **Webhook (HTTP POST)**:
   ```
   https://your-domain.com/api/voice/inbound?restaurantId=YOUR_RESTAURANT_ID
   ```
4. Set **Status Callback URL**:
   ```
   https://your-domain.com/api/voice/status
   ```

Find your Restaurant ID in **Settings** page → copy from the webhook URL shown there.

---

## Architecture

```
Phone Call
    │
    ▼
Twilio Voice
    │  POST /api/voice/inbound
    ▼
Restaurant Lookup + Session Create
    │  TwiML: <Gather> greeting
    ▼
Caller Speaks
    │  POST /api/voice/gather (SpeechResult)
    ▼
AI Agent (GPT-4o-mini)
    │  Function calling:
    │  - check_reservation_availability
    │  - create_reservation
    │  - cancel_reservation
    │  - place_order
    │  - get_menu_info
    │  - get_restaurant_info
    │  - transfer_to_human
    │  - end_call
    ▼
TwiML Response → Twilio speaks to caller
    │
    ▼  (loop until call ends)
Call Status Webhook
    │  POST /api/voice/status
    ▼
Transcript saved to DB
```

## Deploy to Production

```bash
# Build
npm run build

# Vercel (recommended)
vercel --prod

# Or any Node.js host
npm start
```

For production, switch `DATABASE_URL` to a PostgreSQL connection string.
