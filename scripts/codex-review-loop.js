#!/usr/bin/env node

const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const USAGE = "Usage: codex-review-loop.js [MAX_TURNS] [INITIAL_PROMPT|-]";
const MAX_TURNS_HELP = "MAX_TURNS must be a positive integer (default: 1).";
const DEFAULT_INITIAL_PROMPT = "Perform a code review of this repo.\n";
const DEFAULT_FOLLOW_UP_PROMPT = "Proceed with next steps.\n";
const STATUS_ONE_RESPONSE =
  "Please proceed. Treat the question about .claude/settings.local.json auto-approvals as answered: do not commit auto-approval lists; limit shared defaults to benign read-only commands or omit them. Continue with the next steps without pausing for additional approvals.\n";
const STATUS_ONE_MAX_ATTEMPTS = 3;

function ensureCodexAvailable() {
  const result = spawnSync("codex", ["--version"], { stdio: "ignore" });
  if (result.error) {
    if (result.error.code === "ENOENT") {
      console.error("codex CLI is required but was not found in PATH.");
      process.exit(1);
    }
    throw result.error;
  }
  if (result.status !== 0) {
    if (result.status === 1) {
      return;
    }
    console.error("codex CLI is installed but failed to run.");
    process.exit(result.status ?? 1);
  }
}

function parseMaxTurns(rawValue) {
  const value = rawValue ?? "1";
  if (!/^\d+$/.test(value)) {
    console.error(USAGE);
    console.error(MAX_TURNS_HELP);
    process.exit(1);
  }

  const numericValue = Number.parseInt(value, 10);
  if (Number.isNaN(numericValue) || numericValue <= 0) {
    console.error(USAGE);
    console.error(MAX_TURNS_HELP);
    process.exit(1);
  }

  return numericValue;
}

function runCodex(args, { input } = {}) {
  return new Promise((resolve, reject) => {
    const stdio =
      input === undefined
        ? ["inherit", "inherit", "inherit"]
        : ["pipe", "inherit", "inherit"];

    const child = spawn("codex", args, { stdio });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code, signal) => {
      if (signal) {
        reject(new Error(`codex exited due to signal ${signal}`));
        return;
      }
      if (code !== 0) {
        if (code === 1) {
          resolve(1);
          return;
        }
        reject(new Error(`codex exited with status ${code}`));
        return;
      }
      resolve(0);
    });

    if (input !== undefined) {
      child.stdin.end(input, "utf8");
    }
  });
}

async function resolveStatusOne(exitCode, promptToRepeat) {
  let code = exitCode;
  let attempts = 0;
  while (code === 1 && attempts < STATUS_ONE_MAX_ATTEMPTS) {
    attempts += 1;
    console.warn(
      "codex exited with status 1. Sending default guidance to unblock the session."
    );
    const responseCode = await runCodex(["exec", "resume", "--last"], {
      input: STATUS_ONE_RESPONSE,
    });
    if (responseCode === 1) {
      code = 1;
      continue;
    }
    if (promptToRepeat) {
      const followUpCode = await runCodex(["exec", "resume", "--last"], {
        input: promptToRepeat,
      });
      code = followUpCode;
      continue;
    }
    code = responseCode;
  }
  if (code === 1) {
    console.warn(
      "codex continues to exit with status 1 after default guidance; proceeding to the next step."
    );
  }
  return code;
}

async function runFollowUpTurn(prompt) {
  const exitCode = await runCodex(["exec", "resume", "--last"], {
    input: prompt,
  });
  await resolveStatusOne(exitCode, prompt);
}

function readPromptFromStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
    process.stdin.on("error", reject);
  });
}

async function resolveInitialPromptArg(rawPrompt) {
  if (rawPrompt && rawPrompt !== "-") {
    return rawPrompt.endsWith("\n") ? rawPrompt : `${rawPrompt}\n`;
  }
  if (rawPrompt === "-") {
    const stdinPrompt = await readPromptFromStdin();
    const normalized = stdinPrompt.trimEnd();
    if (!normalized) {
      console.warn("Empty prompt provided on stdin. Using default initial prompt.");
      return DEFAULT_INITIAL_PROMPT;
    }
    return `${normalized}\n`;
  }
  return DEFAULT_INITIAL_PROMPT;
}

async function main() {
  ensureCodexAvailable();

  const maxTurns = parseMaxTurns(process.argv[2]);
  const followUpPrompt = DEFAULT_FOLLOW_UP_PROMPT;
  const scriptDir = __dirname;
  const sessionMarker = path.join(scriptDir, ".codex-review-session");
  const hasSession = fs.existsSync(sessionMarker);

  const shouldResumeOnly =
    hasSession && maxTurns === 1 && !process.argv[3];

  if (!hasSession || !shouldResumeOnly) {
    if (hasSession) {
      fs.unlinkSync(sessionMarker);
    }
    const initialPromptArg = process.argv[3];
    const initialPrompt = await resolveInitialPromptArg(initialPromptArg);
    console.log("Starting new Codex review session with full permissions...");
    const initialExitCode = await runCodex(
      ["exec", "--sandbox", "danger-full-access", "-"],
      { input: initialPrompt }
    );
    await resolveStatusOne(initialExitCode, null);
    fs.writeFileSync(sessionMarker, "initialized\n", "utf8");

    if (maxTurns > 1) {
      console.log(`Running follow-up steps (${maxTurns - 1} turns)...`);
      for (let turn = 1; turn < maxTurns; turn += 1) {
        console.log(`--- Proceed turn ${turn} of ${maxTurns - 1} ---`);
        await runFollowUpTurn(followUpPrompt);
      }
    }
    return;
  }

  console.log("Resuming Codex review session with full permissions...");
  for (let turn = 1; turn <= maxTurns; turn += 1) {
    console.log(`--- Proceed turn ${turn} of ${maxTurns} ---`);
    await runFollowUpTurn(followUpPrompt);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
