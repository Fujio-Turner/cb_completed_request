# Couchbase Cluster Integration (Issue #231)

## Overview

The Query Analyzer now supports direct connection to Couchbase clusters for:
- Saving/loading query analysis data
- Persisting user preferences (timezone, report settings, etc.)
- Managing multiple cluster connections (localhost, on-prem, Capella)

## Features

### 1. Settings Button (Top-Right Corner)
- **Location**: Fixed position in top-right corner (sprocket icon)
- **Function**: Opens the cluster connection settings modal
- **Visual**: Rotates 45° on hover

### 2. Connection Status Indicator
- **Location**: Next to settings button
- **States**:
  - 🔴 **Disconnected** (gray) - No active connection
  - 🟢 **Connected** (green) - Successfully connected to cluster
  - 🔴 **Error** (red) - Connection failed

### 3. Settings Modal

The settings modal includes three sections:

#### Cluster Connections
- **Pre-configured clusters**:
  - `localhost` - Local development (http://localhost:8091)
  - `on-prem-prod` - On-premise production
  - `capella-prod` - Couchbase Capella cloud
  
- **Actions**:
  - Select active cluster (radio button)
  - Edit URL, username, password
  - Test connection
  - Add new cluster
  - Remove cluster (except localhost)

#### Bucket Configuration
- **Bucket Name**: `cb_tools` (default)
- **Analyzer Keyspace**: `cb_tools.query.analyzer`
  - Stores query analysis data
  - Document format: `{ requestId, analysisData, savedAt, version }`
  
- **Preferences Keyspace**: `cb_tools._default._default`
  - Stores user preferences
  - Document ID pattern: `user_prefs::{userId}`
  - Includes: timezone, report checkbox settings

#### User Preferences
- **Save timezone preference to Couchbase** (checkbox)
- **Save report checkbox settings to Couchbase** (checkbox)

## Configuration File

### config.json

Location: `/liquid_snake/config.json`

```json
{
  "clusters": [
    {
      "id": "localhost",
      "name": "Local Development",
      "url": "http://localhost:8091",
      "username": "Administrator",
      "password": "",
      "enabled": true,
      "type": "local"
    }
  ],
  "bucketConfig": {
    "bucket": "cb_tools",
    "analyzerScope": "query",
    "analyzerCollection": "analyzer",
    "preferencesScope": "_default",
    "preferencesCollection": "_default"
  },
  "currentCluster": "localhost"
}
```

## Data Schema

### Analyzer Data Collection
**Keyspace**: `cb_tools.query.analyzer`

**Document Structure**:
```json
{
  "requestId": "unique-request-id",
  "statement": "SELECT * FROM ...",
  "executionPlan": { ... },
  "timings": { ... },
  "indexes": [ ... ],
  "savedAt": "2025-11-07T12:34:56.789Z",
  "version": "3.28.2"
}
```

### User Preferences Collection
**Keyspace**: `cb_tools._default._default`

**Document ID**: `user_config` (fixed key for K/V lookup)

**Document Structure**:
```json
{
  "docType": "config",
  "connected": "2025-11-07T12:34:56.789Z",
  "cluster": {
    "name": "My Couchbase Cluster",
    "url": "localhost",
    "username": "Administrator",
    "password": "password",
    "type": "Localhost"
  },
  "timezone": "America/New_York",
  "reportSettings": {
    "opt-include-header": true,
    "opt-include-timestamp": true,
    "opt-date-range": true
  },
  "updatedAt": "2025-11-07T12:34:56.789Z"
}
```

**Note**: Using a fixed document key `user_config` allows simple K/V GET/UPSERT operations instead of N1QL queries, which is faster and more efficient.

**Auto-Connect**: On page load, the app checks for the `user_config` document. If found with cluster credentials, it auto-restores the connection and applies user preferences.

## JavaScript API

### Modules

#### couchbase-connector.js
Core connection and data persistence functions:

```javascript
import { 
  loadConfig,
  testConnection,
  executeQuery,
  saveAnalyzerData,
  loadAnalyzerData,
  saveUserPreferences,
  loadUserPreferences
} from './assets/js/couchbase-connector.js';

// Test connection
const result = await testConnection('localhost');

// Save query analysis
await saveAnalyzerData('req-123', {
  statement: 'SELECT ...',
  plan: { ... }
});

// Load query analysis
const data = await loadAnalyzerData('req-123');

// Save user preferences
await saveUserPreferences('user-123', {
  timezone: 'UTC',
  reportSettings: { ... }
});

// Load user preferences
const prefs = await loadUserPreferences('user-123');
```

#### settings.js
Settings modal UI and interactions:

```javascript
// Open/close settings modal
window.openSettingsModal();
window.closeSettingsModal();

// These functions are automatically exposed to global scope
// for onclick handlers in HTML
```

## Architecture

### Python Server Proxy (Issue #231)

All Couchbase connections go through the Python server (`server.py`) which:
1. Receives API requests from the browser
2. Connects to Couchbase using the Python SDK
3. Executes operations and returns results
4. Caches connections for better performance

**Benefits:**
- ✅ No CORS issues
- ✅ Credentials stay server-side (more secure)
- ✅ Connection pooling
- ✅ Works with localhost, on-prem, and Capella

### Python Dependencies

Install Couchbase Python SDK:
```bash
pip install couchbase
```

The server will automatically handle connections based on the config.json settings.

## Setup Instructions

### 1. Create Bucket and Collections

```sql
-- Create bucket
CREATE BUCKET cb_tools;

-- Create scope and collection for analyzer
CREATE SCOPE cb_tools.query;
CREATE COLLECTION cb_tools.query.analyzer;

-- _default scope/collection exists by default
-- No need to create cb_tools._default._default
```

### 2. Create Indexes (Optional)

```sql
-- Index for analyzer data by requestId
CREATE INDEX idx_analyzer_request 
ON cb_tools.query.analyzer(requestId);

-- Index for user preferences by userId
CREATE INDEX idx_user_prefs 
ON cb_tools._default._default(userId)
WHERE type = 'user_preferences';
```

### 3. Configure Cluster Connection

1. Click the **Settings** button (sprocket icon) in top-right corner
2. Select or add your cluster
3. Enter credentials
4. Click **Test Connection**
5. Click **Save Settings**

## Security Considerations

### Password Storage
- Passwords are stored in `config.json` (client-side only)
- **Do not commit passwords** to version control
- Add `config.json` to `.gitignore`
- For production, use environment variables or secure vaults

### Credentials Management
```bash
# Add to .gitignore
echo "liquid_snake/config.json" >> .gitignore

# Create config template
cp liquid_snake/config.json liquid_snake/config.json.template
# Then remove sensitive data from template
```

### RBAC Permissions
Recommended Couchbase user roles:
- **Data Reader**: Read query analysis data
- **Data Writer**: Save query analysis and preferences
- **Query Select**: Execute N1QL queries
- **Query Insert**: Insert documents
- **Query Update**: Update documents

## Troubleshooting

### Connection Fails
1. **Check CORS settings** on Couchbase Server
2. **Verify credentials** are correct
3. **Check network connectivity** to cluster URL
4. **Review browser console** for detailed error messages

### Data Not Saving
1. **Verify bucket exists**: `cb_tools`
2. **Verify collections exist**: `query.analyzer` and `_default._default`
3. **Check user permissions** (RBAC roles)
4. **Test connection** from settings modal

### Console Errors
Enable debug logging:
```
http://localhost:8000/?debug=true
```

Check browser console for `[debug]` and `[error]` messages from couchbase-connector.

## Future Enhancements

- [ ] OAuth/OIDC authentication support
- [ ] Encrypted credential storage
- [ ] Real-time query analysis streaming
- [ ] Multi-user collaboration
- [ ] Query history browsing
- [ ] Saved query templates
- [ ] Export/import cluster configurations
- [ ] Connection pooling and retry logic

## Related Files

- `/liquid_snake/config.json` - Cluster configuration
- `/liquid_snake/assets/js/couchbase-connector.js` - Core connection module
- `/liquid_snake/assets/js/settings.js` - Settings UI module
- `/liquid_snake/assets/css/main.css` - Settings modal styles
- `/liquid_snake/index.html` - UI elements and modal

## References

- [Couchbase N1QL REST API](https://docs.couchbase.com/server/current/n1ql/n1ql-rest-api/index.html)
- [Couchbase CORS Configuration](https://docs.couchbase.com/server/current/rest-api/rest-cors.html)
- [Couchbase RBAC](https://docs.couchbase.com/server/current/learn/security/roles.html)
