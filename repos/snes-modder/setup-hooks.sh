#!/bin/bash
# Pre-commit hooks setup for snes-modder
# Maintained by Sam (Code Custodian)

echo "🔧 Setting up pre-commit hooks..."

# Install husky if not present
if [ ! -d "node_modules/husky" ]; then
  echo "📦 Installing husky..."
  npm install --save-dev husky
fi

# Initialize husky
npx husky init

# Create pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# TypeScript compilation
echo "📝 Checking TypeScript..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors detected"
  exit 1
fi

echo "✅ Pre-commit checks passed!"
EOF

chmod +x .husky/pre-commit

echo "✅ Pre-commit hooks installed!"
echo "Every commit will now check:"
echo "  - TypeScript compilation"
echo "  - (Add more checks as needed)"