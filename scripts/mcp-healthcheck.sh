#!/usr/bin/env bash
set -euo pipefail

# Simple local healthcheck for repo components used by MCP servers.
# Verifies presence of key files and indicative strings.

LOG_FILE=""
JSON_OUT=""

# Skip flags
SKIP_BSNES_PLUS=0
SKIP_SNES9X=0
SKIP_ZELDA3=0
SKIP_MISTER=0
SKIP_SNES_MCP=0
START_TS=$(date '+%Y-%m-%d %H:%M:%S')
FAILURES=0

usage() {
  cat <<USAGE
Usage: $0 [options]

Options:
  --log <path>           Write human-readable output to file as well as stdout
  --json <path|->        Write JSON summary to path, or '-' for stdout
  --skip-bsnes-plus      Skip bsnes-plus checks
  --skip-snes9x          Skip snes9x checks
  --skip-zelda3          Skip zelda3 checks
  --skip-mister          Skip SNES_MiSTer checks
  --skip-snes-mcp        Skip snes-mcp-server presence check
  -h, --help             Show this help
USAGE
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

search() {
  # $1: pattern, $2: path
  if command_exists rg; then
    rg -n "$1" "$2" >/dev/null 2>&1
  else
    grep -R "$1" "$2" >/dev/null 2>&1
  fi
}

log() {
  if [[ -n "$LOG_FILE" ]]; then
    printf "%s\n" "$*" | tee -a "$LOG_FILE"
  else
    # If JSON is requested to stdout, send human logs to stderr
    if [[ "$JSON_OUT" == "-" ]]; then
      printf "%s\n" "$*" >&2
    else
      printf "%s\n" "$*"
    fi
  fi
}

# JSON helpers
json_escape() {
  # Escape backslashes and quotes
  echo -n "$1" | sed -e 's/\\\\/\\\\\\\\/g' -e 's/\"/\\"/g'
}

JSON_ITEMS=""
add_json_item() {
  # $1 name, $2 status, $3 errors, $4 warnings, $5 lastChange
  local name status errors warnings last
  name=$(json_escape "$1"); status=$(json_escape "$2"); last=$(json_escape "${5:-}")
  local item
  item=$(printf '{"name":"%s","status":"%s","errors":%s,"warnings":%s,"lastChange":"%s"}' "$name" "$status" "${3:-0}" "${4:-0}" "$last")
  if [[ -z "$JSON_ITEMS" ]]; then
    JSON_ITEMS="$item"
  else
    JSON_ITEMS="$JSON_ITEMS,$item"
  fi
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --log)
      shift
      LOG_FILE=${1:-}
      [[ -z "$LOG_FILE" ]] && { usage; exit 2; }
      # Truncate existing
      : > "$LOG_FILE"
      ;;
    --json)
      shift
      JSON_OUT=${1:-}
      [[ -z "$JSON_OUT" ]] && { usage; exit 2; }
      ;;
    --skip-bsnes-plus) SKIP_BSNES_PLUS=1 ;;
    --skip-snes9x) SKIP_SNES9X=1 ;;
    --skip-zelda3) SKIP_ZELDA3=1 ;;
    --skip-mister) SKIP_MISTER=1 ;;
    --skip-snes-mcp) SKIP_SNES_MCP=1 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      usage; exit 2 ;;
  esac
  shift
done

log "[MCP Healthcheck] Start: $START_TS"

# bsnes-plus
if [[ $SKIP_BSNES_PLUS -eq 1 ]]; then
  log "- bsnes-plus: SKIPPED"
  add_json_item "bsnes-plus" "skipped" 0 0 ""
elif [[ -d bsnes-plus ]]; then
  log "- bsnes-plus: FOUND"
  comp_err=0; comp_warn=0; comp_last=""
  # Component fingerprint (last commit touching this dir)
  if command_exists git; then
    FP=$(git log -1 --format='%h %cd' --date=short -- bsnes-plus 2>/dev/null || true)
    if [[ -n "$FP" ]]; then
      log "  * last-change: $FP"; comp_last="$FP"
    fi
  fi
  if [[ -f bsnes-plus/README.md ]]; then
    log "  * README.md: OK"
  else
    log "  * README.md: MISSING"; FAILURES=$((FAILURES+1)); comp_err=$((comp_err+1))
  fi
  if [[ -f bsnes-plus/bsnes/ui-qt/debugger/debugger.cpp ]]; then
    if search "Breakpoint" bsnes-plus/bsnes/ui-qt/debugger/debugger.cpp; then
      log "  * debugger.cpp contains 'Breakpoint': OK"
    else
      log "  * debugger.cpp contains 'Breakpoint': MISSING"; FAILURES=$((FAILURES+1)); comp_err=$((comp_err+1))
    fi
  else
    log "  * ui-qt/debugger/debugger.cpp: MISSING"; FAILURES=$((FAILURES+1)); comp_err=$((comp_err+1))
  fi
  # Build configs quick check
  if [[ -f bsnes-plus/bsnes/Makefile && -f bsnes-plus/snesreader/Makefile ]]; then
    log "  * core + plugin Makefiles: OK"
  else
    log "  * core + plugin Makefiles: MISSING"; FAILURES=$((FAILURES+1)); comp_err=$((comp_err+1))
  fi
  status="ok"; [[ $comp_err -gt 0 ]] && status="error"; [[ $comp_err -eq 0 && $comp_warn -gt 0 ]] && status="warn"
  add_json_item "bsnes-plus" "$status" "$comp_err" "$comp_warn" "$comp_last"
else
  log "- bsnes-plus: MISSING"; FAILURES=$((FAILURES+1))
  add_json_item "bsnes-plus" "error" 1 0 ""
fi

# snes-mcp-server (local sources only)
if [[ $SKIP_SNES_MCP -eq 1 ]]; then
  log "- snes-mcp-server: SKIPPED"
  add_json_item "snes-mcp-server" "skipped" 0 0 ""
elif [[ -d snes-mcp-server ]]; then
  log "- snes-mcp-server: FOUND (local sources)"
  add_json_item "snes-mcp-server" "ok" 0 0 ""
else
  log "- snes-mcp-server: MISSING (non-fatal)"
  add_json_item "snes-mcp-server" "warn" 0 1 ""
fi

# snes9x
if [[ $SKIP_SNES9X -eq 1 ]]; then
  log "- snes9x: SKIPPED"
  add_json_item "snes9x" "skipped" 0 0 ""
elif [[ -d snes9x ]]; then
  log "- snes9x: FOUND"
  comp_err=0; comp_warn=0; comp_last=""
  if command_exists git; then
    FP=$(git log -1 --format='%h %cd' --date=short -- snes9x 2>/dev/null || true)
    if [[ -n "$FP" ]]; then
      log "  * last-change: $FP"; comp_last="$FP"
    fi
  fi
  if search "void S9xMainLoop" snes9x; then
    log "  * S9xMainLoop symbol found: OK"
  else
    log "  * S9xMainLoop symbol found: MISSING"; FAILURES=$((FAILURES+1)); comp_err=$((comp_err+1))
  fi
  if [[ -f snes9x/cpuexec.cpp ]]; then
    if search "S9xMainLoop" snes9x/cpuexec.cpp; then
      log "  * cpuexec.cpp contains S9xMainLoop: OK"
    else
      log "  * cpuexec.cpp contains S9xMainLoop: MISSING"; FAILURES=$((FAILURES+1)); comp_err=$((comp_err+1))
    fi
  fi
  status="ok"; [[ $comp_err -gt 0 ]] && status="error"; [[ $comp_err -eq 0 && $comp_warn -gt 0 ]] && status="warn"
  add_json_item "snes9x" "$status" "$comp_err" "$comp_warn" "$comp_last"
else
  log "- snes9x: MISSING"; FAILURES=$((FAILURES+1))
  add_json_item "snes9x" "error" 1 0 ""
fi

# zelda3
if [[ $SKIP_ZELDA3 -eq 1 ]]; then
  log "- zelda3: SKIPPED"
  add_json_item "zelda3" "skipped" 0 0 ""
elif [[ -d zelda3 ]]; then
  log "- zelda3: FOUND"
  comp_err=0; comp_warn=0; comp_last=""
  if command_exists git; then
    FP=$(git log -1 --format='%h %cd' --date=short -- zelda3 2>/dev/null || true)
    if [[ -n "$FP" ]]; then
      log "  * last-change: $FP"; comp_last="$FP"
    fi
  fi
  SEARCH_DIR="zelda3/src"
  [[ -d "$SEARCH_DIR" ]] || SEARCH_DIR="zelda3"
  if search "Sprite_" "$SEARCH_DIR"; then
    log "  * Sprite_* references found: OK"
  else
    log "  * Sprite_* references found: MISSING"; FAILURES=$((FAILURES+1)); comp_err=$((comp_err+1))
  fi
  # Key source files sanity
  if [[ -f zelda3/src/sprite.c && -f zelda3/src/sprite_main.c ]]; then
    log "  * sprite.c and sprite_main.c present: OK"
  else
    log "  * sprite.c and/or sprite_main.c missing"; FAILURES=$((FAILURES+1)); comp_err=$((comp_err+1))
  fi
  status="ok"; [[ $comp_err -gt 0 ]] && status="error"; [[ $comp_err -eq 0 && $comp_warn -gt 0 ]] && status="warn"
  add_json_item "zelda3" "$status" "$comp_err" "$comp_warn" "$comp_last"
else
  log "- zelda3: MISSING"; FAILURES=$((FAILURES+1))
  add_json_item "zelda3" "error" 1 0 ""
fi

# SNES MiSTer
if [[ $SKIP_MISTER -eq 1 ]]; then
  log "- SNES_MiSTer: SKIPPED"
  add_json_item "SNES_MiSTer" "skipped" 0 0 ""
elif [[ -d SNES_MiSTer ]]; then
  log "- SNES_MiSTer: FOUND"
  comp_err=0; comp_warn=0; comp_last=""
  if command_exists git; then
    FP=$(git log -1 --format='%h %cd' --date=short -- SNES_MiSTer 2>/dev/null || true)
    if [[ -n "$FP" ]]; then
      log "  * last-change: $FP"; comp_last="$FP"
    fi
  fi
  if [[ -f SNES_MiSTer/SNES.qpf || -f SNES_MiSTer/SNES_Q13.qpf ]]; then
    log "  * Quartus project file present: OK"
  else
    log "  * Quartus project file present: MISSING"; FAILURES=$((FAILURES+1)); comp_err=$((comp_err+1))
  fi
  if [[ -d SNES_MiSTer/rtl ]]; then
    log "  * rtl/ directory present: OK"
    # Check for core RTL files
    if [[ -f SNES_MiSTer/rtl/SNES.vhd || -f SNES_MiSTer/rtl/SNES.v ]]; then
      log "  * SNES top RTL file present: OK"
    else
      log "  * SNES top RTL file present: MISSING"; FAILURES=$((FAILURES+1)); comp_err=$((comp_err+1))
    fi
    if [[ -f SNES_MiSTer/rtl/P65C816.vhd ]]; then
      log "  * P65C816 CPU RTL present: OK"
    else
      log "  * P65C816 CPU RTL present: not found (optional)"; comp_warn=$((comp_warn+1))
    fi
  else
    log "  * rtl/ directory present: MISSING"; FAILURES=$((FAILURES+1)); comp_err=$((comp_err+1))
  fi
  status="ok"; [[ $comp_err -gt 0 ]] && status="error"; [[ $comp_err -eq 0 && $comp_warn -gt 0 ]] && status="warn"
  add_json_item "SNES_MiSTer" "$status" "$comp_err" "$comp_warn" "$comp_last"
else
  log "- SNES_MiSTer: MISSING"; FAILURES=$((FAILURES+1))
  add_json_item "SNES_MiSTer" "error" 1 0 ""
fi

# Remote-only MCPs (informational)
log "- context7: remote server check (not performed in shell)"
log "- exa: remote server check (not performed in shell)"
add_json_item "context7" "info" 0 0 ""
add_json_item "exa" "info" 0 0 ""

RESULT_MSG="PASS — no issues detected"
RESULT_STATUS=0
[[ $FAILURES -ne 0 ]] && RESULT_MSG="FAIL — $FAILURES issue(s) detected" && RESULT_STATUS=1

log "[MCP Healthcheck] $RESULT_MSG"

if [[ -n "$JSON_OUT" ]]; then
  # Build result text explicitly (no ternary in bash parameter expansion)
  RES_TXT="PASS"; [[ $RESULT_STATUS -ne 0 ]] && RES_TXT="FAIL"
  SUMMARY=$(printf '{"started":"%s","result":"%s","failures":%d,"components":[%s]}' "$START_TS" "$RES_TXT" "$FAILURES" "$JSON_ITEMS")
  if [[ "$JSON_OUT" == "-" ]]; then
    echo "$SUMMARY"
  else
    printf "%s\n" "$SUMMARY" > "$JSON_OUT"
  fi
fi

exit $RESULT_STATUS
