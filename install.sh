#!/bin/bash

# Meme CLI Installation Script
# This script installs the meme-lyr globally on your system

set -e

echo "🎨 Installing Meme CLI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    echo "   Visit https://nodejs.org/ for installation instructions."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install the package globally
echo "📦 Installing meme-lyr globally..."
npm install -g .

if [ $? -eq 0 ]; then
    echo "✅ meme-lyr installed successfully!"
    echo ""
    echo "🤖 Installing AI agent skill..."
    
    # Create skills directory if it doesn't exist
    mkdir -p ~/.agents/skills
    
    # Try to find the skill directory in various locations
    SKILL_SOURCE=""
    
    # Check current directory (for local installs)
    if [ -d "skills/meme-lyr" ]; then
        SKILL_SOURCE="skills/meme-lyr"
    # Check npm global directory (for npm installs)
    elif [ -d "$(npm root -g)/meme-lyr/skills/meme-lyr" ]; then
        SKILL_SOURCE="$(npm root -g)/meme-lyr/skills/meme-lyr"
    # Check if we can download from repository
    else
        echo "📥 Downloading skill from repository..."
        TEMP_DIR=$(mktemp -d)
        if curl -fsSL https://raw.githubusercontent.com/ishan-parihar/meme-lyr/main/skills/meme-lyr/SKILL.md -o "$TEMP_DIR/SKILL.md"; then
            mkdir -p "$TEMP_DIR/meme-lyr"
            mv "$TEMP_DIR/SKILL.md" "$TEMP_DIR/meme-lyr/"
            # Try to download evals as well
            curl -fsSL https://raw.githubusercontent.com/ishan-parihar/meme-lyr/main/skills/meme-lyr/evals/evals.json -o "$TEMP_DIR/meme-lyr/evals.json" 2>/dev/null || true
            if [ -f "$TEMP_DIR/meme-lyr/SKILL.md" ]; then
                mkdir -p "$TEMP_DIR/meme-lyr/evals"
                [ -f "$TEMP_DIR/meme-lyr/evals.json" ] && mv "$TEMP_DIR/meme-lyr/evals.json" "$TEMP_DIR/meme-lyr/evals/"
                SKILL_SOURCE="$TEMP_DIR/meme-lyr"
            fi
        fi
    fi
    
    # Copy the skill to the agent skills directory
    if [ -n "$SKILL_SOURCE" ] && [ -d "$SKILL_SOURCE" ]; then
        cp -r "$SKILL_SOURCE" ~/.agents/skills/
        echo "✅ AI agent skill installed to ~/.agents/skills/meme-lyr"
        # Clean up temp directory if we used it
        if [ -n "$TEMP_DIR" ]; then
            rm -rf "$TEMP_DIR"
        fi
    else
        echo "⚠️  AI agent skill directory not found. Manual installation required:"
        echo "   cp -r skills/meme-lyr ~/.agents/skills/"
    fi
    
    echo ""
    echo "🎉 Installation complete!"
    echo ""
    echo "📝 To get started:"
    echo "  1. Set your ImgFlip credentials:"
    echo "     meme-lyr config --username your_username --password your_password"
    echo ""
    echo "  2. You can also set a default background color:"
    echo "     meme-lyr config --default-background pink"
    echo ""
    echo "  3. Generate your first meme:"
    echo "     meme-lyr carousel 61579 --text0 \"One does not simply\" --aspect-ratio \"1:1\""
    echo ""
    echo "  4. Or use environment variables instead of config:"
    echo "     export IMGFLIP_USERNAME=\"your_username\""
    echo "     export IMGFLIP_PASSWORD=\"your_password\""
    echo ""
    echo "🔗 Create your ImgFlip account at https://imgflip.com/signup"
    echo ""
    echo "📖 For more information, run: meme-lyr --help"
    echo ""
    echo "🤖 AI agent skill is now available for autonomous meme generation"
else
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi