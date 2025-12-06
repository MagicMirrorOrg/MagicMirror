# MMM-SenseHat

## Overview
MMM-SenseHat is a third-party module for MagicMirror² that integrates the official Raspberry Pi Sense HAT.
It displays sensor readings (temperature, humidity, pressure, and optional orientation) and can control the
Sense HAT’s 8×8 RGB LED matrix for a status color or scrolling text.

- Sense HAT product page: https://www.raspberrypi.com/products/sense-hat/
- Sense HAT documentation: https://www.raspberrypi.com/documentation/accessories/sense-hat.html

This is **not** a core/default MagicMirror module. Install it under: `modules/MMM-SenseHat`.

## Features
- Show temperature, humidity, and pressure
- Optional orientation readout (pitch / roll / yaw)
- Configurable polling interval
- LED matrix control: off, status color, or scrolling text
- Basic threshold-based LED status (green when normal, red when out of range)
- Runs as a standard MagicMirror third-party module (folder: `modules/MMM-SenseHat`)

## Requirements
- Raspberry Pi with a Sense HAT attached
- MagicMirror² installed and running
- Python 3 with the official Sense HAT library

Install dependencies on the Raspberry Pi:
```bash
sudo apt update
sudo apt install -y sense-hat python3-sense-hat
```

## Installation
Clone this repository into your MagicMirror installation under `modules/MMM-SenseHat`.
```bash
cd ~/MagicMirror/modules
git clone https://github.com/YOUR_GITHUB_ACCOUNT/MMM-SenseHat.git MMM-SenseHat
```

Optional: ensure the Python helper is executable:
```bash
chmod +x ~/MagicMirror/modules/MMM-SenseHat/python/reader.py
```

## Configuration
Add the module to your `config/config.js` following standard MagicMirror style.
Paste the following object into the `modules: []` array:
```js
const moduleEntry = {
  module: "MMM-SenseHat",
  position: "top_right",
  config: {
    updateInterval: 5000,
    showTemperature: true,
    showHumidity: true,
    showPressure: true,
    showOrientation: false,
    temperatureUnit: "C", // "C" or "F"
    roundValues: 1,
    ledMatrixEnabled: true,
    ledMode: "status", // "off" | "status" | "text"
    ledText: "Hello from Sense HAT",
    ledColor: [0, 255, 0],
    criticalThresholds: {
      temperatureHigh: 30,
      temperatureLow: 10,
      humidityHigh: 80,
      humidityLow: 20
    },
    debug: false,
    // Optional: override Python executable path (e.g., "/usr/bin/python3").
    // For familiarity with MMM-PythonPrint, you can also use `pythonName` (alias of pythonPath).
    // pythonPath: "/usr/bin/python3",
    // pythonName: "/usr/bin/python3"
  }
};
// Then insert `moduleEntry` into the modules array in your config.js
```

## How it works (architecture)
- Frontend (MMM-SenseHat.js)
  - Renders the sensor values in the MagicMirror UI
  - Shows clear states: loading, error, or data
  - May send LED commands (status/text) back to the backend based on thresholds
- Node helper (node_helper.js)
  - Manages one polling loop per module instance (multi-instance safe)
  - Spawns the Python helper on an interval to read sensors
  - Forwards sensor JSON to the correct frontend instance via an `identifier`
  - Accepts LED commands per instance and uses that instance’s config
  - Respects `config.pythonPath` (or `pythonName`) to select the Python executable
- Python helper (python/reader.py)
  - Uses `from sense_hat import SenseHat`
  - Reads sensors and prints JSON to stdout in `--read` mode
  - Controls the LED matrix (status color, text, clear)

## Troubleshooting
1) Check that the Sense HAT is detected by the kernel
```bash
ls -l /dev/i2c*
dmesg | grep -i "sense"
```
Expected:
- `/dev/i2c-1` present
- A line like `fb1: RPi-Sense FB frame buffer device`
- A Sense HAT joystick device entry

2) Probe I²C bus 1
```bash
sudo i2cdetect -y 1
```
On a working Sense HAT, you should see several non-"--" addresses (e.g., `1c`, `39`, `5c`, `5f`, `6a`).
If everything shows `--`, the HAT may not be seated correctly or could be faulty.

3) Test using the official Python library
```bash
python3 - << 'PY'
from sense_hat import SenseHat

sh = SenseHat()

print("Temperature:", sh.get_temperature())
print("Humidity   :", sh.get_humidity())
print("Pressure   :", sh.get_pressure())
PY
```
- If you get numeric values, the sensors are working.
- If you see `OSError: Humidity Init Failed`, check the 40-pin header seating and try again.

4) Check the LED matrix
```bash
python3 - << 'PY'
from sense_hat import SenseHat
from time import sleep

sh = SenseHat()
sh.clear()
sh.show_message("HI", text_colour=(0, 255, 0), scroll_speed=0.07)
sleep(1)
sh.clear()
PY
```
If no LEDs appear:
- Power off the Raspberry Pi
- Firmly press the Sense HAT onto the 40-pin header (common on new boards)
- Boot again and re-run the test

5) What the MagicMirror module will show
- "Loading Sense HAT data…" → Python helper hasn’t delivered any data yet
- "Sense HAT: no sensor data (check hardware or drivers)" → helper runs, but all sensor fields are null
- "Sense HAT error: …" → helper reported an explicit error (e.g., library missing, init failure). Errors are per instance.

## Multiple instances
You can place MMM-SenseHat in `modules:[]` multiple times, each with different options (e.g., different LED policies or intervals). The module tags all traffic with an `identifier` and the helper maintains one polling loop per instance, so configurations are isolated.

Example with two instances (as part of your modules array):
```js
[
  {
    module: "MMM-SenseHat",
    position: "top_right",
    config: { updateInterval: 4000, ledMatrixEnabled: true, ledMode: "status" }
  },
  {
    module: "MMM-SenseHat",
    position: "bottom_right",
    config: { updateInterval: 10000, ledMatrixEnabled: true, ledMode: "text", ledText: "Hello", ledColor: [0, 200, 255] }
  }
]
```

## Screenshots
- images/mmm-sensehat-dashboard.png — UI screenshot of the module
- images/mmm-sensehat-hardware_1.jpg — Raspberry Pi + Sense HAT setup
- images/mmm-sensehat-hardware_2.jpg — Additional hardware photo

Styling: the module wraps its DOM in a `div.mmm-sensehat`, so you can target `.MMM-SenseHat .mmm-sensehat` from your `custom.css` if desired.

## License
MIT — typical for MagicMirror third-party modules.
