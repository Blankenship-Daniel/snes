# Codex Auto-Fix Workflow

This repository now ships an optional GitHub Actions workflow that asks Codex to try to repair CI failures automatically. The workflow only runs in response to the primary `ci` workflow finishing with the conclusion `failure`.

## How it works

- The action listens to `workflow_run` events for the `ci` workflow. When a failure is detected, it checks out the failing SHA on the originating branch.
- `corepack enable` and `yarn install --mode skip-build` prepare the workspaces so Codex can run local scripts without reinstalling dependencies repeatedly.
- `openai/codex-action@main` runs with a prompt tailored to the Zelda 3 tooling stack. Codex investigates the failing job, applies the smallest possible fix, and exits.
- After Codex completes, the workflow reruns `yarn ws:ci:build` and `yarn ws:ci:test`. These commands mirror the light-weight checks from `ci` and provide quick feedback before opening a new pull request.
- When everything succeeds, `peter-evans/create-pull-request` opens a follow-up branch named `codex/auto-fix-<run-id>` targeting the branch that originally failed. The PR body links back to the failing run for traceability.

## Required configuration

- Store an `OPENAI_API_KEY` secret in the repository or organization. Without it, the workflow exits early and logs a message. The key needs access to a Codex-compatible model (for example `o4-mini`).
- The workflow uses the default GitHub token with `contents` and `pull-requests` write permissions so it can push a fix branch and open a pull request.
- No additional runners or caches are required, but providing the Zelda 3 base ROM (`zelda3.smc`) as a workflow artifact is still optional—Codex primarily targets script and configuration regressions.

## Review expectations

- Treat Codex-created pull requests like a human-contributed fix. Confirm that the proposed change is minimal, appropriate for the failure, and the follow-up CI run is green before merging.
- If Codex cannot resolve an issue it will leave the branch unchanged and the workflow will stop without opening a PR. Investigate the original failure manually in that case.
- To disable or pause the automation, remove or rename `.github/workflows/codex-auto-fix.yml`, or temporarily delete the `OPENAI_API_KEY` secret.
