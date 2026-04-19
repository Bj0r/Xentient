# Requirements: Xentient

**Defined:** 2026-04-13
**Core Value:** The bridge between physical rooms and any AI brain. Voice, sensors, display — any intelligence can plug in.

## v1 Requirements

Requirements for the April 24 Prototype.

### Node Hardware & Firmware
- [ ] **NODE-01**: ESP32 core detects peripherals via I2C/EEPROM ID.
- [ ] **NODE-02**: RMS-based VAD (Voice Activity Detection) notifies Harness of speech start/end.
- [ ] **NODE-03**: Camera frames forwarded from ESP32-CAM via UART1/2 to Node Base at >5fps.
- [ ] **NODE-04**: Bi-directional MQTT communication for sensor telemetry and control commands.
- [ ] **NODE-05**: Reliable GPIO mapping for all 4 slots (Listen, Speak, Sense, Sight).

### Harness Intelligence Engine
- [ ] **HARN-01**: Voice pipeline (STT→LLM→TTS) with streaming audio — thin terminal OS, not orchestration engine.
- [ ] **HARN-02**: Mosquitto-based central message brokerage with separate channels for audio/frames/sensors.
- [ ] **HARN-03**: Cloud LLM provider integration for basic mode (direct provider call, no memory, no skills). Post-demo: Hermes integration (Platform Track P1).
- [ ] **HARN-04**: Real-time audio ingestion and TTS generation with low latency (<2s round-trip).

### Memory (Delegated to Hermes+Mem0)
- [ ] **MEM-01**: Delegate memory to Hermes+Mem0 (Platform Track P1-P2). Demo uses current MemoryDB/FactExtractor/MemoryInjector as temporary implementation. Post-demo, custom memory code (memory/ directory) is DELETED and replaced by ~80 LOC HermesAdapter + ~30 LOC Mem0Adapter.
- [ ] **MEM-02**: Proactive memory retrieval via Hermes+Mem0 (Platform Track P1-P2). Mem0 provides semantic extraction, recency weighting, entity resolution, and space-scoped tags natively. No custom FactExtractor/MemoryInjector code remains post-demo.
- [ ] **MEM-03**: Cross-session identification via Hermes+Mem0 (Platform Track P1-P2). Mem0 user-scoped tags enable greeting by name and persistent context across sessions. No custom user model code remains post-demo.

### Web Control Plane
- [ ] **WEB-01**: Dashboard showing live heartbeat status of Node Base and Peripherals.
- [ ] **WEB-02**: Visual flow editor to configure "Modes" (Query Mode vs. Workflow Mode).
- [ ] **WEB-03**: Activity log viewer showing processed triggers and AI responses.

### Platform Track Requirements (Post-Demo)
- [ ] **PT-01**: Hermes Adapter — Replace custom LLM+memory loop with Hermes connection (P1)
- [ ] **PT-02**: Mem0 Integration — Direct Mem0 API fallback for basic mode (P2)
- [ ] **PT-03**: Mode Manager — Sleep/listen/active/record state machine (P3)
- [ ] **PT-04**: Space Manager — Space context + MQTT contract + permissions (P4)
- [ ] **PT-05**: Pack Loader v2 — New handler types, space awareness (P5)
- [ ] **PT-06**: Web Control Panel — Core Face B: browser UI for hardware config, pack/space/permission management, integration toggles, live telemetry (P6)
- [ ] **PT-07**: Communication Bridge — REST/WS/MQTT bridge between Core and AI Brain tier (P7)
- [ ] **PT-08**: OpenClaw Adapter — Computer-use handler via remote/sandboxed sidecar (P8)
- [ ] **PT-09**: Archon Adapter — Basic YAML DAG workflow delegation (P9)

## v2 Requirements (Deferred)
- **MESH-01**: Multi-node coordination and spatial presence detection.
- **LOCAL-01**: Fully local LLM/Voice stack (Ollama/Whisper/Piper) on edge server.
- **OTA-01**: Over-the-air firmware updates for Node Base base.

### Documentation Architecture
- [x] **DOC-01**: VISION.md exists as canonical L1 vision with bridge model, integration tiers, Spaces/Modes primitives.
- [x] **DOC-02**: NON_GOALS.md explicitly lists what Xentient is NOT, including no Archon in v1 demo.
- [x] **DOC-03**: HARDWARE.md preserves B1-B7 decisions verbatim from NOTES.md.
- [ ] **DOC-04**: CONTRACTS.md, PACKS.md, SPACES.md exist as L2 spec documents.
- [ ] **DOC-05**: INTEGRATIONS/hermes.md, mem0.md, openclaw.md exist as L2 integration specs.
- [x] **DOC-06**: README.md rewritten as 60-second pitch aligned with bridge model.
- [x] **DOC-07**: Archon contradiction resolved (included as P9 in Platform Track, deferred in demo scope).

## Out of Scope
| Feature | Reason |
|---------|--------|
| On-node Audio DSP | ESP32 limited processing; STT offloaded to Harness for V1 stability. |
| Custom Case Design | Focus on functional assembly first; parametric enclosure for V1. |
| n8n-style visual orchestration | Superseded by bridge model. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NODE-01 | Phase 1 | Pending |
| NODE-02 | Phase 1 | Pending |
| NODE-04 | Phase 1 | Pending |
| HARN-01 | Phase 2 | Pending (rephrased) |
| HARN-02 | Phase 2 | Pending |
| HARN-03 | Phase 2 | Pending (rephrased) |
| MEM-01 | Platform P1-P2 | Pending (delegated) |
| MEM-02 | Platform P1-P2 | Pending (delegated) |
| MEM-03 | Platform P1-P2 | Pending (delegated) |
| WEB-01 | Phase 3 | Pending |
| PT-01 | Platform P1 | Pending |
| PT-02 | Platform P2 | Pending |
| PT-03 | Platform P3 | Pending |
| PT-04 | Platform P4 | Pending |
| PT-05 | Platform P5 | Pending |
| PT-06 | Platform P6 | Pending |
| PT-07 | Platform P7 | Pending |
| PT-08 | Platform P8 | Pending |
| PT-09 | Platform P9 | Pending |
| DOC-01 | Phase 5 | Complete |
| DOC-02 | Phase 5 | Complete |
| DOC-03 | Phase 5 | Complete |
| DOC-04 | Phase 5 | Pending |
| DOC-05 | Phase 5 | Pending |
| DOC-06 | Phase 5 | Complete |
| DOC-07 | Phase 5 | Complete |

---
*Requirements defined: 2026-04-13*
*Last updated: 2026-04-19 — MEM/HARN requirements updated for bridge model, PT-01 through PT-09 added*