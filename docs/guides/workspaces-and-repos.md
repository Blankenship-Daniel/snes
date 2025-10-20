# Monorepo: `repos/` Layout + Yarn Workspaces

This repository uses a centralized `repos/` folder and Yarn workspaces to manage subprojects consistently and keep paths stable across docs and scripts.

## Layout

```
repos/
  bsnes-plus/                 # Enhanced SNES emulator (native)
    zelda3_save_tool_mvp/     # Node tool (workspace)
  snes-modder/                # ROM modification toolkit (workspace)
  zelda3-disasm/              # Assembly disassembly + MCP server (workspace)
  snes9x/                     # Emulator (native)
  SNES_MiSTer/                # FPGA core (native)
  zelda3/                     # C reimplementation (native)
```

Only Node packages that contain a `package.json` are part of the Yarn workspaces. Native repos build with their own toolchains and are not added as workspaces.

## Quickstart

```
corepack enable
yarn install

# Workspace helpers
yarn ws:list
yarn ws:build
yarn ws:test

# Quick healthcheck
npm run health:monorepo
```

## Current Workspaces

- `repos/snes-modder`
- `repos/zelda3-disasm`
- `repos/bsnes-plus/zelda3_save_tool_mvp`

To add more, move the project under `repos/` and update the root `package.json` `workspaces` array.

## Path Policy

- Prefer repo‑relative paths in docs and scripts (e.g., `./repos/snes-modder/...`).
- Avoid user-specific absolute paths (e.g., `/Users/<name>`, `C:\\Users\\<name>`). The linter enforces this in CI.

## Pre-commit Path Linter (optional)

Enable once per clone:

```
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

This runs `tools/check-no-absolute-paths.sh` on each commit.
