# Code Examples - Common ROM Modification Patterns

This directory contains comprehensive examples for common SNES ROM modification patterns using the SNES Modder API.

## Quick Start Examples

### [Basic Health Modification](./basic-health-mod.ts)
Simple example of modifying Link's health in Zelda 3.

### [Inventory Management](./inventory-management.ts)
Complete example of managing player inventory items.

### [Graphics Modifications](./graphics-mods.ts)
Examples of modifying sprites, palettes, and tilesets.

## Advanced Patterns

### [Transaction Safety](./transaction-patterns.ts)
Advanced transaction management for complex modifications.

### [Discovery Integration](./discovery-integration.ts)
Using the discovery database for safe, metadata-driven modifications.

### [MCP Server Integration](./mcp-integration.ts)
Leveraging MCP servers for dynamic ROM analysis.

## Real-World Modifications

### [Complete Save Editor](./save-editor.ts)
Full implementation of a save game editor.

### [Gameplay Tweaks](./gameplay-tweaks.ts)
Common gameplay modifications and balancing.

### [Cosmetic Changes](./cosmetic-changes.ts)
Visual modifications and quality-of-life improvements.

## Testing Patterns

### [Unit Testing](./testing-examples.ts)
Comprehensive testing patterns for ROM modifications.

### [Integration Testing](./integration-testing.ts)
Testing with real ROMs and emulator validation.

## Error Handling

### [Robust Error Management](./error-handling.ts)
Best practices for handling ROM modification errors.

### [Recovery Patterns](./recovery-patterns.ts)
Implementing backup and recovery mechanisms.

## Getting Started

All examples assume you have:

1. A valid SNES ROM file (`zelda3.smc`)
2. The SNES Modder dependencies installed
3. Basic TypeScript knowledge

```bash
# Install dependencies
npm install

# Run an example
npx tsx docs/examples/basic-health-mod.ts
```

## Safety Guidelines

⚠️ **Important:** Always test modifications in an emulator before using on real hardware.

1. **Create backups** before making any modifications
2. **Validate all addresses** before writing
3. **Use transactions** for multi-byte modifications
4. **Test thoroughly** with different game states
5. **Document your changes** for future reference

## Example Categories

- **🟢 Beginner** - Simple, single-byte modifications
- **🟡 Intermediate** - Multi-byte operations with validation
- **🔴 Advanced** - Complex modifications requiring deep ROM knowledge