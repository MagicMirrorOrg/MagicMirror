# Traffic Module

The Traffic module displays real-time traffic congestion information for a route using the Google Maps Routes API.

## Features

- Real-time traffic conditions
- Travel time with and without traffic
- Traffic delay calculation
- Traffic level indicators (Light/Moderate/Heavy/Severe)
- Route distance
- Support for alternative routes
- Automatic periodic updates

## Installation

This module is included in the default MagicMirror modules. No additional installation is required.

## Configuration

Add the following configuration block to your `config/config.js` file:

```javascript
{
	module: "traffic",
	position: "top_right", // any valid position
	header: "Traffic",
	config: {
		apiKey: "YOUR_GOOGLE_ROUTES_API_KEY",
		origin: "123 Main St, City, State",
		destination: "456 Oak Ave, City, State",
		updateInterval: 5 * 60 * 1000, // 5 minutes
	}
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | String | **Required** | Your Google Routes API key |
| `origin` | String | **Required** | Starting address or coordinates |
| `destination` | String | **Required** | Destination address or coordinates |
| `updateInterval` | Number | `5 * 60 * 1000` | Update interval in milliseconds (5 minutes) |
| `initialLoadDelay` | Number | `0` | Initial load delay in milliseconds |
| `showAlternatives` | Boolean | `false` | Show alternative routes |
| `trafficModel` | String | `"BEST_GUESS"` | Traffic model: `"BEST_GUESS"`, `"PESSIMISTIC"`, or `"OPTIMISTIC"` |
| `routingPreference` | String | `"TRAFFIC_AWARE_OPTIMAL"` | `"TRAFFIC_AWARE"` or `"TRAFFIC_AWARE_OPTIMAL"` |
| `avoid` | Array | `[]` | Avoid options: `["TOLLS", "HIGHWAYS", "FERRIES", "INDOOR"]` |
| `units` | String | `config.units` | `"metric"` or `"imperial"` |
| `showDistance` | Boolean | `true` | Display total distance |
| `showDuration` | Boolean | `true` | Display travel time |
| `showTrafficDelay` | Boolean | `true` | Show delay due to traffic |
| `showTrafficLevel` | Boolean | `true` | Show traffic level indicator |
| `header` | String | `"Traffic"` | Module header text |
| `animationSpeed` | Number | `1000` | Animation speed in milliseconds |
| `fade` | Boolean | `true` | Enable fade animations |
| `fadePoint` | Number | `0.25` | Fade point (0-1) |

### Using Coordinates

Instead of addresses, you can use coordinates:

```javascript
config: {
	apiKey: "YOUR_API_KEY",
	originLat: 28.5383,
	originLng: -81.3792,
	destinationLat: 28.4158,
	destinationLng: -81.2989,
	// ... other options
}
```

## Google Routes API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Routes API** (not the legacy Directions API)
4. Create credentials → API Key
5. (Recommended) Restrict the API key to Routes API only
6. Copy your API key and add it to the module configuration

**Important**: The Google Directions API was designated as legacy on March 1, 2025. This module uses the modern Routes API.

## API Costs

- Free tier: $200/month credit (typically ~40,000 requests)
- Standard pricing: ~$5 per 1,000 requests
- Default update interval (5 minutes) = ~288 requests/day = ~8,640 requests/month

## Traffic Levels

Traffic levels are calculated based on delay percentage:
- **Light**: Delay < 10% of normal duration
- **Moderate**: Delay 10-30% of normal duration
- **Heavy**: Delay 30-50% of normal duration
- **Severe**: Delay > 50% of normal duration

## Troubleshooting

### Module shows "Loading traffic data..." indefinitely
- Check that your API key is correct
- Verify the Routes API is enabled in Google Cloud Console
- Check the browser console and server logs for errors

### "API key is required" error
- Make sure `apiKey` is set in your config

### "Origin and destination are required" error
- Ensure both `origin` and `destination` are configured
- Or use `originLat`/`originLng` and `destinationLat`/`destinationLng`

### No route found
- Verify the addresses are valid and accessible by car
- Check that the route exists (not blocked, etc.)

## License

This module is part of MagicMirror² and follows the same license.

