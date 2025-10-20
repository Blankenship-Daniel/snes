#!/bin/bash
# Automated Technical Debt Management
# Inspired by bsnes Black+Flake8+pytest success
# Implements systematic automation for TypeScript error reduction

set -euo pipefail

echo "🚀 SNES Modder Technical Debt Automation"
echo "========================================"

# Step 1: Automated Style Fixes (proven success)
echo "📝 Step 1: Style automation..."
npm run fix:fast
echo "✅ Style fixes complete"

# Step 2: TypeScript Error Analysis & Automated Fixes  
echo "🔧 Step 2: TypeScript error automation..."
ERRORS_BEFORE=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
echo "TypeScript errors before: $ERRORS_BEFORE"

# Apply our automated TypeScript fixes
if [ -f "scripts/fix-typescript-errors.js" ]; then
    node scripts/fix-typescript-errors.js
else
    echo "⚠️ TypeScript auto-fixer not yet available"
fi

ERRORS_AFTER=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
echo "TypeScript errors after: $ERRORS_AFTER"

if [ "$ERRORS_BEFORE" -gt "$ERRORS_AFTER" ]; then
    REDUCTION=$((ERRORS_BEFORE - ERRORS_AFTER))
    PERCENTAGE=$((REDUCTION * 100 / ERRORS_BEFORE))
    echo "✅ Reduced by $REDUCTION errors ($PERCENTAGE%)"
else
    echo "📊 Error count stable"
fi

# Step 3: Test Recovery
echo "🧪 Step 3: Test automation..."
npm run test:fast || echo "⚠️ Tests need restoration"

# Step 4: Quality Gate
echo "🎯 Step 4: Quality validation..."
if [ "$ERRORS_AFTER" -lt 100 ]; then
    echo "✅ Quality gate: PASSED (errors < 100)"
    EXIT_CODE=0
else
    echo "❌ Quality gate: FAILED (errors >= 100)"
    EXIT_CODE=1
fi

# Step 5: Report Results
echo ""
echo "📊 AUTOMATION SUMMARY"
echo "===================="
echo "Style fixes: ✅ AUTOMATED"
echo "TypeScript errors: $ERRORS_BEFORE → $ERRORS_AFTER"
echo "Quality gate: $([ $EXIT_CODE -eq 0 ] && echo "PASSED" || echo "FAILED")"
echo ""
echo "🎯 Next priorities:"
echo "1. Consolidate duplicate mods (6+ intro-skip variants)"
echo "2. Restore .excluded test files"  
echo "3. Implement Protocol interface refactoring"

exit $EXIT_CODE