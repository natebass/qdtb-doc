import type { LoadContext, Plugin } from "@docusaurus/types";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Plugins that should be consolidated into a single markdown file
const PLUGINS_TO_CONSOLIDATE = ["code_style", "session_manager", "fold_this"];

// ── Types ────────────────────────────────────────────────────────────────────

interface LuaFunction {
  name: string;
  summary: string;
  description: string;
  params: { name: string; type: string; description: string }[];
  returns: { type: string; description: string }[];
  lineNumber: number;
}

interface LuaModule {
  name: string;
  moduleName: string;
  summary: string;
  description: string;
  filePath: string;
  relativePath: string;
  functions: LuaFunction[];
  variables: { name: string; value: string; description: string }[];
  sourceCode: string;
  category: string; // e.g. 'config', 'plugins', 'colors'
}

interface ColorInfo {
  name: string;
  hex: string;
  usage: string;
}

interface ColorScheme {
  name: string;
  displayName: string;
  description: string;
  filePath: string;
  darkColors: ColorInfo[];
  lightColors: ColorInfo[];
  allColors: ColorInfo[];
  rawSource: string;
  bgDark: string | null;
  bgLight: string | null;
  fgDark: string | null;
  fgLight: string | null;
  accent: string | null;
  saturation: string | null;
}

interface PluginOptions {
  QDtbPath?: string;
  outputDir?: string;
}

// ── Lua Parsing Utilities ────────────────────────────────────────────────────

function extractModuleInfo(source: string): {
  moduleName: string;
  summary: string;
  description: string;
} {
  const moduleMatch = source.match(/---\s*@module\s+(\S+)/);
  const summaryMatch = source.match(/---\s*(.+?)\.?\s*\n---\s*@module/);
  const descLines: string[] = [];

  // Grab description lines between the summary and the first code
  const lines = source.split("\n");
  let inHeader = false;
  for (const line of lines) {
    if (line.startsWith("---") && !line.includes("@module")) {
      if (!inHeader && summaryMatch) {
        inHeader = true;
        continue; // skip the summary line
      }
      if (inHeader) {
        const content = line.replace(/^---\s?/, "").trim();
        if (content && !content.startsWith("@")) {
          descLines.push(content);
        }
      }
    } else if (inHeader && !line.startsWith("---")) {
      break;
    }
  }

  return {
    moduleName: moduleMatch?.[1] ?? "",
    summary: summaryMatch?.[1]?.trim() ?? "",
    description: descLines.join("\n"),
  };
}

function extractFunctions(source: string): LuaFunction[] {
  const functions: LuaFunction[] = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    // Detect function declarations
    const fnMatch = lines[i].match(
      /(?:local\s+)?(?:function\s+(\w[\w.:]*)|([\w.]+)\s*=\s*function)\s*\(/,
    );
    if (!fnMatch) continue;

    const fnName = fnMatch[1] || fnMatch[2];
    if (!fnName) continue;

    // Look backwards for LDoc comments
    const params: { name: string; type: string; description: string }[] = [];
    const returns: { type: string; description: string }[] = [];
    let summary = "";
    let description = "";
    const descLines: string[] = [];

    let j = i - 1;
    while (j >= 0 && lines[j].trim().startsWith("--")) {
      j--;
    }
    j++; // move back to first comment line

    for (let k = j; k < i; k++) {
      const line = lines[k].trim();
      if (!line.startsWith("--")) continue;

      const content = line.replace(/^-+\s?/, "").trim();

      const paramMatch = content.match(/@param\s+(\w+)\s+(\w+)\s*(.*)/);
      const returnMatch = content.match(/@return\s+(\w+)\s*(.*)/);

      if (paramMatch) {
        params.push({
          name: paramMatch[1],
          type: paramMatch[2],
          description: paramMatch[3] || "",
        });
      } else if (returnMatch) {
        returns.push({
          type: returnMatch[1],
          description: returnMatch[2] || "",
        });
      } else if (!content.startsWith("@") && content.length > 0) {
        if (!summary) {
          summary = content;
        } else {
          descLines.push(content);
        }
      }
    }

    description = descLines.join("\n");

    functions.push({
      name: fnName,
      summary,
      description,
      params,
      returns,
      lineNumber: i + 1,
    });
  }

  return functions;
}

function extractVariables(
  source: string,
): { name: string; value: string; description: string }[] {
  const vars: { name: string; value: string; description: string }[] = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    // Match local variable assignments with preceding comments
    const varMatch = lines[i].match(
      /^(?:local\s+)?(\w+)\s*=\s*(.+?)(?:\s*--.*)?$/,
    );
    if (!varMatch) continue;
    if (lines[i].includes("function") || lines[i].includes("require")) continue;

    const name = varMatch[1];
    const value = varMatch[2].trim();

    // Skip common non-interesting assignments
    if (["vim", "map", "hi", "hues", "p", "less_p"].includes(name)) continue;

    let description = "";
    if (i > 0 && lines[i - 1].trim().startsWith("--")) {
      description = lines[i - 1].trim().replace(/^-+\s?/, "");
    }

    vars.push({ name, value, description });
  }

  return vars;
}

// ── Color Extraction ─────────────────────────────────────────────────────────

function extractColors(source: string, fileName: string): ColorScheme {
  const colors: ColorInfo[] = [];
  const hexRegex = /#[0-9a-fA-F]{6}/g;

  // Extract all hex colors with context
  const lines = source.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match: RegExpExecArray | null;
    const lineHexRegex = /#[0-9a-fA-F]{6}/g;
    while ((match = lineHexRegex.exec(line)) !== null) {
      const hex = match[0];

      // Try to find the variable name or context
      let usage = "";
      const assignMatch = line.match(/(\w+)\s*=.*?#/);
      const hiMatch = line.match(/(?:hi|nvim_set_hl).*?['"]([\w@.]+)['"]/);
      const commentMatch = line.match(/--\s*(.+)/);

      if (assignMatch) usage = assignMatch[1];
      else if (hiMatch) usage = hiMatch[1];
      if (commentMatch) usage += (usage ? " — " : "") + commentMatch[1].trim();

      colors.push({
        name: usage || `color_L${i + 1}`,
        hex: hex.toLowerCase(),
        usage: usage || line.trim(),
      });
    }
  }

  // Deduplicate by hex value, keeping the most informative name
  const uniqueColors = new Map<string, ColorInfo>();
  for (const c of colors) {
    if (
      !uniqueColors.has(c.hex) ||
      c.name.length > (uniqueColors.get(c.hex)?.name.length ?? 0)
    ) {
      uniqueColors.set(c.hex, c);
    }
  }

  // Extract bg/fg for dark and light
  const bgDarkMatch = source.match(
    /bg\s*=\s*is_dark\s*and\s*"(#[0-9a-fA-F]{6})"/,
  );
  const bgLightMatch = source.match(
    /bg\s*=\s*is_dark\s*and\s*"#[0-9a-fA-F]{6}"\s*or\s*"(#[0-9a-fA-F]{6})"/,
  );
  const fgDarkMatch = source.match(
    /fg\s*=\s*is_dark\s*and\s*"(#[0-9a-fA-F]{6})"/,
  );
  const fgLightMatch = source.match(
    /fg\s*=\s*is_dark\s*and\s*"#[0-9a-fA-F]{6}"\s*or\s*"(#[0-9a-fA-F]{6})"/,
  );

  const accentMatch = source.match(/accent\s*=\s*"(\w+)"/);
  const saturationMatch = source.match(
    /saturation\s*=\s*is_dark\s*and\s*"(\w+)"/,
  );

  // Separate dark and light colors based on palette naming
  const darkColors: ColorInfo[] = [];
  const lightColors: ColorInfo[] = [];

  for (const line of lines) {
    if (
      line.includes("palette_dark") ||
      line.includes("bg.") ||
      (line.includes("is_dark") && line.includes("and"))
    ) {
      const m = line.match(/#[0-9a-fA-F]{6}/);
      if (m) {
        const nameMatch = line.match(/(\w+)\s*=/);
        darkColors.push({
          name: nameMatch?.[1] ?? "unknown",
          hex: m[0].toLowerCase(),
          usage: line.trim(),
        });
      }
    }
  }

  const displayName = fileName
    .replace(".lua", "")
    .replace(/^mini/, "Mini ")
    .replace(/^neovim_/, "Neovim ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Extract the theme description from comments
  const descMatch = source.match(/^--\s*'(.+?)'/m);

  return {
    name: fileName.replace(".lua", ""),
    displayName,
    description: descMatch?.[1] ?? `${displayName} color scheme`,
    filePath: fileName,
    darkColors,
    lightColors,
    allColors: Array.from(uniqueColors.values()),
    rawSource: source,
    bgDark: bgDarkMatch?.[1]?.toLowerCase() ?? null,
    bgLight: bgLightMatch?.[1]?.toLowerCase() ?? null,
    fgDark: fgDarkMatch?.[1]?.toLowerCase() ?? null,
    fgLight: fgLightMatch?.[1]?.toLowerCase() ?? null,
    accent: accentMatch?.[1] ?? null,
    saturation: saturationMatch?.[1] ?? null,
  };
}

// ── Markdown Generation ──────────────────────────────────────────────────────

// ── Markdown Generation ──────────────────────────────────────────────────────

// ── Markdown Generation ──────────────────────────────────────────────────────

function generateModuleMarkdown(
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

function generateConsolidatedConfigMarkdown(modules: LuaModule[]): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push('title: "Core Configuration"');
  lines.push('description: "Consolidated core configuration for Neovim"');
  lines.push('sidebar_label: "Core Configuration"');
  lines.push("---");
  lines.push("");
  lines.push("# Core Configuration");
  lines.push("");

  // Sort: init, mini, options, keymaps, then others
  const order = ["init", "mini", "options", "keymaps"];
  const sorted = [...modules].sort((a, b) => {
    // Root init.lua should ALWAYS be first
    if (a.relativePath === "init.lua") return -1;
    if (b.relativePath === "init.lua") return 1;

    const idxA = order.indexOf(a.name);
    const idxB = order.indexOf(b.name);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  const initMods = sorted.filter((m) => m.name === "init");
  const miniMod = sorted.find((m) => m.name === "mini");

  if (initMods.length > 0 || miniMod) {
    lines.push(`## Init & Mini`);
    lines.push("");
    const combined = [...initMods];
    if (miniMod) combined.push(miniMod);

    combined.forEach((mod) => {
      lines.push(`### ${mod.moduleName || mod.name}`);
      lines.push("");
      if (mod.summary) {
        lines.push(`> ${mod.summary}`);
        lines.push("");
      }

      if (mod.functions.length > 0) {
        lines.push(`#### Functions`);
        lines.push("");
        for (const fn of mod.functions) {
          const paramStr = fn.params.map((p) => p.name).join(", ");
          lines.push(`##### \`${fn.name}(${paramStr})\``);
          lines.push("");
          if (fn.summary) lines.push(fn.summary + "\n\n");
        }
      }

      lines.push(
        `[View Source on GitHub](https://github.com/natebass/QDtb/blob/master/${mod.relativePath})`,
      );
      lines.push("");
    });
    lines.push("---");
    lines.push("");
  }

  // Then others, but put keymaps last among the remaining ones if it exists
  const remaining = sorted.filter(
    (m) => m.name !== "init" && m.name !== "mini",
  );
  for (const mod of remaining) {
    lines.push(generateModuleMarkdown(mod, 2, false));
  }

  return lines.join("\n");
}

function generateCategoryIndexMarkdown(
  groupName: string,
  modules: LuaModule[],
  category: string,
): string {
  const lines: string[] = [];

  // Prettify group name
  const displayName = groupName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const sidebarLabel = groupName === "QDtb" ? "QDTB" : "Overview";

  lines.push("---");
  lines.push(`title: "${displayName}"`);
  lines.push(`description: "Overview of ${displayName} configuration"`);
  lines.push(`sidebar_label: "${sidebarLabel}"`);
  lines.push(`sidebar_position: 1`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${displayName}`);
  lines.push("");
  lines.push(`Documentation for modules in the \`${groupName}\` folder.`);
  lines.push("");
  lines.push("| Module | Description |");
  lines.push("|--------|-------------|");
  for (const mod of modules.sort((a, b) => a.name.localeCompare(b.name))) {
    // Relative link from /docs/category/groupName to /docs/category/groupName/modName
    lines.push(`| [${mod.name}](${groupName}/${mod.name}) | ${mod.summary} |`);
  }
  lines.push("");

  return lines.join("\n");
}

function generateConsolidatedModuleMarkdown(
  groupName: string,
  modules: LuaModule[],
): string {
  const lines: string[] = [];
  const displayName = groupName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  lines.push("---");
  lines.push(`title: "${displayName}"`);
  lines.push(`description: "Documentation for the ${displayName} plugin"`);
  lines.push(`sidebar_label: "${displayName}"`);
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

function generateColorSchemeMarkdown(scheme: ColorScheme): string {
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

  // Color palette component
  if (scheme.bgDark && scheme.fgDark) {
    lines.push("## Preview");
    lines.push("");
    lines.push(
      `<ColorPreview bgDark="${scheme.bgDark}" bgLight="${scheme.bgLight || "#e5e5e5"}" fgDark="${scheme.fgDark}" fgLight="${scheme.fgLight || "#333333"}" name="${scheme.displayName}" />`,
    );
    lines.push("");
  }

  // All extracted colors
  if (scheme.allColors.length > 0) {
    const colorsJson = JSON.stringify(scheme.allColors);
    lines.push("## Color Palette");
    lines.push("");
    lines.push(`<ColorPalette colors={${colorsJson}} />`);
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

function generateIndexMarkdown(
  groups: Map<
    string,
    { category: string; groupName: string; modules: LuaModule[] }
  >,
  colorSchemes: ColorScheme[],
): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push('title: "Neovim Configuration"');
  lines.push(
    'description: "Complete documentation for the QDtb Neovim configuration"',
  );
  lines.push("sidebar_position: 1");
  lines.push("slug: /");
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
      const displayName = groupName
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const isFolder =
        info.modules.length > 1 || info.modules[0].name !== groupName;

      const link = isFolder
        ? `${info.category}/${groupName}/index`
        : `${info.category}/${groupName}`;

      const modulesList = info.modules
        .map((m) => {
          const mLink = isFolder
            ? `${info.category}/${groupName}/${m.name}`
            : `${info.category}/${groupName}`;
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
      lines.push(
        `| [${cs.displayName}](colors/${cs.name}) | ${cs.description} | \`${cs.bgDark || "—"}\` | \`${cs.bgLight || "—"}\` |`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ── Sidebar Generation ───────────────────────────────────────────────────────

interface SidebarItem {
  type: string;
  label: string;
  items?: SidebarItem[];
  id?: string;
}

function generateSidebar(
  groups: Map<
    string,
    { category: string; groupName: string; modules: LuaModule[] }
  >,
  colorSchemes: ColorScheme[],
): SidebarItem[] {
  const sidebar: SidebarItem[] = [
    { type: "doc", label: "Overview", id: "index" },
  ];

  // Group by category
  const categoryGroups = new Map<string, string[]>();
  for (const [groupKey, info] of groups) {
    if (info.category === "colors") continue;
    if (!categoryGroups.has(info.category))
      categoryGroups.set(info.category, []);
    categoryGroups.get(info.category)!.push(groupKey);
  }

  const categoryConfig: Record<string, { label: string; emoji: string }> = {
    config: { label: "Core Configuration", emoji: "⚙️" },
    plugins: { label: "Plugins", emoji: "🔌" },
    other: { label: "Other Modules", emoji: "📦" },
  };

  for (const [cat, groupKeys] of categoryGroups) {
    const conf = categoryConfig[cat] || {
      label: cat,
      emoji: "📄",
    };

    if (cat === "config") {
      sidebar.push({
        type: "doc",
        label: `${conf.emoji} ${conf.label}`,
        id: "config/index",
      });
      continue;
    }

    sidebar.push({
      type: "category",
      label: `${conf.emoji} ${conf.label}`,
      items: groupKeys.sort().map((groupKey) => {
        const info = groups.get(groupKey)!;
        const groupName = info.groupName;
        const displayName = groupName
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        const isFolder =
          (info.modules.length > 1 || info.modules[0].name !== groupName) &&
          !(cat === "plugins" && PLUGINS_TO_CONSOLIDATE.includes(groupName));

        if (!isFolder) {
          return {
            type: "doc" as const,
            label: displayName,
            id: `${cat}/${groupName}`,
          };
        } else {
          return {
            type: "category",
            label: displayName,
            items: [
              {
                type: "doc" as const,
                label: groupName === "QDtb" ? "QDTB" : "Overview",
                id: `${cat}/${groupName}/index`,
              },
              ...info.modules
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((m) => ({
                  type: "doc" as const,
                  label: m.name,
                  id: `${cat}/${groupName}/${m.name}`,
                })),
            ],
          };
        }
      }),
    });
  }

  // Color schemes category
  if (colorSchemes.length > 0) {
    sidebar.push({
      type: "category",
      label: "🎨 Color Schemes",
      items: colorSchemes
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .map((cs) => ({
          type: "doc" as const,
          label: cs.displayName,
          id: `colors/${cs.name}`,
        })),
    });
  }

  return sidebar;
}

// ── File Discovery ───────────────────────────────────────────────────────────

function findLuaFiles(dir: string, basePath: string = ""): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      // Skip doc, node_modules, and hidden directories
      if (
        ["doc", "node_modules", ".git", "domscheme-main"].includes(entry.name)
      )
        continue;
      files.push(...findLuaFiles(fullPath, relPath));
    } else if (
      entry.name.endsWith(".lua") &&
      entry.name !== "dkjson.lua" &&
      entry.name !== "dump.lua"
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function categorizeFile(filePath: string, QDtbPath: string): string {
  const rel = path.relative(QDtbPath, filePath);
  if (rel === "init.lua") return "config"; // Root init.lua is core config
  if (rel.startsWith("colors/") || rel.startsWith("colors\\")) return "colors";
  if (rel.startsWith("lua/config/") || rel.startsWith("lua\\config\\"))
    return "config";
  if (rel.startsWith("lua/plugins/") || rel.startsWith("lua\\plugins\\"))
    return "plugins";
  return "other";
}

function getModuleName(filePath: string, QDtbPath: string): string {
  const rel = path.relative(QDtbPath, filePath);
  return rel
    .replace(/\.lua$/, "")
    .replace(/[\\/]/g, ".")
    .replace(/\.init$/, "");
}

function getGroupInfo(filePath: string, QDtbPath: string) {
  const rel = path.relative(QDtbPath, filePath);
  const parts = rel.split(path.sep);
  const category = categorizeFile(filePath, QDtbPath);

  // If it's in a subdirectory of plugins or config, use that subdirectory name as group
  if ((category === "plugins" || category === "config") && parts.length >= 4) {
    return { category, group: parts[2] };
  }

  // Consolidate top-level config files
  if (category === "config") {
    return { category, group: "index" };
  }

  // Default: group is just the filename
  return { category, group: path.basename(filePath, ".lua") };
}

// ── Plugin ───────────────────────────────────────────────────────────────────

export default function nvimDocusaurusPlugin(
  context: LoadContext,
  options: PluginOptions,
): Plugin<void> {
  const QDtbPath = options.QDtbPath ?? path.resolve(context.siteDir, "../QDtb");
  const outputBase = path.resolve(context.siteDir, "docs");

  return {
    name: "nvim-docusaurus",

    async loadContent() {
      console.log(`\n🔌 nvim-docusaurus: Scanning ${QDtbPath}...`);

      // Clean previous generated docs
      ["colors", "config", "plugins", "other"].forEach((dir) => {
        const p = path.join(outputBase, dir);
        if (fs.existsSync(p)) {
          fs.rmSync(p, { recursive: true, force: true });
        }
      });
      ["index.md", "_sidebar.json"].forEach((file) => {
        const p = path.join(outputBase, file);
        if (fs.existsSync(p)) {
          fs.unlinkSync(p);
        }
      });

      // Ensure output directory exists
      fs.mkdirSync(outputBase, { recursive: true });

      // Find all Lua files
      const luaFiles = findLuaFiles(QDtbPath);
      console.log(`   Found ${luaFiles.length} Lua files`);

      const modules: LuaModule[] = [];
      const colorSchemes: ColorScheme[] = [];
      const groups = new Map<
        string,
        { category: string; groupName: string; modules: LuaModule[] }
      >();

      for (const filePath of luaFiles) {
        const source = fs.readFileSync(filePath, "utf-8");
        const { category, group: groupName } = getGroupInfo(filePath, QDtbPath);
        const fileName = path.basename(filePath);
        const name = path.basename(filePath, ".lua");
        const relativePath = path.relative(QDtbPath, filePath);

        const moduleInfo = extractModuleInfo(source);
        const functions = extractFunctions(source);
        const variables = extractVariables(source);

        const mod: LuaModule = {
          name,
          moduleName:
            moduleInfo.moduleName || getModuleName(filePath, QDtbPath),
          summary: moduleInfo.summary || `${name} module`,
          description: moduleInfo.description,
          filePath,
          relativePath,
          functions,
          variables,
          sourceCode: source,
          category,
        };

        modules.push(mod);

        // Handle grouping with a composite key to avoid collisions between categories
        const groupKey = `${category}/${groupName}`;
        if (!groups.has(groupKey)) {
          groups.set(groupKey, { category, groupName, modules: [] });
        }
        groups.get(groupKey)!.modules.push(mod);

        // For color files, also extract color data
        if (category === "colors") {
          const scheme = extractColors(source, fileName);
          colorSchemes.push(scheme);
        }
      }

      // Generate markdown files for groups
      for (const [groupKey, info] of groups) {
        if (info.category === "colors") {
          // Color schemes get special treatment (still 1-to-1)
          for (const mod of info.modules) {
            const scheme = colorSchemes.find((s) => s.name === mod.name);
            if (scheme) {
              const outDir = path.join(outputBase, "colors");
              fs.mkdirSync(outDir, { recursive: true });
              const outFile = path.join(outDir, `${mod.name}.mdx`);
              fs.writeFileSync(outFile, generateColorSchemeMarkdown(scheme));
              console.log(`   📝 Generated: colors/${mod.name}.mdx`);
            }
          }
        } else if (info.category === "config" && info.groupName === "index") {
          // Consolidated core configuration
          const outDir = path.join(outputBase, "config");
          fs.mkdirSync(outDir, { recursive: true });
          const outFile = path.join(outDir, `index.md`);
          fs.writeFileSync(
            outFile,
            generateConsolidatedConfigMarkdown(info.modules),
          );
          console.log(`   📝 Generated: config/index.md (consolidated)`);
        } else {
          const outDir = path.join(outputBase, info.category);
          fs.mkdirSync(outDir, { recursive: true });

          const isFolder =
            (info.modules.length > 1 ||
              info.modules[0].name !== info.groupName) &&
            !(
              info.category === "plugins" &&
              PLUGINS_TO_CONSOLIDATE.includes(info.groupName)
            );

          if (
            info.category === "plugins" &&
            PLUGINS_TO_CONSOLIDATE.includes(info.groupName)
          ) {
            const outFile = path.join(outDir, `${info.groupName}.md`);
            fs.writeFileSync(
              outFile,
              generateConsolidatedModuleMarkdown(info.groupName, info.modules),
            );
            console.log(
              `   📝 Generated: ${info.category}/${info.groupName}.md (consolidated)`,
            );
          } else if (!isFolder) {
            const mod = info.modules[0];
            const outFile = path.join(outDir, `${mod.name}.md`);
            fs.writeFileSync(outFile, generateModuleMarkdown(mod));
            console.log(`   📝 Generated: ${info.category}/${mod.name}.md`);
          } else {
            const groupDir = path.join(outDir, info.groupName);
            fs.mkdirSync(groupDir, { recursive: true });

            // Generate individual pages
            for (const mod of info.modules) {
              const outFile = path.join(groupDir, `${mod.name}.md`);
              fs.writeFileSync(outFile, generateModuleMarkdown(mod));
              console.log(
                `   📝 Generated: ${info.category}/${info.groupName}/${mod.name}.md`,
              );
            }

            // Generate index.md for the group
            const indexFile = path.join(groupDir, "index.md");
            fs.writeFileSync(
              indexFile,
              generateCategoryIndexMarkdown(
                info.groupName,
                info.modules,
                info.category,
              ),
            );
            console.log(
              `   📝 Generated: ${info.category}/${info.groupName}/index.md`,
            );
          }
        }
      }

      // Generate index
      const indexFile = path.join(outputBase, "index.md");
      fs.writeFileSync(indexFile, generateIndexMarkdown(groups, colorSchemes));
      console.log(`   📝 Generated: index.md`);

      // Generate sidebar data for the plugin
      const sidebarItems = generateSidebar(groups, colorSchemes);
      const sidebarFile = path.join(outputBase, "_sidebar.json");
      fs.writeFileSync(sidebarFile, JSON.stringify(sidebarItems, null, 2));
      console.log(`   📝 Generated: _sidebar.json`);

      console.log(
        `\n✅ nvim-docusaurus: Generated docs for ${modules.length} modules (${groups.size} groups) and ${colorSchemes.length} color schemes\n`,
      );
    },

    async contentLoaded({ actions }) {
      const sidebarPath = path.join(outputBase, "_sidebar.json");
      if (fs.existsSync(sidebarPath)) {
        const sidebarData = JSON.parse(fs.readFileSync(sidebarPath, "utf-8"));
        actions.setGlobalData({
          apiSidebar: sidebarData,
        });
      }
    },

    getPathsToWatch() {
      return [path.join(QDtbPath, "**/*.lua")];
    },
  };
}
