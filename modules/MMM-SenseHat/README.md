MMM-SenseHat
============

A 3rd‑party MagicMirror² module that integrates the Raspberry Pi Sense HAT. It reads sensor data (temperature, humidity, pressure, optional orientation) and can control the Sense HAT 8×8 RGB LED matrix for simple status indication or scrolling text.

## Screenshot
![MMM-SenseHat screenshot](images/how_its_working.png)

Features
- Display temperature, humidity, pressure, and optionally orientation (pitch/roll/yaw)
- Periodic polling interval (configurable)
- Optional LED matrix control: off, status color, or scrolling text
- Basic threshold‑based LED status (green when normal, red when out‑of‑range)

Requirements
- Raspberry Pi with a Sense HAT attached
- Python 3 with the official sense HAT library

Install dependencies on the Raspberry Pi
```bash
sudo apt update
sudo apt install -y sense-hat python3-sense-hat
```

Installation (as a 3rd‑party module)
1) Clone this module into your MagicMirror installation under `modules/MMM-SenseHat`:
```bash
cd ~/MagicMirror/modules
git clone https://github.com/YOUR_GITHUB_ACCOUNT/MMM-SenseHat.git MMM-SenseHat
```

2) (Optional) Ensure the Python helper is executable:
```bash
chmod +x ~/MagicMirror/modules/MMM-SenseHat/python/reader.py
```

Configuration
Add the module to your `config/config.js`:
```js
{
  module: "MMM-SenseHat",
  position: "top_right",
  config: {
    updateInterval: 5000,
    showTemperature: true,
    showHumidity: true,
    showPressure: true,
    showOrientation: false,
    temperatureUnit: "C",
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
    // Optional: override Python executable path if needed (e.g., "/usr/bin/python3")
    // pythonPath: "/usr/bin/python3"
  }
}
```

How it works
- Frontend (MMM-SenseHat.js): Displays data and optionally sends LED status commands based on thresholds.
- Node Helper (node_helper.js): Spawns the Python helper to read sensors at a set interval and forwards LED commands to it. Respects `config.pythonPath` if provided.
- Python Helper (python/reader.py): Uses `from sense_hat import SenseHat` to read sensors and control the LED matrix. Prints JSON to stdout in read mode.

Troubleshooting
1) Check that the Sense HAT is detected by the kernel
```bash
ls -l /dev/i2c*
dmesg | grep -i "sense"
```
Expect:
- `/dev/i2c-1` present
- A line similar to: `fb1: RPi-Sense FB frame buffer device`
- A joystick device entry for the Sense HAT

2) Probe I²C bus 1
```bash
sudo i2cdetect -y 1
```
On a working Sense HAT, you should see several non-"--" addresses (for example `1c`, `39`, `5c`, `5f`, `6a`). If everything shows `--`, the HAT might not be seated correctly or could be faulty.

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
- If you see errors like `OSError: Humidity Init Failed`, there may be a contact problem on the header or a sensor issue.

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
If you don’t see LEDs:
- Power off the Raspberry Pi.
- Firmly press the Sense HAT onto the 40‑pin header (common on new boards).
- Boot again and re‑run the test.

5) What the MagicMirror module will show
- "Loading Sense HAT data…" → Python helper hasn’t delivered any data yet.
- "Sense HAT: no sensor data (check hardware or drivers)" → helper runs, but all sensor fields are null.
- "Sense HAT error: …" → helper reported an explicit error (library missing, init failure, etc.).

License
MIT (follow the MagicMirror² project license)
