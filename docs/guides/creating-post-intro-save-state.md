# Creating Post-Intro Save State for AI Gameplay

**Purpose**: Enable AI automated gameplay by manually creating a save state past the intro sequence
**Time Required**: 5 minutes
**Frequency**: One-time setup

---

## Why This Is Needed

**Problem**: The Zelda 3 intro sequence cannot be automated because:
- Memory addresses remain at 0 throughout entire intro (no state detection)
- Intro has unpredictable timing across multiple dialogue sequences
- No visual state detection in current MCP tools

**Solution**: Human player manually completes intro once, creates save state, AI loads it for all future sessions.

---

## Quick Start Instructions

### Step 1: Start Emulator
```bash
cd emulatorjs-mcp-server
npm start
```

### Step 2: Load ROM via MCP Tool
```javascript
start_emulator({
  rom_path: "./zelda3.smc",
  headless: false  // Browser window will be visible
})
```

### Step 3: Play Through Intro Manually

**In the browser window that opens**:

1. **Title Screen**: Press Enter (Start button)
2. **File Selection**:
   - Use arrow keys to select a file slot
   - Press Enter (A button)
3. **Name Entry** (if new file):
   - Enter character name or use default
   - Confirm with Enter
4. **Opening Cutscene**:
   - Press Space (B button) or Enter (A button) to advance dialogue
   - Continue pressing to skip through all cutscene text
5. **Zelda's Telepathy**:
   - Continue pressing Space/Enter through dialogue
6. **Uncle Leaving**:
   - Press Space/Enter through uncle's dialogue
7. **Link Wakes Up**:
   - **STOP HERE** - This is the save point

**Key Indicator**: You've reached the correct point when:
- Link is in his bed
- You have full control (can move Link with arrow keys)
- Game HUD is visible (hearts, rupees, etc.)

### Step 4: Create Save State via MCP Tool
```javascript
save_state_file({
  name: "post-intro-gameplay-start",
  location: "Link's house, in bed with full control",
  notes: "Intro complete, ready for AI gameplay"
})
```

### Step 5: Verify Save State
```javascript
// Check that save state was created
list_save_states()

// Should see:
// {
//   name: "post-intro-gameplay-start",
//   timestamp: <current time>,
//   location: "Link's house, in bed with full control"
// }
```

### Step 6: Test Loading (Optional)
```javascript
// Reset emulator
reset_emulator()

// Load save state
load_state_file({ name: "post-intro-gameplay-start" })

// Verify you're back at Link in bed with control
```

---

## Detailed Walkthrough

### Browser Controls

When the emulator opens in the browser, use keyboard controls:

| Keyboard Key | SNES Button |
|--------------|-------------|
| Arrow Keys | D-Pad |
| X | A Button |
| Z | B Button |
| Enter | Start |
| Shift | Select |
| S | X Button |
| A | Y Button |
| Q | L Trigger |
| W | R Trigger |

**Recommended for intro skip**:
- **Enter** (Start) - Navigate menus
- **X** (A) - Confirm selections
- **Space** (B) - Advance dialogue quickly

### Intro Sequence Breakdown

**Estimated time**: 2-3 minutes with fast button pressing

1. **Title Screen** (5 seconds)
   - Wait for animation
   - Press Enter (Start)

2. **File Selection** (10 seconds)
   - Select empty slot for new game OR existing save
   - Press Enter (A)

3. **Name Entry** (20 seconds if new file)
   - Enter "LINK" or custom name
   - Navigate to "END" and confirm
   - **Skip if loading existing file**

4. **Opening Cutscene** (60 seconds)
   - Triforce lore text
   - Zelda's backstory
   - Press Space/Enter rapidly to skip

5. **Zelda's Telepathy** (20 seconds)
   - "Help me..."
   - Press Space/Enter to advance

6. **Uncle's Departure** (15 seconds)
   - Uncle talks to Link
   - Uncle leaves the house
   - Press Space/Enter to advance

7. **Link Wakes Up** (5 seconds)
   - Link gets out of bed
   - **YOU HAVE CONTROL** - Stop here!

### Creating the Save State

**Once you have control of Link** (can move him around the house):

1. **Don't move Link** - Stay at the starting position
2. **Use MCP tool** to create save state:
   ```javascript
   save_state_file({
     name: "post-intro-gameplay-start",
     location: "Link's house, in bed with full control",
     notes: "Intro complete, ready for AI gameplay"
   })
   ```
3. **Confirm success** - Should see message "Save state created"

---

## Using the Save State in Future Sessions

### AI Gameplay Start

```javascript
// 1. Start emulator
start_emulator({
  rom_path: "./zelda3.smc",
  headless: true  // Can run headless for AI
})

// 2. Load post-intro save state
load_state_file({ name: "post-intro-gameplay-start" })

// 3. Verify gameplay ready
const health = await read_memory_named({ name: "Current Health" })
console.log(health)  // Should be 24 (3 hearts)

// 4. AI takes control
press_button({ button: "Down", frames: 30 })
// ... AI gameplay continues
```

### Debugging/Testing Start

```javascript
// Same process but with headless: false to see browser
start_emulator({
  rom_path: "./zelda3.smc",
  headless: false
})

load_state_file({ name: "post-intro-gameplay-start" })

// Browser window shows Link in his house
```

---

## Troubleshooting

### Issue: Can't find emulator controls

**Solution**: Click on the emulator canvas in the browser to focus it, then use keyboard controls.

### Issue: Save state not created

**Check**:
1. Did you wait for "Save state created" confirmation?
2. Run `list_save_states()` to verify
3. Check `saves/` directory for save files

**Fix**: Try creating save state again with same name (will overwrite).

### Issue: Loaded save state but health is still 0

**Problem**: Save state was created during intro, not after intro complete.

**Fix**:
1. Reset emulator
2. Manually play through intro again
3. Ensure Link has full control (can move)
4. Create new save state

### Issue: Browser window doesn't open

**Check**:
1. Is `headless: false` set?
2. Is Playwright browser installed? Run `npx playwright install chromium`
3. Check MCP server console for errors

---

## Advanced: Multiple Save Points

You can create multiple save states at different points:

```javascript
// At Link's house (start)
save_state_file({
  name: "link-house-start",
  location: "Link's house, beginning"
})

// After getting sword from uncle
save_state_file({
  name: "got-sword",
  location: "Castle basement, acquired sword"
})

// Before entering Sanctuary
save_state_file({
  name: "pre-sanctuary",
  location: "Outside Sanctuary"
})
```

**Benefits**:
- Quick access to different game states
- Test specific scenarios
- Resume from checkpoints

---

## Expected Memory State

After loading the post-intro save state, memory should show:

```javascript
// Read key addresses
read_memory_named({ name: "Current Health" })
// → [24] (3 hearts = 24/8 increments)

read_memory_named({ name: "Max Health" })
// → [24] (3 hearts maximum)

// Other addresses
read_memory({ address: "0x7EF359", size: 1 })  // Sword
// → [0] (no sword yet)

read_memory({ address: "0x7EF360", size: 2 })  // Rupees
// → [0, 0] (no rupees)
```

**Key indicator**: Health != 0 means save state is valid.

---

## Validation Checklist

Before marking save state as ready:

- [ ] Link is visible in his house
- [ ] Can move Link with arrow keys
- [ ] HUD is visible (hearts, rupees, etc.)
- [ ] Health memory reads as 24 (3 hearts)
- [ ] Save state name is "post-intro-gameplay-start"
- [ ] Save state loads successfully
- [ ] No errors in MCP console

---

## Time Estimates

| Task | Time |
|------|------|
| Start emulator | 10 seconds |
| Load ROM | 5 seconds |
| Play through intro | 2-3 minutes |
| Create save state | 10 seconds |
| Verify save state | 20 seconds |
| **Total** | **3-4 minutes** |

**One-time investment** that enables unlimited future AI gameplay sessions.

---

## Benefits of This Approach

✅ **Unblocks AI gameplay** - AI can start from actual gameplay
✅ **Reusable** - Create once, use forever
✅ **Fast** - 3-4 minutes one-time effort
✅ **Reliable** - Always starts at same game state
✅ **Enables memory discovery** - AI can now observe memory changes
✅ **Allows reverse image search** - AI can get unstuck during gameplay

---

## What This Enables

Once the post-intro save state exists, AI can:

1. **Play through the game** starting from Link's house
2. **Discover memory addresses** by observing changes during gameplay
3. **Use reverse image search** when stuck (screenshot → find solution)
4. **Test ROM modifications** by loading save and validating behavior
5. **Record optimal strategies** for dungeons, boss fights, item collection
6. **Build memory maps** by correlating actions with memory changes

---

## Next Steps After Save State Created

1. **Load save state** in AI session
2. **Verify health != 0** (confirms gameplay ready)
3. **Begin AI exploration**:
   - Move Link around house
   - Exit house
   - Navigate to castle
   - Follow "Opening Dungeon Sequence" human recording strategy
4. **Use reverse image search** when stuck:
   - Take screenshot
   - Search for Zelda 3 walkthrough matches
   - Determine next action
5. **Document memory discoveries**:
   - Record address changes during actions
   - Build comprehensive memory map
   - Save findings to database

---

**Created**: 2025-10-19
**Status**: Ready to use
**Dependencies**: EmulatorJS MCP server, Zelda 3 ROM
**Related**: `docs/reports/automated-gameplay-challenge-intro-barrier-20251019.md`
