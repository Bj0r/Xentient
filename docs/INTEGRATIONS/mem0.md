# Mem0 Integration

> L2 Spec — Mem0 as primary memory layer with direct API fallback for basic mode. Implemented in Platform Track P2.

---

## What Mem0 Provides

Mem0 is a production-grade AI memory layer (53K GitHub stars, Apache 2.0). It provides everything the custom `memory/` directory reinvented, plus capabilities we would never have built ourselves.

- **Semantic memory:** Automatic fact extraction from conversations — no regex patterns needed
- **Recency weighting:** Recent memories rank higher in retrieval (solves context rot)
- **Entity resolution:** "David" and "Dave" = same person — automatic deduplication
- **Multi-level scoping:** User, session, agent, custom tags — maps directly to Xentient Spaces
- **Graph memory:** Neo4j-based relationship layer for complex entity relationships
- **Search:** Vector similarity + BM25 + entity fusion — multi-strategy retrieval
- **Versioning:** Memory history with audit trail — track how memories evolved over time

---

## Primary Path: Hermes Plugin

When Hermes is active, Mem0 is a first-class Hermes plugin. This is the default and recommended integration.

**Setup:**
```bash
hermes memory setup
# → Select "Mem0" from the list
# → Provide Mem0 API endpoint and credentials
# → Done. Hermes manages the integration.
```

**How it works:**
1. Xentient sends a message to Hermes via `HermesAdapter`
2. Hermes processes the message, invoking Mem0 for memory operations
3. Mem0 stores new facts, retrieves relevant memories, and provides context
4. Hermes returns the response (with memory-enriched context) to Xentient

Xentient doesn't interact with Mem0 directly in this path. Hermes is the orchestrator. Xentient just sends messages and receives responses.

**Advantages:**
- Zero additional adapter code — Hermes handles everything
- Full Mem0 feature set available (semantic extraction, graph memory, entity resolution)
- Consistent memory across Hermes skills, subagents, and Xentient conversations

---

## Fallback Path: Direct API

When Hermes is not available but memory is still desired, Xentient calls Mem0 directly via `Mem0Adapter`. This enables **basic mode with memory** — no full Hermes runtime needed.

### Adapter Contract

```typescript
interface Mem0Adapter {
  // Connection lifecycle
  connect(config: Mem0Config): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;

  // Core operations
  add(messages: Message[], scope: MemoryScope): Promise<void>;
  search(query: string, scope: MemoryScope): Promise<MemoryResult[]>;
  delete(memoryId: string): Promise<void>;
  getAll(scope: MemoryScope): Promise<MemoryResult[]>;

  // History
  getHistory(memoryId: string): Promise<MemoryEvent[]>;
}

interface Mem0Config {
  endpoint: string;         // Mem0 API URL: http://host:port or https://api.mem0.ai
  apiKey?: string;          // API key for cloud Mem0 (not needed for self-hosted)
  provider: "self-hosted" | "cloud";
}

interface MemoryScope {
  space_id?: string;        // Space-scoped facts
  user_id?: string;         // User-scoped facts (cross-Space)
  role?: string;            // Role-scoped facts
  // No tags = global facts
}
```

### When Fallback Activates

1. Hermes is unavailable (health check failure, not configured)
2. Space has `hermes+mem0` or `basic` as integration, but Hermes can't connect
3. Explicit configuration: `Mem0Adapter` configured as primary memory layer

### Fallback Behavior

- **Mem0 available, Hermes available:** Use Hermes plugin path (primary)
- **Mem0 available, Hermes unavailable:** Use direct API path (fallback)
- **Neither available:** Fall back to basic mode with no memory (simplest — always works)

---

## Space-Scoped Tags

How Mem0 multi-level scoping maps to Xentient Spaces:

| Mem0 Tag | Xentient Source | Example | Visibility |
|----------|----------------|---------|------------|
| `space_id` | `Space.id` | `"living-room"` | Only in that Space |
| `user_id` | `Space.userId` (config) | `"david"` | Shared across all Spaces for this user |
| `role` | `Space.role` | `"student"` | Activates in Spaces with matching role |
| _(none)_ | Global | — | Available everywhere |

### Tag Resolution at Runtime

Every Mem0 call includes the active Space's context as tags:

```typescript
// Writing a fact
mem0.add(
  [{ role: "user", content: "my name is David" }],
  { user_id: "david" }  // Stored as user-scoped
);

// Searching for facts in the study-desk space
mem0.search("what's my name?", {
  space_id: "study-desk",   // Space-scoped facts for study-desk
  user_id: "david",         // User-scoped facts (shared)
  role: "student"           // Role-scoped facts (activates here)
});
```

When a Space doesn't have a `role` configured, the `role` tag is omitted from the query — role-scoped facts don't leak into unroledd Spaces.

### Migration from MemoryDB

| Current (MemoryDB) | After (Mem0) |
|--------------------|--------------|
| Flat `facts` table, no scoping | Multi-level scoping with Space/User/Role/Global tags |
| Regex-based fact extraction (`FactExtractor`) | Semantic extraction (automatic, far more capable) |
| Manual injection before LLM (`MemoryInjector`) | Automatic context injection via Mem0 search |
| SQLite storage (`MemoryDB`) | Mem0 storage (vector DB + graph DB) |
| No recency weighting | Built-in recency weighting (context rot solved) |
| No entity resolution | Built-in entity resolution ("David" = "Dave") |

---

## Deployment

### Self-Hosted (recommended for privacy)

```bash
# Docker Compose
docker run -d \
  --name mem0 \
  -p 8050:8050 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  mem0/mem0:latest
```

- User data stays local on the server
- No external API calls (except to the configured LLM for embedding)
- Suitable for home/office deployments where privacy matters

### Cloud API (recommended for dev/testing)

```typescript
const mem0 = new Mem0Adapter({
  endpoint: "https://api.mem0.ai",
  apiKey: process.env.MEM0_API_KEY,
  provider: "cloud"
});
```

- Managed service, no Docker setup
- Higher latency but less operational overhead
- Suitable for development and multi-location access

---

## What It Replaces

Same as the Hermes integration — Mem0 replaces the custom memory system entirely:

| File | Action | LOC |
|------|--------|-----|
| `memory/MemoryDB.ts` | **DELETE** | ~80 LOC |
| `memory/FactExtractor.ts` | **DELETE** | ~60 LOC |
| `memory/MemoryInjector.ts` | **DELETE** | ~80 LOC |
| `memory/schema.ts` | **DELETE** | ~80 LOC |
| **Total deleted** | | **~300 LOC** |
| NEW: `adapters/Mem0Adapter.ts` | **CREATE** | ~30 LOC |

The `Mem0Adapter` is even thinner than `HermesAdapter` because it only handles the direct API fallback case. When Hermes is active, Mem0 is managed by Hermes — no Xentient code needed.

---

## Platform Track Mapping

**P2 (Mem0 Integration)** is the implementation phase. It depends on P1 (Hermes Adapter) being complete.

| Phase | Dependency | Notes |
|-------|------------|-------|
| P2: Mem0 Integration | P1 complete, Mem0 Docker running | This phase. Adds Mem0 as Hermes plugin + direct API fallback |
| P4: Space Manager | P3 complete | Uses Mem0 scoping tags for Space-aware memory |

---

*Cross-references: VISION.md (Mem0 integration details), SPACES.md (memory scoping model, Mem0 tag mapping), INTEGRATIONS/hermes.md (Hermes + Mem0 primary path)*