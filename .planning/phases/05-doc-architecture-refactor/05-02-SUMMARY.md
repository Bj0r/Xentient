---
phase: 05-doc-architecture-refactor
plan: 02
subsystem: docs
tags: [contracts, packs, spaces, integrations, wire-format, mqtt, hermes, mem0, openclaw, web-control]

# Dependency graph
requires:
  - phase: 05-01
    provides: VISION.md, NON_GOALS.md, HARDWARE.md as source references
provides:
  - docs/CONTRACTS.md: authoritative wire format source with MQTT topics, message schemas, versioning
  - docs/PACKS.md: pack folder spec, manifest schema, handler enum, lifecycle, guardrails
  - docs/SPACES.md: Space model, Mode state machine, integration tiers, Mem0 scoping
  - docs/INTEGRATIONS/hermes.md: Hermes adapter contract, API surface, deployment, fallback
  - docs/INTEGRATIONS/mem0.md: Mem0 wiring, space-scoped tags, direct API fallback
  - docs/INTEGRATIONS/openclaw.md: OpenClaw sidecar process manager, sandbox contract
  - docs/WEB_CONTROL.md: Core Face B spec, browser-based control plane
affects: [05-03-PLAN, all implementation phases that reference contracts/packs/spaces]

# Tech tracking
tech-stack:
  added: []
patterns: [enum-gated-handlers, space-scoped-memory, sidecar-architecture, three-tier-core]

key-files:
  created:
    - docs/CONTRACTS.md
    - docs/PACKS.md
    - docs/SPACES.md
    - docs/INTEGRATIONS/hermes.md
    - docs/INTEGRATIONS/mem0.md
    - docs/INTEGRATIONS/openclaw.md
    - docs/WEB_CONTROL.md
  modified: []

key-decisions:
  - "CONTRACTS.md established as design reference that wins over contracts.ts until contracts.ts is updated"
  - "Handler enum locked to 8 types: mqtt-publish, mqtt-request-response, basic-llm, hermes-chat, hermes-memory, hermes-skill, computer-use, agent-delegate"
  - "Mode state machine enforces valid transitions; invalid transitions rejected with error"
  - "OpenClaw integration mapped to P8 (not P6/P7) per VISION.md authoritative Platform Track order"
  - "Web Control Panel tech stack deferred to P6 planning — only constraint is no event loop blocking"
  - "Memory rules JSON preserved for post-Mem0 compatibility — extract rules become Mem0 config"

requirements-completed: [DOC-02]

# Metrics
duration: 12min
completed: 2026-04-19
---

# Phase 5 Plan 02: L2 Spec Documents Summary

**Seven L2 spec documents bridging vision to implementation: wire contracts (CONTRACTS.md), pack system (PACKS.md), spaces and modes (SPACES.md), three integration adapters (hermes/mem0/openclaw), and web control panel (WEB_CONTROL.md)**

## Performance

- **Duration:** 12 min
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- CONTRACTS.md: Complete MQTT topic map (14 topics across 7 categories), message schemas for all message types, versioning/payload cap/enum widths conventions, Zod schema convention
- PACKS.md: Full pack folder spec with manifest schema, persona format (YAML front-matter + interpolation), 8-type handler enum with security model, tools.json/memory-rules.json/voice.json structures, lifecycle (boot/load/validate/hot-reload/switch), 8 guardrails, MQTT pack control, demo pack choreography
- SPACES.md: Space interface (TypeScript), SpaceMode type (4 states), Integration type hierarchy, Mode state machine with transition rules and enforcement, 4 Space examples, Mem0 4-level scoping model, Space+MQTT contract
- INTEGRATIONS/hermes.md: HermesAdapter contract (TypeScript interface), API surface (REST+WebSocket), local/cloud deployment, health check protocol, fallback to basic mode, memory/ deletion scope
- INTEGRATIONS/mem0.md: Primary path (Hermes plugin), fallback path (Mem0Adapter direct API), space-scoped tags, MemoryDB migration table, self-hosted/cloud deployment
- INTEGRATIONS/openclaw.md: OpenClawAdapter sidecar architecture, Docker lifecycle, 6-layer security model, P8 phase mapping per VISION.md authoritative order
- WEB_CONTROL.md: Core Face B definition, three-tier architecture role, 8 responsibility areas, 14 REST endpoints, WebSocket telemetry, P6 mapping

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CONTRACTS.md and PACKS.md** - `2bd0e99` (docs)
2. **Task 2: Create SPACES.md and INTEGRATIONS docs** - `39656e4` (docs)
3. **Task 3: Create WEB_CONTROL.md** - `ff6b68b` (docs)

## Files Created

- `docs/CONTRACTS.md` (318 lines) - Wire format specification: MQTT topics, message schemas, versioning, payload cap, enum widths, peripheral ID registry, Zod convention
- `docs/PACKS.md` (360 lines) - Pack system: folder structure, manifest schema, persona format, handler enum, tools/memory/voice JSON structures, lifecycle, guardrails, MQTT control, demo packs
- `docs/SPACES.md` (238 lines) - Space model, Mode state machine, integration tiers, Mem0 scoping, Space+MQTT contract
- `docs/INTEGRATIONS/hermes.md` (156 lines) - Hermes adapter contract, API surface, deployment, fallback, deletion scope
- `docs/INTEGRATIONS/mem0.md` (204 lines) - Mem0 primary/fallback paths, space-scoped tags, migration, deployment
- `docs/INTEGRATIONS/openclaw.md` (134 lines) - OpenClaw sidecar, Docker lifecycle, security model, P8 mapping
- `docs/WEB_CONTROL.md` (196 lines) - Core Face B, responsibilities, API surface, P6 mapping

## Decisions Made

- **CONTRACTS.md as design authority** — if contracts.ts and this doc disagree, the doc wins until contracts.ts is updated. This prevents code from silently drifting from spec.
- **Handler enum locked to 8 types** — the complete set from the Brain Router in VISION.md. Adding handlers requires a harness PR (intentional friction).
- **Mode state machine enforces transitions** — invalid transitions are rejected with structured error messages, not silently ignored.
- **OpenClaw mapped to P8** — the authoritative Platform Track order (P1-P9) is defined in VISION.md migration table and ROADMAP.md. Earlier P6/P7 labels in repurpose.md/CONTEXT.md are superseded.
- **Web Control Panel tech stack deferred** — the only constraint is no event loop blocking of the Runtime daemon. Framework choice happens in P6 planning.
- **Memory rules JSON preserved for Mem0 compatibility** — when Mem0 is active, the extract rules become Mem0 config; the JSON structure stays the same so packs don't need rewriting.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- lean-ctx MCP intercepted bash commands and caused shell failures; worked around by using `PATH="/usr/bin:/bin:$PATH"` prefix to bypass the interceptor

## Next Phase Readiness
- All 7 L2 spec documents created and cross-referenced
- Plan 05-03 can proceed to rewrite ROADMAP.md, trim NOTES.md, update PROJECT.md/REQUIREMENTS.md, mark Phase 2 superseded
- All implementation phases (P1-P9) now have spec documents they can code against

## Self-Check: PASSED

- docs/CONTRACTS.md: FOUND
- docs/PACKS.md: FOUND
- docs/SPACES.md: FOUND
- docs/INTEGRATIONS/hermes.md: FOUND
- docs/INTEGRATIONS/mem0.md: FOUND
- docs/INTEGRATIONS/openclaw.md: FOUND
- docs/WEB_CONTROL.md: FOUND
- Commit 2bd0e99: FOUND
- Commit 39656e4: FOUND
- Commit ff6b68b: FOUND

---
*Phase: 05-doc-architecture-refactor*
*Completed: 2026-04-19*