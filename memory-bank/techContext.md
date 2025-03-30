# Technical Context: Nuke Family Helper Script

## Technologies Used

### Core Technologies

1. **JavaScript**

   - ES6+ features for modern syntax and capabilities
   - Browser-compatible code that runs in userscript environments
   - No transpilation or bundling required

2. **DOM Manipulation**

   - Direct manipulation of the Torn game's DOM elements
   - Creation of custom UI components that match the game's style
   - Event listeners for user interactions

3. **CSS**

   - Custom styling injected into the page
   - Matching the Torn game's visual design
   - Responsive layouts for different screen sizes

4. **Userscript APIs**
   - GM_xmlhttpRequest for cross-origin requests
   - GM_setValue/GM_getValue for persistent storage
   - GM_info for script metadata access

### External Services

1. **Nuke.Family API**

   - RESTful API for data exchange
   - JSON-based communication
   - Bearer token authentication
   - Endpoints for shitlist, payout, and user role data

2. **GitHub**
   - Hosts the script repository
   - Used for version checking and updates
   - Raw file access for update distribution

## Development Setup

### Local Development Environment

The project uses a simple development setup:

1. **Code Editor**: Visual Studio Code with JavaScript support
2. **Version Control**: Git for source code management
3. **Browser**: Chrome/Firefox with Tampermonkey/Greasemonkey extension
4. **Testing Environment**: Local development instance of the Nuke.Family API (optional)

### Development Workflow

1. **Local Editing**:

   - Edit the script files in a code editor
   - Use the dev.user.js file which loads the main script from a local path:

   ```javascript
   // @require file://C:\Users\Justin\Documents\Coding\nuke-family-helper-script\nuke-family-helper.user.js
   ```

2. **Testing**:

   - The dev.user.js file includes additional match patterns for testing environments:

   ```javascript
   // @match http://nuke.test/auth/token-generation*
   ```

   - Debug mode can be enabled in the script:

   ```javascript
   const debug = true;
   ```

3. **Deployment**:
   - Update version number in the script header
   - Commit changes to GitHub repository
   - Users will be prompted to update when a new version is available

## Technical Constraints

### Browser Environment Limitations

1. **Cross-Origin Restrictions**:

   - Must use GM_xmlhttpRequest for API calls to external domains
   - Cannot directly access resources from domains other than Torn and Nuke.Family

2. **DOM Access**:

   - Limited to the pages specified in the @match directives
   - Must handle dynamic content loading through observers
   - Cannot modify certain secure elements of the Torn interface

3. **Storage Limitations**:
   - GM_setValue/GM_getValue have size limitations
   - localStorage has domain-specific restrictions
   - Must implement efficient caching strategies

### Userscript Constraints

1. **Permissions**:

   - Must declare all required permissions in the userscript header
   - @connect directives needed for external domains
   - @grant directives needed for GM\_\* functions

2. **Execution Context**:

   - Script runs in a semi-isolated environment
   - Must avoid conflicts with the page's own JavaScript
   - Limited access to certain browser APIs

3. **Update Mechanism**:
   - No automatic updates through browser extension stores
   - Custom update checking implementation required
   - User must approve updates manually

## Dependencies

### External Libraries

The script is designed to be self-contained with minimal external dependencies:

1. **jQuery** (provided by Torn):

   - Used for DOM manipulation when available
   - Fallback to native DOM methods when necessary

2. **No other external libraries**:
   - Avoids version conflicts
   - Reduces load time
   - Simplifies maintenance

### API Dependencies

1. **Nuke.Family API**:

   - `/shit-lists` - Get shitlist entries
   - `/shit-list-categories` - Get shitlist categories
   - `/user/get-own-roles` - Get user roles
   - `/payout/get-payout-table` - Get payout information
   - `/contracts/get_contracts` - Get contract information

2. **GitHub Raw Content**:
   - Used for version checking
   - Provides the latest version of the script for updates

## Tool Usage Patterns

### Data Fetching and Caching

```javascript
// Check if cache is expired
if (
  savedDataShitEntries.timestamp == undefined ||
  Date.now() - savedDataShitEntries.timestamp > cacheLength * 60 * 1000
) {
  // Fetch fresh data
  getShitList();
} else {
  // Use cached data
  shitListEntries = savedDataShitEntries.shitListEntries;
}
```

### DOM Observation and Injection

```javascript
// Create observer
var observer = new MutationObserver(function (mutations, observer) {
  mutations.forEach(function (mutation) {
    for (const node of mutation.addedNodes) {
      if (node.querySelector) {
        // Check page type and inject appropriate content
        if (IsPage(PageType.Profile)) {
          injectProfilePage(node);
        }
      }
    }
  });
});

// Start observing
observer.observe(document, {
  attributes: false,
  childList: true,
  characterData: false,
  subtree: true,
});
```

### Element Creation and Styling

```javascript
// Create styled elements
function buildShitListProfileDiv() {
  let outerDiv = document.createElement("div");
  let innerDiv = document.createElement("div");
  outerDiv.classList.add("nfh-shitlist-profile", "nfh-section", "m-top10");
  outerDiv.appendChild(innerDiv);
  return outerDiv;
}

// Inject styles
function addStyle(styleString) {
  const style = document.createElement("style");
  style.textContent = styleString;
  document.head.append(style);
}
```

### API Communication

```javascript
// Make API request
GM_xmlhttpRequest({
  method: "GET",
  url: apiUrl + "/shit-lists",
  headers: {
    Accept: "application/json",
    Authorization: "Bearer " + apiToken,
  },
  onload: function (response) {
    // Process response
    const responseEntries = JSON.parse(response.responseText)["data"];
    // Handle data...
  },
});
```

### Example of API Responses

#### GET Request to /api/shit-lists

```json
{
  "data": [
    {
      "id": 1,
      "playerName": "CooterDefender",
      "playerId": 2605637,
      "factionId": null,
      "factionName": null,
      "isFactionBan": null,
      "shitListCategoryId": 4,
      "reason": "Left to go join Lat's faction :(",
      "isApproved": true,
      "reporterPlayerName": "Fogest",
      "reporterPlayerId": 2254826,
      "approvedByUserId": 645,
      "approvedByPlayerId": 2254826,
      "updatedByUserId": null,
      "updatedByPlayerId": null,
      "created_at": "2024-03-30T02:43:04.000000Z",
      "updated_at": "2024-04-07T06:25:21.000000Z",
      "shitListCategory": {
        "id": 4,
        "name": "Absolute Scum Lords",
        "slug": "absolute-scum-lords",
        "description": "People who have been MASSIVE scum lords in Torn. We are talking things like hurting the faction family in big ways.",
        "is_faction": 0,
        "is_friendly": 0
      }
    }
  ]
}
```

#### GET Request to /api/shit-list-categories

```json
{
  "data": [
    {
      "id": 1,
      "name": "Enemy Alliance",
      "slug": "enemy-alliance",
      "description": "This player is in an enemy alliance faction against our family.",
      "is_faction": 1,
      "is_friendly": 0
    },
    {
      "id": 2,
      "name": "Buy Mugger",
      "slug": "buy-mugger",
      "description": "Just your typical buy mugging SCUM!",
      "is_faction": 0,
      "is_friendly": 0
    }
  ]
}
```

### Error Handling

```javascript
try {
  savedDataShitEntries = JSON.parse(
    localStorage.shitListEntriesList ||
      '{"shitListEntries" : {}, "timestamp" : 0}'
  );
  // Process data...
} catch (error) {
  console.error(error);
  alert("error loading saved data, please reload page!");
}
```

### Helper Functions

```javascript
// Logging helper
function LogInfo(value) {
  var now = new Date();
  console.log(": [//* NFH *\\\\] " + now.toISOString(), value);
}

// DOM element finder with promise
function waitForElm(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}
```

These patterns form the foundation of the script's implementation and provide a consistent approach to common tasks throughout the codebase.
