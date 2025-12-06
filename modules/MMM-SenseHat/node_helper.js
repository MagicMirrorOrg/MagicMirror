const { spawn } = require("child_process");
const path = require("path");
const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
  start() {
    // Manage multiple instances by identifier
    this.instances = new Map(); // id -> { config, timer, pythonPath }
    this.readerPath = path.join(__dirname, "python", "reader.py");
    Log.info("[MMM-SenseHat] Node helper started");
  },

  stop() {
    // Clear all timers on shutdown
    for (const { timer } of this.instances.values()) {
      if (timer) clearInterval(timer);
    }
    this.instances.clear();
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "SENSEHAT_CONFIG") {
      const cfg = payload || {};
      const id = cfg.identifier || "__default__";
      // Accept pythonName as alias to pythonPath for familiarity with MMM-PythonPrint
      const pythonPath = cfg.pythonPath || cfg.pythonName || "python3";
      Log.info(`[MMM-SenseHat] Configuration received for ${id}`);

      // Replace any existing timer for this instance
      const prev = this.instances.get(id);
      if (prev && prev.timer) clearInterval(prev.timer);

      const rec = { config: cfg, pythonPath, timer: null };
      this.instances.set(id, rec);

      this._setupPolling(id);

      // optional: set initial LED state for this instance
      if (cfg.ledMatrixEnabled) {
        this._handleLedCommand(id, { mode: cfg.ledMode || "status", color: cfg.ledColor || [0, 255, 0], text: cfg.ledText || "" });
      }
    } else if (notification === "SENSEHAT_LED_COMMAND") {
      const cmd = payload || {};
      const id = cmd.identifier || "__default__";
      this._handleLedCommand(id, cmd);
    }
  },

  _setupPolling(id) {
    const rec = this.instances.get(id);
    if (!rec) return;
    if (rec.timer) clearInterval(rec.timer);
    const interval = Math.max(1000, parseInt((rec.config && rec.config.updateInterval) || 5000, 10));
    // Poll immediately, then on interval
    this._pollOnce(id);
    rec.timer = setInterval(() => this._pollOnce(id), interval);
    Log.info(`[MMM-SenseHat] Polling every ${interval} ms for ${id}`);
  },

  _pollOnce(id) {
    const rec = this.instances.get(id);
    if (!rec) return;
    const args = [this.readerPath, "--read"]; // explicit --read
    const child = spawn(rec.pythonPath, args, { cwd: path.dirname(this.readerPath) });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => {
      Log.error(`[MMM-SenseHat] Failed to spawn Python for ${id}: ${err.message}`);
      // forward to front-end
      this.sendSocketNotification("SENSEHAT_DATA", { identifier: id, error: `Failed to spawn Python: ${err.message}` });
    });

    child.on("close", (code) => {
      if (stderr && rec.config && rec.config.debug) {
        Log.warn(`[MMM-SenseHat] python stderr (${id}): ${stderr.trim()}`);
      }
      if (code !== 0 && !stdout) {
        const msg = `Python exited with code ${code}`;
        Log.warn(`[MMM-SenseHat] ${msg} (${id})`);
        this.sendSocketNotification("SENSEHAT_DATA", { identifier: id, error: msg });
        return;
      }
      try {
        const data = JSON.parse(stdout.trim());
        if (data && data.error) {
          Log.warn(`[MMM-SenseHat] Python reported error (${id}): ${data.error}`);
          // Forward error payload to frontend so UI can display it
          this.sendSocketNotification("SENSEHAT_DATA", Object.assign({ identifier: id }, data));
          return;
        }
        this.sendSocketNotification("SENSEHAT_DATA", Object.assign({ identifier: id }, data));
      } catch (e) {
        Log.warn(`[MMM-SenseHat] Invalid JSON from python (${id}): ${e.message}. Raw: ${stdout.trim()}`);
        this.sendSocketNotification("SENSEHAT_DATA", { identifier: id, error: `Invalid JSON from python: ${e.message}` });
      }
    });
  },

  _handleLedCommand(id, cmd) {
    const rec = this.instances.get(id);
    if (!rec || !rec.config || !rec.config.ledMatrixEnabled) return;

    const args = [this.readerPath];
    if (cmd.clear || cmd.mode === "off") {
      args.push("--clear");
    } else if (cmd.mode === "text") {
      args.push("--mode", "text");
      if (cmd.text) {
        args.push("--text", String(cmd.text));
      }
      const color = Array.isArray(cmd.color) ? cmd.color : rec.config.ledColor || [255, 255, 255];
      args.push("--color", color.join(","));
    } else {
      // status mode
      args.push("--mode", "status");
      const color = Array.isArray(cmd.color) ? cmd.color : rec.config.ledColor || [0, 255, 0];
      args.push("--color", color.join(","));
    }

    const child = spawn(rec.pythonPath, args, { cwd: path.dirname(this.readerPath) });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => {
      if (code !== 0) {
        Log.warn(`[MMM-SenseHat] LED command failed (${id}) with code ${code}. ${stderr.trim()}`);
      } else if (rec.config && rec.config.debug && stderr.trim()) {
        Log.warn(`[MMM-SenseHat] LED command stderr (${id}): ${stderr.trim()}`);
      }
    });
  }
});
