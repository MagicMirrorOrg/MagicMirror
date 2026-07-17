# displaypower

Controls display power (sleep/wake) on a schedule or via notifications from other modules. Useful for turning off the mirror screen at night and waking it in the morning without external cron jobs.

## Configuration

```js
{
  module: "displaypower",
  config: {
    schedule: [
      { time: "0 7 * * *",  action: "on"  },  // wake at 7:00am every day
      { time: "0 23 * * *", action: "off" },  // sleep at 11:00pm every day
    ]
  }
}
```

`time` uses standard cron syntax (minute hour day month weekday).

## Config options

| Option | Default | Description |
|--------|---------|-------------|
| `schedule` | `[]` | Array of `{ time, action }` entries |
| `driver` | `"auto"` | Display driver (see below) |
| `display` | auto-detected | Output name for Wayland drivers (e.g. `"HDMI-A-1"`) |

## Drivers

| Value | When to use |
|-------|-------------|
| `"auto"` | Detect from environment (recommended) |
| `"wlopm"` | Wayland, wlopm installed |
| `"wlr-randr"` | Wayland, wlr-randr installed |
| `"x11"` | X11 display server |
| `"vcgencmd"` | Raspberry Pi firmware fallback |

Auto-detection order: if `WAYLAND_DISPLAY` is set → tries `wlopm`, then `wlr-randr`, then `vcgencmd`. If `DISPLAY` is set → `x11`. Otherwise → `vcgencmd`.

## Notifications

**Incoming** — send from any other module to control the display:

```js
this.sendNotification("DISPLAY_POWER", { action: "on" });
this.sendNotification("DISPLAY_POWER", { action: "off" });
```

**Outgoing** — broadcast after each state change:

```js
// payload: { on: true | false }
notificationReceived("DISPLAY_POWER_STATE", payload)
```
