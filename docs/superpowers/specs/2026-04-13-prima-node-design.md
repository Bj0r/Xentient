# Prima Node — v1 Design Specification

> **Date:** 2026-04-13
> **Project:** Xentient Phase 0 — Proof of Concept
> **Deadline:** April 24, 2026

---

## 1. Overview

Prima Node is the first Xentient node — a proof-of-concept prototype that demonstrates the core thesis: **modular hardware + configurable AI + physical presence**.

The node sends sensor data (audio, video, environmental) via MQTT. The harness layer (YOU own) decides what to do with that data — stream, archive, trigger workflows, or query an LLM.

---

## 2. What Was Decided

### Hardware Layer

| Decision | Choice | Notes |
|----------|--------|-------|
| **Dev Framework** | Arduino (PlatformIO) | Speed to demo |
| **Node MCU** | ESP32-WROOM-32 dev board | Node base |
| **Camera** | ESP32-CAM-MB + OV3660 | Connects via UART to node base |
| **Microphone** | INMP441 MEMS I2S | + AT24C02 EEPROM |
| **Speaker** | MAX98357A I2S amp + 3W 8Ω | + AT24C02 EEPROM |
| **Sentinel** | HC-SR501 PIR + BME280 | + AT24C02 EEPROM |

### Communication Layer

| Decision | Choice | Notes |
|----------|--------|-------|
| **Upstream Protocol** | MQTT | Local Mosquitto broker |
| **Audio Format** | Raw PCM | ~16KB/sec, no compression |
| **Audio Mode** | Push (VAD-triggered) | RMS threshold |
| **VAD Approach** | Simple threshold | Swap to SpeexDSP if needed |
| **Camera Path** | UART → Node Base → MQTT | Not direct WiFi |
| **MQTT Broker** | Mosquitto (local) | Runs on laptop |

### Slot Architecture (v1)

| Slot | Protocol | Power | Peripheral |
|------|----------|-------|-------------|
| Listen | I2S | 3.3V | INMP441 mic |
| Speak | I2S | 5V | MAX98357A amp |
| Sight | UART | 3.3V | ESP32-CAM-MB |
| Sense | I2C/GPIO | 3.3V | BME280 + PIR |

### Power Path

- USB-C 5V → TP4056 → 18650 → MT3608 → 5V rail
- Runs on battery (UPS mode) or wall power

---

## 3. What Was Implied

### The Node Sends, The Harness Decides

The node is **dumb hardware** — it only:
- Captures raw data from peripherals
- Applies simple VAD threshold
- Sends data to MQTT

The harness owns the intelligence:
- Stream? Archive? Query? Ignore?
- Trigger workflows based on data
- Route to LLM, storage, or webhook

### Not True Modularity (v1 Limitation)

- 1:1 slot-to-peripheral (fixed, not hot-swap)
- JST connector mismatch (ordered XH2.54, spec says SH)
- Not the snap-on vision of v2

### Local LLM Too Slow

- **Cloud API only** for v1 — GPT, Claude, or Gemini
- Ollama can't keep up for voice interaction

---

## 4. Two Modes (v1, Extensible by Design)

### Mode 1: Query Mode (Simple Voice Assistant)

**Trigger:** Clap 3x (configurable threshold in node)

**Flow:**
1. Node detects clap trigger via VAD
2. Node sends audio packet → MQTT
3. Harness receives → starts recording mode
4. VAD detects silence → stops recording
5. STT → converts to text
6. LLM → processes prompt
7. TTS → converts to audio
8. Audio → node speaker → response plays

**VAD Algorithm (Start/Stop):**
- Start: RMS > threshold (tune empirically)
- Stop: RMS < threshold for 1.5s (silence after speech)

### Mode 2: Workflow Mode (Meeting-Assistant)

**Trigger:** Manual (web app button) OR registered trigger phrase

**Flow:**
1. User activates workflow via web app
2. Node enters continuous recording mode
3. All audio captured with timestamps
4. Data → archived / stored
5. End trigger (manual button or configured phrase)
6. Optional: process into transcript summary

**Configurable Triggers:**
- Manual start/stop via web interface
- Time-based (e.g., 9am-5pm)
- Keyword-based ("start meeting", "end meeting")

---

## 5. Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     PRIMA NODE                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│  │  Mic    │  │ Camera  │  │ BME280  │  ┌─────┐            │
│  │  VAD    │  │ UART in │  │ I2C    │  │ PIR │            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
│       │            │            │              │            │
│       └────────────┴────────────┴──────────────┘            │
│                        │                                     │
│                   MQTT (node/)                              │
└────────────────────────┬─────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
┌──────────────┐  ┌─────────────┐  ┌──────────────┐
│ Web Endpoint │  │  Trigger   │  │   Stream    │
│ (simple CCTV)│  │  Processor │  │  (archive)  │
└──────┬──────┘  └──────┬──────┘ └──────┬───────┘
       │                │               │
       └───────────────┬┴──────────────┘
                      ↓
               ┌─────────────┐
               │  HARNESS   │
               │           │
               │ Workflow  │ ← Archon-inspired
               │ Engine    │   (configurable steps)
               │           │
               │ Memory    │ ← Hermes-Agent-inspired
               │ Layer     │   (self-improving, persistent)
               └───────────┘
```

### MQTT Topics (Draft)

```
xentient/{node_id}/audio      # Raw PCM from mic
xentient/{node_id}/camera    # JPEG frames
xentient/{node_id}/sensor    # BME280 json
xentient/{node_id}/event    # PIR trigger
xentient/{node_id}/control # From harness: play audio, capture frame
```

---

## 6. Influences

### Archon — Workflow Engine

> "Think n8n, but for software development."

**Applied:** Own the harness as a workflow engine where you define:
- What data triggers what action
- Configurable steps (STT → LLM → TTS)
- Extensible via code

**Source:** https://github.com/coleam00/Archon

### Hermes-Agent — Memory Layer

- Self-improving skills from experience
- Persists user models across sessions
- FTS5 + LLM for cross-session recall

**Applied:** The memory layer should:
- Remember context across interactions
- Improve based on use
- Support skill generation from workflows

**Source:** https://github.com/nousresearch/hermes-agent

---

## 7. What's Owned vs What's Borrowed

| You Own (Harness) | Borrowed / Delegated |
|-------------------|---------------------|
| Workflow engine | MQTT broker (Mosquitto) |
| Memory layer | Node firmware |
| Trigger logic | WiFi connectivity |
| LLM routing | VAD threshold |
| TTS output | Hardware config |

---

## 8. Boundaries (What's NOT v1)

- ❌ Multi-node coordination
- ❌ Voice recognition / identity
- ❌ OTA updates
- ❌ W5500 Ethernet
- ❌ Universal slots (v2)
- ❌ Cloud-only features
- ❌ Hermes protocol (future consideration)

---

## 9. Extensibility Points (Designed for Growth)

1. **Mode system** — add new modes via config, not firmware
2. **Trigger registration** — web interface to register new phrases
3. **Memory layer** — plug in Hermes-Agent concepts later
4. **Workflow library** — shareable workflow configs
5. **Peripheral slots** — add new slot types without rewriting firmware (v2)

---

## 10. The Feeling

> *"I talked to a space. It heard me. It thought. It spoke back."*

Prima Node + the harness you own = the first Xentient experience.

---

## 11. Open Questions for Later

1. Hermes protocol vs custom MQTT topics?
2. Memory layer implementation details
3. Specific VAD threshold value (empirical)
4. Web app interface for Mode 2 triggers
5. Which cloud LLM API (GPT/Claude/Gemini)?

---

## 12. Next Steps

1. Write implementation plan (sub-session)
2. Generate code (Node Base Firmware + Harness)
3. Build hardware (power path → integration)
4. Test audio loop
5. Demo at April 24

---

*Generated from brainstorming session — April 13, 2026*