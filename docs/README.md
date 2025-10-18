# Project Documentation

Centralized docs live in this folder to keep the repository root clean and focused on runnable code and scripts.

What stays at repo root
- `README.md` — top‑level overview and quick start
- `AGENTS.md` — guidance for agents working in this repo
- `CLAUDE.md` — Claude‑specific working notes

Everything else belongs here
- Guides and how‑tos (e.g., quickstarts, integration guides)
- Architecture notes, specs, plans, best practices
- Validation and healthcheck reports, brief summaries
- Release notes and curated changelogs
- Policies (e.g., security, contributing)

Suggested subfolders
- `docs/guides/` — how‑tos, quickstarts, integration walkthroughs
- `docs/releases/` — release notes and curated changelogs
- `docs/reports/` — validation/healthcheck excerpts and summaries
- `docs/policies/` — security, contributing, code of conduct

Conventions
- Keep files small and scannable; link out for deep detail.
- Prefer descriptive filenames (kebab‑case), e.g., `neo4j-quickstart.md`.
- Include short context and last‑updated date at the top when helpful.
- Avoid committing large logs; include short excerpts instead.

Cross‑project docs
If a subproject (e.g., `snes-mcp-server/`) maintains its own docs, keep those under the subproject’s directory (e.g., `snes-mcp-server/docs/`). Use this top‑level `docs/` for repository‑wide docs.

