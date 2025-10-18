# Security Policy

We take the security of Zelda 3 Modder seriously. Please report vulnerabilities responsibly and avoid sharing proprietary ROMs or keys.

## Reporting a Vulnerability
- Preferred: Open a private security advisory in GitHub (Security → Advisories → Report a vulnerability).
- Alternative: Email the maintainers at security@snes-modding.local.
- Do not open public issues for undisclosed vulnerabilities.

Please include:
- A minimal description and clear reproduction steps
- Affected version/tag and commit SHA
- Environment details (OS, shell, tool versions: bsnes, bc, xxd, timeout)
- Impact assessment and suggested remediation if known

Never include or attach ROMs, keys, or large logs. Provide short excerpts only.

## Scope
- Script vulnerabilities (command injection, unsafe file handling, path traversal)
- Supply-chain concerns (malicious dependencies, workflow secrets exposure)
- Runtime flags or integrations that could lead to unsafe behavior
- CI/CD workflows and release automation security

## Response Targets
- Acknowledge report: within 48 hours
- Initial assessment: within 7 days
- Patch or mitigation: coordinated as soon as practical
- Disclosure: coordinated with reporter (target 90 days unless agreed otherwise)

## Safe Disclosure
- We will credit reporters (if desired) after a fix is released.
- Please test only on your own systems and do not attempt to access data you do not own or have permission to test.

## Hardening Guidance
- Keep `zelda3.smc` local only; never commit or share ROMs/keys.
- Use the validation scripts in non-interactive contexts.
- Pin tool versions where possible and validate checksums for third‑party artifacts.
- Prefer POSIX‑compatible bash and minimal dependencies to reduce attack surface.

