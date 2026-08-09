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
else
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi