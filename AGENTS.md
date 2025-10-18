# Repository Guidelines

This repo ships a fast, script‑driven SNES modding workflow for Zelda 3. Keep changes small, reviewable, and runnable locally.

## Documentation Location
- Place all new documentation in `docs/` to keep the root clean.
- Only these markdown files belong at the root: `README.md`, `AGENTS.md`, `CLAUDE.md`.
- Generated reports, specs, analyses, and how‑tos should live under `docs/` (create subfolders as needed, e.g., `docs/releases/`, `docs/guides/`, `docs/reports/`).

## Project Structure & Module Organization
- `zelda3-modder-demo.sh` — main entry; produces prebuilt mod ROMs fast.
- `validate-mods.sh` — binary‑level sanity checks on produced ROMs.
- `ultimate-runtime-validation.sh` — emulator runtime verification (bsnes).
- `snes-modder/` — prebuilt mod ROM assets used by the demo.
- `zelda3*.smc` — base and generated ROMs (do not commit third‑party ROMs).
- `bsnes-plus`, `snes9x`, `SNES_MiSTer/` — emulator/tooling sources or integrations.
- `package.json` — npm scripts that wrap the shell tooling.

## Build, Test, and Development Commands
- `npm start` or `./scripts/zelda3-modder-demo.sh <mod>` — generate a mod (e.g., `infinite-magic`, `2x-speed`).
- `npm test` or `./scripts/validate-mods.sh` — validate ROM size/differences vs `zelda3.smc`.
- `./scripts/ultimate-runtime-validation.sh` — run bsnes for stability, memory, and input checks.
Prereqs: `bsnes`, `bc`, `xxd`, `cmp`, `timeout` available on PATH; place `zelda3.smc` in repo root.

## Coding Style & Naming Conventions
- Bash: 2 spaces; functions `lower_snake_case`; constants `UPPER_SNAKE_CASE` (e.g., `BASE_ROM`).
- JavaScript: Pre-ESM Node style; prefer `const`/`let`, trailing commas, and small modules.
- Filenames: scripts kebab‑case; output ROMs `zelda3-<mod>-YYYYMMDD.smc`.

## Testing Guidelines
- Primary checks: `validate-mods.sh` then `ultimate-runtime-validation.sh`.
- Add new validations close to the scripts they exercise; keep tests fast and non‑interactive.
- Avoid committing generated ROMs or large logs; include short excerpts when needed.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- Commit scope by area (e.g., `fix(runtime): handle empty WRAM dump`).
- PRs must include: purpose, test evidence (command + output snippet), and risk/rollback notes.
- Link related issues; attach screenshots or terminal snippets for validation.

## Security & Configuration Tips
- Never commit proprietary ROMs or keys; `.smc` outputs are ephemeral.
- Prefer scriptable, deterministic steps; document external deps and versions.
- Cross‑platform: keep Bash POSIX‑friendly where possible; gate platform‑specific code.

## Absolute Paths Policy
- Do not commit user-specific absolute paths (e.g., `/Users/<name>`, `C:\Users\<name>`, `/mnt/c/Users/<name>`).
- Prefer repo‑relative paths, environment variables, or CLI arguments.
- Run the path linter locally before opening a PR:
  - `npm run lint:paths` (or `bash ./tools/check-no-absolute-paths.sh`)
  - CI will fail if absolute user paths are detected.

### Optional: Enable Pre-commit Hook
- We ship a lightweight pre-commit hook that runs the path linter.
- Enable it once per clone:
  - `git config core.hooksPath .githooks`
  - Ensure it’s executable: `chmod +x .githooks/pre-commit`
- Disable locally at any time by unsetting hooksPath:
  - `git config --unset core.hooksPath`
