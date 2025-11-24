# Traffic Congestion Module - Implementation Plan

## Overview
This document outlines the plan to create a new MagicMirror module that displays traffic congestion information for a route using the Google Maps Routes API (the modern replacement for the legacy Directions API).

## Module Name
`traffic` (to be placed in `modules/default/traffic/`)

---

## 1. Architecture Overview

### 1.1 Module Components
- **Frontend Module** (`traffic.js`): Handles UI rendering and user interaction
- **Node Helper** (`node_helper.js`): Handles API calls to Google Routes API (server-side to avoid CORS issues)
- **Template** (`traffic.njk`): Nunjucks template for rendering the traffic information
- **Stylesheet** (`traffic.css`): Custom styling for the traffic display
- **Translations**: Support for multiple languages (optional, can start with English)

### 1.2 Data Flow
```
User Config → Module Start → Node Helper → Google Routes API
                                      ↓
                              Parse Response
                                      ↓
                              Send to Frontend
                                      ↓
                              Display on Mirror
```

---

## 2. Google Maps API Integration

### 2.1 Required API
- **Google Maps Routes API** (REST endpoint)
  - Endpoint: `https://routes.googleapis.com/directions/v2:computeRoutes`
  - **Note**: The Directions API is now legacy (as of March 1, 2025) and has been replaced by the Routes API
  - The Routes API combines and enhances the functionalities of both the Directions API and Distance Matrix API
  - Provides route information including:
    - Duration in traffic
    - Duration without traffic
    - Distance
    - Traffic congestion levels
    - Route steps with traffic information
    - Enhanced toll information
    - Improved performance
  - **Important**: The API returns traffic data **at the time of the request only**. It does NOT provide automatic updates or real-time streaming. You must implement a **polling mechanism** to periodically fetch updated traffic conditions (see section 6.2).

### 2.2 API Key Requirements
- User must obtain a Google Cloud API key
- Enable "Routes API" in Google Cloud Console (not the legacy Directions API)
- Optionally restrict API key to specific IPs/domains for security

### 2.3 API Request Format
- **Method**: POST (Routes API uses POST requests, unlike the legacy Directions API which used GET)
- **Request Body** (JSON):
  - `origin`: Starting location (Waypoint object with address or lat/lng)
  - `destination`: End location (Waypoint object with address or lat/lng)
  - `routingPreference`: `TRAFFIC_AWARE` or `TRAFFIC_AWARE_OPTIMAL`
  - `departureTime`: Current time in RFC3339 format (for traffic-aware routing)
  - `trafficModel`: `BEST_GUESS`, `PESSIMISTIC`, or `OPTIMISTIC`
  - `computeAlternativeRoutes`: `true` to get multiple route options
  - `routeModifiers`: Object with `avoidTolls`, `avoidHighways`, `avoidFerries`, etc.
  - `languageCode`: Language for directions
  - `units`: `METRIC` or `IMPERIAL`

### 2.4 API Response Structure
- `routes[]`: Array of route options
  - `legs[]`: Route segments
    - `duration`: Normal duration (Duration object)
    - `staticDuration`: Duration without traffic
    - `distanceMeters`: Route distance in meters
    - `steps[]`: Detailed turn-by-turn directions
    - `polyline`: Encoded polyline for route visualization
  - `summary`: Route summary (e.g., "I-95 N")
  - `warnings[]`: Route warnings
  - `routeLabels[]`: Labels for route identification

### 2.5 Key Differences from Legacy Directions API
- **Request Method**: Routes API uses POST instead of GET
- **Request Format**: JSON body instead of URL query parameters
- **Authentication**: API key passed in `X-Goog-Api-Key` header instead of query parameter
- **Response Format**: Slightly different structure (e.g., `distanceMeters` instead of `distance.value`)
- **Field Names**: Uses camelCase (e.g., `BEST_GUESS`) instead of snake_case
- **Enhanced Features**: Better toll information, improved traffic data, more routing options

### 2.6 Migration Considerations
- The Routes API requires a POST request with JSON body, unlike the legacy Directions API which used GET with query parameters
- Response parsing will need to account for the new structure (e.g., Duration objects instead of simple values)
- Error handling should account for Routes API-specific error codes
- Google provides migration guides for transitioning from Directions API to Routes API

---

## 3. Configuration Options

### 3.1 Required Configuration
```javascript
{
  module: "traffic",
  position: "top_right", // or any valid position
  config: {
    apiKey: "YOUR_GOOGLE_API_KEY", // Required
    origin: "123 Main St, City, State", // Required - starting point
    destination: "456 Oak Ave, City, State", // Required - destination
    updateInterval: 5 * 60 * 1000, // Update every 5 minutes (default)
    showAlternatives: false, // Show multiple route options
    trafficModel: "best_guess", // best_guess, pessimistic, optimistic
    avoid: [], // ["tolls", "highways", "ferries", "indoor"]
    units: config.units, // metric or imperial
    showRouteSummary: true, // Display route name (e.g., "I-95 N")
    showDistance: true, // Display total distance
    showDuration: true, // Display travel time
    showTrafficDelay: true, // Show delay due to traffic
    showTrafficLevel: true, // Show traffic level (light/moderate/heavy)
    header: "Traffic", // Module header
    animationSpeed: 1000,
    fade: true,
    fadePoint: 0.25
  }
}
```

### 3.2 Optional Advanced Configuration
- `originLat` / `originLng`: Use coordinates instead of address
- `destinationLat` / `destinationLng`: Use coordinates instead of address
- `departureTime`: Specific departure time (default: now)
- `language`: Language for directions (default: config.language)
- `region`: Region code for geocoding (e.g., "us")

---

## 4. Module Structure

### 4.1 File Structure
```
modules/default/traffic/
├── traffic.js          # Main module file
├── node_helper.js      # Server-side API handler
├── traffic.njk         # Nunjucks template
├── traffic.css         # Stylesheet
└── README.md           # Module documentation
```

### 4.2 Frontend Module (`traffic.js`)

**Key Methods:**
- `start()`: Initialize module, send config to node helper, trigger initial fetch
- `getDom()`: Generate DOM (or use template)
- `getTemplate()`: Return template filename
- `getTemplateData()`: Prepare data for template
- `socketNotificationReceived()`: Handle data from node helper
- `scheduleUpdate()`: Set up periodic polling to fetch updated traffic data
- `fetchTrafficData()`: Request new data from node helper (triggers API call)

**Data Properties:**
- `trafficData`: Current traffic information
- `routes`: Array of route options
- `lastUpdate`: Timestamp of last update
- `error`: Error state if API call fails
- `updateTimer`: Reference to the polling timer

**Polling Flow:**
1. Module starts → `start()` called
2. Send initial request to node helper → `sendSocketNotification("FETCH_TRAFFIC", config)`
3. Schedule next update → `scheduleUpdate()`
4. When data received → `socketNotificationReceived("TRAFFIC_DATA", data)`
5. After processing → `scheduleUpdate()` schedules next poll
6. Repeat steps 2-5 at configured interval

### 4.3 Node Helper (`node_helper.js`)

**Key Methods:**
- `start()`: Initialize helper
- `socketNotificationReceived()`: Handle `FETCH_TRAFFIC` notification from frontend, triggers API call
- `fetchTrafficData()`: Make API call to Google Routes API (POST request)
- `processTrafficData()`: Parse and format API response
- `sendTrafficData()`: Send processed data to frontend via `sendSocketNotification("TRAFFIC_DATA", data)`

**Dependencies:**
- `node-fetch` or native `https` module for API calls
- JSON handling for request/response (native `JSON`)

**Note**: The node helper does NOT implement polling itself. It responds to requests from the frontend module, which handles the polling schedule. This separation allows the frontend to control update timing and pause updates when the module is hidden.

### 4.4 Template (`traffic.njk`)

**Display Elements:**
- Route summary (e.g., "I-95 N")
- Origin → Destination
- Current travel time
- Normal travel time (without traffic)
- Traffic delay (difference)
- Distance
- Traffic level indicator (color-coded)
- Alternative routes (if enabled)

**Layout Options:**
- Compact view (single line)
- Detailed view (multi-line with more info)
- Icon-based indicators for traffic levels

### 4.5 Stylesheet (`traffic.css`)

**Styling Considerations:**
- Traffic level colors:
  - Green: Light traffic
  - Yellow: Moderate traffic
  - Orange: Heavy traffic
  - Red: Severe traffic
- Responsive layout
- Fade animations
- Icon styling (Font Awesome)
- Typography matching MagicMirror theme

---

## 5. Implementation Steps

### Phase 1: Basic Setup
1. ✅ Create module directory structure
2. ✅ Create basic `traffic.js` with module registration
3. ✅ Create basic `node_helper.js` with socket communication
4. ✅ Create minimal `traffic.njk` template
5. ✅ Create basic `traffic.css` stylesheet
6. ✅ Add module to `modules/default/defaultmodules.js`

### Phase 2: API Integration
1. ✅ Implement Google Routes API call in node helper (POST request)
2. ✅ Handle API authentication (API key in header)
3. ✅ Parse API response (note: response structure differs from Directions API)
4. ✅ Calculate traffic metrics (delay, level)
5. ✅ Error handling for API failures

### Phase 3: Frontend Display
1. ✅ Implement template rendering
2. ✅ Display route information
3. ✅ Show travel times and delays
4. ✅ Traffic level indicators
5. ✅ Update mechanism (periodic refresh)

### Phase 4: Configuration
1. ✅ Implement all configuration options
2. ✅ Support address and coordinate inputs
3. ✅ Route alternatives support
4. ✅ Customizable display options

### Phase 5: Polish & Testing
1. ✅ Error handling and user feedback
2. ✅ Loading states
3. ✅ Responsive design
4. ✅ Translation support (optional)
5. ✅ Documentation
6. ✅ Testing with various routes and scenarios

---

## 6. Technical Details

### 6.1 Polling Mechanism (Required)

**Critical Understanding**: The Google Routes API is a **request-response API**, not a real-time streaming service. Each API call returns traffic conditions at that moment, but the API does NOT push updates automatically.

**Why Polling is Required:**
- Traffic conditions change continuously throughout the day
- The API only provides data when you request it
- Without polling, traffic information becomes stale quickly
- MagicMirror modules typically use polling for external data (weather, news, etc.)

**How Polling Works in This Module:**

1. **Frontend Module** (`traffic.js`) manages the polling schedule:
   ```javascript
   start() {
     // Initial fetch
     this.sendSocketNotification("FETCH_TRAFFIC", this.config);
     // Schedule periodic updates
     this.scheduleUpdate(this.config.initialLoadDelay);
   }
   
   scheduleUpdate(delay = null) {
     let nextLoad = this.config.updateInterval || 5 * 60 * 1000; // 5 min default
     if (delay !== null && delay >= 0) {
       nextLoad = delay;
     }
     
     setTimeout(() => {
       // Request fresh data from node helper
       this.sendSocketNotification("FETCH_TRAFFIC", this.config);
       // Schedule next update (recursive)
       this.scheduleUpdate();
     }, nextLoad);
   }
   ```

2. **Node Helper** (`node_helper.js`) handles API calls on demand:
   ```javascript
   socketNotificationReceived(notification, payload) {
     if (notification === "FETCH_TRAFFIC") {
       this.fetchTrafficData(payload);
     }
   }
   
   async fetchTrafficData(config) {
     // Make API call to Google Routes API
     // Process response
     // Send back to frontend
     this.sendSocketNotification("TRAFFIC_DATA", processedData);
   }
   ```

3. **Update Flow:**
   ```
   Frontend → sendSocketNotification("FETCH_TRAFFIC") 
          → Node Helper receives notification
          → Node Helper calls Google Routes API
          → Node Helper processes response
          → Node Helper → sendSocketNotification("TRAFFIC_DATA")
          → Frontend receives data and updates display
          → Frontend schedules next poll
          → Repeat at configured interval
   ```

**Polling Best Practices:**
- **Default interval**: 5 minutes (good balance of freshness vs. API costs)
- **Rush hour**: Consider 2-3 minutes for more frequent updates
- **Off-peak**: 10-15 minutes may be sufficient
- **Error handling**: On API failure, retry with exponential backoff
- **Pause when hidden**: Consider pausing updates when module is hidden (future enhancement)
- **Respect rate limits**: Google API has quotas; don't poll too aggressively

**Comparison with Other Modules:**
- Weather module: Polls every 10 minutes by default
- Newsfeed module: Polls every 5 minutes by default
- Calendar module: Polls based on configured interval
- Traffic module: Should follow similar pattern (5-10 minute default)

### 6.2 Traffic Level Calculation
Based on `duration_in_traffic` vs `duration`:
- **Light**: Delay < 10% of normal duration
- **Moderate**: Delay 10-30% of normal duration
- **Heavy**: Delay 30-50% of normal duration
- **Severe**: Delay > 50% of normal duration

### 6.3 Update Strategy
- **Initial load**: Fetch immediately on module start
- **Periodic updates**: Handled by polling mechanism (see section 6.1)
- **Update interval**: Configurable via `updateInterval` config (default: 5 minutes)
- **Manual refresh**: Could be triggered by notification (future enhancement)

### 6.3 Error Handling
- Invalid API key → Show error message
- Network failure → Retry with exponential backoff
- Invalid addresses → Show geocoding error
- No route found → Show "No route available"
- Rate limiting → Respect API quotas

### 6.4 Caching Considerations
- Cache route data briefly to avoid excessive API calls
- Consider caching during same-minute requests
- Clear cache on config changes

---

## 7. API Cost Considerations

### 7.1 Google Routes API Pricing
- Pay-per-use pricing model
- Free tier: $200/month credit (typically ~40,000 requests)
- Standard pricing: ~$5 per 1,000 requests (similar to legacy Directions API)
- Note: Routes API combines Directions and Distance Matrix functionality

### 7.2 Optimization Strategies
- Reasonable default update interval (5-10 minutes)
- Cache responses for short periods
- Only fetch when module is visible
- User education about API costs

---

## 8. Future Enhancements (Post-MVP)

1. **Multiple Routes**: Support multiple origin/destination pairs
2. **Route Comparison**: Side-by-side comparison of alternatives
3. **Historical Data**: Show typical vs current traffic
4. **Notifications**: Alert when traffic exceeds threshold
5. **Map Visualization**: Optional mini-map display
6. **Waypoints**: Support multi-stop routes
7. **Saved Routes**: Store favorite routes in config
8. **Traffic Trends**: Show traffic patterns over time

---

## 9. Testing Checklist

- [ ] Module loads without errors
- [ ] API key validation works
- [ ] Route calculation successful
- [ ] Traffic data displays correctly
- [ ] Update interval works
- [ ] Error handling for invalid addresses
- [ ] Error handling for network failures
- [ ] Multiple route alternatives display
- [ ] Different traffic levels display correctly
- [ ] Configuration options work
- [ ] Module hides/shows correctly
- [ ] Responsive design on different screen sizes

---

## 10. Documentation Requirements

1. **README.md**: Module overview, installation, configuration
2. **API Setup Guide**: How to obtain Google API key
3. **Configuration Examples**: Sample configs for different use cases
4. **Troubleshooting**: Common issues and solutions
5. **Contributing**: Guidelines for contributors

---

## 11. Dependencies

### 11.1 Node.js Dependencies
- None required (use native `https` module)
- Optional: `node-fetch` for cleaner HTTP requests

### 11.2 Frontend Dependencies
- None required (use MagicMirror's built-in utilities)
- Font Awesome (already included in MagicMirror)

---

## 12. Security Considerations

1. **API Key Protection**: 
   - Store API key in config (not in code)
   - Warn users about API key security
   - Consider server-side proxy for API key (advanced)

2. **Input Validation**:
   - Validate addresses/coordinates
   - Sanitize user inputs
   - Prevent injection attacks

3. **Rate Limiting**:
   - Respect API quotas
   - Implement request throttling
   - Handle rate limit errors gracefully

---

## 13. Accessibility

- Semantic HTML structure
- Color-blind friendly traffic indicators (use icons + colors)
- Screen reader support
- Keyboard navigation (if interactive elements added)

---

## Summary

This plan provides a comprehensive roadmap for implementing a traffic congestion module for MagicMirror. The module will use the Google Maps Routes API (the modern replacement for the legacy Directions API) to fetch real-time traffic information and display it in a user-friendly format on the MagicMirror interface.

The implementation follows MagicMirror's standard module architecture with a frontend module and node helper for server-side API calls, ensuring proper separation of concerns and avoiding CORS issues.

**Important Note**: The Google Directions API was designated as legacy on March 1, 2025. This plan uses the Routes API, which is the recommended replacement and offers improved performance and additional features.

