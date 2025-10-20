# Code Organization Tools

This document describes the automated tools installed to keep the SNES workspace clean, organized, and maintainable.

## Overview

We use a suite of npm tools to maintain code quality across the monorepo:

- **npm-check-updates (ncu)** - Keep dependencies up to date
- **depcheck** - Find unused dependencies
- **syncpack** - Ensure consistent dependency versions across packages
- **knip** - Detect unused files, exports, and dependencies
- **husky** - Git hooks for pre-commit checks
- **lint-staged** - Run linters only on staged files

## Quick Reference

### Check for Issues

```bash
# Check for outdated dependencies
npm run deps:check

# Check for unused dependencies
npm run deps:unused

# Check for version mismatches across packages
npm run deps:sync

# Find unused code and files
npm run clean:dead-code
```

### Fix Issues

```bash
# Update dependencies interactively
npm run deps:update:interactive

# Fix dependency version mismatches
npm run deps:fix

# Format package.json files
npm run deps:format

# Run all organization checks
npm run organize

# Run all fixes
npm run organize:fix
```

## Tool Details

### 1. npm-check-updates (ncu)

Upgrades your package.json dependencies to the latest versions.

**Commands:**

```bash
npm run deps:check                    # Check for updates (read-only)
npm run deps:update                   # Update package.json to latest versions
npm run deps:update:interactive       # Interactive update with grouping
```

**Interactive Mode:**
The interactive mode groups updates by type (major, minor, patch) and lets you choose which to apply:

```bash
npm run deps:update:interactive
# Shows grouped updates, press space to select, enter to confirm
```

**Example Output:**

```
Checking /Users/ship/Documents/code/snes/package.json
All dependencies match the latest package versions :)
```

### 2. depcheck

Analyzes your project to find unused dependencies.

**Commands:**

```bash
npm run deps:unused
```

**What it finds:**

- Dependencies in package.json that aren't used in code
- Missing dependencies that are used but not declared
- Dependencies used only in specific environments

**Example Output:**

```
Unused devDependencies
* lint-staged
```

**Note:** Some tools (like lint-staged) are used via configuration files, not directly in code, so they may show as "unused" - use your judgment.

### 3. syncpack

Ensures consistent dependency versions across all packages in the workspace.

**Commands:**

```bash
npm run deps:sync        # List version mismatches
npm run deps:fix         # Fix version mismatches
npm run deps:format      # Format package.json files
```

**Configuration:** [.syncpackrc.json](.syncpackrc.json)

The config tracks these shared dependencies:

- @modelcontextprotocol/sdk
- @types/node
- typescript
- vitest
- @vitest/coverage-v8
- prettier
- eslint
- knip
- husky

**Example Output:**

```
= Keep shared dependencies in sync ======================
✘ typescript ^5.5.4 → 5.8.3 (HighestSemverMismatch)
✘ @types/node ^20.14.12 → 24.1.0 (HighestSemverMismatch)
```

**How to fix:**

```bash
npm run deps:fix
# Then install the updated versions
cd mcp-servers/snes-mcp-server && npm install
cd ../emulatorjs-mcp-server && npm install
# ... etc
```

### 4. knip

Finds unused files, exports, dependencies, and types.

**Commands:**

```bash
npm run clean:dead-code               # Show unused files and exports
npm run clean:dead-code:export        # Export results to JSON
```

**Configuration:** [knip.json](knip.json)

**What it finds:**

- Unused source files
- Unused exports in files
- Unused dependencies
- Unused types
- Duplicate exports

**Example Output:**

```
Unused files (121)
mcp-servers/snes-mcp-server/src/manual/parser/manual-parser-sample.ts
snes-modder/src/examples/discovery-usage.ts
snes-modder/src/asm/example.ts
...
```

**Interpreting Results:**

- **Test files** - May be intentionally unused if they're old examples
- **Example files** - Can be safely removed if no longer needed
- **Type definition files** - Check if they're actually imported

**Safe Removal:**
Review the list carefully. Files like examples, old experiments, and test code can usually be removed. Always verify before deleting.

### 5. Husky + lint-staged

Automatically runs checks on git commit to catch issues early.

**Configuration:**

- Husky: [.husky/pre-commit](.husky/pre-commit)
- lint-staged: [.lintstagedrc.json](.lintstagedrc.json)

**What runs on commit:**

- ESLint auto-fix on `.ts`, `.js`, `.mjs`, `.cjs` files
- Prettier formatting on code and config files
- Syncpack format on package.json

**Pre-commit Hook:**

```bash
# Runs automatically on git commit
npx lint-staged
```

**Skipping hooks (not recommended):**

```bash
git commit --no-verify -m "message"
```

## Workflow Examples

### Starting a New Feature

Before starting work, ensure dependencies are up to date:

```bash
npm run deps:check
npm run deps:update:interactive
npm install
```

### Regular Maintenance

Run weekly or monthly:

```bash
# Check everything
npm run organize

# Fix what can be auto-fixed
npm run organize:fix

# Review and remove unused code
npm run clean:dead-code
# Manually review and delete unused files

# Update dependencies
npm run deps:update:interactive
npm install
```

### Before a Release

Ensure code is clean:

```bash
# 1. Sync versions across packages
npm run deps:sync
npm run deps:fix

# 2. Check for unused dependencies
npm run deps:unused

# 3. Find dead code
npm run clean:dead-code

# 4. Format all package.json files
npm run deps:format

# 5. Run existing tests
npm test
```

### Cleaning Up After Development

```bash
# Find and review unused files
npm run clean:dead-code:export
cat knip-report.json | jq

# Remove files manually after review
git rm snes-modder/src/examples/old-example.ts
git commit -m "chore: remove unused example files"
```

## Configuration Files

### [knip.json](knip.json)

Controls which files knip analyzes:

- Entry points for each package
- Ignored directories (dist, node_modules, etc.)
- Project-specific patterns

**Updating:** Add new packages to the `workspaces` section.

### [.syncpackrc.json](.syncpackrc.json)

Controls dependency version synchronization:

- Which dependencies to keep in sync
- Semver range rules
- Package.json formatting rules

**Updating:** Add new shared dependencies to `versionGroups.dependencies`.

### [.lintstagedrc.json](.lintstagedrc.json)

Controls what runs on git commit:

- ESLint + Prettier for code files
- Prettier for config files
- Syncpack for package.json

**Updating:** Add new file patterns or linters as needed.

## Troubleshooting

### "knip: command not found"

Install dependencies:

```bash
npm install
```

### syncpack shows false positives

Some packages intentionally use different versions. Update [.syncpackrc.json](.syncpackrc.json) to exclude them:

```json
{
  "versionGroups": [
    {
      "dependencies": ["!excluded-package"],
      ...
    }
  ]
}
```

### Pre-commit hook is slow

The hook only runs on staged files (via lint-staged), so it should be fast. If it's slow:

1. Check for large files being committed
2. Ensure your ESLint config is optimized
3. Consider disabling expensive rules for pre-commit

### depcheck shows false positives

Some dependencies are used in non-standard ways:

- Configuration files (eslint, prettier, husky)
- Build tools (rollup plugins, vitest)
- Type definitions (@types/\*)

Add them to `.depcheckrc.json` if needed:

```json
{
  "ignores": ["lint-staged", "husky", "@types/*"]
}
```

## Best Practices

1. **Run checks regularly** - Don't let issues accumulate
2. **Review before removing** - Knip finds unused code, but verify before deleting
3. **Keep versions in sync** - Use syncpack to avoid "works on my machine" issues
4. **Update dependencies incrementally** - Use interactive mode to update in batches
5. **Commit often** - Pre-commit hooks catch issues early
6. **Document exceptions** - If you intentionally ignore a warning, add a comment

## Integration with CI/CD

Add these checks to your CI pipeline:

```yaml
# .github/workflows/quality.yml
name: Code Quality
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run deps:sync
      - run: npm run clean:dead-code
      - run: npm run deps:unused
```

## Additional Resources

- [npm-check-updates docs](https://github.com/raineorshine/npm-check-updates)
- [depcheck docs](https://github.com/depcheck/depcheck)
- [syncpack docs](https://jamiemason.github.io/syncpack/)
- [knip docs](https://knip.dev/)
- [husky docs](https://typicode.github.io/husky/)
- [lint-staged docs](https://github.com/okonet/lint-staged)
