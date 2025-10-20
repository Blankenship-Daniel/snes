# The Legend of Zelda: A Link to the Past - Technical Documentation

## Overview

The Legend of Zelda: A Link to the Past (known internally as "Zelda 3") is a 1991 action-adventure game for the Super Nintendo Entertainment System (SNES). It represents one of the most technically sophisticated games of the 16-bit era, implementing complex systems for world management, sprite handling, and game state persistence.

## Visual References

For comprehensive visual documentation of the game elements discussed in this document, refer to these resources:

### Screenshot Collections
- **[GameFAQs Gallery](https://gamefaqs.gamespot.com/snes/588436-the-legend-of-zelda-a-link-to-the-past/images)** - Over 2,200 user screenshots covering all aspects of gameplay
- **[MobyGames Screenshots](https://www.mobygames.com/game/6608/the-legend-of-zelda-a-link-to-the-past/screenshots/)** - In-game screenshots showcasing various game states
- **[Zelda Dungeon Wiki Screenshots](https://www.zeldadungeon.net/wiki/Category:A_Link_to_the_Past_(SNES)_Screenshot_Files)** - Categorized screenshots from the SNES version
- **[The Spriters Resource](https://www.spriters-resource.com/snes/legendofzeldaalinktothepast/)** - Complete sprite sheets including HUD elements, items, and characters

### Maps and World Structure
- **[Mike's RPG Center Maps](https://mikesrpgcenter.com/zelda3/maps.html)** - Complete Light World, Dark World, and dungeon maps with clickable regions
- **[Zelda Dungeon Maps](https://www.zeldadungeon.net/wiki/A_Link_to_the_Past_Locations)** - Detailed location guides with visual references

### Speedrun and Glitch Documentation
- **[ALttP Speedrunning Wiki](https://alttp-wiki.net/)** - Visual guides for glitches including Exploration Glitch and YBA
- **[Speedrun.com Video Guides](https://www.speedrun.com/alttp/guides)** - Video demonstrations of speedrun techniques
- **[YBA Tutorial by Meowski](https://www.twitch.tv/videos/1990821381)** - In-depth visual explanation of Yuzuhara's Bottle Adventure
- **[WR Run Input Explanation](https://www.youtube.com/watch?v=KzUASO8LZno)** - Frame-by-frame breakdown of speedrun techniques

## Game Mechanics

### Core Gameplay Systems

#### Movement and Controls
- **8-directional movement**: Unlike its NES predecessors, Link can move diagonally
- **Context-sensitive actions**: Single button performs different actions based on context
- **Dash mechanics**: Pegasus Boots enable high-speed charging with collision effects
- **Swimming**: Flippers enable deep water navigation

#### World Structure
- **Dual World System**: Light World and Dark World exist as parallel dimensions
- **Magic Mirror**: Allows transition from Dark World to Light World at any position
- **Portals**: Fixed transition points between worlds
- **Synchronized positions**: Position in one world corresponds to position in the other

### Health System

*Visual Reference: See the HUD display with hearts in the top-left corner at [GameFAQs Screenshot #1902](https://gamefaqs.gamespot.com/snes/588436-the-legend-of-zelda-a-link-to-the-past/images/21902)*

#### Heart Containers
- **Starting health**: 3 Heart Containers (24 HP, 8 HP per heart)
- **Maximum health**: 20 Heart Containers (160 HP)
- **Heart Container sources**:
  - 10 from dungeon bosses (3 Light World, 7 Dark World)
  - 1 from Sanctuary
  - 5 from collecting Pieces of Heart (4 pieces = 1 container)
  - 1 from Uncle (starting)

#### Pieces of Heart
- **Total count**: 24 Pieces of Heart scattered throughout both worlds
- **Collection requirement**: 4 pieces form 1 complete Heart Container
- **Distribution**: Hidden in various locations, rewards for mini-games, side quests

### Currency System

#### Rupees
- **Maximum capacity**: 999 rupees
- **Denominations**:
  - Green: 1 rupee
  - Blue: 5 rupees
  - Red: 20 rupees
  - Purple: 50 rupees (in pots/chests)
  - Silver: 100 rupees (special locations)
  - Gold: 300 rupees (special locations)

#### Major Purchases
- **Zora's Flippers**: 500 rupees (required for swimming)
- **Bottle**: 100 rupees (Kakariko Village)
- **Super Bomb**: 100 rupees (Dark World Bomb Shop)
- **Pond of Happiness**: Variable donations for capacity upgrades

### Item System

*Visual Reference: Complete inventory screen layout available at [The Spriters Resource](https://www.spriters-resource.com/snes/legendofzeldaalinktothepast/) under HUD/Menu sprites*

#### Swords (Progressive Upgrades)
1. **Fighter's Sword**: Starting weapon from Uncle
2. **Master Sword**: Obtained after collecting 3 Pendants
3. **Tempered Sword**: Upgraded by smithies for 10 rupees
4. **Golden Sword**: Thrown into Pyramid fairy fountain

#### Shields
1. **Fighter's Shield**: Basic protection
2. **Red Shield**: Blocks fireballs
3. **Mirror Shield**: Blocks all projectiles including beams

#### Major Items
- **Bow and Arrows**: Ranged combat, Silver Arrows for Ganon
- **Boomerang**: Stunning and retrieval tool (Blue/Red variants)
- **Hookshot**: Grappling and pulling mechanism
- **Bombs**: Destructive items (10-50 capacity)
- **Magic Powder**: Transformation effects
- **Fire Rod/Ice Rod**: Elemental magic weapons
- **Medallions**: Bombos, Ether, Quake (screen-clearing magic)
- **Canes**: Somaria (block creation), Byrna (protective barrier)
- **Magic Cape**: Invisibility and invulnerability
- **Pegasus Boots**: High-speed dashing
- **Power Glove/Titan's Mitt**: Progressive lifting strength
- **Moon Pearl**: Maintains human form in Dark World

### Dungeon System

*Visual Reference: Complete dungeon maps with room layouts at [Mike's RPG Center](https://mikesrpgcenter.com/zelda3/maps.html)*

#### Light World Dungeons
1. **Eastern Palace**: Bow
2. **Desert Palace**: Power Glove
3. **Tower of Hera**: Moon Pearl

#### Dark World Dungeons
1. **Palace of Darkness**: Hammer - *[Walkthrough with screenshots](https://www.zeldadungeon.net/a-link-to-the-past-walkthrough/dark-palace/)*
2. **Swamp Palace**: Hookshot
3. **Skull Woods**: Fire Rod - *Multiple entrances via pits in overworld*
4. **Thieves' Town**: Titan's Mitt - *Under gargoyle statue*
5. **Ice Palace**: Blue Mail - *Carved into central lake iceberg*
6. **Misery Mire**: Cane of Somaria
7. **Turtle Rock**: Mirror Shield
8. **Ganon's Tower**: Red Mail, Silver Arrows

## Technical Architecture

### ROM Structure

#### Memory Mapping
- **Type**: LoROM configuration
- **Bank size**: 32KB per bank
- **Total banks**: 128 banks ($00-$7F, $80-$FF)
- **ROM size**: 1MB (8 Megabit) standard, expandable to 4MB
- **Header location**: $007FC0 in ROM, mapped to $00FFC0 in memory

#### Memory Layout
```
$00-$3F, $80-$BF: System areas with ROM mapped to $8000-$FFFF
$40-$7D, $C0-$FF: ROM banks
$7E-$7F: WRAM (Work RAM, 128KB)
$70: SRAM (Save RAM, mirrored)
```

### 65816 Processor Details

#### Performance Characteristics
- **FastROM**: Code in banks $80-$FF executes at 3.58 MHz
- **SlowROM**: Code in banks $00-$7F executes at 2.68 MHz
- **Address space**: 24-bit addressing ($000000-$FFFFFF)

### Save System (SRAM)

#### Save Slot Structure
- **Slot size**: $500 bytes per save file
- **Total slots**: 3 save files
- **Mirroring**: Each slot mirrored for redundancy
- **Checksum**: Inverse checksum validation

#### Important SRAM Offsets (per slot)
```
$000-$24F: Room data (explored rooms, opened chests)
$340-$37B: Inventory items and equipment
$35C-$363: Rupee count (goal and actual)
$36C: Health capacity
$36D: Current health
$36E-$377: Magic meter, keys, pendants
$378-$37B: Progress flags
```

### Sprite System

#### Sprite Arrays (WRAM)
```
$0DD0[16]: Sprite state
$0E20[16]: Sprite type ID
$0D10[16]: X position low byte
$0D30[16]: X position high byte
$0D00[16]: Y position low byte
$0D20[16]: Y position high byte
$0E50[16]: Sprite health
$0F50[16]: Sprite auxiliary state
```

#### Sprite Types
- **$00-$1F**: Common enemies (soldiers, octoroks)
- **$20-$3F**: Dungeon-specific enemies
- **$40-$5F**: Bosses and mini-bosses
- **$60-$7F**: NPCs and interactive objects
- **$80-$9F**: Projectiles and effects
- **$A0-$BF**: Special objects (fairies, hearts)
- **$C0-$F2**: System sprites

### Room System

#### Room Structure
- **Total rooms**: 296 ($000-$127)
- **Overworld screens**: 128 (64 Light, 64 Dark)
- **Underworld rooms**: 168
- **Room state**: 2 bytes per room (640 bytes total)

## Known Glitches and Exploits

*Visual References: [ALttP Speedrunning Wiki](https://alttp-wiki.net/index.php/Major_Glitches) provides detailed visual guides for all major glitches*

### Major Glitches

#### Exploration Glitch (EG)
- **Effect**: Allows movement between underworld rooms by manipulating layer collision
- **Activation methods**:
  - Out of bounds clips
  - YBA in underworld
  - Mirror jumping
  - Save & quit manipulation
- **Impact**: Enables sub-2 minute completion in Any% categories
- **Visual Guide**: [EG Documentation](https://alttp-wiki.net/index.php/Exploration_Glitch)

#### Yuzuhara's Bottle Adventure (YBA)
- **Mechanism**: Memory corruption via simultaneous potion use and screen transition
- **Technical cause**: Game mode ($0010-0011) conflicting updates
- **Blue Potion YBA**: Triggers fake flute in overworld - *[Fake Flute Guide](https://alttp-wiki.net/index.php/Fake_Flute)*
- **Green/Red Potion YBA**: Various effects based on location
- **Tutorial**: [In-depth YBA explanation by Meowski](https://www.twitch.tv/videos/1990821381)

#### Door Juke
- **Effect**: Bypasses room transition triggers
- **Methods**:
  - YBA timing
  - Statue dragging
  - Mirror door techniques
  - Somaria/Bomb snapping

### Speedrun Categories

*For current world records and video demonstrations, visit [Speedrun.com ALttP Leaderboards](https://www.speedrun.com/alttp)*

#### Any% No Major Glitches (NMG)
- **Banned**: EG, YBA, S&Q, WW, OOB
- **Typical time**: ~1:20:00
- **Route Guide**: [NMG Tutorial Resources](https://www.speedrun.com/alttp/guides)

#### Any% Unrestricted
- **All glitches allowed**
- **Typical time**: Under 2 minutes with EG
- **WR Example**: [Input breakdown video](https://www.youtube.com/watch?v=KzUASO8LZno)

#### 100% All Dungeons
- **Requirements**: All dungeons, all items
- **Typical time**: ~1:45:00

### Memory Manipulation

#### Important Memory Addresses
```
$7E0010: Game mode
$7E0011: Submode
$7E00A0-A1: Link X coordinate
$7E00A2-A3: Link Y coordinate
$7E0040: Current room ID
$7E00EE: Link's layer
$7E0308: Accumulated hearts
$7E0303: Bomb/Arrow upgrades
```

## ROM Modification Considerations

### Safe Modification Zones
- **Initialization table**: $274C0-$274FB (save file defaults)
- **Text data**: Various banks with pointer tables
- **Sprite data**: Properties and behaviors
- **Room headers**: Layout and properties

### Critical Protected Areas
- **Executable code**: Banks containing game logic
- **SNES header**: $7FC0-$7FDF
- **Interrupt vectors**: NMI, IRQ handlers
- **DMA tables**: Graphics transfer routines

### Checksum Requirements
- **Location**: $7FDC-$7FDF
- **Type**: Inverse checksum
- **Calculation**: Must be updated after any ROM modification

## Development Resources

### MCP Servers Available
1. **zelda3**: Complete C reimplementation for understanding game logic
2. **zelda3-disasm**: Annotated 65816 assembly with semantic insights
3. **snes-mcp-server**: SNES hardware documentation and tools
4. **snes9x**: Emulator source for hardware behavior reference

### Key Algorithms
- **Collision detection**: Tile-based with pixel precision
- **RNG**: Linear congruential generator at $7E0FA1
- **Damage calculation**: Based on armor, enemy attack power
- **Physics**: Subpixel positioning for smooth movement

## Historical Context

### Development
- **Release**: November 21, 1991 (Japan), April 13, 1992 (NA)
- **Team size**: ~10 core developers
- **Development time**: ~2 years
- **Director**: Takashi Tezuka
- **Producer**: Shigeru Miyamoto

### Technical Achievements
- **Mode 7**: Used for map screen and triforce sequences
- **Compression**: Custom algorithms for graphics and map data
- **Audio**: Sophisticated use of SPC700 for atmospheric music
- **Battery backup**: First Zelda with comprehensive save system

## Conclusion

The Legend of Zelda: A Link to the Past represents a masterclass in SNES development, pushing the hardware to its limits while maintaining rock-solid gameplay. Its technical architecture has proven robust enough to support decades of speedrunning, ROM hacking, and reverse engineering efforts. Understanding its systems provides insight into both 16-bit game development and the foundations of modern action-adventure game design.