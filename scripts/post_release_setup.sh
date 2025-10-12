#!/bin/bash
# Post-Release Development Version Setup
# Usage: bash scripts/post_release_setup.sh

set -e

echo "🚀 Post-Release Development Version Setup"
echo "=========================================="
echo ""

# Step 1: Check branch
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "❌ ERROR: You are on the main branch!"
    echo "This script should only be run on development/feature branches."
    echo "Please switch to your feature branch first:"
    echo "  git checkout -b feature/your-feature-name"
    exit 1
fi

echo "✅ Current branch: $CURRENT_BRANCH"
echo ""

# Step 2: Detect version
CURRENT_VERSION=$(grep "Current Version" AGENT.md | grep -o "[0-9]\+\.[0-9]\+\.[0-9]\+" | head -1)
POST_VERSION="${CURRENT_VERSION}-post"

echo "📦 Current production version: $CURRENT_VERSION"
echo "📦 New post-release version: $POST_VERSION"
echo ""

# Confirm with user
read -p "Continue with version $POST_VERSION? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Step 3: Update versions
echo "🔄 Updating version numbers..."

sed -i '' "s/v${CURRENT_VERSION}/v${POST_VERSION}/g" AGENT.md
sed -i '' "s/${CURRENT_VERSION}/${POST_VERSION}/g" AGENT.md
sed -i '' "s/content=\"${CURRENT_VERSION}\"/content=\"${POST_VERSION}\"/g" index.html
sed -i '' "s/v${CURRENT_VERSION}/v${POST_VERSION}/g" index.html
sed -i '' "s/Version: ${CURRENT_VERSION}/Version: ${POST_VERSION}/g" en/index.html
sed -i '' "s/content=\"${CURRENT_VERSION}\"/content=\"${POST_VERSION}\"/g" en/index.html
sed -i '' "s/v${CURRENT_VERSION}/v${POST_VERSION}/g" en/index.html
sed -i '' "s/APP_VERSION = \"${CURRENT_VERSION}\"/APP_VERSION = \"${POST_VERSION}\"/g" en/index.html
sed -i '' "s/version=\"${CURRENT_VERSION}\"/version=\"${POST_VERSION}\"/g" Dockerfile
sed -i '' "s/v${CURRENT_VERSION}/v${POST_VERSION}/g" README.md

echo "✅ Version numbers updated"
echo ""

# Step 4: Add dev banner
echo "🎨 Adding development build banner..."

add_banner() {
    local file=$1
    if grep -q "DEV BUILD BANNER" "$file"; then
        echo "⚠️  Banner already exists in $file"
        return
    fi
    
    # Create temporary file with banner
    local tmpfile="${file}.tmp"
    
    # Read file and insert banner before </body>
    awk -v version="$POST_VERSION" '
    /<\/body>/ {
        print "<!-- DEV BUILD BANNER - Remove before release -->"
        print "<div id=\"dev-build-banner\" style=\"position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(255, 0, 0, 0.75); color: #ffffff; padding: 8px 20px; border-radius: 6px; font-size: 16px; font-weight: bold; z-index: 99999; box-shadow: 0 4px 12px rgba(0,0,0,0.5); text-align: center; font-family: Arial, sans-serif; letter-spacing: 1px;\">"
        print "    ⚠️ DEV BUILD: " version " ⚠️"
        print "</div>"
        print "<!-- END DEV BUILD BANNER -->"
    }
    { print }
    ' "$file" > "$tmpfile"
    
    mv "$tmpfile" "$file"
    echo "✅ Added banner to $file"
}

add_banner "index.html"
add_banner "en/index.html"

echo ""
echo "=========================================="
echo "✅ Post-release setup complete!"
echo "📍 Version: $POST_VERSION"
echo "🌿 Branch: $CURRENT_BRANCH"
echo ""
echo "Next steps:"
echo "1. Test the application locally"
echo "2. Verify the red dev banner appears"
echo "3. Commit changes: git commit -am 'chore: set post-release version $POST_VERSION'"
echo "=========================================="
