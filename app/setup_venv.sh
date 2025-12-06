#!/bin/bash
# Setup script for Couchbase Query Analyzer Python environment
# Issue #231

echo "🚀 Setting up Python virtual environment for Couchbase Query Analyzer"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Display Python version
PYTHON_VERSION=$(python3 --version)
echo "✅ Found $PYTHON_VERSION"
echo ""

# Create virtual environment
echo "📦 Creating virtual environment in ./venv..."
python3 -m venv venv

if [ $? -ne 0 ]; then
    echo "❌ Failed to create virtual environment"
    exit 1
fi

echo "✅ Virtual environment created"
echo ""

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

if [ $? -ne 0 ]; then
    echo "❌ Failed to activate virtual environment"
    exit 1
fi

echo "✅ Virtual environment activated"
echo ""

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1

# Install dependencies
echo "📥 Installing dependencies from requirements.txt..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    deactivate
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Activate the virtual environment:"
echo "      source venv/bin/activate"
echo ""
echo "   2. Configure your Couchbase cluster in config.json"
echo ""
echo "   3. Start the server:"
echo "      python3 server.py"
echo ""
echo "   4. Open http://localhost:5000/index.html"
echo ""
echo "   5. When done, deactivate the virtual environment:"
echo "      deactivate"
echo ""
