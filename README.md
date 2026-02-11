# MedTranslate — Healthcare Doctor–Patient Translation System

A production-ready, full-stack web application that eliminates language barriers in medical consultations. Doctors communicate in English while patients respond in Hindi — every message is translated in real time, audio is recorded and transcribed, and an AI generates a structured medical summary at the end of every session.

---

## Live Demo

> **Deployed Application:** [https://your-app.vercel.app](https://your-app.vercel.app)
> **GitHub Repository:** [https://github.com/your-username/healthcare-translator](https://github.com/your-username/healthcare-translator)

---

## The Problem

Communication breakdowns between doctors and patients due to language differences lead to misdiagnosis, poor treatment adherence, and compromised patient safety. Existing solutions are either too expensive, require manual interpreter involvement, or fail to handle medical terminology accurately.

MedTranslate provides an instant, AI-powered translation layer that works directly in the browser — no additional hardware, no third-party interpreters, no delays.

---

## Core Features

### Real-Time Bidirectional Translation
Every message sent by the Doctor (English) is instantly translated to Hindi for the Patient, and vice versa. Translation is powered by LLaMA 3.3 70B — a model chosen specifically for its strong handling of medical terminology and contextual accuracy. Both the original and translated text are visible in each message bubble, ensuring full transparency for both parties.

### Role-Based Chat Interface
The application supports two distinct roles: Doctor and Patient. Messages are visually differentiated — Doctor messages appear on the right in cyan, Patient messages on the left in violet. The active role is selected from the input area and can be switched mid-conversation, making the interface intuitive for both participants at a shared screen or two separate devices.

### Audio Recording and Transcription
Users can record voice messages directly from the browser using the built-in microphone. Recordings are transcribed using Groq's hosted Whisper Large V3 model and converted into translated text messages automatically. Recorded audio clips are embedded inline in the conversation and can be replayed at any time.

### Persistent Conversation Logging
Every message, translation, timestamp, and audio reference is stored in a PostgreSQL database hosted on Supabase. Conversations persist across sessions and page reloads. The sidebar displays all past consultations, each accessible with a single click.

### Full-Text Conversation Search
A search bar allows users to query any keyword or phrase across the active conversation. Matching text is highlighted in real time across both original and translated content, making it easy to locate specific symptoms, diagnoses, or instructions discussed during a session.

### AI-Powered Medical Summary
At any point during or after a consultation, users can generate a structured summary of the conversation. The AI analyzes the full exchange and extracts four key categories: symptoms reported, diagnoses mentioned, medications prescribed, and follow-up actions required. The summary is stored in the database alongside the conversation for future reference.

### Conversation Management
Consultations can be created and deleted from the sidebar. Deletion includes a confirmation step and cascades to remove all associated messages from the database, keeping the interface clean and organized.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack React framework with API routes |
| Language | TypeScript 5.3 | Type safety across frontend and backend |
| Styling | Tailwind CSS 3.4 | Utility-first styling with custom animations |
| Database | PostgreSQL (Supabase) | Persistent conversation and message storage |
| ORM | Prisma 5 | Type-safe database queries and schema management |
| AI — Translation | Groq / LLaMA 3.3 70B | Real-time English ↔ Hindi medical translation |
| AI — Transcription | Groq / Whisper Large V3 | Browser audio to text conversion |
| AI — Summarization | Groq / LLaMA 3.3 70B | Structured medical summary generation |
| Deployment | Vercel | Serverless deployment with zero-config Next.js support |

---

## AI Integration Decisions

**Why Groq over OpenAI**
Groq provides a generous free tier with no billing setup required, making it accessible without credit card dependency. More importantly, Groq's inference speed is significantly faster than standard OpenAI endpoints, which matters for real-time translation where response latency directly affects usability.

**Why LLaMA 3.3 70B for Translation and Summarization**
The 70B parameter model was selected over smaller alternatives because medical translation demands nuance. Smaller models tend to produce literal translations that lose clinical meaning. LLaMA 3.3 70B handles medical terminology, contextual phrasing, and Hindi linguistic structure with a level of accuracy suitable for this use case.

**Why Whisper Large V3 for Transcription**
Whisper Large V3 offers strong multilingual transcription support, including Hindi. Since patients may speak in Hindi or a mix of Hindi and English (Hinglish), a robust multilingual model was essential over simpler speech-to-text alternatives.

**Prompt Design**
Translation prompts explicitly instruct the model to preserve medical terminology rather than simplify it. Summary prompts enforce strict JSON output structure to ensure consistent parsing — with fallback sanitization to strip any markdown code fences the model may inadvertently include.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js Application                  │
│                                                          │
│  ┌──────────────┐          ┌───────────────────────────┐ │
│  │   Frontend   │  fetch   │       API Routes          │ │
│  │  (React UI)  │ ◄──────► │  /api/conversations       │ │
│  │              │          │  /api/messages            │ │
│  │  page.tsx    │          │  /api/transcribe          │ │
│  │  components/ │          │  /api/summary             │ │
│  └──────────────┘          └───────────┬───────────────┘ │
│                                        │                  │
└────────────────────────────────────────┼──────────────────┘
                                         │
                    ┌────────────────────┼────────────────┐
                    │                    │                  │
              ┌─────▼──────┐    ┌───────▼──────┐          │
              │  Supabase  │    │   Groq API   │          │
              │ PostgreSQL │    │              │          │
              │            │    │ LLaMA 3.3 70B│          │
              │ Prisma ORM │    │ Whisper V3   │          │
              └────────────┘    └──────────────┘          │
```

---

## Database Schema

```prisma
model Conversation {
  id        String    @id @default(cuid())
  title     String?
  summary   String?   @db.Text
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messages  Message[]
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           Role
  originalText   String       @db.Text
  translatedText String?      @db.Text
  originalLang   String       @default("en")
  targetLang     String       @default("hi")
  audioUrl       String?
  createdAt      DateTime     @default(now())
}

enum Role {
  DOCTOR
  PATIENT
}
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/conversations` | Fetch all conversations ordered by date |
| POST | `/api/conversations` | Create a new consultation session |
| GET | `/api/conversations/:id` | Fetch a single conversation with all messages |
| DELETE | `/api/conversations/:id` | Delete conversation and all associated messages |
| GET | `/api/messages?conversationId=&search=` | Fetch messages, with optional full-text search |
| POST | `/api/messages` | Create message, trigger translation, store both |
| POST | `/api/transcribe` | Accept audio file, return transcribed text |
| POST | `/api/summary` | Generate and store AI medical summary |

---

## Local Development Setup

### Prerequisites
- Node.js 18 or higher
- A [Supabase](https://supabase.com) account (free tier is sufficient)
- A [Groq](https://console.groq.com) API key (free, no credit card required)

### Steps

```bash
# Clone the repository
git clone https://github.com/your-username/healthcare-translator.git
cd healthcare-translator

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Open `.env` and fill in your credentials:

```env
DATABASE_URL="postgresql://postgres:your-password@db.xxxx.supabase.co:5432/postgres"
GROQ_API_KEY="gsk_your-groq-api-key"
```

```bash
# Generate Prisma client and push schema to database
npx prisma generate
npx prisma db push

# Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### First Use
1. Click **New Consultation** in the sidebar
2. Select the **Doctor** role and type a message in English — it will be translated to Hindi
3. Switch to the **Patient** role and respond in Hindi — it will be translated to English
4. Use the microphone button to record audio messages
5. Click **Summary** to generate an AI medical report of the session

---

## Production Deployment

This application is configured for one-click deployment on Vercel.

1. Push the repository to GitHub (ensure it is set to **Public**)
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add the following environment variables in the Vercel project settings:
   - `DATABASE_URL`
   - `GROQ_API_KEY`
4. Click **Deploy**

Vercel automatically detects the Next.js framework and applies the correct build configuration via `vercel.json`.

---

## Known Limitations

**Language Support**
The current implementation supports English and Hindi only. The translation layer is designed to be extensible — adding a new language requires updating the language map in `src/lib/openai.ts` and adding the corresponding role or toggle in the UI.

**Audio Persistence**
Audio recordings are stored as temporary browser object URLs which expire when the page is closed. In a production healthcare environment, audio should be uploaded to durable object storage such as AWS S3 or Cloudinary before saving the URL to the database.

**Authentication**
There is no user authentication system. All conversations are stored in a shared database accessible to anyone with the application URL. A production deployment would require role-based access control and patient data encryption to meet healthcare privacy standards.

**Rate Limits**
The Groq free tier imposes rate limits on API requests. For high-volume production use, a paid Groq plan or fallback model provider should be configured.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string from Supabase |
| `GROQ_API_KEY` | Yes | API key from console.groq.com |