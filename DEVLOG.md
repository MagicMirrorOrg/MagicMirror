# Devlog

This file records **decisions and rationale** — the _why_ behind non-trivial choices made in this project.

- It is **not a changelog**. Git owns what changed; this file owns why.
- Routine edits, config tweaks, and bug fixes do not belong here unless they reveal a non-obvious tradeoff.
- **Newest entries go on top.**

---

## 2026-07-16 — transit module: Halifax Transit real-time arrivals via GTFS-RT

**Context:** Checking bus arrivals for routes 54/55/56/62 near Crichton Ave, Dartmouth NS required manually consulting Halifax Transit's schedule or app. Adding a mirror module to show upcoming arrivals at a specific stop eliminates that friction.

**Decision:** Use the Halifax Transit GTFS-RT TripUpdates protobuf feed (`gtfs.halifax.ca`) with `gtfs-realtime-bindings` for decoding. The node_helper polls every 30 s, filters by configured `stopId` and `routes`, computes minutes-away from departure timestamps, and sends sorted arrivals to the browser module. `undici` (already a production dep) handles the fetch; no API key is required.

**Alternatives rejected:** Static GTFS schedule parsing — rejected because it requires downloading and parsing a large zip on every deploy, has no real-time delay/cancellation data, and goes stale between feed refreshes. Third-party transit APIs — rejected to avoid API key management and external service dependency; the official HRM open data feed is free and direct.

**Consequences:** Adds `gtfs-realtime-bindings` as a production dependency (Protocol Buffers). The user must look up their exact `stopId` from Halifax Transit's static GTFS `stops.txt` before the module shows data. Route IDs in the feed are strings (e.g. `"56"`) and must match exactly in config.

**Refs:** `defaultmodules/transit/`, `defaultmodules/defaultmodules.js`, `package.json`

---

## 2026-07-16 — displaypower module: built-in display sleep/wake with driver auto-detection

**Context:** The previous MagicMirror installation required manually maintained cron jobs and shell scripts to sleep/wake the connected monitor on a schedule. These lived outside the mirror, were fragile across Pi OS upgrades (X11 vs Wayland command differences), and had no integration with the mirror itself (e.g. couldn't be triggered by other modules like a PIR sensor).

**Decision:** Implement display power control as a first-class default module (`displaypower`) with a `node_helper.js` that auto-detects the display driver at startup (`wlopm` → `wlr-randr` → `x11` → `vcgencmd` fallback), manages a cron schedule via the existing `croner` dependency, and exposes `DISPLAY_POWER` / `DISPLAY_POWER_STATE` notifications so future modules (e.g. PIR sensor) can control the display at runtime.

**Alternatives rejected:** External cron jobs — rejected because they break on OS upgrades, can't be triggered by mirror events, and add setup burden on each Pi deployment. A config-level `schedule` option on the server — rejected because it would couple display logic to core server code rather than keeping it modular.

**Consequences:** Future sensor modules can send `DISPLAY_POWER` notifications without knowing the underlying driver. The module must be added to `config.js` to activate — it ships inert. Wayland output name defaults to `HDMI-A-1` which may need overriding via `display` config on some Pi setups.

**Refs:** `e90630e4` — `defaultmodules/displaypower/`
