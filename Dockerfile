FROM node:22-bullseye

WORKDIR /opt/magic_mirror

# Abhängigkeiten kopieren
COPY package.json package-lock.json ./

# Abhängigkeiten installieren
RUN npm install

# Restlichen Code kopieren
COPY . .

# Konfiguration kopieren (falls vorhanden, ansonsten wird das Sample genutzt)
RUN cp config/config.js.sample config/config.js

# MagicMirror Port freigeben (Standard ist 8080)
EXPOSE 8080

# MagicMirror im Server-Only Modus starten (da es auf einem VPS ohne Bildschirm läuft)
CMD ["node", "serveronly"]
