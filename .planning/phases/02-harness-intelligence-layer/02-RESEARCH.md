# Phase 2: Harness & Intelligence Layer — Research

**Researched:** 2026-04-13
**Phase Goal:** Build the brain that processes audio, vision, and sensors.
**Requirements:** HARN-01, HARN-02, HARN-03, HARN-04, MEM-01, MEM-02, MEM-03

---

## 1. Pipeline Architecture — Archon-Inspired DAG Pattern

### Key Findings
Archon (coleam00) demonstrates the gold-standard for AI workflow orchestration:

- **YAML-defined DAG workflows** — Steps (nodes) are declared with explicit `depends_on` relationships
- **Node types**: `prompt` (AI), `command` (deterministic), `bash` (scripts), `loop` (iterate until condition), `approval` (human gate)
- **Artifact passing**: Outputs from one node flow to downstream nodes via `$nodeId.output` variable substitution
- **Isolated execution**: Each workflow runs in its own git worktree (parallel-safe)
- **Glass-box visibility**: Dashboard shows exactly what each step did

### Recommendation for Xentient Harness
Adopt a **simplified Archon-inspired DAG pattern** for the processing pipeline:

```
Trigger (MQTT/VAD) → STT Node → Memory Inject Node → LLM Node → TTS Node → Output (MQTT)
```

Each node is a **modular class** with typed input/output contracts. The pipeline definition is stored as a **JSON config** (not YAML — keep it Web App editable):

```json
{
  "pipeline": "voice-query",
  "nodes": [
    { "id": "stt", "type": "cloud-stt", "provider": "deepgram" },
    { "id": "memory", "type": "memory-inject", "depends_on": ["stt"] },
    { "id": "llm", "type": "cloud-llm", "provider": "gpt-4o", "depends_on": ["memory"] },
    { "id": "tts", "type": "cloud-tts", "provider": "elevenlabs", "depends_on": ["llm"] }
  ]
}
```

### Node.js Implementation Pattern
Use **Node.js Transform Streams** + **EventEmitter** for the pipeline:

```javascript
// Each pipeline stage is a Transform stream
inputStream
  .pipe(new STTProcessor(config))
  .pipe(new MemoryInjector(db))
  .pipe(new LLMProcessor(config))
  .pipe(new TTSProcessor(config))
  .pipe(outputStream);
```

**Key insight**: Use `.pipe()` for data flow and `EventEmitter` for lifecycle events (`pipelineStarted`, `error`, `complete`). This gives us Archon-style modularity without over-engineering.

---

## 2. Audio Transport — CRITICAL PIVOT

### ⚠️ Finding: MQTT is NOT Suitable for Audio Streaming

Research strongly indicates that **MQTT is poorly suited for real-time audio**:

- MQTT is designed for small, discrete messages — not continuous high-bandwidth streams
- Broker relay adds unpredictable latency (jitter)
- QoS 1 retries cause massive latency spikes and out-of-order delivery
- No native buffering/packet-ordering for audio continuity

### Recommended Transport Strategy (Dual-Protocol)

| Data Type | Protocol | Rationale |
|-----------|----------|-----------|
| **Audio chunks** | **WebSocket** (binary frames) | Full-duplex, low-latency, designed for streaming |
| **Sensor telemetry** (temp/hum) | **MQTT** QoS 0 | Perfect fit — small, infrequent, fire-and-forget |
| **Camera frames** (JPEG) | **WebSocket** or HTTP POST | Binary, bursty — MQTT overhead not justified |
| **Control commands** | **MQTT** QoS 1 | Small, reliable delivery required |
| **Heartbeat/Status** | **MQTT** QoS 0 | Lightweight, periodic |
| **VAD events** | **MQTT** QoS 1 | Small JSON, critical timing signal |

### ESP32 Implications
- ESP32 supports WebSocket clients natively (via `WebSocketsClient` Arduino library)
- Audio path: ESP32 → **WebSocket** → Harness (STT pipeline)
- Sensor/control path: ESP32 → **MQTT** → Harness / Web App
- This is a **hybrid architecture**: WebSocket for media, MQTT for IoT telemetry

---

## 3. STT/TTS Provider Stack

### Research Consensus

| Stage | Provider | Latency | Why |
|-------|----------|---------|-----|
| **STT** | **Deepgram** | <300ms streaming | Best accuracy in noisy/real-world conditions, WebSocket native |
| **STT Fallback** | **OpenAI Whisper API** | ~1-2s batch | Higher accuracy for long utterances, REST-based |
| **TTS** | **ElevenLabs Flash v2.5** | ~75ms model inference | Optimized for real-time agents, natural voice |
| **TTS Fallback** | **Google Cloud TTS** | ~200ms | Reliable, many languages, lower cost |

### Streaming Architecture (Critical for Latency)
The "sandwich" pattern for <700ms end-to-end:

```
User speaks → WebSocket → Deepgram (streaming STT) 
    → partial transcript → LLM (streaming tokens)
    → partial text → ElevenLabs (streaming TTS)
    → audio chunks → WebSocket → ESP32 speaker
```

**Key**: Each stage starts processing as soon as partial data arrives. Never wait for a complete response before starting the next stage.

### Provider Abstraction
All providers must be behind a common interface:

```typescript
interface STTProvider {
  transcribe(audioStream: ReadableStream): AsyncIterable<TranscriptChunk>;
}

interface TTSProvider {
  synthesize(text: string): ReadableStream<AudioChunk>;
}

interface LLMProvider {
  complete(messages: Message[], context: MemoryContext): AsyncIterable<string>;
}
```

This enables hot-swapping (Deepgram → Whisper, ElevenLabs → Google TTS) via config.

---

## 4. Memory Layer — Hermes-Agent Pattern

### Architecture (from Nous Research)

**Three-Tier Memory:**

| Tier | Storage | Purpose | Access Speed |
|------|---------|---------|-------------|
| **Tier 1: Always-Loaded** | Markdown files (`USER.md`, `MEMORY.md`) | Core user profile, learned preferences | Instant (loaded at boot) |
| **Tier 2: Searchable Archive** | SQLite + FTS5 | Full conversation history, extracted facts | <1ms via FTS5 MATCH |
| **Tier 3: Semantic (V2)** | Vector embeddings (optional) | Concept-level retrieval | ~10ms |

### Implementation with `better-sqlite3`

```javascript
const Database = require('better-sqlite3');
const db = new Database('xentient_memory.db');

// Episodic memory (conversation turns)
db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS episodes USING fts5(
  role,          -- 'user' or 'assistant'
  content,       -- the actual message
  session_id UNINDEXED,
  timestamp UNINDEXED
)`);

// Semantic memory (extracted facts)
db.exec(`CREATE TABLE IF NOT EXISTS facts (
  id INTEGER PRIMARY KEY,
  category TEXT,  -- 'name', 'preference', 'routine'
  key TEXT,
  value TEXT,
  confidence REAL DEFAULT 0.8,
  updated_at TEXT
)`);
```

### Proactive Retrieval (The "Thinking" Step)
Before each LLM call:

1. **Extract keywords** from user's current utterance
2. **FTS5 MATCH** against episode history → retrieve relevant past conversations
3. **Fact lookup** from semantic memory → inject known user info
4. **LLM reviews** retrieved memories and decides which are relevant (not blind RAG)
5. **Inject** filtered context into system prompt

```javascript
async function buildContextWithMemory(userMessage, db) {
  // Step 1: Keyword extraction
  const keywords = extractKeywords(userMessage);
  
  // Step 2: FTS5 search
  const episodes = db.prepare(
    'SELECT * FROM episodes WHERE episodes MATCH ? ORDER BY rank LIMIT 5'
  ).all(keywords.join(' OR '));
  
  // Step 3: Fact lookup
  const facts = db.prepare('SELECT * FROM facts').all();
  
  // Step 4: Build augmented prompt
  return {
    systemPrompt: buildSystemPrompt(facts),
    conversationHistory: episodes,
    currentMessage: userMessage
  };
}
```

### Cross-Session Persistence
- On first interaction after restart: query `facts` table for user name → personalized greeting
- `USER.md` file acts as a "frozen snapshot" loaded into every session's system prompt
- Periodic "consolidation" step: LLM reviews recent episodes and extracts new facts

---

## 5. NPM Package Recommendations

| Purpose | Package | Version | Confidence |
|---------|---------|---------|-----------|
| MQTT Client | `mqtt` | ^5.x | ✅ High — industry standard |
| WebSocket Server | `ws` | ^8.x | ✅ High — fastest Node.js WS |
| SQLite | `better-sqlite3` | ^11.x | ✅ High — bundled FTS5, sync API |
| Deepgram SDK | `@deepgram/sdk` | ^3.x | ✅ High — streaming STT |
| ElevenLabs SDK | `elevenlabs` | ^1.x | ✅ High — streaming TTS |
| OpenAI SDK | `openai` | ^4.x | ✅ High — GPT-4o streaming |
| Anthropic SDK | `@anthropic-ai/sdk` | ^0.x | ✅ High — Claude streaming |
| Google GenAI | `@google/generative-ai` | ^0.x | ✅ High — Gemini streaming |
| Config Management | `dotenv` | ^16.x | ✅ Standard |
| Logging | `pino` | ^9.x | ✅ High perf structured logging |

---

## 6. Pitfalls & Anti-Patterns

### 🚫 Don't: Stream raw PCM audio over MQTT
**Do**: Use WebSocket for audio, MQTT for telemetry/control.

### 🚫 Don't: Wait for complete STT transcript before calling LLM
**Do**: Use streaming STT (Deepgram) and pipe partial transcripts to LLM immediately.

### 🚫 Don't: Dump all memory into the LLM context
**Do**: Use the "thinking step" — LLM reviews retrieved memories and selects relevant ones.

### 🚫 Don't: Hard-code provider choices
**Do**: Use provider interfaces so switching Deepgram → Whisper is a config change.

### 🚫 Don't: Block the Node.js event loop with SQLite operations
**Do**: `better-sqlite3` is sync but fast (<1ms for FTS5 queries). For bulk operations, use Worker Threads.

### 🚫 Don't: Over-engineer the DAG engine for V1
**Do**: Start with a simple linear pipeline (Transform streams). DAG branching is a V2 feature.

---

## 7. Validation Architecture

### Must-Verify Before Phase Complete

| Criterion | How to Verify |
|-----------|--------------|
| Audio round-trip works | Send PCM chunk via WebSocket → receive TTS audio back |
| STT produces transcript | Log Deepgram output for a test utterance |
| LLM generates response | Verify GPT-4o returns text from transcript |
| TTS produces audio | Verify ElevenLabs returns audio buffer |
| Memory persists across restart | Store fact, restart process, verify fact retrieved |
| Proactive recall modifies prompt | Log system prompt — verify memory context injected |
| Provider swap works | Switch STT from Deepgram to Whisper via config — verify still functions |

---

## RESEARCH COMPLETE

Key decisions surfaced:
1. **Dual-protocol transport** (WebSocket for media, MQTT for telemetry) — major architectural refinement
2. **Deepgram + ElevenLabs** as primary STT/TTS stack for lowest latency
3. **Archon-inspired linear pipeline** using Node.js Transform streams
4. **better-sqlite3 + FTS5** for Hermes memory with proactive "thinking step"
5. **Provider abstraction interfaces** for hot-swappable AI backends

---
*Research completed: 2026-04-13*
