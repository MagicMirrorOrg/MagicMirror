#!/usr/bin/env python3
import argparse
import json
import sys
from datetime import datetime, timezone

try:
  from sense_hat import SenseHat
except Exception as e:
  SenseHat = None


def iso_timestamp():
  return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def safe_float(value):
  try:
    return float(value) if value is not None else None
  except Exception:
    return None


def read_sensors():
  if SenseHat is None:
    return {"error": "sense_hat library not available"}

  try:
    sh = SenseHat()
  except Exception as e:
    # If we can't even init the SenseHat, we really are stuck
    return {"error": f"SenseHat init failed: {e}"}

  # Read each sensor separately so one failure doesn't kill everything
  try:
    temperature = safe_float(sh.get_temperature())
  except Exception:
    temperature = None

  try:
    humidity = safe_float(sh.get_humidity())
  except Exception:
    humidity = None

  try:
    pressure = safe_float(sh.get_pressure())
  except Exception:
    pressure = None

  # Orientation
  try:
    orientation = sh.get_orientation() or {}
  except Exception:
    orientation = {}

  pitch = orientation.get("pitch")
  roll = orientation.get("roll")
  yaw = orientation.get("yaw")

  # IMU sensors
  try:
    accel_raw = sh.get_accelerometer_raw() or {}
  except Exception:
    accel_raw = {}

  try:
    gyro_raw = sh.get_gyroscope_raw() or {}
  except Exception:
    gyro_raw = {}

  try:
    mag_raw = sh.get_compass_raw() or {}
  except Exception:
    mag_raw = {}

  return {
    "temperature": temperature,
    "humidity": humidity,
    "pressure": pressure,
    "orientation": {
      "pitch": safe_float(pitch),
      "roll": safe_float(roll),
      "yaw": safe_float(yaw)
    },
    "accelerometer": {
      "x": safe_float(accel_raw.get("x")),
      "y": safe_float(accel_raw.get("y")),
      "z": safe_float(accel_raw.get("z"))
    },
    "gyroscope": {
      "x": safe_float(gyro_raw.get("x")),
      "y": safe_float(gyro_raw.get("y")),
      "z": safe_float(gyro_raw.get("z"))
    },
    "magnetometer": {
      "x": safe_float(mag_raw.get("x")),
      "y": safe_float(mag_raw.get("y")),
      "z": safe_float(mag_raw.get("z"))
    },
    "timestamp": iso_timestamp(),
  }


def parse_color(s):
  parts = [p.strip() for p in s.split(",")]
  if len(parts) != 3:
    raise ValueError("Color must be r,g,b")
  rgb = []
  for p in parts:
    v = int(p)
    if v < 0:
      v = 0
    if v > 255:
      v = 255
    rgb.append(v)
  return tuple(rgb)


def apply_led(args):
  if SenseHat is None:
    print("sense_hat library not available", file=sys.stderr)
    return 1
  try:
    sh = SenseHat()
    if args.clear:
      sh.clear()
      return 0
    if args.mode == "text":
      color = parse_color(args.color) if args.color else (255, 255, 255)
      sh.clear()
      sh.show_message(args.text or "", text_colour=color, scroll_speed=0.07)
      return 0
    # default status mode
    color = parse_color(args.color) if args.color else (0, 255, 0)
    sh.clear(color)
    return 0
  except Exception as e:
    print(f"LED command failed: {e}", file=sys.stderr)
    return 2


def main():
  parser = argparse.ArgumentParser(description="Sense HAT reader and LED controller")
  parser.add_argument("--read", action="store_true", help="Read sensors and output JSON")
  parser.add_argument("--mode", choices=["status", "text"], help="LED mode")
  parser.add_argument("--text", help="Text to display when mode=text")
  parser.add_argument("--color", help="Color as r,g,b")
  parser.add_argument("--clear", action="store_true", help="Clear LED matrix")

  args = parser.parse_args()

  if args.read or (not args.mode and not args.clear):
    data = read_sensors()
    print(json.dumps(data))
    return 0 if "error" not in data else 3

  # Otherwise LED control
  return apply_led(args)


if __name__ == "__main__":
  sys.exit(main())
