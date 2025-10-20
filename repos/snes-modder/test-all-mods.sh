#!/bin/bash

# Test All v1.1.0 Gameplay Mods
# Quick validation that our mods work correctly

echo "🧪 TESTING ALL v1.1.0 GAMEPLAY MODS"
echo "=================================="
echo

# Generate test ROMs if they don't exist
if [ ! -f "zelda3-infinite-magic.smc" ]; then
  echo "📦 Creating Infinite Magic ROM..."
  node quick-mods/v1.1-gameplay-mods.js zelda3.smc infinite-magic
fi

if [ ! -f "zelda3-quick-start.smc" ]; then
  echo "📦 Creating Quick Start ROM..."
  node quick-mods/v1.1-gameplay-mods.js zelda3.smc quick-start
fi

if [ ! -f "zelda3-ultimate-test.smc" ]; then
  echo "📦 Creating Ultimate Test ROM..."
  node quick-mods/v1.1-gameplay-mods.js zelda3.smc ultimate-test
fi

echo
echo "🧪 RUNNING TESTS..."
echo

# Test each mod
echo "1️⃣ Testing Infinite Magic..."
npx tsx src/testing/ROMTestFramework.ts zelda3-infinite-magic.smc infinite-magic
if [ $? -ne 0 ]; then
  echo "❌ Infinite Magic tests FAILED"
  exit 1
fi

echo
echo "2️⃣ Testing Quick Start..."
npx tsx src/testing/ROMTestFramework.ts zelda3-quick-start.smc quick-start
if [ $? -ne 0 ]; then
  echo "❌ Quick Start tests FAILED"
  exit 1
fi

echo
echo "3️⃣ Testing Ultimate Test..."
npx tsx src/testing/ROMTestFramework.ts zelda3-ultimate-test.smc ultimate-test
if [ $? -ne 0 ]; then
  echo "❌ Ultimate Test tests FAILED"
  exit 1
fi

echo
echo "🎉 ALL TESTS PASSED!"
echo "✅ Infinite Magic mod validated"
echo "✅ Quick Start mod validated" 
echo "✅ Ultimate Test mod validated"
echo
echo "🚀 v1.1.0 is ready to ship!"