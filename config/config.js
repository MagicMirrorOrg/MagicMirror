// MagicMirror Konfiguration
// Zuletzt aktualisiert: 19.05.2025

// Ausgelagerte API-Keys und vertrauliche Daten
// Diese sollten in einer separaten Datei sein, die nicht im Git-Repository liegt
const credentials = {
    openWeatherApiKey: "9ea3a559d68a46f2a857089dd44a2506",
    fuelApiKey: "b0619a4b-684f-850a-dca4-801cb7d352e4",
    spotifyClientID: "5ff54d7644b34dfb93f690adff326c13",
    spotifyClientSecret: "3465cefbe93644e392a8201418930019",
    spotifyAccessToken: "BQDmcCwykX5bKiJCwCvVTXdGY13bbgxraQjFXun-XKoVz4BlKmE0vgDkQ1jsAIoGJDA4lUMDXwNJYw7m2OnManwogvFW_HBfpv2bUEKhnN5pbqRrCVK9uHHPl4zwkd_4rwSW10CJKS0cfhBVSFPMhc2FV7LHtodORe7mAId5ya9KbevEZzIXU9IEIqESZ3hm4w6AdBpYiVk1dDZajeQGxg",
    spotifyRefreshToken: "AQCV41PfVxPBCimhc2fEn5GdXG4D-RUY7_JxMm7JzcUd6Kt-2HOKXx76MxOEYOZIo-K5HuvpJHvtPauM9ijF7YOLKCPSGBVDamPePa61L9jFHf_JvoyjwSDsWhQZ4ehfWv0",
    newsApiKey: "fb8822efd5ed49e28ed4649040ca6d71",
    // WLAN-Daten
    wifiNetwork: "MagentaWLN-3UKJ",
    wifiPassword: "15774643966064724748" // Achtung: Sollte in einem sicheren Speicher aufbewahrt werden
};

// Standort-Konfigurationen
const locationSettings = {
    latitude: 51.100411,
    longitude: 6.811775,
    city: "Dormagen",
    agsCode: "051620004004"  // AGS Code für Dormagen
};

let config = {
    // Grundlegende Server-Einstellungen
    address: "localhost", // Geändert von "0.0.0.0" zu "localhost" für mehr Sicherheit
    port: 8080,
    basePath: "/",

    // Sicherheitseinstellungen
    ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.0.0/24"], // Beschränkt auf localhost und lokales Netzwerk
    useHttps: false,
    httpsPrivateKey: "",
    httpsCertificate: "",

    // Lokalisierungseinstellungen
    language: "de",
    locale: "de-DE",
    timeFormat: 24,
    units: "metric",

    // Systemeinstellungen
    logLevel: ["INFO", "WARN", "ERROR"], // DEBUG und LOG entfernt für weniger Logs
    serverOnly: false, // Kommentar hinzugefügt, damit die Option leichter verständlich ist

    // Module-Konfiguration
    modules: [
        // ===== ANZEIGEMODULE =====

        // Wallpaper
/*        {
            module: "MMM-Wallpaper",
            position: "fullscreen_below",
            config: {
                source: "bing",
                slideInterval: 600 * 1000, // Erhöht auf 10 Minuten für weniger Netzwerkverkehr
            }
        },
*/
        // Uhr & Datum
        {
            module: "clock",
            position: "top_left"
        },

        // ===== INFORMATIONSMODULE =====

        // Wettervorhersage
        {
            module: "MMM-OpenWeatherForecast",
            header: "Wetter Dormagen",
NN            position: "top_right",
            config: {
                apikey: credentials.openWeatherApiKey,
                latitude: locationSettings.latitude,
                longitude: locationSettings.longitude,
                iconset: "2c",
                concise: true,
                showWind: false,
                displayKmhForWind: true,
                animatedIconStartDelay: 2000,
                label_timeFormat: "HH:mm",
                forecastLayout: "tiled",
                forecastHeaderText: "",
                label_sunriseTimeFormat: "HH:mm",
                maxHourliesToShow: 3,        // Erhöht von 0, um stündliche Vorhersagen zu zeigen
                maxDailiesToShow: 4,
                label_days: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
                updateInterval: 30 * 60 * 1000, // 30 Minuten Update-Intervall hinzugefügt
            }
        },

        // Familienkalender
        {
            module: "MMM-MyCalendar",
            header: "Familienkalender",
            position: "top_left",
            config: {
                maximumEntries: 8,        // Reduziert von 16 für bessere Übersichtlichkeit
                maxTitleLength: 40,       // Reduziert von 50 für bessere Lesbarkeit
                fade: false,
                dateFormat: "DD MMM",     // Gekürzt von "DD MMMM" für Platzersparnis
                timeFormat: "HH:mm",
                joiningWord: "um",
                colored: true,            // Farbige Kalenderereignisse zur besseren Unterscheidung
                showLocation: true,       // Zeigt den Ort des Ereignisses an
                calendars: [
                    {
                        symbol: "calendar-check",
                        url: "https://calendar.google.com/calendar/ical/robinfrank1824%40gmail.com/public/basic.ics",
                        color: "#36c"     // Farbe für Kalenderereignisse
                    },
                    {
                        symbol: "calendar-alt",
                        url: "https://calendar.google.com/calendar/ical/de.german%23holiday%40group.v.calendar.google.com/public/basic.ics",
                        color: "#c33"     // Farbe für Feiertage
                    }
                ],
                updateInterval: 10 * 60 * 1000 // 10 Minuten (neu hinzugefügt)
            }
        },

        // NINA Warnungen
        {
            module: "MMM-NINA",
            header: "NINA Warnungen Dormagen",
            position: "top_right",
            config: {
                ags: locationSettings.agsCode,
                maxAgeInHours: 12,        // Erhöht von 6 auf 12 Stunden
                mergeAlerts: true,        // Geändert auf true um ähnliche Warnungen zusammenzufassen
                showIcon: true,
                showNoWarning: true,
                updateIntervalInSeconds: 3600, // Auf 1 Stunde erhöht (von 30 Minuten)
            }
        },

        // Öffentliche Verkehrsmittel - Abfahrten
        {
            module: "MMM-PublicTransportHafas",
            position: "top_right",
            config: {
                stationID: "586867",
                stationName: "Bahnhof Dormagen",
                direction: "",
                excludedTransportationTypes: ["bus", "taxi"],
                ignoredLines: [],
                timeToStation: 10,
                showAbsoluteTime: true,
                displayLastUpdate: true,  // Auf true gesetzt
                maxUnreachableDepartures: 2,
                maxReachableDepartures: 3,
                showColoredLineSymbols: true,
                customLineStyles: "koeln",
                showOnlyLineNumbers: true,
                showTableHeadersAsSymbols: true,
                useColorForRealtimeInfo: true,
                tableHeaderOrder: ["line", "direction", "time"],
                updateInterval: 2 * 60 * 1000 // 2 Minuten Update-Intervall hinzugefügt
            }
        },

        // Spritpreise
        {
            module: "MMM-Fuel",
            position: "top_right",
            header: "Aktuelle Spritpreise", // Header hinzugefügt
            config: {
                api_key: credentials.fuelApiKey,
                lat: locationSettings.latitude,
                lng: locationSettings.longitude,
                types: ["diesel", "e5"],  // E5 hinzugefügt für mehr Informationen
                radius: 5,                // Erhöht von 4 auf 5 km
                max: 3,
                rotate: true,
                sortBy: "price",          // Nach Preis sortieren
                showDistance: true,       // Zeigt die Entfernung zur Tankstelle
                shortenText: 20,
                showAddress: true,        // Auf true geändert
                iconHeader: true,         // Auf true geändert
                updateInterval: 15 * 60 * 1000 // 15 Minuten Update-Intervall
            }
        },

        // Tägliche Routine
{
    module: "MMM-GoogleSheets",
    header: "Tägliche Routine",
    position: "top_left",
    config: {
        url: "https://script.google.com/macros/s/AKfycbwVjNUZFHRF-caRwTNJoSeCydyXC6l60f6FemwcmpVj48o6Ptz7ZRR7RBDUgn1EWhpkBQ/exec",
        sheet: "MMMGoogleSheets",
        range: "A1:C16",
        cellStyle: "invert",
        stylesFromSheet: ["text-align", "color", "background-color"],
        customStyles: ["font-size: 12px", "padding: 3px"],
        headerStyles: ["font-weight: bold", "background-color:rgb(206, 206, 206)"],
        retryDelay: 10000,     // 10 Sekunden Wartezeit zwischen Versuchen
        maxRetries: 5,         // Maximal 5 Versuche
        updateInterval: 300000, // Alle 5 Minuten aktualisieren statt jede Minute

    }
},

        // ===== SYSTEM- UND STEUERUNGSMODULE =====

        // PIR Sensor für Energiesparmodus
        {
            module: 'EXT-Screen',
            position: 'top_left',
            configDeepMerge: true,
            config: {
                delay: 10 * 60 * 1000,    // Auf 10 Minuten erhöht (von 8)
                animateBody: true,        // Animation beim Ein-/Ausschalten
                displayBar: true,         // Countdown-Anzeige aktiviert
                displayLastPresence: true, // Zeigt letzte Erkennungszeit
                displayAvailability: true // Zeigt an, ob der Sensor aktiv ist
            }
        },

        {
            module: 'EXT-Pir',
            config: {
                debug: false,
                gpio: 27,
                reverseValue: false,
                activateDelay: 0,         // Sofortige Aktivierung
                calibrationTime: 10000    // 10 Sekunden Kalibrierungszeit beim Start
            }
        },

        // ===== MEDIEN- UND NACHRICHTENMODULE =====

        // Spotify
        {
            module: "MMM-NowPlayingOnSpotify",
            header: "Spotify",
            position: "top_right",
            config: {
                clientID: credentials.spotifyClientID,
                clientSecret: credentials.spotifyClientSecret,
                accessToken: credentials.spotifyAccessToken,
                refreshToken: credentials.spotifyRefreshToken,
                showCoverArt: true,           // Album-Cover anzeigen
                showQrCode: false,           // Kein QR-Code nötig
                updatesEvery: 5,              // Sekunden zwischen Updates
                alignment: "left",            // Text-Ausrichtung
                useBottomBar: false,          // Kein Fortschrittsbalken unten
                showPlayingIcon: true,        // Zeigt Play/Pause-Symbol
                songInfoCustomOrder: ["title", "artist", "album"], // Reihenfolge der Info
                debug: false                  // Debug-Modus aus
            }
        },

        // Nachrichten
                {
                module: "MMM-NewsAPI",
                header: "Nachrichten",
                position: "top_right",
                config: {
                        apiKey: credentials.newsApiKey,
                        debug: true,
                        choice: "everything",
                        pageSize: 30,
                        sortBy: "publishedAt",
                        drawInterval: 1000*30, // 30 sec
                        fetchInterval: 1000*30*60, // 30 min
                        query: {
                                country: "",
                                category: "",
                                q: "",
                                qInTitle: "",
                                sources: "",
                                domains: "tagesspiegel,morgenpost.de,rbb24.de,tagesschau.de",
                                excludeDomains: "",
                                language: ""
                                }
                        }
                },

        // SystemInfo & WLAN QR-Code
        {
            module: 'MMM-SystemInfo',
            position: "top_left",
            header: "System & WLAN",      // Header hinzugefügt
            config: {
                // QR-Code Konfiguration für dein WLAN
                network: credentials.wifiNetwork,
                password: credentials.wifiPassword,
                authType: "WPA",
                qrSize: 120,               // Verkleinert von 150 auf 120
                hiddenId: false,

                // Layout und Anzeige-Optionen
                layout: "ltr",             // QR-Code links, Statistiken rechts
                wifiDataCompact: false,     // Kompakte Darstellung der WLAN-Infos
                showNetwork: true,
                showPassword: false,       // Aus Sicherheitsgründen kein Passwort anzeigen

                // System-Informationen
                showCpuUsage: true,
                showCpuTemp: true,
                showMemoryUsage: true,
                showDiskUsage: true,
                showNetworkStatus: true,
                showUptime: true,          // Betriebszeit anzeigen

                // Farben und Formatierung
                connectedColor: "#00C853", // Helleres Grün
                disconnectedColor: "#FF5252", // Helleres Rot
                units: "metric",
                decimal: 1,

                // Update-Intervall
                updateInterval: 30000      // Auf 30 Sekunden erhöht (von 10)
            }
        },

        // Update Notification für Dashboard
        {
            module: "updatenotification",
            position: "top_left",
            config: {
                updateInterval: 6 * 60 * 60 * 1000 // Alle 6 Stunden prüfen statt Standard
            }
        },

        // ===== EIGENE MODULE (BEISPIELE) =====

        // Wetter-Radar (optional, auskommentiert)
        /*
        {
            module: "MMM-DWD-WarnWeather",
            position: "top_right",
            header: "Wetterradar",
            config: {
                lat: locationSettings.latitude,
                lng: locationSettings.longitude,
                zoomLevel: 8,              // Zoom-Level des Radars
                updateInterval: 15 * 60 * 1000, // 15 Minuten
                animationInterval: 2000,   // 2 Sekunden zwischen Frames
                dynamicLocation: true,     // Dynamische Position basierend auf IP
                showValues: false          // Keine Werte anzeigen
            }
        },
        */

        // Luftqualität (optional, auskommentiert)
        /*
        {
            module: "MMM-AirQuality",
            position: "top_right",
            header: "Luftqualität",
            config: {
                location: `geo:${locationSettings.latitude};${locationSettings.longitude}`,
                updateInterval: 30 * 60 * 1000 // 30 Minuten
            }
        }
        */
    ]
};

// Automatisch die Adresse auf localhost setzen, wenn die ipWhitelist nicht leer ist
if (config.ipWhitelist && config.ipWhitelist.length > 0) {
    config.address = "localhost";
}

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}

