# Phase 2: Harness & Intelligence Layer - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning
**Source:** Synthesized from prior design sessions and specifications

<domain>
## Phase Boundary

This phase delivers the **Harness** — the central intelligence engine that sits between hardware (MQTT) and the user (Web App). It receives raw sensor data from the Node Base, orchestrates Cloud LLM processing, manages persistent memory, and returns actionable outputs (TTS audio, control commands).

This phase does NOT include:
- The Web App UI (Phase 3)
- Node Base firmware (Phase 1)
- Hardware assembly (Phase 3)

</domain>

<decisions>
## Implementation Decisions

### Architecture Pattern
- The Harness is an **n8n-inspired general-purpose execution engine**. It executes workflows (routing to streams, archives, LLMs, or webhooks) based on configurations.
- The Harness is a **Node.js application** that subscribes to MQTT topics and processes data through modular pipeline stages.
- Each "workflow" is a sequence of processing nodes: Trigger → Transform → Process → Output.

### Processing Pipeline (HARN-01)
- **Pipeline stages**: MQTT Ingestion → STT (Cloud API) → Memory Injection → LLM Reasoning → TTS Generation → MQTT Response.
- STT provider: **Google Cloud Speech-to-Text** or **OpenAI Whisper API** (Cloud, not local).
- TTS provider: **Google Cloud TTS** or **ElevenLabs API**.
- Audio format: **Raw PCM 16-bit mono 16kHz** from the Node Base (no encoding overhead on ESP32).

### LLM Integration (HARN-03)
- **Cloud APIs are mandatory for V1** — local LLMs (Ollama) are too slow for the required "snappy" experience.
- Supported providers: **GPT-4o**, **Claude Sonnet/Opus**, **Gemini 1.5 Pro/Flash**.
- The LLM receives: system prompt + memory-injected context + transcribed user speech.
- The LLM returns: text response → piped to TTS → audio published back via MQTT.

### MQTT Transport (HARN-02)
- Broker: **Mosquitto** running locally on the dev machine / Raspberry Pi.
- Topic structure:
  - `xentient/{node_id}/audio/chunk` — Raw PCM audio chunks from Node Base
  - `xentient/{node_id}/audio/vad` — VAD start/stop events
  - `xentient/{node_id}/sensors/env` — Temperature/Humidity readings
  - `xentient/{node_id}/camera/frame` — JPEG frames from ESP-CAM (via Node Base UART)
  - `xentient/{node_id}/control/tts` — TTS audio response back to Node Base
  - `xentient/{node_id}/control/cmd` — Control commands to Node Base
  - `xentient/{node_id}/status/heartbeat` — Node health pings
- QoS: Level 1 for audio, Level 0 for telemetry.

### Memory Layer — Hermes-Agent Pattern (MEM-01, MEM-02, MEM-03)
- Based on the **Hermes-Agent** architecture for proactive, self-improving memory.
- Storage: **SQLite with FTS5** extension for full-text search across conversation history.
- Memory types:
  - **Episodic**: Timestamped conversation turns (user said X, agent said Y).
  - **Semantic**: Extracted facts about the user (name, preferences, routines).
  - **Procedural**: Learned patterns (user always asks about weather at 7am).
- **Proactive retrieval**: Before each LLM call, the memory system queries FTS5 for relevant past context and injects it into the system prompt.
- **Cross-session persistence**: User identity persists across power cycles / restarts. On first interaction after restart, memory recalls the user's name and recent context.

### Agent's Discretion
- Internal module structure and file organization of the Node.js Harness.
- Specific npm packages for MQTT client (e.g., `mqtt.js` vs `aedes`).
- Error handling and retry strategies for Cloud API failures.
- Logging framework choice.
- How pipeline stages communicate internally (events, streams, or direct calls).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### V1 Technical Specification
- `docs/superpowers/specs/2026-04-13-prima-node-design.md` — Definitive V1 node design, data flow, MQTT topics, and mode system.

### Master Architecture
- `xentient.md` — Overall Xentient vision, Web App/Harness split, and Hermes-Agent memory concepts.

### Project Timeline
- `Xentient_Project_Timeline.md` — 14-day roadmap with workstream descriptions and technical decisions.

</canonical_refs>

<specifics>
## Specific Ideas

- The pipeline should be **hot-swappable** — changing from GPT-4o to Gemini should be a config change, not a code change.
- Consider using an **event emitter pattern** for pipeline stages so new stages can be inserted without modifying existing ones.
- The memory system should have a **"thinking" step** where the LLM reviews retrieved memories and decides which are relevant before injecting them (not just blind RAG).
- Audio chunking: The Node Base sends chunks on VAD boundaries. The Harness should buffer and concatenate until a "vad_end" event, then send the full utterance to STT.

</specifics>

<deferred>
## Deferred Ideas

- **Visual flow editor** for pipeline configuration (Phase 3 — Web App).
- **Local LLM fallback** when Cloud APIs are unavailable (V2).
- **Multi-node routing** — Harness managing multiple Node Bases simultaneously (V2).
- **Dynamic mode creation** via Web App (V2 extensibility note).

</deferred>

---

*Phase: 02-harness-intelligence-layer*
*Context gathered: 2026-04-13 via synthesis from prior design sessions*
