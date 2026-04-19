/**
 * Mode Manager — implements the mode state machine per SPACES.md.
 *
 * Transitions:
 *   sleep   → listen     (PIR trigger / web button)
 *   listen  → active      (VAD open)
 *   listen  → sleep       (idle timeout)
 *   listen  → record      (explicit record command)
 *   active  → listen      (VAD close + idle timeout)
 *   record  → listen      (stop command)
 *
 * Invalid transitions are rejected with {error: "invalid_transition"}.
 * Publishes xentient/status/mode on every valid transition.
 */

import { MqttClient } from "../comms/MqttClient";
import { MODE_TRANSITIONS, type Mode } from "../shared/contracts";
import pino from "pino";

const logger = pino({ name: "mode-manager" });

export class ModeManager {
  private current: Mode = "sleep";
  private mqtt: MqttClient;

  constructor(mqtt: MqttClient, initialMode: Mode = "sleep") {
    this.current = initialMode;
    this.mqtt = mqtt;
  }

  /** Attempt a mode transition. Returns true if valid, false if rejected. */
  transition(to: Mode): boolean {
    const allowed = MODE_TRANSITIONS[this.current];
    if (!allowed.includes(to)) {
      logger.warn({ from: this.current, to }, "Invalid mode transition rejected");
      return false;
    }

    const from = this.current;
    this.current = to;
    logger.info({ from, to }, "Mode transition");

    // Publish status on xentient/status/mode
    this.mqtt.publish("xentient/status/mode", {
      v: 1,
      type: "mode_status",
      nodeBaseId: this.mqtt.nodeId,
      mode: this.current,
    });

    return true;
  }

  /** Get current mode. */
  getMode(): Mode {
    return this.current;
  }

  /** Force set mode (for web override). Logs warning. */
  forceSet(mode: Mode): void {
    logger.warn({ from: this.current, to: mode }, "Forced mode override");
    this.current = mode;
    this.mqtt.publish("xentient/status/mode", {
      v: 1,
      type: "mode_status",
      nodeBaseId: this.mqtt.nodeId,
      mode: this.current,
    });
  }
}