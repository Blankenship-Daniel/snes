# Zelda 3 Save Template Discovery Documentation

## 🎯 THE CRITICAL DISCOVERY

**The save file template starts at ROM offset `0x274C6` (without header)**

This template is copied by the game when creating a new save file. Modifying these bytes changes what Link starts with in a new game.

## 📍 Key Memory Addresses

### SNES Memory (Runtime)
- Item inventory starts at: `0x7EF340`
- Health Current: `0x7EF36D` 
- Health Capacity: `0x7EF36C`
- Magic Power: `0x7EF36E`
- Rupees: `0x7EF362-0x7EF363`

### ROM Save Template (What We Modify)
- Template Base: `0x274C6` (no header) or `0x276C6` (with header)
- Health at: `0x274F2` (offset 0x2C from base)

## 🗺️ Complete Save Template Map

All offsets are from template base (`0x274C6`):

```
Offset | Item                    | Values
-------|-------------------------|----------------------------------
0x00   | Bow                     | 0=none, 1=normal, 2=silver
0x01   | Boomerang              | 0=none, 1=blue, 2=red
0x02   | Hookshot               | 0=no, 1=yes
0x03   | Bombs                  | 0-99
0x04   | Mushroom/Powder        | 0=none, 1=mushroom, 2=powder
0x05   | Fire Rod               | 0=no, 1=yes
0x06   | Ice Rod                | 0=no, 1=yes
0x07   | Bombos Medallion       | 0=no, 1=yes
0x08   | Ether Medallion        | 0=no, 1=yes
0x09   | Quake Medallion        | 0=no, 1=yes
0x0A   | Lamp                   | 0=no, 1=yes
0x0B   | Hammer                 | 0=no, 1=yes
0x0C   | Flute                  | 0=none, 1=shovel, 2=flute, 3=bird
0x0D   | Bug Net                | 0=no, 1=yes
0x0E   | Book of Mudora         | 0=no, 1=yes
0x0F   | Bottle Count           | 0-4
0x10   | Cane of Somaria        | 0=no, 1=yes
0x11   | Cane of Byrna          | 0=no, 1=yes
0x12   | Magic Cape             | 0=no, 1=yes
0x13   | Magic Mirror           | 0=none, 1=scroll, 2=mirror
0x14   | Gloves                 | 0=none, 1=power, 2=titan
0x15   | Pegasus Boots          | 0=no, 1=yes
0x16   | Flippers               | 0=no, 1=yes
0x17   | Moon Pearl             | 0=no, 1=yes
0x18   | (unused)               | 
0x19   | Sword                  | 0=none, 1=fighter, 2=master, 3=tempered, 4=gold
0x1A   | Shield                 | 0=none, 1=fighter, 2=fire, 3=mirror
0x1B   | Armor                  | 0=green, 1=blue, 2=red
0x1C   | Bottle 1 Contents      | 0=empty, 1=mushroom, 2=red, 3=green, 4=blue, 5=fairy, 6=bee
0x1D   | Bottle 2 Contents      | Same as above
0x1E   | Bottle 3 Contents      | Same as above
0x1F   | Bottle 4 Contents      | Same as above
0x20   | Rupees (wallet) Low    | Low byte of rupee count
0x21   | Rupees (wallet) High   | High byte of rupee count
0x22   | Rupees (actual) Low    | Low byte of actual rupees
0x23   | Rupees (actual) High   | High byte of actual rupees
0x24   | Compass1               | Dungeon compass bitfield
0x25   | Compass2               | Dungeon compass bitfield
0x26   | BigKey1                | Big key bitfield
0x27   | BigKey2                | Big key bitfield
0x28   | Dungeon Map1           | Dungeon map bitfield
0x29   | Dungeon Map2           | Dungeon map bitfield
0x2A   | Pendant/Crystal Low    | Pendant/crystal bitfield
0x2B   | Pendant/Crystal High   | Pendant/crystal bitfield
0x2C   | Health Current         | Current HP (hearts * 8)
0x2D   | Health Maximum         | Maximum HP (hearts * 8)
0x2E   | Magic Power            | Current magic (0x80 = full)
0x2F   | Keys                   | Small key count
0x30   | Bomb Upgrades          | 0-7 (capacity upgrades)
0x31   | Arrow Upgrades         | 0-7 (capacity upgrades)
0x32   | Half Magic             | 0=normal, 1=half magic consumption
0x33   | Quarter Magic          | 0=normal, 1=quarter consumption
0x34   | Ability Flags          | Various ability flags
0x35   | Coins Collected        | For digging game
0x36   | (unused)               |
0x37   | Arrows                 | Arrow count 0-99
```

## 🔍 How We Found It

1. **Searched for health pattern**: Found `18 18` (3 hearts) at `0x274F2`
2. **Verified with hex dump**:
   ```bash
   hexdump -C zelda3.smc | grep 000274f0
   # Output: 00 00 18 18 00 00 00 00  (health values visible)
   ```
3. **Calculated base**: Health is at offset 0x2C in save structure, so base = 0x274F2 - 0x2C = 0x274C6
4. **Confirmed by modifying**: Changed values, started new game, items appeared!

## ⚠️ Critical Notes

1. **Header Detection**: Check if ROM size % 0x8000 == 0x200 to detect header
2. **Save Template vs Runtime**: This is the template for NEW games, not existing saves
3. **Byte Order**: Multi-byte values (rupees, crystals) are little-endian
4. **Health Formula**: Hearts = value / 8 (e.g., 0x50 = 80 = 10 hearts)
5. **Magic**: 0x80 = full magic bar

## 💻 Working Code Example

```typescript
// Calculate offsets
const hasHeader = rom.getSize() % 0x8000 === 0x200;
const headerOffset = hasHeader ? 0x200 : 0;
const templateBase = 0x274C6 + headerOffset;

// Give 10 hearts
rom.writeByte(templateBase + 0x2C, 0x50); // Current health
rom.writeByte(templateBase + 0x2D, 0x50); // Max health

// Give 999 rupees
rom.writeByte(templateBase + 0x22, 0xE7); // 999 & 0xFF = 0xE7
rom.writeByte(templateBase + 0x23, 0x03); // 999 >> 8 = 0x03
```

## 🚨 Why Other Approaches Failed

1. **Direct SRAM writes**: Crashed because we wrote to wrong offsets
2. **ASM patching alone**: Only changed code, not initial data
3. **Wrong memory space**: Confused SNES memory (0x7EXXXX) with ROM offsets
4. **No template understanding**: Didn't know game copies from template

## 📝 Verification Commands

```bash
# Check original values
hexdump -C zelda3.smc | grep 000274c0 -A 3

# After modification, verify changes
hexdump -C zelda3-modified.smc | grep 000274c0 -A 3

# Look for health pattern specifically
hexdump -C zelda3.smc | grep "18 18"
```

## 🎮 Testing Checklist

- [ ] Start new game (don't load existing save!)
- [ ] Check inventory screen for items
- [ ] Verify health hearts
- [ ] Check rupee count
- [ ] Test item functionality (can swim with flippers, etc.)

## 📚 References

- Zelda 3 C implementation: variables.h defines memory layout
- SNES memory map: $7E0000-$7FFFFF is WRAM
- Save file structure: 0x500 bytes per slot
- ROM banks: LoROM addressing scheme

---

**NEVER FORGET**: The save template at `0x274C6` is the key to everything!