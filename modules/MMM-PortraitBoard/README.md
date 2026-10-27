# Portrait board in MagicMirror

Configured in `config/config.js` as the only visible module. Open `http://localhost:8080` after `npm run server`. The page fills a portrait display (2160 × 3840 on a typical 4K portrait screen); on a landscape browser it is centered at 9:16 for preview. The operating system must rotate the physical monitor separately.

For a temporary going-home layout preview with **Wednesday, 21 October, 15:00** and **God tur hjem**, open `http://localhost:8080/?preview=wednesday`. This only changes the displayed date/time and view in that browser tab. Weather and departures are still live and departure minutes refer to the real current time. Remove the query string to return to the normal schedule.

To inspect the dashboard at a morning time, open `http://localhost:8080/?preview=morning`. It shows **09:00** on today's date with live weather and departures; departure minutes refer to the real current time.

To compare all six greetings side by side using the dashboard's actual header and weather styling, open `http://localhost:8080/?preview=messages`. This comparison uses example weather and dates, and does not affect the normal display.

The Wednesday preview uses the normal number of rows. Bus and T-bane departure times remain live.

- All day: the former going-home layout with compact weather and separate **Buss · Marienlyst** (up to five) and **T-bane · Majorstuen** (up to six) groups, sorted by departure time within each group. Other modes at each stop are excluded. The weather summary changes at 14:30 **Europe/Oslo** to describe the trip home. The view and clock update every 30 seconds without reloading. Shared meetings are not shown in this departures-focused layout.
- Top-right greeting (Europe/Oslo): **Tidlig ute i dag? :)** from 00:00–07:30; **God morgen** from 07:31–09:30; **God formiddag** from 09:31–11:59; **Ha en fin dag :)** from 12:00–14:29; **God helg** from 14:30–23:59 on Fridays and **God tur hjem** at those times on other days.
- T-bane rows show the platform number (**Spor**) from Entur's `quay.publicCode` at the right; missing numbers show a dash. Bus rows do not show a platform column.
- T-bane badges for lines 1–5 use colours sampled from the [official network map](https://cdn.sanity.io/files/5a84xxkm/prod/e46cf566dd5b9cc4e323b70b168115d7bc3c911f.pdf): 1 light blue, 2 orange, 3 purple, 4 dark blue, 5 green. These are map-derived screen colours, not published brand specifications; the line number remains visible independently of colour.
- Missing or old weather disappears. If departure data is unavailable or old, the screen says so instead of showing outdated times.

The existing `MMM-RuterDepartures` module fetches Entur data and broadcasts it to this module; it has no position, so its original display is hidden. The built-in `calendar` module remains configured as a data source for future use, but meetings are not currently displayed. If a shared Google Calendar iCal URL is added later, do not commit a private feed URL containing a secret token.

Weather uses the Norwegian Meteorological Institute's locationforecast API (the data behind Yr), fetched by this module's node helper. This is intentionally a short weather summary, not the Yr meteogram. The sample design at `prototypes/portrait-board/index.html` remains independent and uses example data. This implementation does **not** change the physical display orientation or resolution.
