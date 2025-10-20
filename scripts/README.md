# Scripts Directory

Automation scripts for the SNES development workspace.

## Claude Code Integration

### Prompt Enhancer Hook
**File**: [`prompt-enhancer-hook.sh`](./prompt-enhancer-hook.sh)

User-prompt-submit hook that automatically enhances prompts using codex CLI.

**Quick Start**:
```bash
# Already configured in .vscode/settings.json
# Just restart Claude Code and start using

# Test manually
echo "add error handling" | ./scripts/prompt-enhancer-hook.sh

# Run test suite
./scripts/test-prompt-enhancer.sh
```

**Documentation**: [docs/PROMPT_ENHANCER_HOOK.md](../docs/PROMPT_ENHANCER_HOOK.md) | [docs/HOOKS_QUICK_START.md](../docs/HOOKS_QUICK_START.md)

### Codex Review Loop
**File**: [`codex-review-loop.js`](./codex-review-loop.js)

Run paired Codex CLI sessions that iterate on code review tasks.

**Usage**:
```bash
# Run 5 review iterations (default)
./scripts/codex-review-loop.js

# Run custom number of iterations
./scripts/codex-review-loop.js 10
```

**How it works**:
1. Client 1 performs code review
2. Client 2 determines concrete next steps
3. Results feed back to Client 1
4. Repeats for MAX_TURNS iterations

### Codex MCP Setup
**File**: [`setup-codex-mcp.sh`](./setup-codex-mcp.sh)

Configure MCP servers for Codex CLI integration.

**Usage**:
```bash
./scripts/setup-codex-mcp.sh
```

## ROM Modding Scripts

### Zelda 3 Modder Demo
**File**: [`zelda3-modder-demo.sh`](./zelda3-modder-demo.sh)

Create instant ROM mods with pre-built configurations.

**Usage**:
```bash
# Available mods: infinite-magic, max-hearts, 2x-speed, intro-skip,
#                 quick-start, team-solution, ultimate

./scripts/zelda3-modder-demo.sh infinite-magic
./scripts/zelda3-modder-demo.sh ultimate
```

**Output**: Timestamped ROM files ready to play

### Validate Mods
**File**: [`validate-mods.sh`](./validate-mods.sh)

Binary validation of ROM modifications.

**Usage**:
```bash
./scripts/validate-mods.sh
```

**Validates**:
- SHA256 checksums
- Byte-level differences
- ROM structure integrity

### Ultimate Runtime Validation
**File**: [`ultimate-runtime-validation.sh`](./ultimate-runtime-validation.sh)

Runtime testing of ROM mods in bsnes-plus emulator.

**Usage**:
```bash
./scripts/ultimate-runtime-validation.sh
```

**Tests**:
- Emulator loading
- Save file manipulation
- Frame-by-frame verification

### Verify Rich Start ROM Bytes
**File**: [`verify-rich-start-rom-bytes.sh`](./verify-rich-start-rom-bytes.sh)

Verify byte-level modifications for rich start configurations.

**Usage**:
```bash
./scripts/verify-rich-start-rom-bytes.sh
```

## Gameplay Automation Scripts

### Play Zelda 3 (Simple)
**File**: [`play-zelda3-simple.sh`](./play-zelda3-simple.sh)

Simple browser-based gameplay automation using EmulatorJS.

**Usage**:
```bash
./scripts/play-zelda3-simple.sh
```

### Play Zelda 3 (Headless)
**File**: [`play-zelda3-headless.sh`](./play-zelda3-headless.sh)

Headless browser gameplay for automated testing.

**Usage**:
```bash
./scripts/play-zelda3-headless.sh
```

### Play Zelda 3 (Continuous)
**File**: [`play-zelda3-continuous.sh`](./play-zelda3-continuous.sh)

Continuous gameplay loop for long-running tests.

**Usage**:
```bash
./scripts/play-zelda3-continuous.sh
```

### Test Rich Start Gameplay
**File**: [`test-rich-start-gameplay.sh`](./test-rich-start-gameplay.sh)

Automated testing of rich start ROM configurations.

**Usage**:
```bash
./scripts/test-rich-start-gameplay.sh
```

## System Health Scripts

### MCP Health Check
**File**: [`mcp-healthcheck.sh`](./mcp-healthcheck.sh)

Check health and connectivity of MCP servers.

**Usage**:
```bash
./scripts/mcp-healthcheck.sh
```

**Checks**:
- MCP server connectivity
- Tool availability
- Resource endpoints
- Error reporting

### Monorepo Health
**File**: [`monorepo-health.sh`](./monorepo-health.sh)

Quick health check of the entire workspace.

**Usage**:
```bash
./scripts/monorepo-health.sh
```

**Checks**:
- Project directories exist
- Key files present
- Build tools available
- ROM files located

## Testing Scripts

### Test Prompt Enhancer
**File**: [`test-prompt-enhancer.sh`](./test-prompt-enhancer.sh)

Automated test suite for the prompt enhancer hook.

**Usage**:
```bash
./scripts/test-prompt-enhancer.sh
```

**Tests**:
- Short prompt handling
- Empty prompt handling
- Enhancement quality
- Logging functionality
- Codex CLI availability

## Script Categories

### Claude Code Integration
- `prompt-enhancer-hook.sh` - Auto-enhance user prompts
- `codex-review-loop.js` - Iterative code review
- `setup-codex-mcp.sh` - MCP server configuration

### ROM Development
- `zelda3-modder-demo.sh` - Instant ROM mods
- `validate-mods.sh` - Binary validation
- `ultimate-runtime-validation.sh` - Runtime testing
- `verify-rich-start-rom-bytes.sh` - Byte verification

### Gameplay Automation
- `play-zelda3-simple.sh` - Simple browser gameplay
- `play-zelda3-headless.sh` - Headless automation
- `play-zelda3-continuous.sh` - Continuous testing
- `test-rich-start-gameplay.sh` - Rich start testing

### System Utilities
- `mcp-healthcheck.sh` - MCP server health
- `monorepo-health.sh` - Workspace health
- `test-prompt-enhancer.sh` - Hook testing

## Common Workflows

### Quick ROM Mod
```bash
# Create and validate a mod
./scripts/zelda3-modder-demo.sh infinite-magic
./scripts/validate-mods.sh
```

### Full Validation Pipeline
```bash
# Binary and runtime validation
./scripts/validate-mods.sh
./scripts/ultimate-runtime-validation.sh
```

### MCP Server Testing
```bash
# Check server health
./scripts/mcp-healthcheck.sh

# Setup if needed
./scripts/setup-codex-mcp.sh
```

### Automated Gameplay Testing
```bash
# Test ROM in browser
./scripts/play-zelda3-simple.sh

# Or headless for CI/CD
./scripts/play-zelda3-headless.sh
```

### Iterative Code Review
```bash
# Run review loop
./scripts/codex-review-loop.js 5
```

## Requirements

### All Scripts
- Bash shell (macOS/Linux/WSL)

### ROM Modding
- Node.js 18+ (for snes-modder)
- Zelda 3 ROM (SHA256: `66871d66be19ad2c34c927d6b14cd8eb6fc3181965b6e517cb361f7316009cfb`)

### Gameplay Automation
- Node.js 18+
- Playwright browsers: `npx playwright install chromium`

### Claude Code Integration
- Codex CLI: Must be installed and in PATH
- Claude Code VSCode extension

### Emulator Testing
- bsnes-plus: Built and available at `repos/bsnes-plus/`

## Permissions

All scripts should be executable. If not:

```bash
chmod +x scripts/*.sh scripts/*.js
```

## Environment Variables

### Prompt Enhancer
- `PROMPT_ENHANCER_LOG=1` - Enable before/after logging

### Gameplay Scripts
- `HEADLESS=1` - Force headless mode (some scripts)
- `DEBUG=1` - Enable debug output (some scripts)

## Documentation

- **Prompt Enhancer**: [docs/PROMPT_ENHANCER_HOOK.md](../docs/PROMPT_ENHANCER_HOOK.md)
- **Quick Start**: [docs/HOOKS_QUICK_START.md](../docs/HOOKS_QUICK_START.md)
- **Implementation Summary**: [docs/PROMPT_ENHANCER_SUMMARY.md](../docs/PROMPT_ENHANCER_SUMMARY.md)
- **Main README**: [README.md](../README.md)
- **Project Guide**: [CLAUDE.md](../CLAUDE.md)

## Contributing

When adding new scripts:

1. Make them executable: `chmod +x script.sh`
2. Add usage comments at the top
3. Include help text (`--help` flag recommended)
4. Update this README
5. Add to appropriate category above

## Support

For issues or questions:
- Check script comments for usage details
- Review related documentation in `docs/`
- Check main project README and CLAUDE.md
- Test with `--help` flag if supported
