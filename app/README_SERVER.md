# Couchbase Query Analyzer - Server Setup

## Quick Start

### 1. Setup Virtual Environment (First Time Only)

```bash
# Run the setup script
./setup_venv.sh
```

This will:
- Create a Python virtual environment in `./venv`
- Install all required dependencies from `requirements.txt`
- Display next steps

### 2. Activate Virtual Environment

```bash
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

### 3. Install Dependencies (if not using setup script)

```bash
pip install -r requirements.txt
```

### 4. Configure Couchbase Connection

Edit `config.json` to add your Couchbase cluster details:

```json
{
  "clusters": [
    {
      "id": "localhost",
      "name": "Local Development",
      "url": "localhost",
      "username": "Administrator",
      "password": "your-password-here",
      "enabled": true,
      "type": "local"
    }
  ],
  "bucketConfig": {
    "bucket": "cb_tools",
    "analyzerScope": "query",
    "analyzerCollection": "analyzer"
  }
}
```

### 5. Start the Server

```bash
python3 app.py
```

You should see:
```
🚀 Liquid Snake Server
📡 Serving at http://localhost:8888
📂 Directory: /path/to/liquid_snake
🌐 Open: http://localhost:8888/index.html
🛑 Press Ctrl+C to stop
```

### 6. Open in Browser

Navigate to: http://localhost:8888/index.html

### 7. Deactivate Virtual Environment (When Done)

```bash
deactivate
```

## Dependencies

### Required
- **Python 3.8+** - Core language
- **couchbase** - Couchbase Python SDK for cluster connections

### Optional
- **python-dotenv** - For environment variable management

See `requirements.txt` for versions.

## Python Server API Endpoints

The server provides the following REST API endpoints for Couchbase integration:

### Connection Testing
- **POST** `/api/couchbase/test` - Test connection to Couchbase cluster

### Query Execution
- **POST** `/api/couchbase/query` - Execute N1QL queries

### Analyzer Data (cb_tools.query.analyzer)
- **POST** `/api/couchbase/save-analyzer` - Save query analysis data
- **GET** `/api/couchbase/load-analyzer/<requestId>` - Load query analysis data

### User Preferences (cb_tools._default._default)
- **POST** `/api/couchbase/save-preferences` - Save user preferences
- **GET** `/api/couchbase/load-preferences/<userId>` - Load user preferences

## Troubleshooting

### Virtual Environment Issues

**Problem**: `python3 -m venv venv` fails
```bash
# On Ubuntu/Debian
sudo apt-get install python3-venv

# On macOS (using Homebrew)
brew install python@3.11
```

**Problem**: `venv/bin/activate` not found
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### Couchbase SDK Issues

**Problem**: `pip install couchbase` fails
```bash
# macOS - Install required build tools
xcode-select --install

# Ubuntu/Debian
sudo apt-get install build-essential libssl-dev python3-dev

# Then retry
pip install couchbase
```

**Problem**: `ImportError: No module named couchbase`
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall
pip install --upgrade couchbase
```

### Connection Issues

**Problem**: Cannot connect to Couchbase
1. Check that Couchbase is running
2. Verify URL in `config.json` (use hostname only, e.g., `localhost`)
3. Verify credentials are correct
4. Check bucket exists: `cb_tools`
5. Check collections exist: `cb_tools.query.analyzer` and `cb_tools._default._default`

**Problem**: Port 8888 already in use
```bash
# Find process using port 8888
lsof -ti:8888

# Kill the process
kill -9 $(lsof -ti:8888)

# Or use a different port
PORT=9000 python app.py
```

> **Note**: We use port 8888 instead of 5000 because macOS AirPlay Receiver uses port 5000. Playwright tests use port 5555.

## Development Workflow

### Daily Workflow

```bash
# 1. Navigate to project
cd liquid_snake

# 2. Activate virtual environment
source venv/bin/activate

# 3. Start server
python3 app.py

# 4. Work on the analyzer...

# 5. When done, stop server (Ctrl+C) and deactivate
deactivate
```

### Updating Dependencies

```bash
# Activate virtual environment
source venv/bin/activate

# Update all packages
pip install --upgrade -r requirements.txt

# Or update specific package
pip install --upgrade couchbase
```

### Adding New Dependencies

```bash
# Install new package
pip install package-name

# Add to requirements.txt
pip freeze | grep package-name >> requirements.txt
```

## Security Notes

### Config File Security

⚠️ **Never commit passwords to version control!**

```bash
# Add config.json to .gitignore
echo "liquid_snake/config.json" >> ../.gitignore

# Create a template instead
cp config.json config.json.template
# Remove passwords from template
```

### Environment Variables (Optional)

For production, use environment variables instead of hardcoded passwords:

```bash
# Create .env file
cat > .env << EOF
CB_HOST=localhost
CB_USER=Administrator
CB_PASS=your-password
CB_BUCKET=cb_tools
EOF

# Add to .gitignore
echo "liquid_snake/.env" >> ../.gitignore
```

Then update `app.py` to load from `.env`:
```python
from dotenv import load_dotenv
import os

load_dotenv()

CB_HOST = os.getenv('CB_HOST', 'localhost')
CB_USER = os.getenv('CB_USER', 'Administrator')
CB_PASS = os.getenv('CB_PASS', '')
```

## File Structure

```
liquid_snake/
├── venv/                    # Virtual environment (git ignored)
├── app.py               # Python server with Couchbase API
├── requirements.txt        # Python dependencies
├── setup_venv.sh          # Setup script
├── config.json            # Cluster configuration (git ignored)
├── config.json.template   # Template for config
├── index.html             # Main application
└── assets/
    ├── js/
    │   ├── couchbase-connector.js  # Frontend connector
    │   └── settings.js             # Settings UI
    └── css/
        └── main.css
```

## Related Documentation

- [COUCHBASE_INTEGRATION.md](../../COUCHBASE_INTEGRATION.md) - Full integration guide
- [Couchbase Python SDK Docs](https://docs.couchbase.com/python-sdk/current/hello-world/start-using-sdk.html)
- [Main README](../../README.md) - Project overview

## Support

For issues related to:
- **Couchbase Integration**: See [Issue #231](https://github.com/Fujio-Turner/cb_completed_request/issues/231)
- **Server Setup**: Check this README or open a new issue
- **Query Analyzer**: See main [README.md](../../README.md)
