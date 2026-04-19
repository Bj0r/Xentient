#!/usr/bin/env bun
/**
 * Verify all session fixtures parse against Zod contracts.
 *
 * Usage: bun run fixtures:verify
 *
 * Reads harness/fixtures/sessions/*.json, validates each fixture's
 * session.turns structure against the SessionComplete schema, and
 * reports pass/fail for each.
 */

import * as fs from "fs";
import * as path from "path";
import { SessionComplete, TurnSchema, MODE_VALUES } from "./contracts";

interface FixtureTurn {
  role: string;
  text: string;
  durationMs: number;
}

interface Fixture {
  session: {
    mode: string;
    turns: FixtureTurn[];
  };
  hasAudio: boolean;
  hasCamera: boolean;
  error?: { recoverable: boolean; message: string };
}

const FIXTURES_DIR = path.join(__dirname, "..", "..", "fixtures", "sessions");

let passed = 0;
let failed = 0;

const files = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".json")).sort();

console.log(`\nVerifying ${files.length} session fixtures...\n`);

for (const file of files) {
  const fp = path.join(FIXTURES_DIR, file);
  const name = file.replace(".json", "");

  try {
    const raw = fs.readFileSync(fp, "utf-8");
    const fixture: Fixture = JSON.parse(raw);

    // Validate fixture structure
    const errors: string[] = [];

    if (!fixture.session) errors.push("missing 'session' key");
    if (!fixture.session?.mode) errors.push("missing 'session.mode'");
    if (!fixture.session?.turns) errors.push("missing 'session.turns'");
    if (!Array.isArray(fixture.session?.turns)) errors.push("'session.turns' is not an array");

    // Validate mode is a known value
    if (fixture.session?.mode && !MODE_VALUES.includes(fixture.session.mode as any)) {
      errors.push(`unknown mode: ${fixture.session.mode}`);
    }

    // Validate each turn
    for (const [i, turn] of (fixture.session?.turns ?? []).entries()) {
      const parsed = TurnSchema.safeParse({
        role: turn.role,
        text: turn.text,
        startedAt: Date.now(),
        durationMs: turn.durationMs,
      });
      if (!parsed.success) {
        errors.push(`turn[${i}]: ${parsed.error.issues.map((iss) => iss.message).join(", ")}`);
      }
    }

    // Validate that a full SessionComplete can be built from this fixture
    const now = Date.now();
    const sessionData = {
      v: 1,
      type: "session_complete" as const,
      sessionId: `verify-${name}`,
      nodeBaseId: "node-01",
      spaceId: "living-room",
      startedAt: now - 3000,
      endedAt: now,
      mode: fixture.session.mode,
      status: "done" as const,
      turns: fixture.session.turns.map((t: FixtureTurn) => ({
        role: t.role,
        text: t.text,
        startedAt: now - 2000,
        durationMs: t.durationMs,
      })),
      artifacts: {
        userAudio: `verify-${name}/user.wav`,
        asstAudio: `verify-${name}/assistant.wav`,
        transcript: `verify-${name}/transcript.txt`,
        meta: `verify-${name}/meta.json`,
      },
    };

    const sessionParsed = SessionComplete.safeParse(sessionData);
    if (!sessionParsed.success) {
      errors.push(`SessionComplete: ${sessionParsed.error.issues.map((iss) => iss.message).join(", ")}`);
    }

    if (errors.length > 0) {
      console.log(`  FAIL  ${name}`);
      errors.forEach((e) => console.log(`        ${e}`));
      failed++;
    } else {
      console.log(`  PASS  ${name}`);
      passed++;
    }
  } catch (e: any) {
    console.log(`  FAIL  ${name} — ${e.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);