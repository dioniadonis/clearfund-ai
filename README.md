# ClearFund AI

A full-stack business funding platform for contractors. It has public lead-capture flows, an admin CRM, an agent portal, and a worker API that outside automation workers and AI assistants use to source and enrich leads.

## Highlights

- **One app, two brands.** Hostname-based site selection (`src/lib/site.ts`) serves two branded homepages from one codebase that shares a back office.
- **Security-first data access.** Postgres Row Level Security, plus security-definer functions for every sensitive read and write. Agents only see field-limited, assigned leads, and the public share links never expose contact data.
- **Atomic lead pipeline.** All lead writes go through one dedupe chokepoint (`crm_insert_lead`) backed by unique indexes. Database triggers handle CRM auto-feed and stage logging.
- **Worker API.** External workers authenticate with per-worker keys and claim, complete and write back jobs through service-role SQL functions, so every worker follows identical rules.
- **AI integrations.**
  - An MCP server with OAuth caller-scoped clients gives AI assistants read-only CRM access.
  - LLM-written audit reports: the server computes every number, and the model only writes the prose.
  - Voice-agent (Retell) webhooks for callbacks.
- **ClearFund Claim List (in progress).** An AI tool that turns photos and voice notes into an itemized insurance contents claim, exported as PDF or XLSX.

## Stack

React · TypeScript · Vite · Tailwind · shadcn/ui · TanStack Query · Supabase (Postgres, RLS, Edge Functions/Deno) · Drizzle migrations · Bun test

## Project layout

```
src/                 React app (pages, CRM, operator console, shared lib)
supabase/functions/  Edge functions (worker-api, mcp, email-events, submit-*, …)
drizzle/migrations/  SQL schema and RLS policies
tools/file-worker/   Standalone automation worker
tests/               Unit tests for scoring, routing and site rules
```

## Running locally

```sh
npm install
npm run dev
```

Copy `.env` and point it at your own Supabase project. Server secrets (service role key, worker keys) live in Supabase function secrets, never in this repo.
