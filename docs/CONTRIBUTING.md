# Contributing Guide

Thanks for contributing to the SNES Zelda 3 modding workflow! Please keep changes small, reviewable, and runnable locally.

## Quick Checklist

- Build/tests
  - `npm start` or `./scripts/zelda3-modder-demo.sh <mod>`
  - `npm test` or `./scripts/validate-mods.sh`
  - Optional: `./scripts/ultimate-runtime-validation.sh` (requires `bsnes` on PATH or `BSNES_PATH`)

- Lint for absolute paths (required)
  - `npm run lint:paths`
  - CI will fail if user-specific absolute paths are detected (e.g., `/Users/<name>`, `C:\\Users\\<name>`, `/mnt/c/Users/<name>`)

- MCP health (optional sanity)
  - `npm run mcp:health` or `bash ./scripts/mcp-healthcheck.sh --json - | jq`

## Emulator Path

- Default: we look for `bsnes` on your PATH.
- Override: set `BSNES_PATH` to a specific binary.
  - macOS/Linux: `export BSNES_PATH=/usr/local/bin/bsnes`
  - Windows (PowerShell): `$env:BSNES_PATH = 'C:\\Path\\To\\bsnes.exe'`

## Pre-commit Hook (Optional)

We ship a pre-commit hook to run the path linter before committing.

Enable per-clone:
```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

Disable:
```bash
git config --unset core.hooksPath
```

## Pre-push Hook (Optional)

We also provide a pre-push hook that runs the path linter and the MCP healthcheck.

Enable per-clone (same hooksPath as above):
```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-push
```

Disable by unsetting hooksPath as above.

## Docs

- Put new guides/reports/specs under `docs/`.
- Root markdown files are limited to: `README.md`, `AGENTS.md`, `CLAUDE.md`.

## Commit Message Style

- Use Conventional Commits (examples):
  - `feat(runtime): support BSNES_PATH env override`
  - `fix(linter): detect C:\\Users\\ pattern`
  - `docs(contrib): add pre-commit hook usage`
