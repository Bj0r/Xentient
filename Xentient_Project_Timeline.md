# Xentient v1 — Master Project Plan

> **Deadline: April 24, 2026** | Today: April 10 | 14 days
> This is the **trunk**. Sub-sessions branch off to finalize specifics.

---

## How This Plan Works

This document defines **what** needs to happen and **when**, not **how** in detail. Each workstream has decision points where multiple viable paths exist. We spin up dedicated sub-planning sessions to explore each branch, prototype options, and commit to a final approach.

```
This Document (Master Plan)
  ├── Sub-plan: Firmware architecture & GPIO allocation
  ├── Sub-plan: Harness pipeline (STT × LLM × TTS selection)
  ├── Sub-plan: 3D enclosure design approach
  ├── Sub-plan: Node communication protocol
  └── Sub-plan: Demo & presentation strategy
```

The master plan stays high-level. The sub-plans go deep. Decisions flow **up** — once a sub-plan resolves a choice, we note it here and move forward.

---

## Constraints (Fixed, Non-Negotiable)

| Constraint | Detail |
|-----------|--------|
| **Deadline** | April 24, 2026 — present a working prototype |
| **Parts ETA** | Local vendors: Apr 11–14. China vendors: by Apr 16–18 |
| **3D print lead time** | ~5 business days via Shopee after submission |
| **Budget spent** | ₱1,822 of ~₱2,222 BOM |
| **Core hardware** | ESP32-CAM-MB, INMP441, MAX98357A, BME280, HC-SR501, TP4056+MT3608+18650 |

---

## The Five Workstreams

### ① Firmware — The Node Brain

> **Goal:** ESP32-CAM-MB boots, connects, enumerates peripherals, streams sensor data upstream, receives commands downstream.

**Core functions (non-negotiable):**
- WiFi connectivity with reconnection handling
- Peripheral enumeration via I2C EEPROM (AT24C02)
- Audio capture (INMP441) and playback (MAX98357A) via I2S
- Sensor reads (BME280, HC-SR501)
- State machine (UNCLAIMED → BARE → OPERATIONAL → DEGRADED)
- Status LED feedback

**Open decisions:**

| Decision | Options | Tradeoffs |
|----------|---------|-----------|
| **Dev framework** | Arduino IDE / PlatformIO+Arduino / ESP-IDF (native) | Arduino = fastest to prototype, ESP-IDF = most control over I2S DMA and memory. PlatformIO bridges both. |
| **Audio streaming format** | Raw PCM chunks / Opus compressed / WAV framed | Raw PCM = simple but bandwidth-heavy. Opus = compact but adds encode/decode complexity on ESP32. WAV = easy to debug. |
| **Upstream protocol** | MQTT / WebSocket / HTTP chunked / ESP-NOW (node-to-node) | MQTT = natural IoT fit with QoS. WebSocket = better for continuous audio. HTTP = simplest but no push. ESP-NOW = zero-infrastructure but limited range. |
| **Camera in demo?** | Use OV3660 / Disable camera, free GPIO | Camera pins on ESP32-CAM-MB steal GPIOs 0,2,4,5,12-15,25-27,32-39. Disabling camera frees pins for I2S. Using camera means careful pin remapping or I2S over remaining pins. **This decision cascades into everything.** |
| **OTA in prototype?** | Implement basic OTA / Skip for v1 demo | OTA is in the architecture but may be scope creep for a 14-day sprint. |

**Sub-session to spawn:** *"Firmware architecture — resolve GPIO map, framework choice, audio format, camera decision"*

---

### ② Harness Pipeline — The AI Brain

> **Goal:** Audio goes in, intelligent spoken response comes out. Runs on laptop/server, not on ESP32.

**The pipeline has three stages. Each stage has multiple viable approaches:**

#### Stage A — Speech-to-Text (STT)

| Option | Runs | Latency | Quality | Offline? | Notes |
|--------|------|---------|---------|----------|-------|
| **faster-whisper** (local) | Laptop CPU/GPU | ~1-3s | Excellent | ✅ | CTranslate2 optimized Whisper. Best local option. |
| **OpenAI Whisper API** | Cloud | ~1-2s | Excellent | ❌ | Simple, reliable, costs money. |
| **whisper.cpp** | Laptop/RPi | ~2-5s | Good | ✅ | C++ port, runs on minimal hardware. |
| **Vosk** | Laptop/RPi | <1s | Moderate | ✅ | Lightweight, real-time capable, lower accuracy. |
| **Google Cloud STT** | Cloud | <1s | Excellent | ❌ | Free tier available. |
| **Deepgram** | Cloud | <0.5s | Excellent | ❌ | Fastest cloud option. |

#### Stage B — Language Model (LLM)

| Option | Runs | Latency | Quality | Offline? | Notes |
|--------|------|---------|---------|----------|-------|
| **Ollama** (llama3.1, phi3, gemma2) | Local | 2-5s | Good-Great | ✅ | Best for demo reliability. No API dependency. Pick model by laptop GPU. |
| **OpenAI API** (GPT-4o-mini) | Cloud | 1-2s | Excellent | ❌ | Fast, cheap, but internet-dependent. |
| **Anthropic API** (Claude) | Cloud | 1-3s | Excellent | ❌ | Strong reasoning. |
| **Google Gemini API** | Cloud | 1-2s | Excellent | ❌ | Free tier generous. |
| **LM Studio** | Local | 2-5s | Good-Great | ✅ | GUI-based, easy model switching. |
| **Self-hosted vLLM/TGI** | Server | 1-3s | Great | ✅ (on network) | If you have a server. Overkill for prototype. |

**Context & memory approaches:**
| Approach | How | Complexity |
|----------|-----|-----------|
| **Simple context window** | Append last N messages to prompt | Low — good enough for demo |
| **RAG with vector DB** (ChromaDB, FAISS) | Embed and retrieve relevant context | Medium — impressive but may be overkill |
| **Obsidian-style markdown memory** | Store conversations as .md files, search/inject relevant ones | Medium — elegant, human-readable, debuggable |
| **Mem0 / MemGPT pattern** | Autonomous memory management agent | High — most architecturally aligned with Xentient vision |
| **Redis/SQLite key-value** | Simple persistent store per space+identity | Low — reliable, boring, works |

#### Stage C — Text-to-Speech (TTS)

| Option | Runs | Latency | Voice Quality | Offline? | Notes |
|--------|------|---------|---------------|----------|-------|
| **Piper TTS** | Local | <1s | Good | ✅ | Fast, lightweight, many voices. Best offline option. |
| **edge-tts** | Cloud (free) | <1s | Great | ❌ | Uses Microsoft Edge's TTS. Free, high quality, no API key. |
| **ElevenLabs** | Cloud | 1-2s | Excellent | ❌ | Most natural. Free tier limited. |
| **Google Cloud TTS** | Cloud | <1s | Great | ❌ | Reliable. |
| **Coqui TTS** | Local | 1-3s | Good-Great | ✅ | Open-source, XTTS for voice cloning. |
| **OpenAI TTS** | Cloud | 1-2s | Excellent | ❌ | Simple API, great voices. |
| **F5-TTS / MaskGCT** | Local | 2-5s | Excellent | ✅ | Cutting edge, but heavy. |

**Harness configuration approach:**
| Approach | Description |
|----------|-------------|
| **Flat config files** | `model.config`, `rules.md`, `memory.policy` as plain files. Simple, human-editable. |
| **YAML/TOML harness spec** | Single structured config. Validated schema. |
| **Agent framework** (LangChain, CrewAI, AutoGen) | Framework handles pipeline orchestration. More magic, less control. |
| **Custom pipeline (pure Python)** | We wire STT→LLM→TTS ourselves. Maximum control and debuggability. |
| **Node-RED flows** | Visual pipeline builder. Great for demos. Non-programmer friendly. |

**Sub-session to spawn:** *"Harness pipeline — select STT×LLM×TTS stack, choose memory approach, define config format"*

---

### ③ 3D Enclosure — The Physical Body

> **Goal:** A printed housing that fits the assembled node, with proper apertures for mic, speaker, USB-C, LED, and ventilation.

**Design approach options:**

| Approach | Tool | Strengths | Who can do it |
|----------|------|-----------|---------------|
| **Parametric CAD** | OpenSCAD | Code-driven, version-controllable, AI-agent can generate entirely | Anyone with code skills |
| **Traditional CAD** | Fusion 360 / FreeCAD | GUI-based, precise constraints, industry standard | Requires CAD experience |
| **Simplified CAD** | TinkerCAD | Browser-based, very easy, limited precision | Beginners |
| **AI-generated** | Text-to-CAD (Meshy, Tripo3D, Zoo.dev) | Prompt-driven 3D generation | Experimental, may need cleanup |
| **Skip enclosure** | Open frame / acrylic plate mount | No print needed, looks "maker" aesthetic | Anyone |

**Enclosure style options:**
| Style | Look | Printability | Notes |
|-------|------|-------------|-------|
| Simple rectangular box | Clean, professional | Easy, no supports | Safe choice |
| Rounded / organic shell | Modern, premium feel | Needs supports, longer print | More visually impressive |
| Stackable modular segments | Matches snap-on peripheral philosophy | Medium complexity | Architecturally coherent with Xentient vision |
| Transparent / semi-open | Shows internals, "maker" aesthetic | Easy | Good for demos — audience sees the hardware |

**3D printing service options:**
| Option | Lead Time | Cost | Notes |
|--------|-----------|------|-------|
| **Shopee 3D printing** | ~5 business days | ₱200–500 | Known quantity, ordered before |
| **Local makerspace** | 1-2 days | Varies | If available near you — fastest turnaround |
| **Self-print** (if you have a printer) | Same day | Filament cost only | Most flexible but needs printer access |
| **Skip print** | 0 days | ₱0 | Use standoffs + acrylic plate. Functional, just not enclosed. |

> **Critical timing:** Print must be **submitted by April 17–18** for April 22–23 delivery.
> If we lose confidence in timing, commit to the "open frame" fallback early rather than scrambling.

**Sub-session to spawn:** *"3D enclosure — choose tool, design style, and printing path"*

---

### ④ Hardware Assembly — The Physical Build

> **Goal:** A wired, powered, functional node on the universal PCB that passes all firmware tests.

This workstream has **fewer decisions** — it's mostly execution. But the sequence matters.

**Assembly phases:**

```
Phase A: Power Path (can start Apr 11 when local parts arrive)
  TP4056 → 18650 → MT3608 → 5V rail
  Gate: Multimeter reads stable 5V

Phase B: MCU Mount (after Phase A)
  ESP32-CAM-MB seated on headers, powered from 5V rail
  Gate: Serial monitor shows boot log

Phase C: Audio Peripherals (after Phase B, needs China parts ~Apr 16)
  INMP441 + MAX98357A + speaker wired to I2S pins
  Gate: Test firmware captures and plays audio

Phase D: Sensor Peripherals (parallel with Phase C)
  BME280 + HC-SR501 wired to I2C/GPIO
  Gate: Test firmware reads sensor values

Phase E: EEPROM ID Bus (parallel with C/D)
  AT24C02 chips programmed and wired on shared I2C
  Gate: Enumeration firmware detects all peripherals

Phase F: Integration test
  Full firmware flashed, all peripherals active
  Gate: WiFi → MQTT → audio round-trip works
```

**Connector strategy for v1:**
| Approach | Pros | Cons |
|----------|------|------|
| **Dupont wires** (female-female) | Fast, zero solder, easy to reconfigure | Loose connections, messy internally |
| **Soldered headers** | Reliable, semi-permanent | Can't reconfigure without desoldering |
| **JST XH2.54** (what we ordered) | Clean, locking, multi-pin | 2.5mm pitch — doesn't match SH spec but works physically |
| **Screw terminals** | Rock-solid, tool-free | Bulky, not elegant |

**Sub-session to spawn:** *"Hardware assembly — finalize wiring plan and connector approach after GPIO map is resolved"*

---

### ⑤ Presentation & Demo — The Story

> **Goal:** A compelling 10-15 minute presentation culminating in a live hardware demo.

**Presentation structure options:**

| Approach | How | Strengths |
|----------|-----|-----------|
| **Use existing `xentient_presentation.html`** | Update the interactive dashboard with final data, add demo section | Already built, interactive, impressive |
| **Slide deck** (Google Slides, PowerPoint) | Traditional presentation format | Easy to structure narrative, familiar to audience |
| **Hybrid: slides + live dashboard** | Slides for narrative, switch to dashboard for the interactive demo | Best of both worlds |
| **Pure live demo** | No slides, just walk through the hardware and dashboard | High risk, high reward — most impressive if it works |

**Demo approach options:**

| Strategy | Risk Level | Impression |
|----------|-----------|------------|
| **Live hardware demo** (speak → response) | High — depends on WiFi, LLM, audio quality | Most impressive. "It actually works." |
| **Pre-recorded video + live dashboard** | Low | Safe. Less exciting. |
| **Live demo with pre-recorded fallback** | Medium | Best strategy — try live, cut to video if issues |
| **Simulated demo** (pre-scripted responses) | Low | Looks live but isn't. Audience may not know the difference. |

**What to showcase beyond the hardware:**
| Element | Why it matters |
|---------|---------------|
| **Modular snap-on design** | Physical modularity is the differentiator — show peripherals being attached/detached |
| **EEPROM auto-detection** | "It knows what's plugged in" — hardware self-awareness is impressive |
| **Privacy / self-hosting story** | "Your data stays yours" — resonates with audiences |
| **Harness swappability** | "Change the AI, keep the hardware" — show switching models |
| **The interactive dashboard** | Already built, already impressive — leverage it |

**Sub-session to spawn:** *"Presentation strategy — finalize demo script, backup plan, and narrative arc"*

---

## Milestone Gates (Technology-Agnostic)

These checkpoints are **what must be true**, not how to get there.

| # | Gate | Must Be True | Target |
|---|------|-------------|--------|
| **M1** | Code generation complete | Firmware + harness code exists, compiles/runs (even if buggy) | Apr 12 |
| **M2** | Harness pipeline validated | Audio file in → spoken response out, on laptop | Apr 14 |
| **M3** | 3D model exists | Printable STL exported, inspected in slicer | Apr 14 |
| **M4** | Power path works | 5V rail stable on assembled PCB | Apr 12* |
| **M5** | All parts received | Full BOM inventory confirmed | Apr 16–18 |
| **M6** | Firmware on real hardware | ESP32 boots, connects WiFi, MQTT heartbeat visible | Apr 17 |
| **M7** | End-to-end audio loop | Speak → hear response through physical hardware | **Apr 18** |
| **M8** | 3D print submitted | Order confirmed, receipt saved | **Apr 17–18** |
| **M9** | Assembled in enclosure | Everything fits, functions inside closed housing | Apr 22 |
| **M10** | Rehearsal done | Full timed presentation run-through | Apr 23 |

---

## Time Allocation

```
WORKSTREAM          Apr 10──11──12──13──14──15──16──17──18──19──20──21──22──23──24
                                                     ▲                          ▲
                                                All parts                    PRESENT

① Firmware          ████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░
                    gen ├──── debug/iterate on real hardware ──────┤ stable

② Harness           ████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                    gen ├── test & tune ──────────┤ stable

③ 3D Design         ████████████████████████████████████▓▓▓▓██████░░░░░░░░░░░░░░
                    prototype model ────────────┤revise├ Shopee print ──────────┤

④ Hardware           ░░░░░░██████░░░░░░░░████████████▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░
                    blocked ├pwr┤ wait    ├─ full build ────┤debug ┤ stable

⑤ Presentation       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████░
                                                              ├─ script+rehearse┤

█ active   ▓ debug/iterate   ░ idle/blocked
```

> **~30% generation (AI agents, immediate) → ~70% debugging, integration, refinement (human-driven)**

---

## What To Spin Up RIGHT NOW

These sub-planning sessions can run **in parallel, today**:

| Session | Purpose | Key Decision to Resolve |
|---------|---------|------------------------|
| **Firmware Architecture** | Generate the ESP32 codebase | GPIO map, framework, camera decision, audio format |
| **Harness Pipeline** | Generate the STT→LLM→TTS service | Which STT × LLM × TTS combo, memory approach, config format |
| **3D Enclosure** | Generate the CAD model | Tool choice, design style, print+timeline strategy |
| **MQTT / Comms Setup** | Stand up the communication layer | Broker choice (Mosquitto local vs cloud), topic schema |

Each session explores options, prototypes if needed, and reports back a recommended path.

---

## Fallback Ladder

If we're running behind, we shed scope in this order (last items shed first):

| Priority | Feature | Fallback if cut |
|----------|---------|----------------|
| 🔴 P0 — Must have | Mic → STT → LLM → TTS → Speaker (the core loop) | No demo without this |
| 🔴 P0 — Must have | WiFi connectivity + MQTT data flow | No demo without this |
| 🟡 P1 — Should have | EEPROM peripheral enumeration | Hardcode peripheral config instead of auto-detect |
| 🟡 P1 — Should have | BME280 + HC-SR501 sensor reads | Demo without environmental sensing — just voice |
| 🟢 P2 — Nice to have | 3D printed enclosure | Present on open perfboard — still functional |
| 🟢 P2 — Nice to have | RGB LED state machine | Skip status indicator — use serial logs instead |
| 🟢 P2 — Nice to have | Camera integration (OV3660) | Disable camera, simplify GPIO map significantly |
| ⚪ P3 — Stretch | OTA updates | Completely skip for v1 demo |
| ⚪ P3 — Stretch | Multiple node coordination | Single node is the demo |
| ⚪ P3 — Stretch | Voice identity / face recognition | Future phase feature |

---

*Master plan v3 — April 10, 2026 | ₱1,822 spent | 14 days to ship*
*This document is the trunk. Sub-sessions grow the branches.*
