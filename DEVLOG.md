# Devlog

This file records **decisions and rationale** — the _why_ behind non-trivial choices made in this project.

- It is **not a changelog**. Git owns what changed; this file owns why.
- Routine edits, config tweaks, and bug fixes do not belong here unless they reveal a non-obvious tradeoff.
- **Newest entries go on top.**

---

## 2026-07-17 — wind module: three independent sources for Halifax Harbour wind

**Context:** As a boater, wind conditions in Halifax Harbour need to be immediately legible from the mirror — speed, gusts, direction, and active warnings. No single source is reliable alone: real-time buoys drop out for days, model data has no observation lag but isn't measured, and EC marine forecasts are prose issued 4×/day. Hiding a dropped-out source behind stale data is actively dangerous.

**Decision:** Three sources fetched and rendered independently, each failing on its own without blanking the panel. Open-Meteo GEM (modelled, always populated, knots returned directly) provides a live baseline. The SmartAtlantic Herring Cove ERDDAP buoy provides a real measurement, explicitly labelled with its observation age and greyed out past a configurable stale threshold — turning buoy dropouts into an obvious "don't trust this" signal rather than a silent failure. The Environment Canada marine RSS Atom feed (weather.gc.ca/rss/marine/06000_e.xml) provides the human-readable forecast and warning banner; parsed with regex on the server side.

**Alternatives rejected:** EC Datamart XML (`dd.weather.gc.ca/marine_weather/xml/06000_e.xml`) — confirmed 404, does not exist for this site. Single-source approach — rejected because each source answers a different question (current model / lagged measurement / issued forecast) and has distinct failure modes. Adding an XML parser dependency — rejected; the Atom feed is simple enough for regex extraction with no new deps.

**Consequences:** Buoy staleness is a first-class display concern, not an implementation detail — the stale threshold is user-configurable. Warning banner is only shown when EC issues one; the absence of a banner is meaningful. Module degrades gracefully: any source can be unavailable without affecting the others.

**Refs:** `defaultmodules/wind/`, `defaultmodules/defaultmodules.js`, `config/config.js`

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
