#!/usr/bin/env bash
# Setup Codex CLI with SNES MCP Servers
#
# This script configures Codex CLI to use all SNES-related MCP servers.
#
# Usage:
#   ./scripts/setup-codex-mcp.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CODEX_CONFIG_DIR="$HOME/.codex"
CODEX_CONFIG_FILE="$CODEX_CONFIG_DIR/config.toml"

echo "=== Codex CLI MCP Server Setup ==="
echo ""

# Check if Codex CLI is installed
if ! command -v codex &> /dev/null; then
    echo "❌ Codex CLI is not installed."
    echo ""
    echo "Please install Codex CLI first:"
    echo "  npm install -g @openai/codex"
    echo ""
    echo "Or using Homebrew:"
    echo "  brew install codex"
    exit 1
fi

echo "✓ Codex CLI is installed: $(which codex)"
echo ""

# Create .codex directory if it doesn't exist
if [ ! -d "$CODEX_CONFIG_DIR" ]; then
    echo "Creating $CODEX_CONFIG_DIR directory..."
    mkdir -p "$CODEX_CONFIG_DIR"
fi

# Check if config already exists
if [ -f "$CODEX_CONFIG_FILE" ]; then
    echo "⚠️  Existing Codex config found at $CODEX_CONFIG_FILE"
    echo ""
    read -p "Do you want to backup and replace it? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        backup_file="$CODEX_CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
        echo "Backing up to $backup_file"
        cp "$CODEX_CONFIG_FILE" "$backup_file"
    else
        echo ""
        echo "Appending to existing config instead..."
        echo ""
        echo "# SNES MCP Servers - Added $(date)" >> "$CODEX_CONFIG_FILE"
    fi
fi

# Generate config with absolute paths
echo "Generating Codex config with absolute paths..."
cat > "${CODEX_CONFIG_FILE}.new" << EOF
# Codex CLI Configuration for SNES MCP Servers
# Generated on $(date)
# Project root: $PROJECT_ROOT

# Zelda 3 C Reimplementation MCP Server
[mcp_servers.zelda3]
command = "node"
args = ["$PROJECT_ROOT/repos/zelda3/.mcp-server/index.js"]

# SNES9x Emulator MCP Server
[mcp_servers.snes9x]
command = "node"
args = ["$PROJECT_ROOT/repos/snes9x/.mcp-server/index.js"]

# SNES MiSTer FPGA Core MCP Server
[mcp_servers.snes-mister]
command = "node"
args = ["$PROJECT_ROOT/repos/SNES_MiSTer/.mcp-server/index.js"]

# Zelda 3 Assembly Disassembly MCP Server
[mcp_servers.zelda3-disasm]
command = "node"
args = ["$PROJECT_ROOT/repos/zelda3-disasm/dist/index.js"]

# Playwright Browser Automation MCP Server (Official)
[mcp_servers.playwright]
command = "npx"
args = ["-y", "@playwright/mcp@latest"]
EOF

# Either replace or append
if [ -f "$CODEX_CONFIG_FILE" ] && [[ ! $REPLY =~ ^[Yy]$ ]]; then
    cat "${CODEX_CONFIG_FILE}.new" >> "$CODEX_CONFIG_FILE"
    rm "${CODEX_CONFIG_FILE}.new"
else
    mv "${CODEX_CONFIG_FILE}.new" "$CODEX_CONFIG_FILE"
fi

echo "✓ Codex config updated at $CODEX_CONFIG_FILE"
echo ""

# Verify MCP server files exist
echo "Verifying MCP server files..."
servers=(
    "repos/zelda3/.mcp-server/index.js"
    "repos/snes9x/.mcp-server/index.js"
    "repos/SNES_MiSTer/.mcp-server/index.js"
    "repos/zelda3-disasm/dist/index.js"
)

all_exist=true
for server in "${servers[@]}"; do
    full_path="$PROJECT_ROOT/$server"
    if [ -f "$full_path" ]; then
        echo "  ✓ $server"
    else
        echo "  ✗ $server (NOT FOUND)"
        all_exist=false
    fi
done

echo ""

if [ "$all_exist" = false ]; then
    echo "⚠️  Some MCP servers were not found. You may need to build them first."
    echo ""
    echo "For zelda3-disasm, run:"
    echo "  cd $PROJECT_ROOT/repos/zelda3-disasm && npm run build"
fi

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "To use the MCP servers with Codex CLI:"
echo "  1. Run: codex"
echo "  2. The MCP servers will be automatically loaded"
echo "  3. Ask questions like:"
echo "     - 'Search Zelda 3 code for Link's sword attack'"
echo "     - 'Find SNES9x APU emulation code'"
echo "     - 'Show me MiSTer PPU implementation'"
echo ""
echo "To verify servers are loaded:"
echo "  codex"
echo "  /mcp servers"
echo ""
echo "For more information, see:"
echo "  - repos/zelda3/.mcp-server/CODEX_CLI.md"
echo "  - https://developers.openai.com/codex/cli/"
echo ""
