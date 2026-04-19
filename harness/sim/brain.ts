#!/usr/bin/env bun
/**
 * Simulated Brain — fake Core pipeline that responds to triggers.
 *
 * Usage: bun run sim:brain [--broker=127.0.0.1:1883] [--artifacts=./var/artifacts] [--scenario=round-robin|happy-path-short|...]
 *
 * On trigger (PIR, web button, or audio):
 *   1. Pick fixture (--scenario for deterministic, round-robin default)
 *   2. Emit pipeline state transitions (listening → thinking → speaking → idle)
 *   3. Copy fixture artifacts to $artifacts/{newSessionId}/
 *   4. fsync, THEN publish xentient/session/complete with relative paths
 *
 * Per tasks/TRACK-A-WEB.md §3.2 and tasks/TRACK-B-CORE-HW.md §2.2.
 */

import mqtt from "mqtt";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { validateMessage, type MessageType } from "../src/shared/contracts";
import { ArtifactWriter } from "../src/engine/ArtifactWriter";

const args = process.argv.slice(2);
const broker = args.find((a) => a.startsWith("--broker="))?.split("=")[1] ?? "mqtt://127.0.0.1:1883";
const artifactsPath = args.find((a) => a.startsWith("--artifacts="))?.split("=")[1] ?? "./var/artifacts";
const scenario = args.find((a) => a.startsWith("--scenario="))?.split("=")[1] ?? "round-robin";

console.log(`[sim:brain] Starting — broker=${broker} artifacts=${artifactsPath} scenario=${scenario}`);

const writer = new ArtifactWriter(artifactsPath);
let client: mqtt.MqttClient;

// Pipeline state cadence — cumulative delays from trigger (ms)
const STATE_CADENCE: Array<{ state: string; delayMs: number }> = [
  { state: "listening", delayMs: 0 },
  { state: "thinking", delayMs: 500 },
  { state: "speaking", delayMs: 1500 },
  { state: "idle", delayMs: 3000 },
];

interface Fixture {
  session: {
    mode: string;
    turns: Array<{ role: string; text: string; durationMs: number }>;
  };
  hasAudio: boolean;
  hasCamera: boolean;
  error?: { recoverable: boolean; message: string };
}

let fixtureIndex = 0; // for round-robin

function loadFixtures(): string[] {
  const dir = path.join(__dirname, "..", "fixtures", "sessions");
  if (!fs.existsSync(dir)) {
    console.warn("[sim:brain] No fixtures directory — creating placeholder");
    fs.mkdirSync(dir, { recursive: true });
    return [];
  }
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
}

function pickFixture(fixtures: string[]): string {
  if (scenario !== "round-robin") {
    // Deterministic: match by name or pick first
    const match = fixtures.find((f) => f.replace(".json", "") === scenario);
    if (match) return match;
    console.warn(`[sim:brain] Scenario "${scenario}" not found, falling back to round-robin`);
  }
  const pick = fixtures[fixtureIndex % fixtures.length];
  fixtureIndex++;
  return pick;
}

function sessionId(): string {
  const ts = Date.now().toString(36);
  const rand = crypto.randomUUID().slice(0, 8);
  return `${ts}${rand}`;
}

async function simulateSession(fixtureName: string, fixtures: string[]) {
  const fixturePath = path.join(__dirname, "..", "fixtures", "sessions", fixtureName);
  const fixture: Fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
  const sid = sessionId();
  const now = Date.now();

  // Emit pipeline state transitions with cadence delays
  for (const { state, delayMs } of STATE_CADENCE) {
    await new Promise((r) => setTimeout(r, delayMs));
    const msg = validateMessage("pipeline_state", {
      v: 1, type: "pipeline_state", sessionId: sid, state,
    });
    client.publish("xentient/pipeline/state", JSON.stringify(msg));
    console.log(`[sim:brain] → pipeline/${state} (${sid})`);
  }

  // If fixture has an error, emit session_error instead of session_complete
  if (fixture.error) {
    const errMsg = validateMessage("session_error", {
      v: 1,
      type: "session_error",
      recoverable: fixture.error.recoverable,
      message: fixture.error.message,
    });
    client.publish("xentient/session/error", JSON.stringify(errMsg));
    console.log(`[sim:brain] Session error: ${fixture.error.message}`);
    return;
  }

  // Write artifacts
  const userAudio = Buffer.alloc(1024); // placeholder — real fixtures have WAV files
  const assistantAudio = Buffer.alloc(2048);
  const transcript = fixture.session.turns.map((t) => `${t.role}: ${t.text}`).join("\n");

  const artifactPaths = await writer.writeSession(
    sid,
    {
      sessionId: sid,
      nodeBaseId: "node-01",
      spaceId: "living-room",
      startedAt: now - 3000,
      endedAt: now,
      mode: fixture.session.mode,
      turns: fixture.session.turns.map((t) => ({
        role: t.role,
        text: t.text,
        startedAt: now - 2000,
        durationMs: t.durationMs,
      })),
    },
    userAudio,
    assistantAudio,
    transcript,
  );

  // Publish session complete (relative paths only!)
  const completeMsg = validateMessage("session_complete", {
    v: 1,
    type: "session_complete",
    sessionId: sid,
    nodeBaseId: "node-01",
    spaceId: "living-room",
    startedAt: now - 3000,
    endedAt: now,
    mode: fixture.session.mode,
    status: "done",
    turns: fixture.session.turns.map((t) => ({
      role: t.role,
      text: t.text,
      startedAt: now - 2000,
      durationMs: t.durationMs,
    })),
    artifacts: artifactPaths,
  });
  client.publish("xentient/session/complete", JSON.stringify(completeMsg));
  console.log(`[sim:brain] Session ${sid} complete (fixture: ${fixtureName})`);
}

function start() {
  const fixtures = loadFixtures();
  if (fixtures.length === 0) {
    console.error("[sim:brain] No session fixtures found in harness/fixtures/sessions/. Run fixture generator first.");
    process.exit(1);
  }
  console.log(`[sim:brain] Loaded ${fixtures.length} fixtures (scenario: ${scenario})`);

  client = mqtt.connect(broker, { clientId: "sim-brain", clean: true });

  client.on("connect", () => {
    console.log("[sim:brain] Connected to broker");
    client.subscribe([
      "xentient/control/trigger",
      "xentient/sensors/motion",
      "xentient/control/mode",
    ], (err) => {
      if (err) console.error("[sim:brain] Subscribe error:", err);
    });
  });

  client.on("message", (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      if (topic === "xentient/control/trigger") {
        const validated = validateMessage("trigger_pipeline", data);
        console.log(`[sim:brain] Trigger received (source: ${validated.source})`);
        const fixture = pickFixture(fixtures);
        simulateSession(fixture, fixtures).catch((err) => {
          console.error("[sim:brain] Session simulation error:", err);
        });
      } else if (topic === "xentient/sensors/motion") {
        validateMessage("sensor_data", data);
        console.log("[sim:brain] PIR motion trigger");
        const fixture = pickFixture(fixtures);
        simulateSession(fixture, fixtures).catch((err) => {
          console.error("[sim:brain] Session simulation error:", err);
        });
      } else if (topic === "xentient/control/mode") {
        const validated = validateMessage("mode_set", data);
        console.log(`[sim:brain] Mode change: ${validated.mode}`);
        // Echo mode status
        const echo = validateMessage("mode_status", {
          v: 1, type: "mode_status", nodeBaseId: "node-01", mode: validated.mode,
        });
        client.publish("xentient/status/mode", JSON.stringify(echo));
      }
    } catch (e) {
      console.error("[sim:brain] Invalid message on", topic, e);
    }
  });

  client.on("error", (err) => console.error("[sim:brain] MQTT error:", err));
}

start();