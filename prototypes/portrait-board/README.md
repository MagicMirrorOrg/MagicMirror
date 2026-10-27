# Portrait information screen — design prototype

Open `index.html` in a browser (double-click it in Finder). This is a **standalone mockup**; it does not change the existing MagicMirror page at `http://localhost:8080` and requires no server or npm command.

Use **Før 14:00** and **Etter 14:00** to preview the two modes. Uncheck **Vis møter i dag** to see the workday layout without shared events. All times, dates, weather, meetings and departures are **example data**, not live information; there is no automatic switch at 14:00 yet.

The canvas is 9:16 (2160 × 3840 on a 4K portrait screen) and scales to fit the available browser height on a landscape monitor. For a full-size preview, use browser device emulation at 2160 × 3840 or a portrait monitor. The controls sit outside the canvas so they would not appear on the actual display.

Next steps after design review: choose content hierarchy and type sizes at real viewing distance; connect concise weather to Yr, shared events to Google Calendar and departures to Ruter; then add Oslo-time scheduling, empty states and stale-data handling. Keep live data separate from the preview until the design is approved.
