# Xentient — Working Notes

> **RULE:** Append-only. Brief. No fluff. Decisions and status only.

---

## Current State — 2026-04-19

**Deadline:** April 24, 2026 (demo day)

**Architecture:** Three-tier bridge model (VISION.md). Core = thin runtime + Brain Router. Web = separate Laravel app. Brain = Hermes/Mem0/OpenClaw (delegated).

**Parallel tracks:**
- **Track A (teammate):** Web Console — Laravel+Livewire+Reverb. Blocked on SIMKIT. See `tasks/TRACK-A-WEB.md`.
- **Track B (sarmi):** Core + Hardware. See `tasks/TRACK-B-CORE-HW.md`.

**What changed this session:**
- Deleted `harness/src/memory/` (Mem0 replaces in-house fact extraction per VISION.md reframe)
- Added `harness/src/brain/BrainRouter.ts` (thin dispatcher, basic mode only for demo)
- Added `harness/src/engine/ArtifactWriter.ts` (session recording per CONTRACTS layout)
- Added `harness/src/engine/ModeManager.ts` (sleep/listen/active/record state machine)
- Added `harness/src/shared/contracts.ts` (Zod schemas — single source of truth)
- Added `harness/sim/node-base.ts` and `brain.ts` (fake ESP32 and fake Core for Track A)
- Added 10 session fixtures in `harness/fixtures/sessions/`
- Rewrote `MqttClient.ts` to use CONTRACTS.md topic structure
- Simplified `index.ts` (removed memory imports, basic-mode only)
- Closed bead Xentient-dql (SvelteKit — superseded by Laravel pivot)
- Created beads: SIMKIT (P0), Brain Router (P2), Artifact Writer (P1), Mode Manager (P1)

**Key decisions still valid from previous session (archived in NOTES.md.archive-2026-04-19):**
- B1–B7 decisions (retry bug, data contract, firmware, connectors, enclosures, LCD) — ALL STILL VALID
- EEPROM enumeration dropped (compile-time peripheral map in peripherals.h)
- JST 1.0mm 4-pin/6-pin, PETG enclosures, slide-rail mounting
- LCD 16x2 I2C at 0x27 as Xentient's "face"
- Raw PCM 16kHz mono, no Opus, DMA ring buffer
- `p-retry` + `zod` (harness), `ArduinoWebsockets` + `PubSubClient` + `ArduinoJson` (firmware)

---

## Track B — Next Steps (bead order)

| Priority | Bead | What | Depends on |
|---|---|---|---|
| **P0** | `Xentient-qae` SIMKIT | Make sims actually run + write 03-06-CONTRACT.md | — |
| **P0** | `Xentient-x44` | DB schema contract doc (publish SQL) | — |
| **P0** | `Xentient-abs` | PlatformIO env + I2C peripheral enumeration | — |
| **P0** | `Xentient-cg9` | MQTT pub/sub on ESP32 | `Xentient-abs` |
| P1 | `Xentient-ifd` | Mode Manager (wired into Core) | `abs` + `cg9` |
| P1 | `Xentient-pnn` | Artifact Writer (wired into Pipeline) | `cg9` |
| P1 | `Xentient-n8e` | RMS VAD + audio WS | `cg9` |
| P1 | `Xentient-azp` | LCD face state machine | `abs` |
| P2 | `Xentient-ff6` | Brain Router (beyond basic mode) | `pnn` |

**Track A beads** (gin, ej6, dkv, z98) all **blocked on SIMKIT** completing.

---

## Hardware Status

- Parts arrived Apr 18
- 3D prints: Speaker + PIR prototypes done, dock design pending
- LCD module measured (71x26mm typical), cutout in dock front face
- JST pigtails: pre-crimped 1.0mm, solder to PCB headers, heatshrink color-coded
- HB100 radar (FloodWatch): needs LM358 op-amp (₱15) + resistors/caps (₱20)

---

## File Map (what lives where)

| Path | Purpose |
|---|---|
| `docs/VISION.md` | L1 — Intent, what we own vs delegate |
| `docs/CONTRACTS.md` | L2 — Wire formats, MQTT topics, Zod schemas |
| `docs/HARDWARE.md` | L2 — Hardware decisions (B1–B7) |
| `docs/WEB_CONTROL.md` | L2 — Web Console spec, demo cut |
| `docs/SPACES.md` | L2 — Space/Mode model |
| `docs/PACKS.md` | L2 — Pack system |
| `docs/ARCHITECTURE.md` | L1 — Visual architecture (mermaid) |
| `docs/WIRING.md` | L2 — Wiring/pinout reference |
| `tasks/TRACK-A-WEB.md` | Teammate track — Web Console |
| `tasks/TRACK-B-CORE-HW.md` | Your track — Core + Hardware |
| `harness/src/shared/contracts.ts` | Zod schemas (runtime enforcement) |
| `harness/src/brain/BrainRouter.ts` | Thin brain dispatcher |
| `harness/src/engine/` | Pipeline, ArtifactWriter, ModeManager |
| `harness/sim/` | Fake ESP32 + fake Core (Track A unblock) |
| `harness/fixtures/sessions/` | 10 golden session fixtures |
| `firmware/` | ESP32 code (PlatformIO, not yet created) |

---

## Previous decisions archived
See `NOTES.md.archive-2026-04-19` for B1–B7 deep-plan seeds, retry bug details, and all locked decisions from Apr 18.