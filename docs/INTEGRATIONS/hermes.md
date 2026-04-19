# Hermes Agent Integration

> L2 Spec — Adapter contract for connecting Xentient to a Hermes Agent instance. Implemented in Platform Track P1.

---

## What Hermes Provides

Hermes is a full autonomous agent runtime (96K GitHub stars, MIT license, by Nous Research). It's not a library you call — it's a process you connect to.

- **LLM routing:** 18+ providers, OpenAI-compatible endpoints, Ollama for local models
- **3-layer memory:** Session context (L1) + SQLite+FTS5 persistent store (L2) + user model (L3)
- **Mem0 as plugin:** First-class integration — `hermes memory setup` → select Mem0 → done
- **118 bundled skills:** Auto-created, self-improving procedural memory
- **Home Assistant integration:** IoT-native — controls devices, reads sensors, triggers automations
- **Voice mode:** Built-in STT/TTS support
- **Subagent delegation:** Up to 3 concurrent isolated subagents
- **Cron scheduling:** Time-based triggers, recurring tasks
- **15+ messaging platforms:** Telegram, Discord, Slack, WhatsApp, Signal, Matrix, etc.
- **MCP integration:** Connect any MCP server

---

## How Xentient Connects

The `HermesAdapter` is a thin bridge between Xentient Core and the Hermes process:

1. Xentient Core sends text/audio to `HermesAdapter`
2. `HermesAdapter` translates Xentient's internal message format to Hermes API calls
3. Hermes handles LLM calls, memory, skills, tool dispatch
4. Xentient receives responses and routes them through the voice pipeline or LCD

The adapter does NOT embed Hermes. Hermes runs as a separate process. The adapter only manages the communication channel.

---

## API Surface

Hermes exposes two interfaces:

| Interface | Protocol | Use Case |
|-----------|----------|----------|
| REST API | HTTP/HTTPS | Tool calls, memory queries, skill invocation, configuration |
| WebSocket | WS/WSS | Streaming LLM responses, real-time audio, event subscriptions |

**Xentient adapter usage:**
- **WebSocket:** Used for streaming LLM responses (token-by-token to TTS) and real-time event subscriptions (skill results, memory updates)
- **REST:** Used for tool calls, memory queries, skill invocation, and health checks

### Adapter Contract

```typescript
interface HermesAdapter {
  // Connection lifecycle
  connect(config: HermesConfig): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;

  // Core operations
  chat(message: string, context: ChatContext): AsyncGenerator<string>;  // streaming
  invokeSkill(skillName: string, args: Record<string, unknown>): Promise<string>;
  queryMemory(query: string, scope: MemoryScope): Promise<MemoryResult[]>;
  storeMemory(fact: string, scope: MemoryScope): Promise<void>;

  // Configuration
  getAvailableSkills(): Promise<string[]>;
  getAvailableModels(): Promise<string[]>;
}

interface HermesConfig {
  endpoint: string;         // WebSocket URL: ws://host:port or wss://host:port
  restEndpoint: string;     // REST URL: http://host:port or https://host:port
  apiKey?: string;          // Optional API key if Hermes is configured with auth
  defaultModel?: string;    // Override default LLM model
}
```

---

## Deployment

Hermes runs as a process on the server (local computer or cloud). Xentient doesn't care where the brain runs — it just needs a connection.

### Local Setup (recommended for privacy)

- Hermes Agent installed on a Raspberry Pi or desktop computer on the same LAN
- `HermesAdapter` connects over `ws://localhost:<port>` or `ws://<lan-ip>:<port>`
- Mem0 runs as a Docker container on the same host
- All data stays local — no cloud dependency

### Cloud Setup (recommended for dev/testing)

- Hermes Agent deployed on a cloud VPS
- `HermesAdapter` connects over `wss://<cloud-host>:<port>` (TLS required)
- Higher latency, but more compute power available
- Suitable for development and multi-location access

### Health Check Protocol

The adapter performs periodic health checks (every 30 seconds):
1. `GET /health` → expects `200 OK` with `{status: "ok"}`
2. If health check fails 3 times consecutively → trigger fallback to basic mode
3. When health check passes again → automatically reconnect to Hermes

---

## Fallback Behavior

When Hermes is unavailable, Xentient falls back to **basic mode**:

- **Direct LLM provider call** — no memory, no skills, no multi-step reasoning
- The `basic-llm` handler is always available (see PACKS.md handler enum)
- The terminal **never bricks** because the brain is offline
- LCD shows a degraded-mode indicator: `(~_~) basic`

Fallback triggers:
1. Hermes health check fails 3 times consecutively
2. Hermes WebSocket disconnects unexpectedly
3. Hermes returns a fatal error (not transient)
4. Space has `basic` as the only integration

When Hermes becomes available again, the adapter automatically reconnects and the Space returns to full integration mode. No manual intervention required.

---

## What It Replaces

Integrating Hermes replaces the entire custom memory system:

| File | Action | LOC |
|------|--------|-----|
| `memory/MemoryDB.ts` | **DELETE** | ~80 LOC |
| `memory/FactExtractor.ts` | **DELETE** | ~60 LOC |
| `memory/MemoryInjector.ts` | **DELETE** | ~80 LOC |
| `memory/schema.ts` | **DELETE** | ~80 LOC |
| **Total deleted** | | **~300 LOC** |
| NEW: `adapters/HermesAdapter.ts` | **CREATE** | ~80 LOC |

Net change: **-220 LOC** of custom code replaced by a thin adapter that delegates to a production-grade agent runtime with months of built-in capability.

The `memory/` directory is deleted wholesale. Mem0 (as a Hermes plugin or direct fallback) handles all memory operations. The custom code that reinvented semantic extraction, fact management, and context injection is no longer needed.

---

## Platform Track Mapping

**P1 (Hermes Adapter)** is the implementation phase. It is the first Platform Track phase because all other integrations (Mem0, OpenClaw, Archon) depend on the adapter architecture being established.

| Phase | Dependency | Notes |
|-------|------------|-------|
| P1: Hermes Adapter | Hermes Agent installed on server | This phase. Creates adapter + deletes memory/ |
| P2: Mem0 Integration | P1 complete, Mem0 Docker running | Adds Mem0 as Hermes plugin + direct API fallback |
| P5: Pack Loader v2 | P1 + P4 complete | Extends pack handler types for Hermes tools |

---

*Cross-references: VISION.md (Hermes integration details, three-tier architecture), SPACES.md (Integration type, fallback behavior), PACKS.md (handler enum, basic-llm fallback), INTEGRATIONS/mem0.md (Mem0 as Hermes plugin)*