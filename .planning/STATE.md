---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
last_updated: "2026-04-28T00:00:00.000Z"
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 7
  completed_plans: 5
  percent: 71
---

# Project State: Xentient

## Project Reference

See: [.planning/PROJECT.md](file:///d:/Projects/Xentient/.planning/PROJECT.md) (updated 2026-04-19)

**Core value:** The IoT terminal — a thin voice/hardware bridge that lets any AI brain inhabit a physical room.
**Current focus:** Phase 6 — Xentient Layers (Waves 3-5 remaining)

## Active Context

Phase 5 complete. Phase 6 in progress: Waves 1-2 (CoreSkill types + SkillExecutor) done, Waves 3-5 (SpaceManager + MCP tools, core wiring, tests) remaining.

Demo scope reduced: no furnished casing required — filming breadboard prototype as-is. P3-ASSY now covers breadboard assembly + validation only (no 3D-printed enclosure).

**Open bugs:** PIR interrupt not wired in firmware (9id, P0) — blocks sleep→listen demo. Two P1 bugs deferred (bgx: dead MQTT sub, b94: audio prefix).

Quick task 260420-4do complete: ModeManager wired into Core runtime — MQTT mode/sensor events, idle timeouts (listen 60s, active 300s), PIR wake (sleep→listen), Pipeline mode-aware audio gating, LCD face display publishing on mode transitions.

## Milestone Status

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| V1 Prototype | 2026-04-24 | In Progress |

## Recent Decisions

- Bridge model adopted: Xentient = IoT terminal, not AI brain
- Three-tier architecture: Hardware / Core (Runtime + Web Control Panel) / AI Brain
- 4-layer doc system established (L0-L4)
- Phase 2 plans superseded by bridge reframe
- Two-track roadmap: Demo Track (frozen) + Platform Track (P1-P9)
- Brain Router: Core's dispatch layer routing handler calls across tiers
- Mem0 as primary memory layer (P2), Hermes as default brain (P1)
- Demo scope reduced: breadboard prototype filming, no furnished casing required
- P3-ASSY merged with 03-07: single hardware assembly task, breadboard scope only

## Roadmap Evolution

- Phase 5 added: Doc architecture refactor — restructure all docs to reflect bridge-model vision
- Phase 5 Plan 01 complete: VISION.md, NON_GOALS.md, HARDWARE.md, README.md created
- Phase 5 Plan 02 complete: CONTRACTS.md, PACKS.md, SPACES.md, INTEGRATIONS/*.md created
- Phase 5 Plan 03 complete: ROADMAP.md, PROJECT.md, REQUIREMENTS.md updated; NOTES.md trimmed; xentient.md shrunk; SUPERSEDED.md added

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 05 | 01 | 15 min | 2 | 4 |
| 05 | 02 | 20 min | 2 | 7 |
| 05 | 03 | 10 min | 2 | 7 |

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260419-abs | PlatformIO firmware scaffold — Node Base I2C enumeration | 2026-04-19 | a83bb7a | [260419-abs-platformio-node-base](.planning/quick/260419-abs-platformio-node-base/) |
| 260420-lcd | LCD 16x2 I2C driver — Core Face A output | 2026-04-20 | 13353b6 | [260420-lcd-lcd-core-face-a](.planning/quick/260420-lcd-lcd-core-face-a/) |
| 260420-mqtt | MQTT pub/sub client + JSON telemetry protocol | 2026-04-20 | 1f959ab | [260420-mqtt-pub-sub-client](.planning/quick/260420-mqtt-pub-sub-client/) |
| 260420-4do | Mode Manager wired into Core | 2026-04-20 | d21750b | [260420-4do-xentient-ifd](.planning/quick/260420-4do-xentient-ifd/) |

---
*State updated: 2026-04-28 (bead alignment + demo scope reduction)*
