# Xentient Sim Kit

Fake ESP32 Node Base + fake Core Brain for offline development.

## Quickstart

```bash
cd harness
bun install
bun run sim:node               # starts fake sensor telemetry
bun run sim:brain               # starts fake pipeline (in another terminal)
```

Requires a running Mosquitto broker at `127.0.0.1:1883`.

## Options

### sim:node

```bash
bun run sim:node [--broker=mqtt://host:port] [--client=node-01] [--profile=quiet|chatty|flaky]
```

- `--profile=quiet` (default): BME every 5s, PIR every 60-120s
- `--profile=chatty`: BME every 3s, PIR every 15-25s
- `--profile=flaky`: like quiet, disconnects every 3min for 10s

### sim:brain

```bash
bun run sim:brain [--broker=mqtt://host:port] [--artifacts=./var/artifacts] [--scenario=round-robin|happy-path-short|...]
```

- `--scenario=round-robin` (default): cycles through all fixtures
- `--scenario=happy-path-short`: always use that specific fixture

## Triggering a session

```bash
mosquitto_pub -t xentient/control/trigger -m '{"v":1,"type":"trigger_pipeline","source":"web"}'
```

## Fixture verification

```bash
bun run fixtures:verify          # validate all session fixtures
bun run fixtures:regen-schemas   # regenerate JSON-Schema exports
```

## MQTT topics produced

| Topic | Produced by |
|-------|-------------|
| `xentient/sensors/env` | sim:node |
| `xentient/sensors/motion` | sim:node |
| `xentient/status/mode` | sim:node (echo) |
| `xentient/pipeline/state` | sim:brain |
| `xentient/session/complete` | sim:brain |
| `xentient/session/error` | sim:brain |