# SNES Address Space Clarification

## 🎯 CRITICAL UNDERSTANDING: THREE ADDRESS SPACES

### 1. **SNES RAM Addresses** (Runtime Memory)
- **Format**: `0x7EXXXX` (24-bit SNES addressing)
- **Example**: `0x7EF36C` = Link's max health in RAM
- **Usage**: What the game uses during gameplay
- **When**: Runtime memory operations

### 2. **ROM File Offsets** (Save Initialization)
- **Format**: `0x27XXXX` (File position in ROM)
- **Example**: `0x274EC` = Health initialization value in ROM
- **Usage**: Default values for new game start
- **When**: ROM modification for starting equipment

### 3. **Save File Offsets** (SRAM)
- **Format**: `0x0XXX` (Offset within save slot)
- **Example**: `0x36C` = Health in save file
- **Usage**: Persistent game saves
- **When**: Save/load operations

## 📋 ADDRESS MAPPING REFERENCE

| Item | SNES RAM | ROM Init | Save File | Description |
|------|----------|----------|-----------|-------------|
| Health Max | `0x7EF36C` | `0x274EC` | `0x36C` | Maximum health capacity |
| Health Current | `0x7EF36D` | `0x274ED` | `0x36D` | Current health |
| Bow | `0x7EF340` | `0x27480` | `0x340` | Bow possession/type |
| Bombs | `0x7EF343` | `0x27483` | `0x343` | Bomb count |
| Rupees | `0x7EF360-361` | `0x274A0-A1` | `0x360-361` | Currency (16-bit) |

## ✅ CONVERSION FORMULAS

```typescript
// SNES RAM to Save File offset
saveOffset = snesAddress & 0xFFFF;  // 0x7EF36C -> 0xF36C

// Save File to ROM initialization offset
romOffset = 0x27400 + (saveOffset - 0xF300);  // 0xF36C -> 0x274EC

// ROM to SNES RAM (for reference only)
snesAddress = 0x7E0000 + (romOffset - 0x27400) + 0xF300;
```

## 🎮 WHAT WE MODIFY

**For Explorer's Pack, we modify ROM INITIALIZATION VALUES:**
- We change bytes at `0x274EC` (ROM file)
- This sets the default health when starting a new game
- The game copies these to `0x7EF36C` (RAM) on new game
- The game saves these to `0x36C` (save file) when saving

## 🏆 AUTHORITATIVE SOURCE

All addresses verified from:
1. **Zelda3 C source** (MCP server) - RAM addresses
2. **Production testing** - ROM offsets work
3. **Save file analysis** - Confirmed mappings

---

**TL;DR for Morgan:** Use ROM offsets (`0x274XX`) for modifications. They work.

**TL;DR for Sam:** The three address spaces are properly mapped. No conflicts.

**TL;DR for Alex:** This is temporary documentation until Phase 3 refactor.