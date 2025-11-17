/**
 * MagicMirror Credentials Template
 *
 * ANLEITUNG:
 * 1. Kopiere diese Datei zu "credentials.js" im selben Verzeichnis
 * 2. Fülle deine echten API-Keys und Credentials ein
 * 3. credentials.js wird NICHT ins Git-Repository committed (siehe .gitignore)
 *
 * NIEMALS diese Datei mit echten Credentials committen!
 */

module.exports = {
    // ===== API KEYS =====

    // OpenWeather API Key
    // Erhalten unter: https://openweathermap.org/api
    openWeatherApiKey: "DEIN_OPENWEATHER_API_KEY",

    // Tankerkönig Fuel API Key
    // Erhalten unter: https://creativecommons.tankerkoenig.de/
    fuelApiKey: "DEIN_FUEL_API_KEY",

    // News API Key
    // Erhalten unter: https://newsapi.org/
    newsApiKey: "DEIN_NEWS_API_KEY",

    // ===== SPOTIFY CREDENTIALS =====

    // Spotify Developer App Credentials
    // Erhalten unter: https://developer.spotify.com/dashboard/applications
    spotifyClientID: "DEIN_SPOTIFY_CLIENT_ID",
    spotifyClientSecret: "DEIN_SPOTIFY_CLIENT_SECRET",
    spotifyAccessToken: "DEIN_SPOTIFY_ACCESS_TOKEN",
    spotifyRefreshToken: "DEIN_SPOTIFY_REFRESH_TOKEN",

    // ===== WLAN CREDENTIALS =====

    // Nur benötigt, wenn du den WLAN-QR-Code im MMM-SystemInfo Modul nutzen möchtest
    wifiNetwork: "DEIN_WLAN_NAME",
    wifiPassword: "DEIN_WLAN_PASSWORT"
};
