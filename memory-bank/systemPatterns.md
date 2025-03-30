# System Patterns: Nuke Family Helper Script

## System Architecture

The Nuke Family Helper Script follows a client-side architecture pattern typical of browser userscripts, with several key components:

```
┌─────────────────────────────────────────────────────────────┐
│                  Nuke Family Helper Script                   │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │ Page-Specific│    │  Core       │    │ API            │  │
│  │ Injections   │◄──►│  Functions  │◄──►│ Communication  │  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
│         ▲                  ▲                   ▲            │
└─────────┼──────────────────┼───────────────────┼────────────┘
          │                  │                   │
          ▼                  ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Torn Game UI    │  │ Browser Storage │  │ Nuke.Family API │
│ (DOM Elements)  │  │ (GM_* Functions)│  │ (External)      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Key Components:

1. **Page-Specific Injections**: Code that targets specific pages in the Torn game UI to add new functionality
2. **Core Functions**: Shared utilities and business logic used across different features
3. **API Communication**: Handles requests to and responses from the Nuke.Family API
4. **Browser Storage**: Manages persistent data using userscript storage capabilities
5. **DOM Manipulation**: Modifies the Torn game UI to add new elements and functionality

## Key Technical Decisions

### 1. Userscript Implementation

The decision to implement as a userscript (rather than a browser extension or separate application) was made to:

- Simplify installation for users
- Allow direct integration with the Torn game UI
- Leverage existing userscript infrastructure (Tampermonkey, Greasemonkey)
- Avoid the more complex review process required for browser extensions

### 2. API-Driven Architecture

The script relies heavily on the Nuke.Family API for data and authentication:

- Centralizes sensitive data on secure servers
- Allows for role-based access control
- Enables consistent data across multiple users
- Simplifies updates to shared data

### 3. Client-Side Caching

To reduce API load and improve performance:

- Data is cached in browser storage (using GM_setValue/GM_getValue)
- Cache expiration is managed with timestamps
- Different data types have appropriate cache durations

### 4. Progressive Enhancement

The script follows a progressive enhancement approach:

- Core game functionality remains intact if the script fails
- Features are injected only when relevant page elements are detected
- MutationObserver is used to handle dynamically loaded content

## Design Patterns

### 1. Observer Pattern

The script uses MutationObserver to watch for changes in the DOM:

```javascript
var observer = new MutationObserver(function (mutations, observer) {
  mutations.forEach(function (mutation) {
    for (const node of mutation.addedNodes) {
      if (node.querySelector) {
        if (IsPage(PageType.Profile)) {
          injectProfilePage(node);
        }
        // Other page-specific injections...
      }
    }
  });
});

observer.observe(document, {
  attributes: false,
  childList: true,
  characterData: false,
  subtree: true,
});
```

This allows the script to respond to dynamic content loading in the Torn game UI.

### 2. Module Pattern

The script uses an Immediately Invoked Function Expression (IIFE) to create a private scope:

```javascript
(function () {
  "use strict";

  // Script code here...
})();
```

This prevents variable leakage into the global scope and potential conflicts with other scripts.

### 3. Factory Pattern

The script uses factory functions to create UI elements:

```javascript
function buildShitListEntry(entry) {
  let li = document.createElement("li");
  // Configure the element...
  return li;
}
```

This centralizes the creation logic and ensures consistent styling and behavior.

### 4. Caching Pattern

The script implements a time-based caching system:

```javascript
if (
  savedDataShitEntries.timestamp == undefined ||
  Date.now() - savedDataShitEntries.timestamp > cacheLength * 60 * 1000
) {
  LogInfo(
    "shitlist data is older than " + cacheLength + " minutes, updating now"
  );
  getShitList();
}
```

This reduces API calls and improves performance while ensuring data freshness.

## Component Relationships

### Page Detection → Feature Injection

The script uses URL patterns to determine which page the user is viewing:

```javascript
function IsPage(pageType) {
  let endWith = mapPageAddressEndWith[pageType];
  if (endWith != undefined) {
    return window.location.href.includes(endWith);
  }

  let startWith = mapPageTypeAddress[pageType];
  if (startWith != undefined) {
    return window.location.href.startsWith(startWith);
  }
  return false;
}
```

Based on the detected page, specific features are injected:

```javascript
if (IsPage(PageType.Profile)) {
  injectProfilePage();
}
```

### API Communication → Data Storage → UI Update

The script follows a flow for data management:

1. Fetch data from API
2. Process and store in browser storage
3. Update UI elements with the data

Example:

```javascript
function getShitList() {
  GM_xmlhttpRequest({
    method: "GET",
    url: apiUrl + "/shit-lists",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + apiToken,
    },
    onload: function (response) {
      // Process response
      localStorage.shitListEntriesList = JSON.stringify({
        shitListEntries: toSave,
        timestamp: Date.now(),
      });
      shitListEntries = toSave;
      refreshShitList();
    },
  });
}
```

### User Action → API Update → UI Feedback

When users take actions (e.g., adding a shitlist entry):

1. Capture user input
2. Send to API
3. Provide feedback on success/failure
4. Update UI to reflect changes

## Critical Implementation Paths

### 1. Authentication Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Script  │     │ Check for   │     │ Prompt for  │     │ Store Token │
│ Loads   │────►│ API Token   │────►│ Token Input │────►│ in GM_*     │
└─────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                       │                                       │
                       │ Token exists                          │
                       ▼                                       ▼
                ┌─────────────┐                        ┌─────────────┐
                │ Validate    │                        │ Enable      │
                │ Token       │───────────────────────►│ Features    │
                └─────────────┘                        └─────────────┘
```

### 2. Shitlist Display Path

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Profile │     │ Check Cache │     │ Fetch from  │     │ Process &   │
│ Page    │────►│ Validity    │────►│ API if      │────►│ Store Data  │
│ Loads   │     │             │     │ Needed      │     │             │
└─────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                               │
                                                               ▼
                                                        ┌─────────────┐
                                                        │ Inject UI   │
                                                        │ Elements    │
                                                        └─────────────┘
```

### 3. Payout Processing Path

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ User    │     │ Fetch Payout│     │ Process     │     │ Update UI   │
│ Clicks  │────►│ Data from   │────►│ Payout      │────►│ with Payout │
│ Button  │     │ API         │     │ Information │     │ Suggestions │
└─────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                               │
                                                               ▼
                                                        ┌─────────────┐
                                                        │ User        │
                                                        │ Confirms    │
                                                        │ Payouts     │
                                                        └─────────────┘
```

### 4. Update Checking Path

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Script  │     │ Check Last  │     │ Fetch       │     │ Compare     │
│ Loads   │────►│ Update Check│────►│ Version from│────►│ Versions    │
└─────────┘     │ Time        │     │ GitHub      │     │             │
                └─────────────┘     └─────────────┘     └─────────────┘
                                                               │
                                                               ▼
                                                        ┌─────────────┐
                                                        │ Prompt for  │
                                                        │ Update if   │
                                                        │ Available   │
                                                        └─────────────┘
```

These critical paths represent the core functionality of the script and are essential for understanding how the different components interact to deliver the features.
