# 🧠 NeuroMemory

> **An autonomous cognitive memory architecture for persistent AI assistants.**

NeuroMemory is an experimental AI memory system designed to give AI assistants structured, persistent memory instead of relying only on a temporary conversation window.

Rather than treating every interaction as isolated chat history, NeuroMemory organizes information into multiple memory layers and provides a cognitive cycle for storing, promoting, reflecting on, and consolidating information over time.

---

## ✨ What Makes NeuroMemory Different?

Most AI chat applications primarily rely on the current conversation context.

NeuroMemory explores a different approach:

```text
Conversation
     ↓
Working Memory
     ↓
Episodic Memory
     ↓
Reflection Memory
     ↓
Semantic Memory
     ↓
Long-term Consolidated Knowledge
```

The goal is to make memory a **process**, rather than simply a database lookup.

---

# 🧠 Cognitive Memory Architecture

NeuroMemory uses multiple memory layers with different purposes.

| Memory Layer             | Purpose                                                 |
| ------------------------ | ------------------------------------------------------- |
| 🧠 **Working Memory**    | Stores recent and active conversation context           |
| ⚡ **Episodic Memory**    | Stores significant individual experiences and events    |
| 🔍 **Reflection Memory** | Captures recurring patterns, insights, and observations |
| 💎 **Semantic Memory**   | Stores consolidated concepts and longer-term knowledge  |
| 🗄️ **Archive Log**      | Maintains archived memory-related records               |

The system can automatically move information through the memory architecture using its cognitive cycle.

---

# 🔄 Autonomous Cognitive Cycle

NeuroMemory includes an automated three-stage cognitive cycle:

```text
┌──────────────────────┐
│   Working Memory     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Episodic Promotion  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Reflection Synthesis │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Semantic Consolidation│
└──────────────────────┘
```

The cycle is designed to transform short-term conversational information into increasingly consolidated representations.

The system can automatically trigger this cycle after a configurable number of conversation turns.

---

# 🚀 Features

* 💬 Context-aware AI chat
* 🧠 Persistent Working Memory
* ⚡ Episodic Memory storage
* 🔍 Reflection Memory
* 💎 Semantic Memory
* 🔄 Autonomous memory consolidation
* 🌙 Sleep Cycle / cognitive-cycle interface
* 🕒 Memory timeline and debugging interface
* 📊 Memory inspection panels
* 🗄️ CockroachDB-backed persistence
* 🤖 Gemini-powered AI responses
* 🧩 MCP-based CockroachDB inspection during development
* ☁️ Vercel deployment
* 🔢 1536-dimensional embedding support for episodic memories
* 🛡️ Environment-variable based secret management

---

# 🏗️ Architecture

```text
                         ┌──────────────────┐
                         │      User        │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │    Next.js App   │
                         │   Chat Interface │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │    /api/chat     │
                         │ AI Orchestrator  │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
             ┌────────────┐ ┌────────────┐ ┌────────────┐
             │  Working   │ │ Reflection │ │  Semantic  │
             │  Memory    │ │  Memory    │ │  Memory    │
             └─────┬──────┘ └─────▲──────┘ └─────▲──────┘
                   │              │              │
                   ▼              │              │
             ┌────────────┐       │              │
             │  Episodic  │───────┘              │
             │  Memory    │                      │
             └─────┬──────┘                      │
                   │                             │
                   └──────────────┬──────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │     Prisma       │
                         │       ORM        │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   CockroachDB    │
                         │ Persistent Store │
                         └──────────────────┘

                                  │
                                  ▼
                         ┌──────────────────┐
                         │   Gemini API     │
                         │  AI Generation   │
                         └──────────────────┘
```

---

# 🗃️ CockroachDB Integration

CockroachDB acts as the persistent database layer for NeuroMemory.

The project currently contains dedicated tables for the different memory layers:

```text
working_memory
episodic_memory
reflection_memory
semantic_memory
archive_log
```

This allows different types of memory to be stored and inspected independently.

### CockroachDB is responsible for:

* Persistent memory storage
* Conversation history
* Episodic memory records
* Reflection records
* Semantic concepts
* Memory metadata
* Importance/significance scores
* Promotion state
* Memory timestamps

The project also supports vector embeddings for episodic memory, allowing the architecture to be extended toward embedding-based semantic retrieval.

---

# 🧩 CockroachDB MCP Integration

During development, NeuroMemory's CockroachDB database was connected to the **CockroachDB MCP server through Cursor**.

The MCP connection was used to inspect the live database and verify the memory architecture directly.

For example, the database was inspected to verify the presence of:

```text
archive_log
episodic_memory
reflection_memory
semantic_memory
working_memory
```

This made it possible to inspect the actual database structure and memory records while developing and debugging NeuroMemory.

> **Note:** The MCP configuration is a development tool and is not part of the NeuroMemory application runtime.

---

# 🤖 AI Layer

NeuroMemory uses Google Gemini for AI response generation.

The AI orchestrator:

1. Receives a user message.
2. Stores the user turn.
3. Retrieves available memory.
4. Builds a context-augmented prompt.
5. Sends the prompt to Gemini.
6. Stores the assistant response.
7. Triggers the cognitive memory cycle when the configured interval is reached.

The system therefore combines **LLM reasoning with structured persistent memory**.

---

# ☁️ AWS Integration

NeuroMemory includes an AWS Bedrock integration for embedding generation.

The Bedrock wrapper supports:

* Amazon Titan embedding models
* 1536-dimensional embeddings
* Normalized embedding vectors
* Runtime AWS credential configuration

For local development, the implementation also contains a deterministic embedding fallback when AWS credentials are unavailable.

This allows the application to continue running during development without requiring AWS credentials.

```text
Text
 │
 ▼
AWS Bedrock Embedding
 │
 ▼
1536-dimensional vector
 │
 ▼
Episodic Memory
```

---

# 🧠 Episodic Memory Pipeline

When a conversation turn is processed for episodic memory, NeuroMemory:

```text
Conversation Turn
       │
       ▼
Significance Scoring
       │
       ▼
Embedding Generation
       │
       ▼
Concept Tag Extraction
       │
       ▼
Episodic Memory Storage
```

Each episodic memory record can contain information such as:

* User ID
* Session ID
* Content
* Embedding
* Significance score
* Reinforcement count
* Concept tags
* Promotion state
* Creation timestamp
* Last-access timestamp
* Metadata

---

# 🔄 Chat Orchestration

The main chat flow is handled by the AI orchestrator.

```text
User Message
     │
     ▼
Process Conversation Turn
     │
     ▼
Retrieve Memory
     │
     ├── Working Memory
     ├── Reflection Memory
     └── Semantic Memory
     │
     ▼
Build Context Prompt
     │
     ▼
Gemini
     │
     ▼
Assistant Response
     │
     ▼
Save Assistant Turn
     │
     ▼
Cognitive Cycle
```

The orchestrator also returns safe metadata about recalled memory without exposing sensitive database information.

---

# 🌙 Cognitive "Sleep Cycle"

NeuroMemory includes a conceptual **Sleep Cycle** inspired by the idea that memory consolidation can occur outside immediate interaction.

Instead of requiring every memory transformation to happen during a single response, the architecture can run a cognitive cycle that processes accumulated information.

```text
Working Memory
      ↓
Episodic Memory
      ↓
Reflection Memory
      ↓
Semantic Memory
```

The cycle can be triggered automatically based on the number of conversation turns or manually when required.

---

# 🕒 Timeline & Debugging

NeuroMemory includes interfaces for observing the memory system.

These interfaces help visualize:

* Conversation events
* Memory records
* Memory promotion
* Cognitive cycles
* Stored concepts
* Debug information

This makes the internal memory architecture observable rather than treating it as a hidden process.

---

# 🛠️ Tech Stack

### Frontend

* Next.js
* React
* Tailwind CSS

### Backend

* Next.js API Routes
* TypeScript

### AI

* Google Gemini
* AWS Bedrock integration for embeddings

### Database

* CockroachDB
* PostgreSQL-compatible SQL

### ORM

* Prisma

### Developer Tools

* Cursor
* CockroachDB MCP

### Deployment

* Vercel

---

# 📁 Project Structure

```text
neuromemory/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── chat/
│   ├── lib/
│   │   ├── aiOrchestrator.ts
│   │   ├── cognitiveCycle.ts
│   │   ├── memoryManager.ts
│   │   ├── promotionEngine.ts
│   │   ├── reflectionEngine.ts
│   │   ├── semanticEngine.ts
│   │   ├── aws/
│   │   │   └── bedrock.ts
│   │   └── cockroach/
│   ├── services/
│   │   ├── episodicMemoryService.ts
│   │   └── episodicPipeline.ts
│   └── ...
├── prisma/
│   └── schema.prisma
├── public/
├── package.json
├── README.md
└── .env.example
```

> The project structure may evolve as development continues.

---

# ⚙️ Getting Started

## 1. Clone the repository

Clone the NeuroMemory repository from GitHub and enter the project directory.

```bash
git clone <repository-url>
cd neuromemory
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create a `.env.local` file containing the required credentials:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_COCKROACHDB_HOST:26257/defaultdb?sslmode=verify-full"

GEMINI_API_KEY="your_gemini_api_key"

GEMINI_MODEL="your_gemini_model"
```

If using AWS Bedrock embeddings, configure the required AWS environment variables as well:

```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
```

Never commit real API keys, AWS credentials, or database credentials to GitHub.

## 4. Generate Prisma Client

```bash
npx prisma generate
```

## 5. Apply the database schema

```bash
npx prisma db push
```

## 6. Start the development server

```bash
npm run dev
```

Then open the local application at:

```text
http://localhost:3000
```

---

# 🌐 Deployment

NeuroMemory is designed to run using:

```text
Vercel
   │
   ├── Next.js Application
   │
   ├── CockroachDB
   │
   └── Gemini API
```

The required environment variables should be configured in the Vercel project settings.

```text
DATABASE_URL
GEMINI_API_KEY
GEMINI_MODEL
```

AWS credentials and configuration should only be added if the deployed environment is intended to use the live Bedrock integration.

The application can then be deployed from the configured Git branch.

---

# 🔐 Security

NeuroMemory uses environment variables for external service credentials.

Sensitive information such as:

* Database passwords
* Gemini API keys
* AWS credentials
* MCP authentication headers

should **never be committed to the repository**.

The Cursor MCP configuration is intentionally kept outside the project repository.

---

# 🧪 Current Status

## Hackathon Prototype — Production Deployed

Currently implemented:

* ✅ AI chat interface
* ✅ Persistent Working Memory
* ✅ Episodic Memory architecture
* ✅ Reflection Memory architecture
* ✅ Semantic Memory architecture
* ✅ CockroachDB persistence
* ✅ Prisma database integration
* ✅ Memory retrieval
* ✅ Cognitive memory cycle
* ✅ Memory promotion pipeline
* ✅ Memory inspection UI
* ✅ Sleep Cycle interface
* ✅ Timeline & Debug interface
* ✅ Gemini-powered responses
* ✅ Vercel deployment
* ✅ CockroachDB MCP development integration
* ✅ AWS Bedrock embedding integration with local fallback

---

# 🔬 Why NeuroMemory?

Human memory is not a single undifferentiated storage system.

We remember:

* what we are currently thinking about,
* experiences that happened,
* recurring patterns,
* and consolidated knowledge.

NeuroMemory explores whether a similar layered architecture can make AI assistants more persistent and context-aware.

Instead of asking:

> "How much conversation history can an AI remember?"

NeuroMemory explores a different question:

> **"Can an AI decide what information deserves to become memory?"**

The project therefore treats memory as an **active cognitive process**, rather than simply storing every previous message.

---

# 🎯 Hackathon Context

NeuroMemory was built as an exploration of **agentic memory architecture** and persistent AI systems.

The architecture focuses on allowing an AI system to:

1. Maintain active conversational context.
2. Identify significant experiences.
3. Promote important information into episodic memory.
4. Generate reflections from accumulated experiences.
5. Consolidate recurring information into semantic memory.
6. Persist the resulting memory structure in CockroachDB.

The project combines:

**AI reasoning + agentic memory + persistent database infrastructure**

into one experimental architecture.

---

# 🚧 Future Improvements

Potential future work includes:

* More advanced memory promotion policies
* Improved semantic retrieval
* More sophisticated embedding-based search
* Automated background consolidation
* More advanced importance scoring
* Better long-term memory evaluation
* Memory forgetting and decay mechanisms
* Large-scale memory benchmarking
* More sophisticated reflection generation

---

# 👩‍💻 Author

**Hira Fatima**

Computer Engineering Student • AI/ML Builder • Research Enthusiast • Poet

GitHub: **@itselodie**

---

## ⭐ Support

If you find the NeuroMemory architecture interesting, consider starring the repository and exploring the implementation.

---

## 📜 License

This project is licensed under the **MIT License**.

Copyright © 2026 Hira Fatima.
