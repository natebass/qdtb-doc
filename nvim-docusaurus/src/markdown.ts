import type { LuaModule, ColorScheme, GroupMap } from "./types.js";
import { PLUGINS_TO_CONSOLIDATE } from "./files.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format a name for display: replace underscores with spaces and title-case */
function toDisplayName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Slugify a heading string the same way Docusaurus (github-slugger) does.
 * Keeps word chars and hyphens, strips everything else (dots, etc.),
 * replaces spaces with hyphens, and lowercases.
 */
function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Build a docs-relative link path for a given category/group/module.
 *
 * All links are absolute from the docs root (prefixed with `/docs/`) so they
 * resolve correctly regardless of the linking page's slug.
 *
 * Special cases:
 * - When `groupName` is "index", it represents the category root
 *   (e.g. config/index.md → `/docs/config`), so the group segment is omitted.
 * - When `moduleName` matches `groupName`, the trailing segment is omitted
 *   so Docusaurus doesn't produce `/index` URLs.
 */
function docsLink(
  category: string,
  groupName: string,
  moduleName?: string,
): string {
  // "index" groups represent the category root (e.g. config/index.md)
  if (groupName === "index") {
    if (!moduleName) return `/docs/${category}`;
    return `/docs/${category}/${moduleName}`;
  }
  const base = `/docs/${category}/${groupName}`;
  if (!moduleName || moduleName === groupName) return base;
  return `${base}/${moduleName}`;
}

// ── Individual Module Markdown ───────────────────────────────────────────────

export function generateModuleMarkdown(
  mod: LuaModule,
  hLevel: number = 1,
  includeFrontmatter: boolean = true,
): string {
  const lines: string[] = [];

  if (includeFrontmatter) {
    lines.push("---");
    lines.push(`title: "${mod.moduleName || mod.name}"`);
    lines.push(`description: "${mod.summary}"`);
    lines.push(`sidebar_label: "${mod.name}"`);
    lines.push("---");
    lines.push("");
  }

  lines.push(`${"#".repeat(hLevel)} ${mod.moduleName || mod.name}`);
  lines.push("");
  if (mod.summary) {
    lines.push(`> ${mod.summary}`);
    lines.push("");
  }

  // Functions
  if (mod.functions.length > 0) {
    lines.push(`${"#".repeat(hLevel + 1)} Functions`);
    lines.push("");
    for (const fn of mod.functions) {
      const paramStr = fn.params.map((p) => p.name).join(", ");
      lines.push(`${"#".repeat(hLevel + 2)} \`${fn.name}(${paramStr})\``);
      lines.push("");
      if (fn.summary) {
        lines.push(fn.summary);
        lines.push("");
      }
      if (fn.params.length > 0) {
        lines.push("**Parameters:**");
        lines.push("");
        lines.push("| Name | Type | Description |");
        lines.push("|------|------|-------------|");
        for (const p of fn.params) {
          lines.push(`| \`${p.name}\` | \`${p.type}\` | ${p.description} |`);
        }
        lines.push("");
      }
      if (fn.returns.length > 0) {
        lines.push("**Returns:**");
        lines.push("");
        for (const r of fn.returns) {
          lines.push(`- \`${r.type}\` ${r.description}`);
        }
        lines.push("");
      }
      lines.push(`*Defined at line ${fn.lineNumber}*`);
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  // Source Code Link
  lines.push(`${"#".repeat(hLevel + 1)} Source`);
  lines.push("");
  lines.push(
    `[View Source on GitHub](https://github.com/natebass/QDtb/blob/master/${mod.relativePath})`,
  );
  lines.push("");

  return lines.join("\n");
}

// ── Consolidated Config Markdown ─────────────────────────────────────────────

export function generateInitConfigMarkdown(modules: LuaModule[]): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push('title: "Initialization"');
  lines.push(
    'description: "Neovim initialization, mini.nvim setup, and autocmds"',
  );
  lines.push('sidebar_label: "Init"');
  lines.push("---");
  lines.push("");
  lines.push("# Initialization");
  lines.push("");

  const initOrder = ["init", "mini", "autocmds"];
  const filtered = modules.filter((m) =>
    ["init", "mini", "autocmds", "other"].includes(m.name),
  );
  const sorted = [...filtered].sort((a, b) => {
    if (a.relativePath === "init.lua") return -1;
    if (b.relativePath === "init.lua") return 1;
    const idxA = initOrder.indexOf(a.name);
    const idxB = initOrder.indexOf(b.name);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const mod of sorted) {
    lines.push(generateModuleMarkdown(mod, 2, false));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

export function generateOptionsConfigMarkdown(modules: LuaModule[]): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push('title: "Options"');
  lines.push('description: "Neovim options and settings"');
  lines.push('sidebar_label: "Options"');
  lines.push("---");
  lines.push("");
  lines.push("# Options");
  lines.push("");

  const mod = modules.find((m) => m.name === "options");
  if (mod) {
    lines.push(generateModuleMarkdown(mod, 2, false));
  }

  return lines.join("\n");
}

export function generateKeymapsConfigMarkdown(modules: LuaModule[]): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push('title: "Keymaps"');
  lines.push('description: "Custom keybindings and mappings"');
  lines.push('sidebar_label: "Keymaps"');
  lines.push("---");
  lines.push("");
  lines.push("# Keymaps");
  lines.push("");

  const mod = modules.find((m) => m.name === "keymaps");
  if (mod) {
    lines.push(generateModuleMarkdown(mod, 2, false));
  }

  return lines.join("\n");
}

// ── Category Index Markdown ──────────────────────────────────────────────────

export function generateCategoryIndexMarkdown(
  groupName: string,
  modules: LuaModule[],
  category: string,
): string {
  const lines: string[] = [];

  const displayName = toDisplayName(groupName);
  const sidebarLabel = groupName === "qdtb" ? "Miscellaneous" : "Overview";

  const position = groupName === "qdtb" ? 40 : 1;

  lines.push("---");
  lines.push(`title: "${displayName}"`);
  lines.push(`description: "Overview of ${displayName} configuration"`);
  lines.push(`sidebar_label: "${sidebarLabel}"`);
  lines.push(`sidebar_position: ${position}`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${displayName}`);
  lines.push("");
  lines.push(`Documentation for modules in the \`${groupName}\` folder.`);
  lines.push("");
  lines.push("| Module | Description |");
  lines.push("|--------|-------------|");
  for (const mod of modules.sort((a, b) => a.name.localeCompare(b.name))) {
    // Use absolute doc link so it works regardless of the current page's slug
    const link = docsLink(category, groupName, mod.name);
    lines.push(`| [${mod.name}](${link}) | ${mod.summary} |`);
  }
  lines.push("");

  return lines.join("\n");
}

// ── Consolidated Module Markdown ─────────────────────────────────────────────

export function generateConsolidatedModuleMarkdown(
  groupName: string,
  modules: LuaModule[],
): string {
  const lines: string[] = [];
  const displayName = toDisplayName(groupName);

  const positions: Record<string, number> = {
    code_style: 10,
    fold_this: 20,
    session_manager: 30,
  };
  const position = positions[groupName] || 50;

  lines.push("---");
  lines.push(`title: "${displayName}"`);
  lines.push(`description: "Documentation for the ${displayName} plugin"`);
  lines.push(`sidebar_label: "${displayName}"`);
  lines.push(`sidebar_position: ${position}`);
  lines.push("---");
  lines.push("");

  if (modules.length === 1) {
    const mod = modules[0];
    const content = generateModuleMarkdown(mod, 1, false);
    const contentLines = content.split("\n");
    // Replace the first header line with the display name
    contentLines[0] = `# ${displayName}`;
    lines.push(contentLines.join("\n"));
  } else {
    lines.push(`# ${displayName}`);
    lines.push("");

    const sorted = [...modules].sort((a, b) => {
      if (a.name === "init" || a.name === "all") return -1;
      if (b.name === "init" || b.name === "all") return 1;
      return a.name.localeCompare(b.name);
    });

    for (const mod of sorted) {
      lines.push(generateModuleMarkdown(mod, 2, false));
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ── Color Scheme Markdown ────────────────────────────────────────────────────

export function generateColorSchemeMarkdown(scheme: ColorScheme): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push(`title: "${scheme.displayName}"`);
  lines.push(`description: "${scheme.description}"`);
  lines.push(`sidebar_label: "${scheme.displayName}"`);
  lines.push("---");
  lines.push("");
  lines.push(`import ColorPalette from '@site/src/components/ColorPalette';`);
  lines.push(`import ColorPreview from '@site/src/components/ColorPreview';`);
  lines.push("");
  lines.push(`# ${scheme.displayName}`);
  lines.push("");
  lines.push(`> ${scheme.description}`);
  lines.push("");

  // All extracted colors
  if (scheme.allColors.length > 0) {
    const colorsJson = JSON.stringify(scheme.allColors);
    lines.push("## Color Palette");
    lines.push("");
    lines.push(`<ColorPalette colors={${colorsJson}} />`);
    lines.push("");
  }

  // Color palette component
  if (scheme.bgDark && scheme.fgDark) {
    lines.push("## Preview");
    lines.push("");
    lines.push(
      `<ColorPreview bgDark="${scheme.bgDark}" bgLight="${scheme.bgLight || "#e5e5e5"}" fgDark="${scheme.fgDark}" fgLight="${scheme.fgLight || "#333333"}" name="${scheme.displayName}" />`,
    );
    lines.push("");
  }

  // Theme metadata
  if (scheme.accent || scheme.saturation) {
    lines.push("## Theme Properties");
    lines.push("");
    lines.push("| Property | Value |");
    lines.push("|----------|-------|");
    if (scheme.accent) lines.push(`| Accent | \`${scheme.accent}\` |`);
    if (scheme.saturation)
      lines.push(`| Saturation | \`${scheme.saturation}\` |`);
    if (scheme.bgDark)
      lines.push(`| Background (Dark) | \`${scheme.bgDark}\` |`);
    if (scheme.bgLight)
      lines.push(`| Background (Light) | \`${scheme.bgLight}\` |`);
    if (scheme.fgDark)
      lines.push(`| Foreground (Dark) | \`${scheme.fgDark}\` |`);
    if (scheme.fgLight)
      lines.push(`| Foreground (Light) | \`${scheme.fgLight}\` |`);
    lines.push("");
  }

  // Source Link
  lines.push("## Source");
  lines.push("");
  lines.push(
    `[View Source on GitHub](https://github.com/natebass/QDtb/blob/master/colors/${scheme.filePath})`,
  );
  lines.push("");

  return lines.join("\n");
}

// ── Root Index Markdown ──────────────────────────────────────────────────────

export function generateIndexMarkdown(
  groups: GroupMap,
  colorSchemes: ColorScheme[],
): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push('title: "Module Index"');
  lines.push(
    'description: "Overview of all modules in the QDtb Neovim configuration"',
  );
  lines.push("sidebar_label: Index");
  lines.push("sidebar_position: 999");
  lines.push("---");
  lines.push("");
  lines.push("# QDtb Neovim Configuration");
  lines.push("");
  lines.push(
    "Auto-generated documentation from the QDtb Neovim Lua configuration files.",
  );
  lines.push("");

  // Group by category
  const categories = new Map<string, string[]>();
  for (const [groupKey, info] of groups) {
    if (info.category === "colors") continue;
    if (!categories.has(info.category)) categories.set(info.category, []);
    categories.get(info.category)!.push(groupKey);
  }

  const categoryLabels: Record<string, string> = {
    config: "⚙️ Core Configuration",
    plugins: "🔌 Plugins",
    colors: "🎨 Color Schemes",
    other: "📦 Other",
  };

  for (const [cat, groupKeys] of categories) {
    lines.push(`## ${categoryLabels[cat] || cat}`);
    lines.push("");
    lines.push("| Page | Modules |");
    lines.push("|------|---------|");
    for (const groupKey of groupKeys.sort()) {
      const info = groups.get(groupKey)!;
      const groupName = info.groupName;
      // "index" groups are category roots — use the category name for display
      const displayName =
        groupName === "index"
          ? toDisplayName(info.category)
          : toDisplayName(groupName);

      // Consolidated groups put all modules on one page (no individual pages)
      const isConsolidated =
        (cat === "config" && groupName === "index") ||
        (cat === "plugins" && PLUGINS_TO_CONSOLIDATE.includes(groupName));

      const isFolder =
        !isConsolidated &&
        (info.modules.length > 1 || info.modules[0].name !== groupName);

      // Link to the group's root page (no trailing /index)
      const link = docsLink(cat, groupName);

      const modulesList = info.modules
        .map((m) => {
          let mLink: string;
          if (isConsolidated) {
            // Anchor into the consolidated page using the heading slug
            const anchor = headingSlug(m.moduleName || m.name);
            mLink = `${link}#${anchor}`;
          } else if (isFolder) {
            mLink = docsLink(cat, groupName, m.name);
          } else {
            mLink = docsLink(cat, groupName);
          }
          return `[${m.name}](${mLink})`;
        })
        .join(", ");

      lines.push(`| [${displayName}](${link}) | ${modulesList} |`);
    }
    lines.push("");
  }

  if (colorSchemes.length > 0) {
    lines.push("## 🎨 Color Schemes");
    lines.push("");
    lines.push("| Scheme | Description | Dark BG | Light BG |");
    lines.push("|--------|-------------|---------|----------|");
    for (const cs of colorSchemes.sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    )) {
      const link = docsLink("colors", cs.name);
      lines.push(
        `| [${cs.displayName}](${link}) | ${cs.description} | \`${cs.bgDark || "—"}\` | \`${cs.bgLight || "—"}\` |`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}
