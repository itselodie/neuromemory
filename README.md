# 🧠 NeuroMemory

> **An autonomous 3-tier cognitive memory architecture for AI
> assistants.**

NeuroMemory is an experimental AI memory engine designed to give an
assistant more persistent and structured memory than a simple chat
history.

Instead of treating every conversation as isolated context, NeuroMemory
organizes information into different memory layers and uses an
autonomous cycle to store, recall, reflect on, and consolidate
information over time.

## ✨ What makes NeuroMemory different?

Most AI chat applications rely heavily on the current conversation
window. NeuroMemory explores a different approach:

**Conversation → Working Memory → Reflection → Semantic Memory**

The goal is to make memory a process rather than just a database lookup.

### 🧩 Three-Tier Cognitive Memory

  -----------------------------------------------------------------------
  Layer                               Purpose
  ----------------------------------- -----------------------------------
  🧠 **Working Memory**               Stores recent and active
                                      conversation context

  ⚡ **Reflection Memory**            Captures recurring patterns,
                                      insights, and useful reflections

  💎 **Semantic Memory**              Stores consolidated knowledge and
                                      longer-term concepts
  -----------------------------------------------------------------------

NeuroMemory also includes a **Sleep Cycle** concept for background
consolidation and a **Timeline & Debug** interface for observing how
information moves through the system.

## 🚀 Features

-   💬 **Context-aware AI chat**
-   🧠 **Working Memory retrieval**
-   ⚡ **Reflection Memory**
-   💎 **Semantic Memory**
-   🔄 **Autonomous memory consolidation**
-   🌙 **Sleep Cycle simulation**
-   🕒 **Memory timeline and debugging**
-   📊 **Memory inspection panels**
-   🗄️ **Persistent database-backed memory**
-   ☁️ **Production deployment on Vercel**
-   🤖 **Gemini-powered AI responses**

## 🏗️ Architecture

``` text
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Next.js App      │
                    │     Live Chat       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    /api/chat        │
                    │   Memory Orchestrator│
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │   Working   │ │ Reflection  │ │  Semantic   │
        │   Memory    │ │   Memory    │ │   Memory    │
        └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
               │               │               │
               └───────────────┼───────────────┘
                               ▼
                    ┌─────────────────────┐
                    │      Prisma         │
                    │      ORM            │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │     CockroachDB     │
                    │   Persistent Store  │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Gemini API        │
                    │   AI Generation     │
                    └─────────────────────┘
```

## 🛠️ Tech Stack

-   **Frontend:** Next.js, React, Tailwind CSS
-   **Backend:** Next.js API Routes
-   **AI:** Google Gemini
-   **Database:** CockroachDB
-   **ORM:** Prisma
-   **Deployment:** Vercel
-   **Language:** TypeScript

## 📁 Project Structure

``` text
neuroMemory/
├── app/
│   ├── api/
│   │   └── chat/
│   ├── components/
│   └── ...
├── prisma/
│   └── schema.prisma
├── public/
├── package.json
├── .env.example
└── README.md
```

> The exact structure may evolve as the project develops.

## ⚙️ Getting Started

### 1. Clone the repository

``` bash
git clone https://github.com/itselodie/neuromemory.git
cd neuromemory
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file:

``` env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_COCKROACHDB_HOST:26257/defaultdb?sslmode=verify-full"

GEMINI_API_KEY="your_gemini_api_key"

GEMINI_MODEL="your_gemini_model"
```

**Never commit your real API keys or database credentials to GitHub.**

### 4. Generate Prisma Client

``` bash
npx prisma generate
```

### 5. Apply the database schema

``` bash
npx prisma db push
```

### 6. Run the development server

``` bash
npm run dev
```

Open:

``` text
http://localhost:3000
```

## 🌐 Deployment

NeuroMemory is designed to run in production using:

**Vercel + CockroachDB + Gemini**

For Vercel, configure the same environment variables under the
appropriate deployment environments:

``` text
DATABASE_URL
GEMINI_API_KEY
GEMINI_MODEL
```

Then deploy from the `master` branch.

## 🧠 Memory Flow

A simplified memory cycle looks like this:

``` text
User message
     │
     ▼
Working Memory
     │
     ▼
AI Response
     │
     ▼
Pattern / Insight Detection
     │
     ▼
Reflection Memory
     │
     ▼
Consolidation
     │
     ▼
Semantic Memory
```

This allows the system to move beyond simply remembering the previous
message and toward building a structured representation of information
across interactions.

## 🔬 Why NeuroMemory?

Human memory is not a single undifferentiated storage system.

We remember:

-   what we are currently thinking about,
-   recurring experiences and patterns,
-   and consolidated knowledge.

NeuroMemory explores whether a similar layered architecture can make AI
assistants more context-aware and persistent.

The project is an experiment in **agentic memory architecture**,
combining AI reasoning with structured persistent memory.

## 🧪 Current Status

**Prototype → Production-deployed**

Currently implemented:

-   [x] AI chat interface
-   [x] Persistent Working Memory
-   [x] Reflection Memory architecture
-   [x] Semantic Memory architecture
-   [x] Database persistence
-   [x] Memory retrieval
-   [x] Memory inspection UI
-   [x] Sleep Cycle interface
-   [x] Timeline & Debug interface
-   [x] Production deployment

Future improvements:

-   [ ] More advanced memory promotion policies
-   [ ] Improved semantic retrieval
-   [ ] Embedding-based memory search
-   [ ] Automated background consolidation
-   [ ] Memory importance scoring
-   [ ] Long-term evaluation and benchmarking

## 🎯 Hackathon Context

NeuroMemory was built as an exploration of **agentic memory** and
persistent AI systems, with a focus on creating an architecture where an
AI agent can decide what information should remain active, what should
become a reflection, and what should eventually become consolidated
knowledge.

## 👩‍💻 Author

**Hira Fatima**\
Computer Engineering student • AI/ML builder • Research enthusiast •
Poet

GitHub: [@itselodie](https://github.com/itselodie)

------------------------------------------------------------------------

### ⭐ If you find the idea interesting, consider starring the repository!
