/**
 * Shared type definitions used across multiple subsystems.
 *
 * Placed here (rather than in comms/ or mcp/) to avoid circular dependencies.
 */

/** Sensor cache populated by MQTT sensor events, consumed by MCP tools. */
export interface SensorCache {
  temperature: number;
  humidity: number;
  pressure: number;
  motion: boolean;
}