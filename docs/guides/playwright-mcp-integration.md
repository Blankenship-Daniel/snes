# Playwright MCP Server Integration

## Overview

The Playwright MCP server has been added to enable browser automation capabilities for AI agents. This complements the EmulatorJS MCP server by providing general-purpose web automation for tasks like:

- Testing web-based tools and dashboards
- Automating browser-based workflows
- Taking screenshots of web applications
- Interacting with web forms and UI elements
- Running browser-based tests

## Installation

The Playwright MCP server is already configured in `.mcp.json` and will be automatically available in Claude Code.

### Prerequisites

Install Playwright browsers (required one-time setup):

```bash
# Install Chromium (most common)
npx playwright install chromium

# Or install all browsers
npx playwright install
```

## Configuration

The server is configured in `.mcp.json`:

```json
{
  "playwright": {
    "command": "npx",
    "args": ["-y", "@playwright/mcp@latest"],
    "description": "Browser automation with Playwright"
  }
}
```

## Available Tools

The Playwright MCP server provides the following tools (exact list may vary by version):

### Browser Management
- **browser_navigate** - Navigate to a URL
- **browser_navigate_back** - Go back to previous page
- **browser_close** - Close the browser

### Page Interaction
- **browser_click** - Click on an element
- **browser_type** - Type text into an element
- **browser_press_key** - Press keyboard keys
- **browser_fill_form** - Fill multiple form fields
- **browser_select_option** - Select dropdown options

### Visual & State
- **browser_snapshot** - Capture accessibility tree snapshot (recommended)
- **browser_take_screenshot** - Take visual screenshot
- **browser_evaluate** - Run JavaScript in browser context

### Advanced
- **browser_drag** - Drag and drop elements
- **browser_hover** - Hover over elements
- **browser_wait_for** - Wait for conditions
- **browser_handle_dialog** - Handle alerts/confirms

## Usage Examples

### Example 1: Take a Screenshot of a Website

```typescript
// Navigate to a website
await use_mcp_tool("playwright", "browser_navigate", {
  url: "https://example.com"
});

// Take a screenshot
await use_mcp_tool("playwright", "browser_take_screenshot", {
  filename: "./screenshots/example.png"
});

// Close browser
await use_mcp_tool("playwright", "browser_close", {});
```

### Example 2: Fill Out a Form

```typescript
// Navigate to form
await use_mcp_tool("playwright", "browser_navigate", {
  url: "https://example.com/contact"
});

// Fill form fields
await use_mcp_tool("playwright", "browser_fill_form", {
  fields: [
    {
      name: "Name field",
      type: "textbox",
      ref: "input[name='name']",
      value: "Test User"
    },
    {
      name: "Email field",
      type: "textbox",
      ref: "input[name='email']",
      value: "test@example.com"
    }
  ]
});

// Submit form
await use_mcp_tool("playwright", "browser_click", {
  element: "Submit button",
  ref: "button[type='submit']"
});
```

### Example 3: Test Web Dashboard

```typescript
// Navigate to dashboard
await use_mcp_tool("playwright", "browser_navigate", {
  url: "http://localhost:3000/dashboard"
});

// Wait for page to load
await use_mcp_tool("playwright", "browser_wait_for", {
  text: "Dashboard loaded"
});

// Take snapshot for AI analysis
await use_mcp_tool("playwright", "browser_snapshot", {});

// Click on a specific element
await use_mcp_tool("playwright", "browser_click", {
  element: "Analytics tab",
  ref: "[data-testid='analytics-tab']"
});

// Screenshot the result
await use_mcp_tool("playwright", "browser_take_screenshot", {
  filename: "./screenshots/analytics.png"
});
```

## Comparison: Playwright MCP vs EmulatorJS MCP

| Feature | Playwright MCP | EmulatorJS MCP |
|---------|---------------|----------------|
| **Purpose** | General web automation | SNES game emulation |
| **Target** | Any website/webapp | SNES ROMs only |
| **Control** | Browser interactions | Game controller inputs |
| **Visual** | Screenshots + snapshots | Game screenshots |
| **State** | Browser state | Game save states |
| **Use Case** | Web testing | ROM playtesting |

## Integration with SNES Workflow

### Scenario 1: Visual Documentation

Use Playwright to capture screenshots of your modding workflow for documentation:

```typescript
// 1. Screenshot the mod validation dashboard
await use_mcp_tool("playwright", "browser_navigate", {
  url: "http://localhost:3000/validation-dashboard"
});

await use_mcp_tool("playwright", "browser_take_screenshot", {
  filename: "./docs/images/validation-dashboard.png"
});

// 2. Use EmulatorJS to capture actual gameplay
await use_mcp_tool("emulatorjs", "start_emulator", {
  rom_path: "./zelda3-infinite-magic.smc"
});

await use_mcp_tool("emulatorjs", "run_frames", { frames: 300 });

await use_mcp_tool("emulatorjs", "take_screenshot", {
  filepath: "./docs/images/gameplay-infinite-magic.png"
});
```

### Scenario 2: Automated Testing Workflow

```typescript
// 1. Use Playwright to test web-based ROM management tool
await use_mcp_tool("playwright", "browser_navigate", {
  url: "http://localhost:8080/rom-builder"
});

await use_mcp_tool("playwright", "browser_click", {
  element: "Build Mod button",
  ref: "#build-infinite-magic"
});

// 2. Wait for build to complete
await use_mcp_tool("playwright", "browser_wait_for", {
  text: "Build complete"
});

// 3. Use EmulatorJS to test the built ROM
await use_mcp_tool("emulatorjs", "start_emulator", {
  rom_path: "./output/zelda3-infinite-magic.smc"
});

await use_mcp_tool("emulatorjs", "run_frames", { frames: 600 });

// 4. Verify gameplay
await use_mcp_tool("emulatorjs", "get_game_state", {});
```

## Best Practices

### 1. Use Snapshots Over Screenshots

The accessibility tree snapshot is more reliable than visual screenshots:

```typescript
// Preferred - semantic understanding
await use_mcp_tool("playwright", "browser_snapshot", {});

// Less preferred - visual only
await use_mcp_tool("playwright", "browser_take_screenshot", {
  filename: "./screenshot.png"
});
```

### 2. Wait for Page Load

Always wait for content to load before interacting:

```typescript
await use_mcp_tool("playwright", "browser_navigate", {
  url: "https://example.com"
});

// Wait for key element
await use_mcp_tool("playwright", "browser_wait_for", {
  text: "Page loaded indicator"
});
```

### 3. Clean Up Resources

Always close the browser when done:

```typescript
try {
  // ... browser automation ...
} finally {
  await use_mcp_tool("playwright", "browser_close", {});
}
```

## Troubleshooting

### Browser Not Found

If you get "browser not found" errors:

```bash
# Install browsers
npx playwright install

# Or specific browser
npx playwright install chromium
```

### Permission Errors

Ensure the MCP server has permission to run `npx`:

```bash
# Test npx access
npx --version

# If issues, install Playwright globally
npm install -g playwright
```

### Connection Issues

If the MCP server won't start:

1. Check `.mcp.json` syntax is valid JSON
2. Ensure `npx` is in your PATH
3. Try specifying a specific version instead of `@latest`:
   ```json
   "args": ["-y", "@playwright/mcp@0.1.0"]
   ```

## Security Considerations

⚠️ **Important**: The Playwright MCP server has full browser access and runs with your user permissions. Be cautious when:

- Automating interactions with production systems
- Handling sensitive credentials
- Running untrusted scripts
- Accessing payment or financial interfaces

## Resources

- **Playwright MCP GitHub**: https://github.com/microsoft/playwright-mcp
- **Playwright Documentation**: https://playwright.dev
- **MCP Protocol**: https://modelcontextprotocol.io
- **EmulatorJS MCP**: See `emulatorjs-mcp-quick-start.md`

## Next Steps

1. Test the Playwright MCP server with a simple navigation command
2. Explore combining Playwright and EmulatorJS for comprehensive testing
3. Create automated workflows for ROM validation
4. Document additional use cases specific to SNES development
