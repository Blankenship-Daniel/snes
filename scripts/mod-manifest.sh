#!/usr/bin/env bash

# Shared manifest describing all supported Zelda 3 mods.
# Provides helper functions that return metadata for each mod so every script
# stays consistent when listing, validating, or copying ROMs.

if [[ -n "${MOD_MANIFEST_LOADED:-}" ]]; then
  return 0
fi
MOD_MANIFEST_LOADED=1

# Each entry encodes:
#   key|source_rom|output_prefix|description|aliases|category|flags
# The order here controls default presentation order.
MOD_MANIFEST_ENTRIES=(
  "infinite-magic|repos/snes-modder/zelda3-infinite-magic.smc|zelda3-infinite-magic|Infinite Magic Mod|unlimited-magic never-run-out-of-magic|magic"
  "max-hearts|repos/snes-modder/zelda3-health-v2-fixed.smc|zelda3-max-health|Maximum Health Mod|full-health 20-hearts|max"
  "rich-start|repos/snes-modder/zelda3-rich-start-999.smc|zelda3-rich-start-999|Rich Start (999 Rupees)|rich 999-rupees millionaire|money"
  "rich-start-500|repos/snes-modder/zelda3-rich-start-500.smc|zelda3-rich-start-500|Rich Start Comfortable (500 Rupees)|comfortable 500-rupees|money"
  "rich-start-777|repos/snes-modder/zelda3-rich-start-777.smc|zelda3-rich-start-777|Rich Start Wealthy (777 Rupees)|wealthy 777-rupees lucky|money"
  "2x-speed|repos/snes-modder/zelda3-2x-speed.smc|zelda3-2x-speed|2x Speed Mod|double-speed faster|speed"
  "intro-skip|repos/snes-modder/zelda3-intro-skip.smc|zelda3-intro-skip|Intro Skip Mod|skip-intro no-intro|speed"
  "quick-start|repos/snes-modder/zelda3-quickstart-final.smc|zelda3-quickstart|Quick Start Mod|speedrun-start|speed"
  "team-solution|repos/snes-modder/zelda3-team-solution.smc|zelda3-team-solution|Team Solution (Balanced Combo)|best-combo|packs"
  "ultimate|repos/snes-modder/zelda3-ultimate-test.smc|zelda3-ultimate|Ultimate Combo (All Mods)|ultimate-combo everything|packs"
  "safe-start|repos/snes-modder/zelda3-safe-start.smc|zelda3-safe-start|Safe Start (Beginner Friendly)|beginner|packs|allow-identical"
)

# Categories for presentation; key|label
MOD_MANIFEST_GROUPS=(
  "magic|🎭 MAGIC & POWER"
  "max|❤️ HEALTH & SURVIVAL"
  "money|💰 MONEY & RESOURCES"
  "speed|🏃 SPEED & FLOW"
  "packs|🎯 COMPLETE PACKAGES"
)

mod_manifest_keys() {
  local entry key
  for entry in "${MOD_MANIFEST_ENTRIES[@]}"; do
    IFS='|' read -r key _ <<<"$entry"
    printf '%s\n' "$key"
  done
}

mod_manifest_field() {
  local key="$1"
  local field="$2"
  local entry entry_key source prefix description aliases category flags
  for entry in "${MOD_MANIFEST_ENTRIES[@]}"; do
    IFS='|' read -r entry_key source prefix description aliases category flags <<<"$entry"
    if [[ "$entry_key" == "$key" ]]; then
      case "$field" in
        source) printf '%s\n' "$source" ;;
        output_prefix) printf '%s\n' "$prefix" ;;
        description) printf '%s\n' "$description" ;;
        aliases) printf '%s\n' "$aliases" ;;
        category) printf '%s\n' "$category" ;;
        flags) printf '%s\n' "${flags:-}" ;;
        *) return 1 ;;
      esac
      return 0
    fi
  done
  return 1
}

mod_manifest_group_label() {
  local group="$1"
  local entry key label
  for entry in "${MOD_MANIFEST_GROUPS[@]}"; do
    IFS='|' read -r key label <<<"$entry"
    if [[ "$key" == "$group" ]]; then
      printf '%s\n' "$label"
      return 0
    fi
  done
  return 1
}

mod_manifest_resolve_key() {
  local input="$1"
  local key aliases alias
  while IFS= read -r key; do
    if [[ "$key" == "$input" ]]; then
      printf '%s\n' "$key"
      return 0
    fi
    aliases=$(mod_manifest_field "$key" aliases) || continue
    for alias in $aliases; do
      if [[ "$alias" == "$input" ]]; then
        printf '%s\n' "$key"
        return 0
      fi
    done
  done < <(mod_manifest_keys)
  return 1
}
