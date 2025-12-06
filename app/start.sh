#!/bin/bash
# Start Liquid Snake Flask Server

echo "🚀 Starting Liquid Snake Server..."

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Creating one..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate venv and install dependencies
echo "📦 Installing dependencies..."
source venv/bin/activate
pip install -q -r requirements.txt

# Run Flask app
echo "🌐 Starting Flask server on http://localhost:5555"
echo "🛑 Press Ctrl+C to stop"
echo ""

python app.py
