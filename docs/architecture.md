# BeautyIQ Revenue System™ — Architecture

## Overview
BeautyIQ is an AI-native revenue operating system for Shopify skincare & beauty brands. It uses a modular event-driven architecture with a single LangGraph-based AI orchestrator.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Shopify Store                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Products  │  │  Carts   │  │ Checkouts│  │ Orders  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │              │              │              │      │
└───────┼──────────────┼──────────────┼──────────────┼──────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────────┐
│                 Shopify Webhooks                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Webhook Handler (HMAC verification)               │  │
│  └────────────────────┬───────────────────────────────┘  │
│                        │                                  │
│                        ▼                                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │           Event Ingestor                           │  │
│  └────────────────────┬───────────────────────────────┘  │
└───────────────────────┼──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│              Core Platform                               │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │   Event Bus      │  │     Knowledge Graph          │  │
│  │  (Event-Driven)  │  │  (Ingredients, Products,     │  │
│  │                  │  │   Skin Types, Routines)      │  │
│  └────────┬─────────┘  └─────────────┬────────────────┘  │
│           │                          │                   │
│           ▼                          ▼                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │           LangGraph Orchestrator                   │  │
│  │  (Router → Execute → Aggregate)                    │  │
│  └───────┬──────┬──────┬──────┬──────┬──────┬─────────┘  │
│          │      │      │      │      │      │            │
│          ▼      ▼      ▼      ▼      ▼      ▼            │
│  ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌────────┐     │
│  │ Rec  ││Supp  ││Up-   ││Recov-││Cont- ││Analyt- │     │
│  │ omm  ││ ort  ││ sell ││ ery  ││ ent  ││ ics    │     │
│  └──────┘└──────┘└──────┘└──────┘└──────┘└────────┘     │
│                                                          │
│  ┌────────────────┐  ┌──────────────────────────────┐   │
│  │   RAG System    │  │  Product + Event Store       │   │
│  │  (Vector Store) │  │  (PostgreSQL + pgvector)     │   │
│  └────────────────┘  └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│                REST API Layer                            │
│  /recommend  /support  /upsell  /recover-cart  /analytics│
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│            Shopify Embedded App (React)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Dashboard   │  │ Beauty       │  │ Routine        │  │
│  │  (Analytics) │  │ Advisor Chat │  │ Builder        │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Core Principles

### Single Brain Principle
All AI decisions flow through the LangGraph orchestrator. No module makes independent AI calls. Modules are stateless handlers that receive state and return state.

### Event-Driven Architecture
- Shopify webhooks → Event Ingestor → Event Bus → Orchestrator
- Internal events trigger module execution
- All events are stored for analytics and replay

### Knowledge Graph → RAG Pipeline
1. Knowledge Graph handles structured relationships (ingredient→product, product→routine)
2. RAG handles semantic search (FAQs, product descriptions, ingredient info)
3. Orchestrator combines both for context-rich decisions

## Tech Stack
- **Runtime**: Node.js 20+ (TypeScript)
- **Orchestrator**: LangGraph (custom implementation)
- **Database**: PostgreSQL 16 + pgvector
- **Vector Store**: Pinecone / Weaviate / In-memory
- **Embeddings**: OpenAI text-embedding-3-small / Cohere
- **Frontend**: React + Shopify App Bridge
- **Auth**: Shopify OAuth
- **Infra**: Docker + Docker Compose
