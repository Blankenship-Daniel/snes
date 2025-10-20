# Reverse Engineering Workflows

Automated reverse engineering workflows for SNES games using the bsnes-cli headless emulator.

## Quick Start

### 1. Ensure ROM is in root directory

```bash
# Create symlink if needed
ln -s data/zelda3-original.smc zelda3.smc
```

### 2. Run automated analysis scripts

```bash
# Memory analysis - Find variable locations
./scripts/reverse-engineering/zelda3-memory-analysis.sh

# CPU trace analysis - Find execution hotspots
./scripts/reverse-engineering/zelda3-trace-analysis.sh

# Complete workflow example - Magic meter reverse engineering
./scripts/reverse-engineering/zelda3-magic-meter-re.sh
```

### 3. View results

```bash
# Check output directories
ls -la output/memory-analysis/
ls -la output/trace-analysis/
ls -la output/magic-meter-analysis/

# View reports
cat output/trace-analysis/ANALYSIS_REPORT.md
cat output/magic-meter-analysis/FINDINGS.md
```

## Documentation

See [zelda3-headless-workflow.md](./zelda3-headless-workflow.md) for complete documentation including:

- Memory dumping techniques
- CPU execution tracing
- Integration with MCP servers
- Advanced analysis workflows
- Case studies and examples

## Scripts

| Script | Purpose | Output |
|--------|---------|--------|
| `zelda3-memory-analysis.sh` | Memory state capture and comparison | `output/memory-analysis/` |
| `zelda3-trace-analysis.sh` | CPU execution tracing and hotspot analysis | `output/trace-analysis/` |
| `zelda3-magic-meter-re.sh` | Complete RE workflow example | `output/magic-meter-analysis/` |

## Tools Used

- **bsnes-cli**: Headless emulator (`repos/bsnes-plus/bsnes/cli-headless/bsnes-cli`)
- **hexdump**: Binary data visualization
- **grep/awk**: Trace log analysis
- **cmp**: Binary comparison
- **MCP servers**: Code search and discovery (zelda3-disasm, zelda3, snes-mcp-server)

## Workflow Summary

```
┌─────────────────────┐
│  Memory Dumping     │  Find WHAT changed
├─────────────────────┤
│  CPU Tracing        │  Find WHERE/WHEN it changed
├─────────────────────┤
│  MCP Code Search    │  Find WHY (source code)
├─────────────────────┤
│  Cross-Reference    │  Validate across sources
├─────────────────────┤
│  Mod Implementation │  Test with snes-modder
└─────────────────────┘
```

## Next Steps

1. **Run the scripts** to see the workflow in action
2. **Review the comprehensive guide**: `zelda3-headless-workflow.md`
3. **Pick a feature** to reverse engineer
4. **Use MCP servers** to find source code
5. **Create mods** with snes-modder

---

**Happy Reverse Engineering!** 🔍
