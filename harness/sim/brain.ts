#!/usr/bin/env bun
/**
 * Simulated Brain — fake Core pipeline that responds to triggers.
 *
 * Usage: bun run sim:brain [--broker=127.0.0.1:1883] [--artifacts=./var/artifacts]
 *
 * On trigger (PIR or web button):
 *   1. Pick a random fixture from fixtures/sessions/
 *   2. Emit pipeline state transitions (listening → thinking → speaking → idle)
 *   3. Copy fixture artifacts to $artifacts/{newSessionId}/
 *   4. fsync, THEN publish xentient/session/complete with relative paths
 *
 * Per tasks/TRACK-A-WEB.md §3.2 and tasks/TRACK-B-CORE-HW.md §2.2.
 */

import mqtt from "mqtt";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "crypto";
import { validateMessage } from "../src/shared/contracts";
import { ArtifactWriter } from "../src/engine/ArtifactWriter";

const args = process.argv.slice(2);
const broker = args.find((a) => a.startsWith("--broker="))?.split("=")[1] ?? "mqtt://127.0.0.1:1883";
const artifactsPath = args.find((a) => a.startsWith("--artifacts="))?.split("=")[1] ?? "./var/artifacts";

console.log(`[sim:brain] Starting — broker=${broker} artifacts=${artifactsPath}`);

const writer = new ArtifactWriter(artifactsPath);
let client: mqtt.MqttClient;

// Pipeline state cadence (ms)
const STATE_DELAYS = {
  listening: 0,
  thinking: 500,
  speaking: 1500,
  idle: 3000,
};

interface Fixture {
  session: {
    mode: string;
    turns: Array<{ role: string; text: string; durationMs: number }>;
  };
  hasAudio: boolean;
  hasCamera: boolean;
}

function loadFixtures(): string[] {
  const dir = path.join(__dirname, "..", "fixtures", "sessions");
  if (!fs.existsSync(dir)) {
    console.warn("[sim:brain] No fixtures directory — creating placeholder");
    fs.mkdirSync(dir, { recursive: true });
    return [];
  }
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
}

function pickFixture(fixtures: string[]): string {
  return fixtures[Math.floor(Math.random() * fixtures.length)];
}

function ulid(): string {
  const now = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${now.toString(36)}${random}`;
}

async function simulateSession(fixtureName: string, fixtures: string[]) {
  const fixturePath = path.join(__dirname, "..", "fixtures", "sessions", fixtureName);
  const fixture: Fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
  const sessionId = ulid();
  const now = Date.now();

  // Emit pipeline state transitions
  for (const [state, delay] of Object.entries(STATE_DELAYS)) {
    await new Promise((r) => setTimeout(r, delay));
    client.publish("xentient/pipeline/state", JSON.stringify({
      v: 1, type: "pipeline_state", sessionId, state,
    }));
  }

  // Write artifacts
  const userAudio = Buffer.alloc(1024); // placeholder — real fixtures have WAV files
  const assistantAudio = Buffer.alloc(2048); // placeholder
  const transcript = fixture.session.turns.map((t) => `${t.role}: ${t.text}`).join("\n");

  const artifactPaths = await writer.writeSession(
    sessionId,
    {
      sessionId,
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
  client.publish("xentient/session/complete", JSON.stringify(validateMessage("session_complete", {
    v: 1,
    type: "session_complete",
    sessionId,
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
  })));

  console.log(`[sim:brain] Session ${sessionId} complete (fixture: ${fixtureName})`);
}

function start() {
  const fixtures = loadFixtures();
  if (fixtures.length === 0) {
    console.error("[sim:brain] No session fixtures found in harness/fixtures/sessions/. Run fixture generator first.");
    process.exit(1);
  }
  console.log(`[sim:brain] Loaded ${fixtures.length} fixtures`);

  client = mqtt.connect(broker, { clientId: "sim-brain", clean: true });

  client.on("connect", () => {
    console.log("[sim:brain] Connected to broker");
    client.subscribe(["xentient/control/trigger", "xentient/sensors/motion"], (err) => {
      if (err) console.error("[sim:brain] Subscribe error:", err);
    });
  });

  client.on("message", (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      if (topic === "xentient/control/trigger" || topic === "xentient/sensors/motion") {
        console.log(`[sim:brain] Trigger received from ${topic}`);
        const fixture = pickFixture(fixtures);
        simulateSession(fixture, fixtures).catch((err) => {
          console.error("[sim:brain] Session simulation error:", err);
        });
      }
    } catch (e) {
      console.error("[sim:brain] Invalid trigger message:", e);
    }
  });

  client.on("error", (err) => console.error("[sim:brain] MQTT error:", err));
}

start();