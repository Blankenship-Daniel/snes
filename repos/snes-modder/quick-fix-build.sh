#!/bin/bash
# Morgan's Quick Build Fix Script - Ship it!

echo "🚀 Morgan's Pragmatic Build Fixer"
echo "================================"

# Step 1: Count errors by type
echo "Error breakdown:"
npm run build 2>&1 | grep "error TS" | sed 's/.*error TS\([0-9]*\).*/\1/' | sort | uniq -c | sort -rn | head -10

# Step 2: Most common issues
echo -e "\nMost common issues:"
echo "- TS6133: Unused variables (can ignore with _prefix)"
echo "- TS2345: Type mismatches (need casting)"
echo "- TS6192: Unused imports (just delete)"

echo -e "\nRecommendation: Add skipLibCheck and less strict rules to tsconfig temporarily"
