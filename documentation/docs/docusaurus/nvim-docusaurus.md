---
title: nvim-docusaurus
description: A Docusaurus plugin for auto-generating Neovim configuration documentation.
sidebar_label: nvim-docusaurus
---

# nvim-docusaurus

`nvim-docusaurus` is a custom Docusaurus plugin built for this project to automate the documentation of Neovim Lua configurations. It bridges the gap between the code and the documentation by parsing Lua source files and generating structured Markdown content.

## Key Features

- **LDoc Parsing**: Automatically extracts documentation from Lua comments using LDoc-style annotations like `@module`, `@param`, and `@return`.
- **Structured Documentation**: Generates consistent Markdown layouts including:
  - Module summaries and descriptions.
  - Function signatures with parameter tables.
  - Return value details.
  - Direct links to the source code on GitHub.
- **Color Scheme Visualization**: Specialized logic for parsing Neovim color schemes, extracting hex values, and generating interactive color palettes and previews.
- **Dynamic Sidebars**: Generates Docusaurus-compatible sidebar structures, ensuring new configuration modules are automatically added to the navigation.
- **Consolidation Support**: Ability to group multiple related Lua modules (e.g., small plugin configs) into a single documentation page for better readability.

## How it Works

The plugin scans the Neovim configuration directory (typically `QDtb/`) and processes files based on their category:

1. **Modules**: It looks for `--@module` annotations to identify documentation entry points.
2. **Functions**: It parses local and global function declarations, associating them with the preceding comment block.
3. **Colors**: For files in the `colors/` directory, it extracts hex codes and theme metadata (like accent colors and dark/light variants).

### Example Annotation

```lua
--- Set up the statusline.
--- This function initializes the UI components for the status bar.
--- @module statusline
--- @param mode string The current editor mode.
--- @return table The statusline configuration.
function M.setup(mode)
  -- implementation
end
```

The plugin transforms this into a formatted Markdown section with headers, tables, and descriptions.

## Configuration

To use the plugin, add it to the `plugins` array in your `docusaurus.config.ts`:

```typescript
import type { Config } from "@docusaurus/types";

const config: Config = {
  // ...
  plugins: [
    "nvim-docusaurus",
    // ...
  ],
};

export default config;
```

## Internal Implementation

The core logic resides in `nvim-docusaurus/src/index.ts`. It uses:

- `fs` and `path` for file system traversal.
- `execSync` for potential shell integrations.
- Regular expressions for robust Lua code parsing without requiring a full Lua parser.
- Custom React components (`ColorPalette`, `ColorPreview`) for enhanced visual representation of theme data.
