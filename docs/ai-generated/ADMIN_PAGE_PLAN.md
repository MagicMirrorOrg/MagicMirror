# Admin Page Implementation Plan

## Overview
This document outlines the implementation plan for creating an admin page that allows runtime configuration of MagicMirror modules, starting with the traffic module.

## Goals
1. Create a `/admin` endpoint that serves an admin interface
2. Allow enabling/disabling the traffic module
3. Allow updating traffic module configuration:
   - Destination
   - Traffic model (BEST_GUESS, PESSIMISTIC, OPTIMISTIC)
   - Update interval
4. Update traffic module to display "Traffic Module Disabled" when disabled
5. Create a new module to display the admin page URL (IP address and port) at the bottom of the screen

## Architecture

### Server-Side Components

#### 1. Admin Endpoint (`/admin`)
- **Location**: `js/server.js`
- **Implementation**: Add Express route to serve admin HTML page
- **Method**: `app.get("/admin", ...)`
- **Response**: Serve static HTML file or generate HTML dynamically

#### 2. Admin API Endpoints

##### GET `/admin/api/config`
- **Purpose**: Retrieve current module configurations
- **Response**: JSON object containing module configs
- **Implementation**: Read from `config/config.js` and return relevant module data

##### GET `/admin/api/config/traffic`
- **Purpose**: Get current traffic module configuration
- **Response**: JSON object with traffic module config
- **Example Response**:
```json
{
  "enabled": true,
  "destination": "7079 S Kirkman Rd, Orlando, FL",
  "trafficModel": "BEST_GUESS",
  "updateInterval": 300000
}
```

##### POST `/admin/api/config/traffic`
- **Purpose**: Update traffic module configuration
- **Request Body**:
```json
{
  "enabled": true,
  "destination": "New Destination",
  "trafficModel": "PESSIMISTIC",
  "updateInterval": 600000
}
```
- **Implementation**:
  1. Read current `config/config.js`
  2. Parse and update traffic module config
  3. Write updated config back to file
  4. Broadcast socket notification to update module
  5. Return success/error response

#### 3. Config File Management
- **Location**: `js/server_functions.js` or new `js/admin_functions.js`
- **Functions Needed**:
  - `readConfig()` - Read and parse config.js
  - `updateModuleConfig(moduleName, updates)` - Update specific module config
  - `writeConfig(config)` - Write config back to file
- **Note**: Need to handle JavaScript file parsing carefully (not pure JSON)

#### 4. Socket Notifications
- **Purpose**: Notify modules of configuration changes
- **Implementation**: Use existing Socket.IO instance to broadcast notifications
- **Notification Types**:
  - `MODULE_CONFIG_UPDATED` - Notify module of config change
  - `MODULE_DISABLED` - Notify module it's been disabled
  - `MODULE_ENABLED` - Notify module it's been enabled

#### 5. Admin Info Module Support
- **Purpose**: Provide server address information to the admininfo module
- **Implementation**: 
  - Add API endpoint `GET /admin/api/server-info` to return server address and port
  - Use Node.js `os.networkInterfaces()` to get all network interfaces
  - Filter to get non-internal IPv4 addresses (exclude 127.0.0.1, ::1, etc.)
  - Return primary IP address, port, and protocol (http/https)
  - Format: `{ address: "192.168.1.100", port: 8080, protocol: "http", url: "http://192.168.1.100:8080/admin" }`

### Client-Side Components

#### 1. Admin Page HTML
- **Location**: `admin.html` (new file) or serve from `js/server_functions.js`
- **Structure**:
  - Header with title
  - Section for Traffic Module configuration
  - Form with:
    - Enable/Disable toggle
    - Destination input field
    - Traffic Model dropdown (BEST_GUESS, PESSIMISTIC, OPTIMISTIC)
    - Update Interval input (in minutes)
    - Save button
  - Status messages for success/error feedback

#### 2. Admin Page JavaScript
- **Location**: Inline in HTML or separate `admin.js` file
- **Functionality**:
  - Load current config on page load
  - Handle form submission
  - Make API calls to update config
  - Display success/error messages
  - Basic form validation

#### 3. Admin Page Styling
- **Location**: Inline styles or separate `admin.css`
- **Design**: Simple, clean interface suitable for admin use

### Traffic Module Updates

#### 1. Handle Disabled State
- **Location**: `modules/default/traffic/traffic.js`
- **Changes**:
  - Add `disabled` property to defaults (default: false)
  - Check disabled state in `getTemplateData()`
  - Return disabled message when disabled
  - Stop updates when disabled
  - Resume updates when enabled

#### 2. Handle Config Updates
- **Location**: `modules/default/traffic/traffic.js`
- **Changes**:
  - Listen for `MODULE_CONFIG_UPDATED` socket notification
  - Update module config when notification received
  - Restart update timer with new interval if changed
  - Re-validate config (API key, origin, destination)

#### 3. Update Template
- **Location**: `modules/default/traffic/traffic.njk`
- **Changes**:
  - Add condition to display "Traffic Module Disabled" message
  - Show this message when `disabled === true`

### Admin Info Module (New Module)

#### 1. Module Structure
- **Location**: `modules/default/admininfo/` (new directory)
- **Files**:
  - `admininfo.js` - Main module file
  - `admininfo.njk` - Template file
  - `node_helper.js` - Node helper to fetch server info
  - `admininfo.css` - Optional styling file

#### 2. Module Implementation (`admininfo.js`)
- **Defaults**:
  ```javascript
  defaults: {
    updateInterval: 60 * 1000, // Check every minute
    showProtocol: true, // Show http:// or https://
    showPort: true, // Show port number
    showPath: true, // Show /admin path
    format: "full", // "full" (http://ip:port/admin) or "ip-only" or "url-only"
    position: "bottom_bar" // Display at bottom
  }
  ```
- **Functionality**:
  - Request server info from node helper on start
  - Display admin page URL in format: `http://192.168.1.100:8080/admin`
  - Handle cases where IP address cannot be determined (show localhost)
  - Update periodically to handle IP address changes
  - Make URL clickable if possible (depends on MagicMirror display setup)

#### 3. Node Helper (`node_helper.js`)
- **Purpose**: Fetch server information from the server
- **Implementation**:
  - On start, request server info from `/admin/api/server-info` endpoint
  - Parse response to get IP address, port, and protocol
  - Send `ADMIN_INFO` socket notification to frontend module
  - Re-fetch periodically based on `updateInterval` config

#### 4. Template (`admininfo.njk`)
- **Display Format**:
  - Full URL: `http://192.168.1.100:8080/admin`
  - Or IP only: `192.168.1.100:8080`
  - Or URL only: `/admin` (if IP not available)
- **Styling**: Small, dimmed text suitable for bottom bar
- **Structure**:
  ```html
  <div class="admininfo-container">
    <div class="admininfo-label">Admin:</div>
    <div class="admininfo-url">{{ adminUrl }}</div>
  </div>
  ```

#### 5. Server Info API Endpoint
- **Location**: `js/server_functions.js` or `js/admin_functions.js`
- **Function**: `getServerInfo()`
- **Implementation**:
  ```javascript
  function getServerInfo(config) {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let ipAddress = config.address || 'localhost';
    const port = process.env.MM_PORT || config.port || 8080;
    const protocol = config.useHttps ? 'https' : 'http';
    
    // Find first non-internal IPv4 address
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ipAddress = iface.address;
          break;
        }
      }
      if (ipAddress !== (config.address || 'localhost')) break;
    }
    
    return {
      address: ipAddress,
      port: port,
      protocol: protocol,
      url: `${protocol}://${ipAddress}:${port}/admin`
    };
  }
  ```
- **Endpoint**: `GET /admin/api/server-info`
- **Response**:
  ```json
  {
    "success": true,
    "serverInfo": {
      "address": "192.168.1.100",
      "port": 8080,
      "protocol": "http",
      "url": "http://192.168.1.100:8080/admin"
    }
  }
  ```

## Implementation Steps

### Phase 1: Server Infrastructure
1. Create admin API functions in `js/server_functions.js` or new `js/admin_functions.js`
   - `readConfig()` - Parse config.js file
   - `updateModuleConfig()` - Update module config in memory
   - `writeConfig()` - Write config back to file
   - `getTrafficConfig()` - Get traffic module config
   - `updateTrafficConfig()` - Update traffic module config
   - `getServerInfo()` - Get server IP address, port, and admin URL

2. Add admin routes to `js/server.js`
   - `GET /admin` - Serve admin page
   - `GET /admin/api/config/traffic` - Get traffic config
   - `POST /admin/api/config/traffic` - Update traffic config
   - `GET /admin/api/server-info` - Get server address and admin URL

3. Add socket notification broadcasting for config updates

### Phase 2: Admin Page UI
1. Create admin page HTML with form
2. Add JavaScript for form handling and API calls
3. Add basic styling
4. Test form submission and API integration

### Phase 3: Traffic Module Updates
1. Add disabled state handling to traffic module
2. Add socket notification listener for config updates
3. Update template to show disabled message
4. Test enable/disable functionality

### Phase 4: Admin Info Module
1. Create `modules/default/admininfo/` directory
2. Implement `admininfo.js` module
3. Implement `node_helper.js` to fetch server info
4. Create `admininfo.njk` template
5. Add optional `admininfo.css` for styling
6. Test IP address detection and display
7. Test URL formatting options
8. Add module to config.js at bottom position

### Phase 5: Integration Testing
1. Test full flow: update config via admin page → module updates
2. Test enable/disable functionality
3. Test all traffic model options
4. Test update interval changes
5. Verify config file persistence
6. Test admin info module displays correct URL
7. Verify admin info module updates when IP changes

## Technical Considerations

### Config File Parsing
- `config.js` is a JavaScript file, not JSON
- Need to parse it as JavaScript (using `require()` or `eval()`)
- Must preserve comments and formatting if possible
- Alternative: Use AST parser (like `esprima`) for safer parsing

### Config File Writing
- Need to write valid JavaScript
- Preserve other modules' configs
- Handle edge cases (missing module, multiple instances)

### Security
- Validate all input data
- Sanitize file paths to prevent directory traversal

### Error Handling
- Handle file read/write errors gracefully
- Validate config before writing
- Provide user-friendly error messages
- Rollback on errors if possible

### Module Instance Handling
- Handle case where traffic module appears multiple times in config
- Update all instances or allow selection of specific instance

## File Structure

```
MagicMirror/
├── js/
│   ├── server.js (modified - add /admin routes)
│   ├── server_functions.js (modified - add admin functions)
│   └── admin_functions.js (new - admin-specific functions)
├── admin.html (new - admin page)
├── modules/default/
│   ├── traffic/
│   │   ├── traffic.js (modified - handle disabled state, config updates)
│   │   └── traffic.njk (modified - show disabled message)
│   └── admininfo/ (new - admin info display module)
│       ├── admininfo.js (new)
│       ├── admininfo.njk (new)
│       ├── node_helper.js (new)
│       └── admininfo.css (new - optional)
└── docs/ai-generated/
    └── ADMIN_PAGE_PLAN.md (this file)
```

## API Specification

### GET /admin/api/server-info
**Purpose**: Get server IP address, port, and admin page URL

**Response:**
```json
{
  "success": true,
  "serverInfo": {
    "address": "192.168.1.100",
    "port": 8080,
    "protocol": "http",
    "url": "http://192.168.1.100:8080/admin"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Unable to determine server address"
}
```

**Implementation Notes**:
- Uses `os.networkInterfaces()` to find network interfaces
- Prefers non-internal IPv4 addresses
- Falls back to config.address or 'localhost' if no external IP found
- Respects `config.useHttps` for protocol determination
- Uses `process.env.MM_PORT` or `config.port` for port

### GET /admin/api/config/traffic
**Response:**
```json
{
  "success": true,
  "config": {
    "enabled": true,
    "destination": "7079 S Kirkman Rd, Orlando, FL",
    "trafficModel": "BEST_GUESS",
    "updateInterval": 300000
  }
}
```

### POST /admin/api/config/traffic
**Request:**
```json
{
  "enabled": true,
  "destination": "New Destination Address",
  "trafficModel": "PESSIMISTIC",
  "updateInterval": 600000
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Traffic module configuration updated successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Future Enhancements
- Support for configuring other modules
- Configuration history/undo
- Export/import configurations
- Real-time preview of changes
- Multiple module instance management
- Configuration templates/presets
- Admin info module: QR code generation for easy mobile access
- Admin info module: Copy-to-clipboard functionality
- Admin info module: Multiple IP address display (if multiple interfaces)

