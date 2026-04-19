#!/usr/bin/env bun
/**
 * Simulated Node Base — fake ESP32 that publishes MQTT telemetry.
 *
 * Usage: bun run sim:node [--broker=127.0.0.1:1883] [--client=node-01] [--profile=quiet|chatty|flaky]
 *
 * Profiles:
 *   quiet  — BME every 5s, PIR every 60-120s (default)
 *   chatty — BME every 3s, PIR every 15-25s
 *   flaky  — like quiet, but drops MQTT connection every 3min for 10s
 *
 * Subscribes to xentient/control/mode → echoes xentient/status/mode after 200ms.
 * Subscribes to xentient/display → logs but does not render.
 *
 * Per tasks/TRACK-A-WEB.md §3.1 and tasks/TRACK-B-CORE-HW.md §2.1.
 */

import mqtt from "mqtt";
import { WebSocket } from "ws";
import { validateMessage } from "../src/shared/contracts";

const args = process.argv.slice(2);
const broker = args.find((a) => a.startsWith("--broker="))?.split("=")[1] ?? "mqtt://127.0.0.1:1883";
const clientId = args.find((a) => a.startsWith("--client="))?.split("=")[1] ?? "node-01";
const profile = (args.find((a) => a.startsWith("--profile="))?.split("=")[1] ?? "quiet") as "quiet" | "chatty" | "flaky";

const BME_INTERVAL = profile === "chatty" ? 3000 : 5000;
const PIR_MIN = profile === "chatty" ? 15000 : 60000;
const PIR_MAX = profile === "chatty" ? 25000 : 120000;
const FLAKY_DISCONNECT_INTERVAL = 180000; // 3min
const FLAKY_DISCONNECT_DURATION = 10000; // 10s

console.log(`[sim:node] Starting — broker=${broker} client=${clientId} profile=${profile}`);

let client: mqtt.MqttClient | null = null;
let bmeTimer: ReturnType<typeof setInterval> | null = null;
let pirTimer: ReturnType<typeof setTimeout> | null = null;

function connect() {
  client = mqtt.connect(broker, { clientId, clean: true });

  client.on("connect", () => {
    console.log("[sim:node] Connected to broker");
    client!.subscribe(["xentient/control/mode", "xentient/display"], (err) => {
      if (err) console.error("[sim:node] Subscribe error:", err);
    });
    startSensors();
    if (profile === "flaky") startFlakyDisconnect();
  });

  client.on("message", (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      if (topic === "xentient/control/mode") {
        const validated = validateMessage("mode_set", data);
        setTimeout(() => {
          publish("xentient/status/mode", {
            v: 1, type: "mode_status", nodeBaseId: clientId, mode: validated.mode,
          });
        }, 200);
      } else if (topic === "xentient/display") {
        console.log("[sim:node] Display command:", data);
      }
    } catch (e) {
      console.error("[sim:node] Invalid message on", topic, e);
    }
  });

  client.on("error", (err) => console.error("[sim:node] MQTT error:", err));
  client.on("close", () => console.log("[sim:node] Disconnected"));
}

function publish(topic: string, payload: object) {
  if (!client?.connected) return;
  const msg = validateMessage(
    topic.includes("sensor") ? "sensor_data" :
    topic.includes("mode") ? "mode_status" :
    topic.includes("motion") ? "sensor_data" : "mode_status",
    payload,
  );
  client!.publish(topic, JSON.stringify(msg));
}

// Simulated BME280: sinusoidal temp 24-26°C, humidity 55-70, pressure 1012-1014
function publishBME() {
  const t = Date.now() / 1000;
  publish("xentient/sensors/env", {
    v: 1, type: "sensor_data", peripheralType: 0x12,
    payload: {
      temperature: 25 + Math.sin(t / 60) * 1,
      humidity: 62.5 + Math.sin(t / 90) * 7.5,
      pressure: 1013 + Math.sin(t / 120) * 1,
    },
    timestamp: Date.now(),
  });
}

// Simulated PIR: random motion events
function publishPIR() {
  publish("xentient/sensors/motion", {
    v: 1, type: "sensor_data", peripheralType: 0x11,
    payload: { motion: true },
    timestamp: Date.now(),
  });
  scheduleNextPIR();
}

function scheduleNextPIR() {
  const delay = PIR_MIN + Math.random() * (PIR_MAX - PIR_MIN);
  pirTimer = setTimeout(publishPIR, delay);
}

function startSensors() {
  bmeTimer = setInterval(publishBME, BME_INTERVAL);
  scheduleNextPIR();
}

function startFlakyDisconnect() {
  setInterval(() => {
    console.log("[sim:node] Flaky disconnect...");
    client?.end(true);
    setTimeout(() => {
      console.log("[sim:node] Reconnecting...");
      connect();
    }, FLAKY_DISCONNECT_DURATION);
  }, FLAKY_DISCONNECT_INTERVAL);
}

connect();