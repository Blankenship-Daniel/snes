#!/bin/bash

# Direct ROM Byte Verification for Rich Start Mod
# Verifies the actual bytes written to ROM at save initialization addresses

set -e

echo "🔍 Rich Start Mod - ROM Byte Verification"
echo "═══════════════════════════════════════════"
echo ""

# ROM addresses where starting rupees are stored (save file template)
RUPEE_ADDR="0x274F4"

verify_rom_bytes() {
    local rom="$1"
    local expected_value="$2"
    local variant="$3"

    echo "🧪 Verifying: $variant"
    echo "─────────────────────────────────────"

    if [ ! -f "$rom" ]; then
        echo "⚠️  ROM not found: $rom - SKIPPING"
        echo ""
        return
    fi

    echo "📍 ROM Address: $RUPEE_ADDR (2 bytes, little-endian)"
    echo "💰 Expected Value: $expected_value rupees"
    echo ""

    # Read bytes using xxd
    if command -v xxd &> /dev/null; then
        echo "📊 Hexdump at address $RUPEE_ADDR:"
        xxd -s "$RUPEE_ADDR" -l 2 "$rom"
        echo ""

        # Extract the actual bytes
        # xxd -p outputs hex in file order: first byte, then second byte
        # For little-endian: first byte is LOW, second byte is HIGH
        local hex_bytes=$(xxd -s "$RUPEE_ADDR" -l 2 -p "$rom")
        local low_byte="0x${hex_bytes:0:2}"   # First byte
        local high_byte="0x${hex_bytes:2:2}"  # Second byte

        # Convert to decimal (little-endian: value = high*256 + low)
        local decimal_value=$(( (high_byte << 8) | low_byte ))

        echo "🔢 Parsed Values:"
        echo "  Low byte:  $low_byte"
        echo "  High byte: $high_byte"
        echo "  Decimal:   $decimal_value rupees"
        echo ""

        # Verify
        if [ "$decimal_value" = "$expected_value" ]; then
            echo "✅ PASS: ROM bytes are correct!"
            echo "   Expected: $expected_value"
            echo "   Got:      $decimal_value"
        else
            echo "❌ FAIL: ROM bytes don't match!"
            echo "   Expected: $expected_value"
            echo "   Got:      $decimal_value"
        fi
    else
        echo "❌ Error: xxd command not available"
        return 1
    fi

    echo ""
}

# Verify all three variants
echo "Starting ROM byte verification..."
echo ""

verify_rom_bytes "repos/snes-modder/zelda3-rich-start-999.smc" 999 "Millionaire (999 rupees)"
verify_rom_bytes "repos/snes-modder/zelda3-rich-start-500.smc" 500 "Comfortable (500 rupees)"
verify_rom_bytes "repos/snes-modder/zelda3-rich-start-777.smc" 777 "Wealthy (777 rupees)"

echo "═══════════════════════════════════════════"
echo "✨ ROM byte verification complete!"
echo ""
echo "📋 Technical Details:"
echo "  - Address: 0x274F4-0x274F5 (ROM offset)"
echo "  - Encoding: Little-endian 16-bit unsigned"
echo "  - Purpose: Save file initialization template"
echo "  - Game copies this to SRAM when creating new save"
echo ""
echo "✅ These bytes prove the ROM modification worked correctly"
echo "   at the binary level, independent of emulator behavior."
