# OpenClaw Integration

> L2 Spec — OpenClaw as a computer-use sidecar for terminal, browser, and filesystem operations. Implemented in Platform Track P8.

---

## What OpenClaw Provides

OpenClaw is a battle-tested computer-use agent with sandbox execution. It gives Xentient's AI brain the ability to interact with a computer the way a human would — using a terminal, browsing the web, reading and writing files.

- **Sandbox execution:** All operations run inside an isolated Docker container
- **Screen capture:** Take screenshots of the desktop for visual understanding
- **Terminal access:** Execute shell commands in the sandbox
- **Browser control:** Navigate websites, fill forms, extract data
- **Filesystem operations:** Read, write, and manipulate files within the sandbox

OpenClaw is not a library — it's a sidecar process that Xentient's Core manages and communicates with via API.

---

## How Xentient Connects

The `OpenClawAdapter` is the bridge between Xentient Core and the OpenClaw sidecar:

1. Xentient Core sends an instruction to `OpenClawAdapter` (e.g., "Open the browser and search for weather forecast")
2. `OpenClawAdapter` translates the instruction to an OpenClaw API call
3. OpenClaw executes the instruction inside its sandbox
4. Results come back as text or structured data
5. Xentient routes the result through the voice pipeline or LCD

The adapter does NOT embed OpenClaw. OpenClaw runs as a separate Docker container. The adapter only manages the communication channel and sidecar lifecycle.

---

## Sidecar Architecture

OpenClaw runs as a Docker container managed by Xentient's Core:

```typescript
interface OpenClawAdapter {
  // Sidecar lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  healthCheck(): Promise<boolean>;

  // Core operations
  execute(instruction: string, options?: ExecutionOptions): Promise<ExecutionResult>;
  screenshot(): Promise<Buffer>;

  // Configuration
  getCapabilities(): Promise<string[]>;
}

interface ExecutionOptions {
  timeout?: number;       // Max execution time in ms (default: 30000, max: 120000)
  maxSteps?: number;      // Max steps OpenClaw can take (default: 10, max: 50)
}

interface ExecutionResult {
  success: boolean;
  output: string;          // Text output from the execution
  screenshots?: Buffer[];  // Screenshots taken during execution
  error?: string;          // Error message if execution failed
}
```

### Sidecar Lifecycle

1. **Start:** `docker run -d openclaw/sandbox:latest` — adapter spawns the container
2. **Health check:** `GET /health` every 30 seconds — expects `200 OK`
3. **Execute:** `POST /execute` with instruction and options — adapter sends the task
4. **Receive:** Wait for `ExecutionResult` — adapter receives the outcome
5. **Timeout:** If execution exceeds `timeout` ms, adapter sends a cancel signal and returns `{success: false, error: "tool_timeout"}`
6. **Stop:** `docker stop openclaw-sandbox` — adapter kills the container on shutdown

### Container Management

- Each Space with `openclaw` integration gets its own container
- Containers are isolated — no shared state between Spaces
- Containers are ephemeral — stopped and removed when the Space goes to SLEEP
- Container resources are bounded: 1 CPU core, 2GB RAM max

---

## Security Model

The security model is defense-in-depth:

1. **Sandbox isolation:** All `computer-use` operations run inside OpenClaw's Docker sandbox. Xentient's Core cannot bypass this isolation — it only communicates via the API.

2. **Space permissions gate availability:** A Space must have `openclaw` in its `integrations` array to use the `computer-use` handler. `study-desk` can't use computer-use unless explicitly configured (see SPACES.md).

3. **Handler enum-gated:** The `computer-use` handler is one of the fixed handler types in the PACKS.md enum. It cannot execute arbitrary code — it can only send instructions to OpenClaw's sandbox.

4. **Bounded execution:** Every `computer-use` call has `maxSteps` and `timeout` limits. Long-running operations are cancelled. The LLM receives `{error: "tool_timeout"}` and decides what to say.

5. **No host filesystem access:** The Docker container mounts no host directories by default. Filesystem operations are confined to the container's own filesystem.

6. **No network escape:** The Docker container's network can be configured per Space. Default: no internet access (only internal API communication). Internet access is an explicit per-Space opt-in.

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Arbitrary code execution | Docker sandbox isolation + enum-gated handler |
| Data exfiltration | No host mount + restricted network |
| Persistent compromise | Ephemeral containers (destroyed on Space SLEEP) |
| Resource exhaustion | CPU/RAM limits + timeout/maxSteps bounds |
| Unauthorized access | Space permission gating + integration config |

---

## Platform Track Mapping

**P8 (OpenClaw Adapter)** is the implementation phase per the updated Platform Track P1-P9 ordering.

The authoritative phase order is defined in docs/VISION.md (migration table) and .planning/ROADMAP.md (Platform Track):

| Phase | What | Dependency |
|-------|------|------------|
| P1: Hermes Adapter | Replace custom LLM+memory loop | Hermes installed |
| P2: Mem0 Integration | Mem0 as Hermes plugin + fallback | P1, Mem0 Docker |
| P3: Mode Manager | Sleep/listen/active/record state machine | None |
| P4: Space Manager | Space context + permissions | P3 |
| P5: Pack Loader v2 | New handler types, space awareness | P1, P4 |
| P6: Web Control Panel | Browser-based control plane | P4 |
| P7: Communication Bridge | REST/WS/MQTT bridge to AI Brain | P1 |
| **P8: OpenClaw Adapter** | **computer-use handler + sidecar manager** | **P5** |
| P9: Archon Adapter | agent-delegate handler | P5 |

This supersedes any earlier P6/P7 labels in repurpose.md or CONTEXT.md. The authoritative order is VISION.md + ROADMAP.md.

---

*Cross-references: VISION.md (integration tiers, three-tier architecture), SPACES.md (Space permissions, integration gating), PACKS.md (computer-use handler enum), CONTRACTS.md (MQTT topics)*