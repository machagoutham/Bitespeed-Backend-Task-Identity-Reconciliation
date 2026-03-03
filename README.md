# Bitespeed Backend Task: Identity Reconciliation

<img width="1919" height="1078" alt="Screenshot 2026-03-03 072907" src="https://github.com/user-attachments/assets/d3cbdc2e-5835-420a-8d6b-1ec179072f35" />

**Meet Dr. Emmett Brown (Doc)** — stuck in 2023, secretly building a time machine using parts from FluxKart.com. To stay under the radar, he uses **different emails and phone numbers** for every purchase.

FluxKart wants to reward loyal customers and give personalized experiences — so they integrate **Bitespeed** to collect contact details. But Doc’s method creates a big challenge: linking multiple orders with different contact info to the **same real person**.

This backend service solves exactly that: **identity reconciliation** using email and/or phone number.

## Features Implemented

- POST `/identify` endpoint (accepts optional `email` and/or `phoneNumber`)
- Creates new **primary** contact if no match exists
- Creates **secondary** contact when new info is provided for an existing person
- Merges multiple primary records when email + phone bridge separate chains (oldest remains primary)
- Returns consolidated view: primary ID + all unique emails/phones (primary first) + secondary IDs
- Handles null/empty values, exact duplicates (no new row), transitive linking
- Soft-delete aware (`deletedAt: null`)

## Tech Stack

- Node.js + TypeScript
- Express.js
- Prisma ORM
- SQLite (local dev) → PostgreSQL (production on Render)
- Thunder Client for testing

## Live Endpoint

**Not deployed yet** — deploying to Render soon.  
Once live, the endpoint will be:  
`https://your-app-name.onrender.com/identify`

## How to Test Locally

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Sync schema to local SQLite
npx prisma db push

# Start server (auto-reload)
npm run dev
```

Open: http://localhost:3000 → you should see:  
✅ Bitespeed Identity Reconciliation API is running  

Test endpoint:  
http://localhost:3000/identify  

Example request (Thunder Client / Postman / curl):

```json
{
  "email": "doc@hillvalley.edu",
  "phoneNumber": "5551234567"
}
```

## Output Screenshot

![API Running Screenshot](https://github.com/user-attachments/assets/98459ad7-bbdd-4f1f-a16f-dc187163d170)
