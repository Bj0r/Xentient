# Project Charter: Xentient

## What This Is

Xentient is the IoT terminal — a thin voice/hardware bridge that lets any AI brain inhabit a physical room. The harness is a terminal OS; intelligence plugs in via integration tiers (basic, Hermes+Mem0, OpenClaw, Archon).

## Core Value

The bridge between physical rooms and any AI brain. Voice, sensors, display — any intelligence can plug in.

## Requirements

### Validated

- ARCH-V1: Finalized V1 Technical Specification (Web App Control, Node Base/Peripheral split)
- COMMS-V1: MQTT-based transport protocol for hardware-to-harness communication
- MODEL-V1: Committed to Cloud LLM APIs for V1 performance

### Active

- [ ] NODE-BASE: Implement ESP32 PlatformIO firmware with UART peripheral forwarding
- [ ] VOICE-PIPELINE: STT→LLM→TTS streaming pipeline (current harness, ships in demo)
- [ ] MQTT-BRIDGE: MQTT hardware bridge + VAD (current, ships in demo)
- [ ] LCD-FACE: I2C 16x2 display state machine (B7, ships in demo)
- [ ] HERMES-INTEGRATION: Replace custom memory with Hermes+Mem0 (Platform Track P1-P2)
- [ ] SPACE-MODE-MGR: Mode and Space managers (Platform Track P3-P4)
- [ ] WEB-CONTROL: Develop the management UI for hardware status and workflow configuration
- [ ] HW-PHYSICAL: Assemble the physical Prima Node V1 prototype with functional peripherals

### Out of Scope

- **Local LLMs (Ollama)**: Deferred for V1 to ensure snappy user experience.
- **Dynamic Firmware Modes**: Logic resides in the Harness; Node Base firmware remains static and modular.
- **Multi-Node Mesh**: V1 is a single-node prototype.
- **On-device Speech-to-Text**: STT is offloaded to Harness/Cloud for V1 accuracy.
- **n8n-style visual orchestration**: Superseded by bridge model.

## Context

Xentient is in V1 demo prep with a hard deadline of April 24, 2026. Post-demo, the architecture shifts from a custom AI brain to a thin terminal that delegates intelligence to best-in-class integrations (Hermes, Mem0, OpenClaw, Archon).

## Constraints

- **Timeline**: Prototype presentation on April 24, 2026.
- **Transport**: All data flows over MQTT (Mosquitto).
- **Communication**: Camera frames are passed via UART to the Node Base, then MQTT.
- **Frameworks**: SvelteKit (Web App), PlatformIO/Arduino (Firmware), Node.js (Harness).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Three-Tier Architecture — Hardware / Core (Runtime + Web Control Panel) / AI Brain (Hermes, Mem0, OpenClaw, Archon) | Bridge model: Xentient owns the bridge, delegates the brain | — Pending |
| Core is Always-On | Xentient Core runs live 24/7 on hosted server; owns hardware state; Node Bases reconnect to Core | — Pending |
| Core Has Two Faces | Runtime daemon (machine-facing) + Web Control Panel (human-facing), same codebase | — Pending |
| Brain Router | Core's dispatch layer routing handler calls across the three tiers (replaces "Tool Router" naming) | — Pending |
| Mem0 as primary memory layer (P2), Hermes as default brain (P1) | Stop rebuilding what Hermes+Mem0 already solve | — Pending |
| Cloud LLM Mandatory | Local execution too slow for interactive prototype throughput requirements. | — Pending |
| UART Camera Path | ESP-CAM frames routed via Node Base to minimize WiFi interference. | — Pending |
| Demo ships current harness as-is | No Platform Track code before Apr 24 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-19*