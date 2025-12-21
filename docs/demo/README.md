# MagicMirror² Browser Demo

A browser-based demo version of [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror).

## Live Demo

**Try it now:** [https://magicmirrororg.github.io/MagicMirror/docs/demo/](https://magicmirrororg.github.io/MagicMirror/docs/demo/)

## What makes this special?

This demo runs **real MagicMirror² code** from the `master` branch in your browser. It's not a simplified recreation - it uses the actual:

- Core architecture (`Module.register()`, `Class.extend()`)
- Original default modules (clock, weather, compliments, calendar, newsfeed)
- Real CSS styling
- Authentic module system and lifecycle

**The only difference:** Server components are mocked with demo data instead of making real API calls.

This means you're seeing the real MagicMirror² experience, just without needing a server or API keys!

## Running locally

```bash
# IMPORTANT: Server must run from the MagicMirror root directory!
cd /path/to/MagicMirror

# With Python 3
python -m http.server 8080

# Or with Node.js
npx http-server -p 8080

# Open in browser
open http://localhost:8080/docs/demo/
```

**Why from root?** The demo uses real files with relative paths (`../../js/`, `../../modules/`) - the server must run from the repository root.

## Structure

```
demo/
├── index.html             # Loads real modules
├── config.js              # Demo configuration
├── css/
│   └── demo.css           # Demo banner styling only
└── js/
    ├── demo-mocks.js      # Mocks for Log, Translator, Socket.io
    ├── demo-loader.js     # Overrides API calls with mock data
    └── demo-main.js       # Initializes MM like the original
```

## How it works

1. **index.html** loads the real MagicMirror core files:
   - `js/class.js` - Base class system
   - `js/module.js` - Module architecture
   - Original modules from `modules/default/`

2. **demo-mocks.js** creates replacements for server components:
   - `window.Log` for logging
   - `window.Translator` for translations
   - `window.MM` for module manager
   - Mock data for weather, calendar, news

3. **demo-loader.js** extends modules during registration:
   - Intercepts `Module.register()`
   - Overrides `start()` methods
   - Replaces API calls with mock data

4. **demo-main.js** starts the system:
   - Reads `config.modules`
   - Creates module instances
   - Inserts DOM like the original

## Customization

### Change configuration

Edit [config.js](config.js):

```javascript
modules: [
  {
    module: "clock",
    position: "top_left",
    config: {
      /* ... */
    }
  }
  // More modules...
];
```

### Change mock data

Edit [js/demo-mocks.js](js/demo-mocks.js):

```javascript
const mockWeatherData = {
  current: {
    temperature: 8
    // ...
  }
};
```

## Limitations

As a pure browser demo:

- ❌ No real API calls (CORS, API keys)
- ❌ No node_helper.js modules
- ❌ No third-party modules (but easy to add!)
- ❌ No Electron features

## Adding new modules

1. Add script tag in [index.html](index.html):

```html
<script src="../../modules/default/MODULENAME/MODULENAME.js"></script>
```

2. Add module to config in [config.js](config.js)

3. If API calls needed: Add mock function in [demo-loader.js](js/demo-loader.js)
