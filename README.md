# VedaAI – Enterprise AI Assessment Creator

### 🌐 Live Demo
- **Frontend**: [https://veda-ai-rosy-eight.vercel.app](https://veda-ai-rosy-eight.vercel.app)
- **Backend API**: [https://veda-ai-shaaz.onrender.com](https://veda-ai-shaaz.onrender.com)

This repository contains the complete full-stack implementation of the VedaAI Full Stack Engineering Assignment. It is an enterprise-grade, AI-powered assessment creator that lets teachers dynamically generate structured question papers using LLMs, selectively regenerate questions, and download cleanly formatted PDF outputs.

The project perfectly matches the Figma UI specifications and features an extremely robust, fault-tolerant asynchronous generation pipeline built with BullMQ, Redis, WebSockets, and Idempotency protocols.

## 🏗️ Architecture Overview

The system is separated into two decoupled services: a modern React frontend and a highly scalable async Node.js backend.

### Frontend (Next.js)
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS (Pixel-perfect matching of Figma designs)
- **State Management**: Zustand simplifies the multi-step assignment form state and manages global WebSocket connection status.
- **Real-time UX**: Connects to the backend via WebSockets. When a user submits an assignment, the UI immediately updates to a "generating" state and listens for incremental progress updates and the final completion payload.

### Backend (Node.js + Express)
- **Framework**: Node.js + Express (TypeScript)
- **Database**: MongoDB (Mongoose) for securely storing assignment requests and AI-generated sections.
- **Queue System**: Redis + BullMQ. Because LLM text generation is inherently slow and prone to timeouts, we do not block the Express API request.
  - The API creates a "generating" DB entry and immediately enqueues a BullMQ job.
  - A dedicated BullMQ Worker processes the assignment, constructs the prompt, interacts with the LLM (Groq API), parses the JSON response, and writes it back to MongoDB.
- **Real-time Engine**: `ws` package running alongside Express broadcasts job status tracking directly to the Next.js client via Redis Pub/Sub events.

---

## 💡 Key Features & Enterprise Capabilities

### 1. Robust AI Generation & Parsing
Accurately respects difficulty, marks, and question types to deliver structured sections (e.g., Multiple Choice, Short Answer). The prompt pipeline forces strict JSON schemas out of the LLM, bypassing markdown blobs to render native UI components perfectly.

### 2. Idempotency Layer (Duplicate Protection)
Implemented an `X-Idempotency-Key` tracking system backed by Redis (`SET NX EX`). This strictly prevents duplicate assignment generation and redundant LLM API costs if a user double-clicks, refreshes, or encounters network retries.

### 3. Job Timeout, Fallback, & Stall Detection
LLM APIs can hang. We built a highly resilient backend:
- **Aborts & Timeouts**: Strict 30-second `AbortController` timeouts on LLM API calls.
- **Exponential Backoff**: BullMQ natively retries failed prompts across an exponential backoff sequence (e.g., 2s, 4s, 8s).
- **Graceful UI Recovery**: The UI dynamically detects the error, displays an optimistic `"Generation timed out. Retrying (1/3)..."` state via WebSockets, and attempts recovery in the background.

### 4. Micro-Regeneration (Individual Question Targeting)
Instead of throwing away an entire 50-question paper due to one bad question, users can regenerate *individual* questions.
- Powered by a dedicated, lightweight `question-regen-queue`.
- Uses targeted MongoDB nested array filters (`$set`) to atomically swap single questions without risking race conditions.
- Handled seamlessly on the frontend with inline optimistic loading spinners.

### 5. Bonus - PDF Export & Visuals
- A single-click Download PDF feature using `html2pdf.js`, perfectly retaining the original hierarchy, typography, and styling for standard A4 printing.
- Visually distinct difficulty tags and real-time loading percentage broadcasted through WebSockets.

---

## 🚀 Setup Instructions

### 1. Prerequisites
- **Node.js**: v18+
- **Database**: A MongoDB instance (Local or Atlas)
- **Redis**: A running Redis instance (Local or Upstash)
- **LLM Key**: A valid Groq API Key (or alternate LLM key set up via your `.env`)

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd vedaai-backend
```

Install dependencies:
```bash
npm install
```

Set up environment variables:
Create a `.env` file (copy from `.env.example` if available) and add:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=your_groq_api_key_here
ALLOWED_ORIGINS=http://localhost:3000
```

Start the development environment (runs the API Server, Generation Worker, and Question Regen Worker concurrently):
```bash
npm run dev
```

### 3. Frontend Setup
Navigate to the frontend directory:
```bash
cd ../vedaai-frontend
```

Install dependencies:
```bash
npm install
```

Set up your environment variables:
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

Start the development server:
```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.
