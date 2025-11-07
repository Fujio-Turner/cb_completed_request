# Quick Start Guide

## First Time Setup

```bash
# 1. Run setup script (creates venv and installs dependencies)
./setup_venv.sh

# 2. Copy config template and add your credentials
cp config.json.template config.json
# Edit config.json with your Couchbase credentials
```

## Daily Use

```bash
# Activate virtual environment
source venv/bin/activate

# Start server
python3 server.py

# Open browser to http://localhost:5555/index.html

# When done (Ctrl+C to stop server)
deactivate
```

## Files Created

✅ `venv/` - Virtual environment (git ignored)  
✅ `requirements.txt` - Python dependencies  
✅ `config.json` - Your cluster settings (git ignored)  
✅ `config.json.template` - Template for sharing  

## Need Help?

See [README_SERVER.md](./README_SERVER.md) for detailed documentation.
