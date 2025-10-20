# Zelda 3 Reverse Engineering - Documentation Index

Complete navigation guide for all reverse engineering documentation.

## 🚀 Start Here

- **New to reverse engineering?** → [QUICK_START.md](./QUICK_START.md)
- **Want working examples?** → [WORKING_EXAMPLES.md](./WORKING_EXAMPLES.md)
- **Need complete guide?** → [zelda3-headless-workflow.md](./zelda3-headless-workflow.md)
- **Check implementation status?** → [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)

## 📚 Documentation Structure

### Beginner Level
1. **[README.md](./README.md)** - Quick overview and navigation
2. **[QUICK_START.md](./QUICK_START.md)** - 5-minute getting started guide
   - Prerequisites
   - Quick start commands
   - Known memory locations
   - Basic workflow

### Intermediate Level
3. **[WORKING_EXAMPLES.md](./WORKING_EXAMPLES.md)** - 7 tested, real examples
   - Memory dumps
   - State comparison
   - Variable extraction
   - Batch analysis
   - Complete workflows

### Advanced Level
4. **[zelda3-headless-workflow.md](./zelda3-headless-workflow.md)** - Comprehensive guide
   - Manual workflows
   - Advanced techniques
   - MCP integration
   - Case studies
   - Performance tuning

### Reference
5. **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** - Status report
   - What's working
   - Test results
   - Known limitations
   - Success criteria

## 🛠️ Tools & Scripts

Located in: `scripts/reverse-engineering/`

- **zelda3-memory-analysis.sh** - Memory dumps + comparison
- **zelda3-trace-demo.sh** - CPU trace demonstration

## 🎯 Common Tasks

### Find Unknown Variable
1. Start with [WORKING_EXAMPLES.md](./WORKING_EXAMPLES.md) - Example 6
2. Use batch dumps to capture multiple states
3. Compare with `cmp -l` or Python script
4. Cross-reference with known locations

### Analyze Known Address
1. See [QUICK_START.md](./QUICK_START.md) - Known Locations table
2. Dump specific offset with `--dump-wram`
3. View with hexdump
4. Use MCP to find source code

### Create Complete Workflow
1. Follow [WORKING_EXAMPLES.md](./WORKING_EXAMPLES.md) - Example 7 (Magic Meter)
2. Adapt template for your target
3. Document findings
4. Create mod with snes-modder

## 🔗 External Resources

### bsnes-cli Documentation
- Built-in help: `repos/bsnes-plus/bsnes/cli-headless/bsnes-cli --help`
- Full guide: `repos/bsnes-plus/bsnes/cli-headless/HEADLESS_EMULATOR_GUIDE.md`

### MCP Servers
- zelda3-disasm: Assembly code search
- zelda3: C source search
- snes-mcp-server: Hardware documentation

### Community Resources
- Zelda 3 Disassembly: https://github.com/strager/zelda3-disassembly
- SNES Dev Manual: https://problemkaputt.de/fullsnes.htm
- ROM Hacking: https://www.romhacking.net/

## 📊 Quick Reference

### Memory Map
- WRAM: $7E0000-$7E1FFF (128KB)
- Save area: $7EF000-$7EF4FF
- Link state: $7E0000-$7E00FF

### Command Templates
```bash
# Memory dump
bsnes-cli zelda3.smc --run-frames N --dump-wram OFFSET:SIZE:FILE

# Multiple dumps
bsnes-cli zelda3.smc --run-frames N \
  --dump-wram 0:131072:wram.bin \
  --dump-vram 0:65536:vram.bin

# Hex viewing
hexdump -C file.bin | less
hexdump -v -e '2/1 "%02X " "\n"' file.bin

# Comparison
cmp -l file1.bin file2.bin | head -20
```

## 🎓 Learning Path

### Week 1: Basics
- Day 1-2: [QUICK_START.md](./QUICK_START.md)
- Day 3-4: [WORKING_EXAMPLES.md](./WORKING_EXAMPLES.md) - Examples 1-4
- Day 5-7: [WORKING_EXAMPLES.md](./WORKING_EXAMPLES.md) - Examples 5-7

### Week 2: Practice
- Day 1-2: Find 3 unknown variables
- Day 3-4: Use MCP to find source code
- Day 5-7: Create first discovery-based mod

### Week 3: Advanced
- Day 1-3: Read [zelda3-headless-workflow.md](./zelda3-headless-workflow.md)
- Day 4-5: Implement advanced techniques
- Day 6-7: Document and share discoveries

## 📞 Getting Help

### Documentation Issues
- Check [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - Known Limitations
- Review [WORKING_EXAMPLES.md](./WORKING_EXAMPLES.md) - Troubleshooting

### Tool Issues
- Run: `bsnes-cli --help`
- Check: `repos/bsnes-plus/bsnes/cli-headless/HEADLESS_EMULATOR_GUIDE.md`

### Technique Questions
- See [zelda3-headless-workflow.md](./zelda3-headless-workflow.md) - Case Studies
- Review [WORKING_EXAMPLES.md](./WORKING_EXAMPLES.md) - Practical Tips

---

**All documentation is production-ready and tested!** 🚀
