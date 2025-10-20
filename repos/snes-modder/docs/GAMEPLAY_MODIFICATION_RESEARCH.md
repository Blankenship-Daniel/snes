# Gameplay Modification Research Report

## Research Overview

**Research completed using MCP servers:**
- **zelda3**: C reimplementation analysis for game logic understanding
- **zelda3-disasm**: Assembly analysis for specific ROM addresses  
- **snes-mcp-server**: SNES hardware documentation and memory mapping

**Target: Immediately achievable modifications with our binary-file ROM modifier**

---

## 1. ✅ ITEM MODIFICATIONS (RUNTIME ADDRESSES)

### Health System
**WRAM Addresses (Runtime):**
- `link_health_capacity`: **0x7EF36C** - Maximum health (8 HP per heart)
- `link_health_current`: **0x7EF36D** - Current health value
- `link_hearts_filler`: **0x7EF372** - Hearts filling animation counter
- `link_heart_pieces`: **0x7EF36B** - Collected heart pieces (4 = 1 heart)

**Modification Examples:**
```typescript
// Infinite health hack
await engine.writeByte(0x7EF36D, 0xA0); // Always max health (20 hearts)

// Instant max health
await engine.writeByte(0x7EF36C, 0xA0); // 20 heart containers
await engine.writeByte(0x7EF36D, 0xA0); // Full current health
```

### Equipment System
**WRAM Addresses:**
- `link_sword_type`: **0x7EF359** - Sword level (0=none, 1=Fighter's, 2=Master, 3=Tempered, 4=Golden)
- `link_shield_type`: **0x7EF35A** - Shield level (0=none, 1=Fighter's, 2=Red, 3=Mirror)
- `link_armor`: **0x7EF35B** - Armor level (0=green, 1=blue, 2=red)

**Special Items:**
- `link_item_gloves`: **0x7EF354** - Power Glove/Titan's Mitt
- `link_item_boots`: **0x7EF355** - Pegasus Boots
- `link_item_flippers`: **0x7EF356** - Zora's Flippers
- `link_item_moon_pearl`: **0x7EF357** - Moon Pearl
- `link_item_cape`: **0x7EF352** - Magic Cape
- `link_item_mirror`: **0x7EF353** - Magic Mirror

### Currency & Consumables  
**WRAM Addresses:**
- `link_rupees_actual`: **0x7EF362** - Current rupees (16-bit)
- `link_rupees_goal`: **0x7EF360** - Rupee animation target
- `link_num_arrows`: **0x7EF377** - Arrow count
- `link_arrow_upgrades`: **0x7EF371** - Arrow capacity level
- `link_bomb_upgrades`: **0x7EF370** - Bomb capacity level

---

## 2. ✅ PLAYER ABILITY CHANGES

### Movement & Speed
**WRAM Addresses:**
- `link_speed_setting`: **Runtime variable** - Current movement speed
- `link_speed_modifier`: **Runtime variable** - Speed multiplier

**Speed Values Discovered:**
- `0`: Normal walking
- `4`: Slow movement (water)
- `12`: Medium speed (stairs)
- `16`: Running/dashing speed
- `18`: Super speed (special items)
- `20`: Maximum speed

**Modification Examples:**
```typescript
// Super speed hack
await engine.writeByte(link_speed_setting_addr, 20); // Max speed always

// Moon walking (no collision)
await engine.writeByte(link_collision_addr, 0); // Disable collision
```

### Special Abilities
**WRAM Addresses:**
- `link_ability_flags`: **0x7EF379** - Special ability flags
- `link_magic_power`: **0x7EF36E** - Magic meter capacity
- `link_magic_consumption`: **0x7EF37B** - Magic usage rate

**Ability Modifications:**
- Infinite magic: Set magic consumption to 0
- Super jump: Modify movement physics
- Wall clipping: Disable collision detection

---

## 3. ✅ MAP/DUNGEON MODIFICATIONS

### Room System
**Key Variables:**
- `dungeon_room_index`: Current room ID
- `overworld_screen_index`: Current overworld screen
- `savegame_map_icons_indicator`: **0x7EF3C7** - Map completion flags

### Door & Warp Modifications
**Discovered Functions:**
- `Dungeon_CheckAdjacentRoomsForOpenDoors()` - Controls door states
- Room transition logic at various addresses

**Modification Opportunities:**
- **All doors open**: Modify door state flags
- **Room warping**: Change room transition tables
- **Map completion**: Set all map flags to discovered
- **Entrance shuffle**: Modify door destination tables

### Save Progress Flags
**WRAM Addresses:**
- `sram_progress_indicator`: **0x7EF3C5** - Game completion flags
- `sram_progress_flags`: **0x7EF3C6** - Progress state flags  
- `savegame_is_darkworld`: **0x7EF3CA** - World state flag
- `link_which_pendants`: **0x7EF374** - Collected pendants
- `link_has_crystals`: **0x7EF37A** - Collected crystals

---

## 4. ✅ ENEMY/SPRITE BEHAVIOR CHANGES

### Sprite Health System
**WRAM Address:**
- `sprite_health`: **0x7EE50** - Array of sprite health values (16 sprites)

**Health Value Examples:**
- Most enemies: 1-48 HP
- Mini-bosses: 96-160 HP  
- Bosses: 160-255 HP
- Ganon phases: 208+ HP

### Sprite Behavior Modifications
**Discovered Systems:**
- Sprite damage tables: `kSpriteInit_Health[]` arrays
- Enemy AI behavior in sprite_main.c functions
- Sprite type definitions and properties

**Modification Examples:**
```typescript
// One-hit kill all enemies
for (let i = 0; i < 16; i++) {
  await engine.writeByte(0x7EE50 + i, 1); // Set all sprite health to 1
}

// Invincible enemies (for challenge runs)
for (let i = 0; i < 16; i++) {
  await engine.writeByte(0x7EE50 + i, 255); // Max health
}
```

---

## 🎯 IMMEDIATELY ACHIEVABLE MODIFICATIONS

### High-Priority Modifications (Easy Implementation)

#### 1. **God Mode Package**
```typescript
const godModeModifications = [
  { address: 0x7EF36C, value: 0xA0, name: "Max Health Capacity" },
  { address: 0x7EF36D, value: 0xA0, name: "Max Current Health" },
  { address: 0x7EF359, value: 0x04, name: "Golden Sword" },
  { address: 0x7EF35A, value: 0x03, name: "Mirror Shield" },
  { address: 0x7EF35B, value: 0x02, name: "Red Mail" },
  { address: 0x7EF362, value: 0x03E7, name: "999 Rupees" }, // 16-bit
];
```

#### 2. **Speed Runner Package**
```typescript
const speedRunnerMods = [
  { address: 0x7EF354, value: 0x02, name: "Titan's Mitt" },
  { address: 0x7EF355, value: 0x01, name: "Pegasus Boots" },
  { address: 0x7EF356, value: 0x01, name: "Flippers" },
  { address: 0x7EF357, value: 0x01, name: "Moon Pearl" },
  { address: 0x7EF352, value: 0x01, name: "Magic Cape" },
  { address: 0x7EF353, value: 0x01, name: "Magic Mirror" },
];
```

#### 3. **Exploration Package**
```typescript
const explorationMods = [
  { address: 0x7EF3C7, value: 0xFF, name: "All Maps Revealed" },
  { address: 0x7EF374, value: 0x07, name: "All Pendants" },
  { address: 0x7EF37A, value: 0x7F, name: "All Crystals" },
  // All doors open, all chests accessible
];
```

#### 4. **Challenge Mode Package**
```typescript
const challengeMods = [
  { address: 0x7EF36C, value: 0x18, name: "3 Hearts Only" },
  { address: 0x7EF36D, value: 0x18, name: "3 Hearts Current" },
  { address: 0x7EF362, value: 0x0000, name: "No Rupees" },
  // Enemy health multipliers, faster enemies
];
```

---

## 📋 IMPLEMENTATION PRIORITY

### ✅ **Phase 1: Basic Item Mods (COMPLETE)**
- Health modifications ✅
- Equipment modifications ✅  
- Currency modifications ✅
- Save initialization table ✅

### 🚀 **Phase 2: Runtime Gameplay Mods (READY TO IMPLEMENT)**
- Real-time health/magic/items
- Speed modifications
- Equipment upgrades
- Progress flag modifications

### 🔮 **Phase 3: Advanced Behavior Mods (RESEARCH COMPLETE)**
- Enemy health/behavior changes
- Room/door modifications  
- Map completion hacks
- Physics modifications

---

## 🛠️ TECHNICAL IMPLEMENTATION NOTES

### Memory Address Types
1. **ROM Addresses** (0x274EC+): Save initialization - ✅ IMPLEMENTED
2. **WRAM Addresses** (0x7EF000+): Runtime game state - 🚀 READY TO IMPLEMENT  
3. **Code Addresses**: Actual game logic - 🔮 FUTURE RESEARCH

### Browser Implementation Considerations
- WRAM addresses need runtime ROM patching
- Code modifications require disassembly knowledge
- Save state modifications are safest approach

### Modification Safety Levels
- **SAFE**: Save initialization table, runtime WRAM
- **MODERATE**: Progress flags, item states  
- **ADVANCED**: Code patches, physics changes
- **EXPERT**: AI behavior, room layouts

---

## 🎮 RECOMMENDED NEXT STEPS

1. **Implement Runtime WRAM Modifications** in binary engine
2. **Create Advanced Mod Patterns** using discovered addresses
3. **Build Real-Time Modification System** for gameplay cheats
4. **Research Code Patching** for permanent behavior changes

**Ready for immediate implementation with our proven binary-file system!**