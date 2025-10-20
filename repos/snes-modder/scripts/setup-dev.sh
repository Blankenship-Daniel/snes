#!/bin/bash

# SNES Modder Development Environment Setup
# Automated setup script for new developers

set -e

echo "🎮 SNES Modder - Development Environment Setup"
echo "=============================================="
echo

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
    if ! npm list -g semver &> /dev/null; then
        echo "⚠️  Node.js version check requires semver package"
        echo "   Current version: v$NODE_VERSION (minimum: v$REQUIRED_VERSION)"
        echo "   If you have issues, please upgrade Node.js"
    else
        echo "❌ Node.js version v$NODE_VERSION is too old (minimum: v$REQUIRED_VERSION)"
        exit 1
    fi
fi

echo "✅ Node.js v$NODE_VERSION detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check TypeScript compilation
echo "🔍 Checking TypeScript compilation..."
if ! npm run typecheck; then
    echo "⚠️  TypeScript compilation has errors, but continuing setup..."
fi

# Run tests to verify setup
echo "🧪 Running tests..."
if npm test -- --run; then
    echo "✅ All tests passed!"
else
    echo "⚠️  Some tests failed, but setup is complete"
fi

# Initialize git hooks if not already done
if [ ! -f .husky/pre-commit ]; then
    echo "🪝 Setting up git hooks..."
    npm run prepare
fi

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p test-roms
mkdir -p backups
mkdir -p coverage

# Set up environment
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << EOF
NODE_ENV=development
DEBUG=false
LOG_LEVEL=info
EOF
fi

echo
echo "🎉 Setup complete!"
echo
echo "📋 Next steps:"
echo "  1. Place your Zelda 3 ROM file as 'zelda3.smc' in the project root"
echo "  2. Run 'npm run instant-mod zelda3.smc explorer' to test the setup"
echo "  3. Check out docs/guides/getting-started.md for more information"
echo
echo "🔧 Available commands:"
echo "  npm run instant-mod      # Quick ROM modifications"
echo "  npm run test            # Run test suite"
echo "  npm run lint            # Check code quality"
echo "  npm run typecheck       # Verify TypeScript"
echo "  npm run dev             # Start development server"
echo
echo "📚 Documentation: docs/INDEX.md"
echo "🐛 Issues: Create GitHub issue for help"
echo
echo "Happy modding! 🎮✨"