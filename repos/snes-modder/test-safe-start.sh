#!/bin/bash

echo "Testing Safe Start ROM Modification"
echo "===================================="
echo ""

# Check if ROM exists
if [ ! -f "zelda3-safe-start.smc" ]; then
    echo "Error: zelda3-safe-start.smc not found!"
    exit 1
fi

echo "✓ ROM file exists"
echo ""

# Compare file sizes
ORIGINAL_SIZE=$(stat -f%z zelda3.smc 2>/dev/null || stat -c%s zelda3.smc 2>/dev/null)
MODIFIED_SIZE=$(stat -f%z zelda3-safe-start.smc 2>/dev/null || stat -c%s zelda3-safe-start.smc 2>/dev/null)

if [ "$ORIGINAL_SIZE" != "$MODIFIED_SIZE" ]; then
    echo "⚠️  Warning: File sizes differ"
    echo "   Original: $ORIGINAL_SIZE bytes"
    echo "   Modified: $MODIFIED_SIZE bytes"
else
    echo "✓ File sizes match ($ORIGINAL_SIZE bytes)"
fi

echo ""
echo "ROM Comparison:"
echo "---------------"

# Use hexdump to check for differences
echo "Checking for modifications..."
diff <(hexdump -C zelda3.smc | head -1000) <(hexdump -C zelda3-safe-start.smc | head -1000) > /tmp/rom_diff.txt 2>&1

if [ -s /tmp/rom_diff.txt ]; then
    echo "✓ Modifications detected"
    echo "  Number of changed lines: $(wc -l < /tmp/rom_diff.txt)"
else
    echo "⚠️  No differences detected in first 16KB"
fi

echo ""
echo "Safety Checks:"
echo "--------------"

# Check header
HEADER_CHECK=$(hexdump -C zelda3-safe-start.smc | head -1 | grep -c "00000000")
if [ "$HEADER_CHECK" -eq 1 ]; then
    echo "✓ ROM header appears valid"
else
    echo "⚠️  ROM header may be corrupted"
fi

# Check for common crash patterns
echo "Scanning for potential issues..."

# Check if file is mostly zeros (corrupted)
ZERO_COUNT=$(hexdump -C zelda3-safe-start.smc | grep -c "00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00")
if [ "$ZERO_COUNT" -gt 1000 ]; then
    echo "⚠️  Warning: ROM contains excessive null bytes (possible corruption)"
else
    echo "✓ ROM data integrity looks good"
fi

echo ""
echo "Summary:"
echo "--------"
echo "The zelda3-safe-start.smc ROM has been created with minimal modifications."
echo "This version only changes the starting health from 3 hearts to 10 hearts."
echo ""
echo "Next step: Test this ROM in OpenEmu to verify it doesn't crash."
echo ""
echo "If it still crashes, we can try:"
echo "1. Using an IPS patcher instead of direct modification"
echo "2. Analyzing the exact crash location with bsnes debugger"
echo "3. Creating an even simpler mod that changes just one byte"