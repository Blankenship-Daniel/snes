# Contributing

Thank you for helping improve Zelda 3 Modder. This repo ships a fast, script‑driven SNES modding workflow. Keep changes small, reviewable, and runnable locally.

## Ground Rules
- Do not commit ROMs or keys.
  - Base ROM: keep `zelda3.smc` local only.
  - Generated ROMs: `zelda3-<mod>-YYYYMMDD.smc` are ephemeral.
  - Prebuilt assets under `snes-modder/` are the only `.smc` files committed.
- Prefer deterministic, scriptable steps; document external deps and versions.
- Cross‑platform first: keep Bash POSIX‑friendly; gate platform specifics.

## Project Structure
- `zelda3-modder-demo.sh` — main entry; copies prebuilt mod ROMs.
- `validate-mods.sh` — binary‑level checks vs `zelda3.smc`.
- `ultimate-runtime-validation.sh` — emulator runtime verification (bsnes).
- `snes-modder/` — prebuilt ROM assets used by the demo.
- `docs/`, `tools/`, `logs/` — docs, helper scripts, and validation outputs.

## Dev Commands
- Generate a ROM
  - `./zelda3-modder-demo.sh list`
  - `./zelda3-modder-demo.sh <mod>`
  - `OUTPUT_DIR=out ./zelda3-modder-demo.sh -o out <mod>`
- Validate
  - `./validate-mods.sh`
  - `./ultimate-runtime-validation.sh` (requires `bsnes`, `bc`, `xxd`, `timeout`)

## Release Process
- Bump version and tag (creates git tag and pushes):
  - Patch: `npm run release:version:patch`
  - Minor: `npm run release:version:minor`
  - Major: `npm run release:version:major`
- On pushing a `v*` tag, GitHub Actions creates a release.
  - If `docs/releases/<tag>.md` exists, it will be used as the body.
  - Otherwise, auto-generated release notes are enabled.

## Tests and Evidence
- Include a short terminal excerpt showing:
  - `./validate-mods.sh` summary with pass/fail counts
  - If relevant, `./ultimate-runtime-validation.sh` summary (success rate)
- Keep logs under `logs/` (gitignored). Include brief snippets in PRs.

## Commit & PR Guidelines
- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- Scope by area (e.g., `fix(runtime): handle empty WRAM dump`).
- PR must include: purpose, test evidence snippet, risk/rollback notes.
- Link related issues; attach screenshots or terminal snippets for validation.

## Accidental ROM Commits
- If a ROM was committed, remove it from the index and amend:
  - `git rm --cached zelda3.smc zelda3-*.smc`
  - Add/confirm `.gitignore` rules, then re‑commit.
- If it exists in history, rewrite with care (coordinate with maintainers).

## Environment
- Prereqs on PATH: `bsnes`, `bc`, `xxd`, `cmp`, `timeout`.
- Place `zelda3.smc` in repo root (not committed).
- Outputs follow `zelda3-<mod>-YYYYMMDD.smc`; `OUTPUT_DIR` is supported.

## Style
- Bash: 2 spaces; functions `lower_snake_case`; constants `UPPER_SNAKE_CASE`.
- JavaScript: Pre‑ESM Node style; prefer `const`/`let`, trailing commas, small modules.
- Filenames: scripts kebab‑case; ROM outputs follow the naming convention above.
