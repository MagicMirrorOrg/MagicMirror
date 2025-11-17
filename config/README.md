# MagicMirror Konfiguration

## 🔐 Sicherheits-Setup

### Credentials einrichten

Die sensiblen Daten (API-Keys, Passwörter) sind **nicht** in diesem Repository enthalten.

**Erstmalige Einrichtung:**

1. Kopiere die Vorlage:
   ```bash
   cd config
   cp credentials.example.js credentials.js
   ```

2. Öffne `credentials.js` und trage deine echten Credentials ein

3. **Wichtig:** Die Datei `credentials.js` wird automatisch von Git ignoriert!

### Benötigte API-Keys

- **OpenWeather API:** https://openweathermap.org/api
- **Tankerkönig (Fuel):** https://creativecommons.tankerkoenig.de/
- **News API:** https://newsapi.org/
- **Spotify Developer:** https://developer.spotify.com/dashboard/applications

### Dateien-Übersicht

- `config.js` - Hauptkonfiguration (OHNE sensible Daten)
- `credentials.js` - Deine persönlichen API-Keys (**NICHT in Git**)
- `credentials.example.js` - Vorlage für neue Installationen (**IN Git**)

## 📝 Konfiguration anpassen

Die Hauptkonfiguration befindet sich in `config.js`. Hier kannst du Module, Positionen, Update-Intervalle und mehr anpassen.

### Standort ändern

Die Standort-Koordinaten sind in `config.js` unter `locationSettings` definiert:

```javascript
const locationSettings = {
    latitude: 51.100411,
    longitude: 6.811775,
    city: "Dormagen",
    agsCode: "051620004004"  // AGS Code für NINA Warnungen
};
```

### Module aktivieren/deaktivieren

Kommentiere Module in der `modules`-Array aus oder entferne den Kommentar, um sie zu aktivieren.

## ⚠️ Wichtige Sicherheitshinweise

1. **NIEMALS** die Datei `credentials.js` ins Git-Repository committen!
2. Teile deine API-Keys nicht öffentlich
3. Überprüfe die `.gitignore` Datei, bevor du pushst
4. Bei Problemen: Überprüfe, ob `config/credentials.js` in `.gitignore` steht
