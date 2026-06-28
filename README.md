<div align="center">

<h1>
  <img src="./public/WhatsAgent.png-Green.png" alt="WhatsAgent Logo" width="48" align="center">
  WhatsAgent
</h1>

[![React](https://img.shields.io/badge/React-Frontend-61DAFB.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688.svg)]()
[![LangGraph](https://img.shields.io/badge/LangGraph-Agentic%20RAG-FF9900.svg)]()
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E.svg)]()
[![Groq](https://img.shields.io/badge/Groq-LLaMA%203.1-F55036.svg)]()
[![Gemini](https://img.shields.io/badge/Gemini-Embeddings-4285F4.svg)]()
[![Evolution API](https://img.shields.io/badge/Evolution%20API-WhatsApp%20Engine-25D366.svg)]()
[![Vercel](https://img.shields.io/badge/Vercel-Frontend%20Deploy-000000.svg)]()
[![HuggingFace](https://img.shields.io/badge/Hugging%20Face-Backend%20Deploy-FFD21E.svg)]()

**Transform your business WhatsApp into an intelligent, automated support engine powered by live Google Docs**
<br>
<br>
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Try%20WhatsAgent-111827?style=for-the-badge&logo=vercel&logoColor=white)](https://whats-agent-phi.vercel.app/home)

🔗 [https://whats-agent-phi.vercel.app](https://whats-agent-phi.vercel.app)

</div>

---

## 🛑 The Problem

Businesses lose customers every day due to delayed responses. Traditional chatbot systems attempt to solve this, but they rely on rigid, frustrating decision trees.

Standard Retrieval-Augmented Generation (RAG) systems are an improvement, but they lack reasoning. A standard RAG simply searches a vector database, dumps the nearest chunks into a prompt, and relies on the LLM to figure it out. This leads to high latency, expensive token costs, hallucinated responses when data is missing, and an inability to handle conversational nuances like follow-up questions or pleasantries.

## 🚀 Introducing WhatsAgent

WhatsAgent is not just another wrapper around an LLM. It is an **Agentic RAG** system built specifically for WhatsApp business support. By utilizing LangGraph, the system acts as a stateful, reasoning agent that dynamically routes queries, manages conversation memory, and optimizes retrieval strategies based on the *intent* of the user, ensuring instant, accurate, and context-aware replies.

---

### Main Components

| Component | Purpose |
| --- | --- |
| **React + Vite** | Frontend UI and user dashboard |
| **FastAPI** | Backend API, graph orchestration, and webhook handling |
| **LangGraph** | Agentic workflow, state management, and query routing |
| **Supabase (PostgreSQL)** | Vector storage (pgvector), auth, and conversation memory |
| **Groq (LLaMA 3.1 8B)** | Lightning-fast answer generation and intent classification |
| **Google Gemini (gemini-embedding-001)** | Dense vector embeddings for document chunks |
| **Evolution API** | WhatsApp Web instance management and messaging engine |
| **Google Drive API** | Live document fetching and synchronization |

---

## 🧠 Agentic Architecture

```mermaid
graph TD
    A[Incoming WhatsApp Message] --> B(Load Memory State)
    B --> C(Classify Intent)
    C --> D(Dynamic Retrieval)
    D --> E(Select Context)
    E --> F{Routing Agent}
    F -->|Pleasantry / Greeting| G(Greet Back)
    F -->|Missing Data| H(Fallback)
    F -->|Complex / Broad Query| I(Generate Answer - Groq)
    G --> J(Save State & Reply)
    H --> J
    I --> J
    
    style F fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff
    style G fill:#10b981,stroke:#064e3b,color:#fff
    style H fill:#ef4444,stroke:#7f1d1d,color:#fff
    style I fill:#f59e0b,stroke:#78350f,color:#fff

```

What makes this system "Agentic" rather than "Standard" is its state-driven graph architecture. Every message passes through a series of intelligent nodes:

1. **Memory Node (`load_memory`):** Injects the last 5 messages and recent topic context into the current state.
2. **Intent Classification Node (`classify_intent`):** Analyzes the query to determine if it is a `broad` question, a `followup`, or a specific query (e.g., `location`, `pricing`).
3. **Dynamic Retrieval Node (`retrieve`):** Adjusts the top-K chunks dynamically. For a `broad` query, it fetches up to 10 chunks to summarize a list. For a highly specific narrow question, it fetches 4.
4. **Context Selection Node (`select_context`):** Analyzes similarity thresholds and keyword scores to discard irrelevant chunks before they ever reach the LLM.
5. **The Routing Agent**

* **Fallback Node (Pleasantry / Out of Scope):** This node acts as an intelligent traffic filter to keep the conversational experience feeling natural while strictly protecting the boundaries of your business knowledge. It handles two distinct scenarios:
    
    * *Greetings & Simple Pleasantries:* If the user sends a simple greeting or acknowledgment (e.g., *"Hi"* or *"Thank you"*), the system recognizes this instantly. Instead of coldly rejecting the message with a missing-data notice, it replies with a human-like greeting.
    
    * *Out-of-Scope Questions:* If a user asks a general knowledge trivia question, requests an out-of-bounds topic (e.g., *"How do rockets work?"*), or makes an entirely unrelated statement, the agent cleanly traps the request. It completely bypasses the LLM generator to avoid hallucinations and outputs a polite refusal message and the query is then cleanly marked as unanswered on your dashboard.

* **Generation Node (Valid Business Query):** For any legitimate inbound query regarding your explicit business operations (such as class schedules, price structures, branches, or course options), the agent skips the fallback mechanics entirely. It forwards the dense, curated context chunks straight to the Groq LLaMA 3.1 8B engine to generate a highly personalized, context-aware, and natural response in real-time.

<img src="./public/screenshots/Greetings vs OOS vs Valid-2.png" alt="Placeholder">


## ⚡ Engineering Highlights

### Dual LLM Engine

To balance cost, rate limits, and latency, the system splits responsibilities across two distinct AI providers:

* **Google Gemini (gemini-embedding-001):** Utilized exclusively for generating 768-dimensional dense vector embeddings during document ingestion and search.
* **Groq (LLaMA 3.1 8B):** Handing answer generation. Because Groq runs on specialized LPU hardware, responses are generated in milliseconds, allowing the bot to reply to customers in real-time.

### Google Docs over Static PDFs

Instead of requiring businesses to upload static PDFs, WhatsAgent ingests a live Google Document. Businesses constantly update prices, policies, and offers. By using a public Google Doc URL, owners can seamlessly edit their knowledge base natively in Google Docs, click "Update" on the WhatsAgent dashboard, and instantly sync the new structured vectors into the database.

<img src="./public/screenshots/Google DOCS-1.png" alt="Placeholder">

### Contextual Memory & Follow-ups

Standard RAGs fail when a user asks, "Is he a good lecturer" because the query lacks keywords. WhatsAgent saves the conversation state.

* *Example Flow:*<br>

  <img src="./public/screenshots/He.png" alt="Placeholder" width="850">
  
* *Agentic Action:* The `load_memory` node injects the "Maths Class/Rizlan Hassan" context, allowing the retriever to search for "Experience and Rating of Rizlan" without the user explicitly stating who is "he".

---

## 🛠 Core Features

### 1. Linking WhatsApp via Evolution API

Connecting a bot to WhatsApp usually requires Meta's Cloud API, which restricts access to verified business portfolios. Because this is an MVP, WhatsAgent integrates the **Evolution API (Baileys)**. Users simply scan a QR code from the dashboard to link their standard WhatsApp number as an official "Linked Device."
*(Note: For enterprise deployment, this module can be swapped to Meta's embedded signup co-existence flow).*

  <img src="./public/screenshots/Whatsapp Linked.png" alt="Placeholder" width="850">

### 2. Unanswered Query Tracking
AI shouldn't trap customers. If a customer asks a question that isn't covered in your Google Doc, the bot won't hallucinate an answer; it politely defers and marks the chat as "unanswered." Similarly, if an owner spots a high-value customer or a sensitive issue, they can use the "Pause Bot" toggle to temporarily halt the AI and take over manually.

  <img src="./public/screenshots/Unanswered-1.png" alt="Placeholder" width="850">

### 3. Instant Knowledge Updates
WhatsAgent adapts to your business in real-time. If you check your dashboard and notice the bot missing specific questions you can fix the blind spot instantly. Simply type the missing details into your connected Google Doc and click the update button on your dashboard. The system will dynamically re-embed the new vectors.

  <img src="./public/screenshots/Knowledge update.png" alt="Placeholder" width="850">

---

ⓘ Note

* **Repository Scope:** This public repository contains only the frontend codebase for demonstration purposes. To protect proprietary AI routing logic and ensure system security, the core Agentic RAG backend architecture is maintained in a separate private repository.
  
* **Live Demo Cold Starts:** The backend and Evolution API services are hosted on Render's free tier, which automatically spins down after periods of inactivity. If you are testing the live demo, please allow **2-3 minutes** for the initial QR code to generate and for the bot to reply to your very first message while the servers "wake up." All subsequent replies will be instant.

---

<div align="center">
  <h2>Contact Me</h2>
  <p>Have inquiries or feedback? Feel free to reach out!</p>
  
  <a href="https://mail.google.com/mail/?view=cm&fs=1&to=abdlraheem26@gmail.com&su=Inquiry%20regarding%20WhatsAgent" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/Email-abdlraheem26%40gmail.com-005bb5?style=for-the-badge&logo=gmail&logoColor=white" alt="Email Abdul Raheem" />
  </a>
</div>

---
