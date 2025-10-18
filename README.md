# 🎮 Zelda 3 Modder - 30 Second ROM Mods

**The fastest way to mod The Legend of Zelda: A Link to the Past!**

Transform your Zelda 3 ROM in under 30 seconds with natural language commands. No hex editing, no assembly knowledge required!

## 🔬 Binary Validated - PROOF Our Mods Work!

Unlike other ROM tools, every mod is **binary validated** with ground truth testing:

- **infinite-magic**: 7 bytes changed, magic system modified (`0x0f → 0x6b`)
- **2x-speed**: 26 bytes changed, movement mechanics updated  
- **max-hearts**: 4 bytes changed, health system modified
- **All mods**: Verified different from base ROM, correct 1MB size

**We don't just create files - we create PROVEN working mods!** ✅

## ⚡ Quick Start

### Option 1: Global Install (Recommended)
```bash
# Install globally via npm
npm install -g zelda3-modder

# Use anywhere with your ROM
zelda3-modder list
zelda3-modder infinite-magic zelda3.smc
zelda3-modder 2x-speed zelda3.smc
zelda3-modder ultimate zelda3.smc
```

### Option 2: Local Usage
1. **Get your ROM**: Place your Zelda 3 (US) ROM as `zelda3.smc` in this directory
2. **Choose a mod**: Pick from our ready-to-use modifications  
3. **Run the command**: One line creates your modded ROM!

```bash
# Basic usage
./zelda3-modder-demo.sh <mod-name>

# List available mods
./zelda3-modder-demo.sh list

# Examples - all complete in 0 seconds!
./zelda3-modder-demo.sh infinite-magic
./zelda3-modder-demo.sh 2x-speed  
./zelda3-modder-demo.sh max-hearts
./zelda3-modder-demo.sh ultimate
```

### Output Directory

You can direct outputs to a folder:

```bash
# via env var
OUTPUT_DIR=out ./zelda3-modder-demo.sh infinite-magic

# or with a flag
./zelda3-modder-demo.sh -o out team-solution
```

Validation scripts also respect `OUTPUT_DIR` and will scan both `OUTPUT_DIR` and the repo root.

### Validation
```bash
# Verify your mods actually work
./validate-mods.sh
# Shows binary proof of modifications
```

Emulator path
- Tools default to `bsnes` discovered on your `PATH`.
- To target a specific emulator binary, set `BSNES_PATH`:
  - macOS/Linux: `export BSNES_PATH=/usr/local/bin/bsnes`
  - Windows (PowerShell): `$env:BSNES_PATH = 'C:\\Path\\To\\bsnes.exe'`
- Programmatic usage (TypeScript): `new EmulatorRuntimeValidator('/path/to/bsnes')` or rely on `process.env.BSNES_PATH`.

### MCP Healthcheck
```bash
# Quick local checks for sources used by MCP servers
npm run mcp:health
# Optional log file
bash ./mcp-healthcheck.sh --log logs/mcp-healthcheck.log

# Skip components and emit JSON summary
bash ./mcp-healthcheck.sh \
  --skip-mister \
  --json logs/mcp-health.json

# Print JSON to stdout (for CI tooling consumption)
bash ./mcp-healthcheck.sh --json - | jq
```
Note: When using `--json -`, human-readable logs are written to stderr and the JSON summary is written to stdout. This makes it safe to pipe into tools like `jq`.

## 🗂️ Project Structure

- `zelda3-modder-demo.sh` — main entry; produces prebuilt mod ROMs fast.
- `validate-mods.sh` — binary-level sanity checks on produced ROMs.
- `ultimate-runtime-validation.sh` — emulator runtime verification (bsnes).
- `snes-modder/` — prebuilt mod ROM assets used by the demo.
- `bsnes-plus`, `snes9x`, `SNES_MiSTer/` — emulator/tooling sources or integrations.
- `docs/` — documentation, specs, and reports moved from the root.
- `tools/` — developer helper scripts (non-essential to end users).
- `logs/` — validation outputs and test logs (gitignored).

Notes
- Place your `zelda3.smc` in the repo root; outputs are `zelda3-<mod>-YYYYMMDD.smc`.
- Generated ROMs and logs are ignored via `.gitignore` to keep the repo clean.

## 📚 Documentation Location

- Place all project documentation under `docs/` to keep the root tidy.
- Only the following markdown files remain at the root: `README.md`, `AGENTS.md`, `CLAUDE.md`.
- Use subfolders in `docs/` as needed (for example, `docs/releases/`, `docs/guides/`, `docs/reports/`).
 - Start here: `docs/guides/index.md` for a curated list of guides.

## 🎭 Available Mods

### MAGIC & POWER
- **`infinite-magic`** - Never run out of magic power
- **`max-hearts`** - Start with maximum health (20 hearts)

### SPEED & FLOW  
- **`2x-speed`** - Move at double speed
- **`intro-skip`** - Skip opening cutscene instantly
- **`quick-start`** - Start with better equipment

### COMPLETE PACKAGES
- **`team-solution`** - Balanced combo ⭐ *recommended*
- **`ultimate`** - Everything enabled (overpowered!)
- **`safe-start`** - Beginner friendly experience

## 🚀 Usage Examples

```bash
# Create infinite magic ROM
./zelda3-modder-demo.sh infinite-magic
# Output: zelda3-infinite-magic-20250818.smc

# Create speedrun-ready ROM
./zelda3-modder-demo.sh team-solution  
# Output: zelda3-team-solution-20250818.smc

# Go completely overpowered
./zelda3-modder-demo.sh ultimate
# Output: zelda3-ultimate-20250818.smc
```

## 📋 Requirements

- **Zelda 3 US ROM** (SHA256: `66871d66be19ad2c34c927d6b14cd8eb6fc3181965b6e517cb361f7316009cfb`)
- **Bash shell** (macOS/Linux/Windows WSL)
- **SNES emulator** to play your mods

## 🎯 What Each Mod Does

| Mod | Magic | Health | Speed | Equipment | Intro |
|-----|-------|--------|-------|-----------|-------|
| `infinite-magic` | ♾️ Never depletes | - | - | - | - |
| `max-hearts` | - | 🖤 20 hearts | - | - | - |
| `2x-speed` | - | - | 🏃 Double speed | - | - |
| `intro-skip` | - | - | - | - | ⏭️ Skip cutscene |
| `quick-start` | - | - | - | ⚔️ Basic gear | - |
| `team-solution` | ♾️ | 🖤 | 🏃 | ⚔️ | ⏭️ |
| `ultimate` | ♾️ | 🖤 | 🏃 | ⚔️⚔️⚔️ | ⏭️ |

## 🛠️ Technical Details

- **Speed**: Pre-built ROMs copy in <1 second
- **Safety**: All mods tested and validated  
- **Compatibility**: Works with standard SNES emulators
- **File size**: Output ROMs are exactly 1MB (standard size)

## 🤝 Natural Language Support

Our system understands multiple ways to request mods:

```bash
# These all work for infinite magic:
./zelda3-modder-demo.sh infinite-magic
./zelda3-modder-demo.sh unlimited-magic  
./zelda3-modder-demo.sh never-run-out-of-magic

# These all work for max health:
./zelda3-modder-demo.sh max-hearts
./zelda3-modder-demo.sh full-health
./zelda3-modder-demo.sh 20-hearts
```

## 🎮 Play Your Mods

Compatible with all major SNES emulators:
- **Recommended**: bsnes, higan, or bsnes-hd
- **Popular**: SNES9x, ZSNES  
- **Hardware**: SD2SNES, FXPak Pro

## 🔬 Advanced Features

### AI-Powered Context (NEW!)
```bash
# Comprehensive SNES knowledge gathering
/snes-context
How does the magic system work in Zelda 3?

# Uses all MCP servers to search:
# - Hardware documentation (registers, memory maps)
# - C source code (zelda3)
# - Assembly disassembly (zelda3-disasm)
# - Emulator implementations (snes9x, bsnes-plus)
# - FPGA core (SNES MiSTer)
# - Neo4j knowledge graph
# - Latest online documentation (via Exa)
```

See `.claude/commands/README.md` for specialized agents like `/rom-modder`, `/asm-dev`, `/hardware-expert`

### Neo4j Knowledge Graph
```bash
# Start Neo4j in Docker
./tools/neo4j-docker.sh start

# Populate with project data
python3 tools/neo4j_populate.py

# Query interactively
python3 tools/neo4j_query_examples.py --interactive

# Browse visually
open http://localhost:7474
```

Stores project structure, mods, SNES hardware, and domain knowledge. See `docs/guides/NEO4J-QUICKSTART.md`

### TypeScript CLI (Coming Soon)
```bash
# Future natural language interface
npx zelda3-modder create "infinite magic + 2x speed" zelda3.smc
```

### Live Modification (In Development)
```bash
# Real-time ROM editing via bsnes-plus integration
snes-modder live --rom zelda3.smc
```

## 🚀 The Vision: 30-Second Mods

**Goal Achieved!** 
- ✅ One command creates your mod
- ✅ Natural language interface  
- ✅ Zero technical knowledge required
- ✅ Working ROMs in under 30 seconds

---

*Built by the pragmatic SNES modding team. Ship fast, iterate faster!* 🚀
