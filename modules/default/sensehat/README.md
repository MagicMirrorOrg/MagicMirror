Sense HAT Module for MagicMirror²

This module integrates the Raspberry Pi Sense HAT with MagicMirror². It reads sensor data and can control the 8×8 LED matrix for simple status indication or text display.

Features

- Display temperature, humidity, pressure, and optionally orientation (pitch/roll/yaw)
- Periodic polling interval configurable
- Optional LED matrix control: off, status color, or scrolling text
- Simple threshold-based LED status (green/normal, red/out-of-range)

Requirements

- Raspberry Pi with an attached Sense HAT
- Python 3 and the official Sense HAT library

Install dependencies on the Raspberry Pi:
sudo apt update
sudo apt install -y sense-hat python3-sense-hat

Installation

The module lives in this repository under `modules/default/sensehat`.

On a real Raspberry Pi installation of MagicMirror, you can deploy it in one of two ways:

1. Keep it under `modules/default/sensehat` and create a symlink so MagicMirror can also find it as `modules/sensehat`:
   - cd ~/MagicMirror/modules
   - ln -s default/sensehat sensehat

2. Alternatively, place the module directly under `modules/sensehat` (preferred by some maintainers for non-core modules).

Additionally, ensure the Python helper is executable (optional):

- chmod +x modules/default/sensehat/python/reader.py

### Raspberry Pi deployment example

Assuming your MagicMirror installation is in `~/MagicMirror`:

```
cd ~/MagicMirror/modules
# if the module is under modules/default/sensehat, create a symlink
ln -s default/sensehat sensehat
```

Configuration
Add the module to your config/config.js:

{
module: "sensehat",
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
debug: false
}
}

How it works

- Frontend (sensehat.js): Displays data and optionally sends LED status commands based on thresholds.
- Node Helper (node_helper.js): Spawns the Python helper to read sensors at a set interval and forwards LED commands to it.
- Python Helper (python/reader.py): Uses from sense_hat import SenseHat to read sensors and control the LED matrix. Outputs JSON to stdout in read mode.

Troubleshooting

1. Check that the Sense HAT is detected by the kernel

```
ls -l /dev/i2c*
dmesg | grep -i "sense"
```

You should see:

- /dev/i2c-1 present
- A line like: fb1: RPi-Sense FB frame buffer device
- A joystick device entry for the Sense HAT

2. Probe I²C bus 1

```
sudo i2cdetect -y 1
```

On a working Sense HAT, you should see several non-"--" addresses (e.g. 1c, 39, 5c, 5f, 6a). If everything shows "--", the HAT may not be seated correctly or could be faulty.

3. Test using the official Python library

```
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

4. Check the LED matrix

```
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
- Firmly press the Sense HAT onto the 40-pin header (common on new boards).
- Boot again and re-run the test.

5. What the MagicMirror module will show

- "Loading Sense HAT data…" → Python helper hasn’t delivered any data yet.
- "Sense HAT: no sensor data (check hardware or drivers)" → helper runs, but all sensor fields are null.
- "Sense HAT error: …" → helper reported an explicit error (library missing, init failure, etc.).

If the Python tests fail, the issue is with hardware/OS/driver rather than this MagicMirror module.

License
MIT (follow the MagicMirror² project license)
