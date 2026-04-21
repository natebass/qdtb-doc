import type { LoadContext, Plugin } from "@docusaurus/types";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

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
  qdtbPath?: string;
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
      /(?:local\s+)?(?:function\s+(\w[\w.:]*)|([\w.]+)\s*=\s*function)\s*\(/
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

      const paramMatch = content.match(
        /@param\s+(\w+)\s+(\w+)\s*(.*)/
      );
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
  source: string
): { name: string; value: string; description: string }[] {
  const vars: { name: string; value: string; description: string }[] = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    // Match local variable assignments with preceding comments
    const varMatch = lines[i].match(
      /^(?:local\s+)?(\w+)\s*=\s*(.+?)(?:\s*--.*)?$/
    );
    if (!varMatch) continue;
    if (lines[i].includes("function") || lines[i].includes("require"))
      continue;

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
      const hiMatch = line.match(
        /(?:hi|nvim_set_hl).*?['"]([\w@.]+)['"]/
      );
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
    /bg\s*=\s*is_dark\s*and\s*"(#[0-9a-fA-F]{6})"/
  );
  const bgLightMatch = source.match(
    /bg\s*=\s*is_dark\s*and\s*"#[0-9a-fA-F]{6}"\s*or\s*"(#[0-9a-fA-F]{6})"/
  );
  const fgDarkMatch = source.match(
    /fg\s*=\s*is_dark\s*and\s*"(#[0-9a-fA-F]{6})"/
  );
  const fgLightMatch = source.match(
    /fg\s*=\s*is_dark\s*and\s*"#[0-9a-fA-F]{6}"\s*or\s*"(#[0-9a-fA-F]{6})"/
  );

  const accentMatch = source.match(/accent\s*=\s*"(\w+)"/);
  const saturationMatch = source.match(/saturation\s*=\s*is_dark\s*and\s*"(\w+)"/);

  // Separate dark and light colors based on palette naming
  const darkColors: ColorInfo[] = [];
  const lightColors: ColorInfo[] = [];

  for (const line of lines) {
    if (line.includes("palette_dark") || line.includes("bg.") || (line.includes("is_dark") && line.includes("and"))) {
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


function generateModuleMarkdown(mod: LuaModule): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push(`title: "${mod.moduleName || mod.name}"`);
  lines.push(`description: "${mod.summary}"`);
  lines.push(`sidebar_label: "${mod.name}"`);
  lines.push(`sidebar_position: 1`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${mod.moduleName || mod.name}`);
  lines.push("");
  if (mod.summary) {
    lines.push(`> ${mod.summary}`);
    lines.push("");
  }
  if (mod.description) {
    lines.push(mod.description);
    lines.push("");
  }
  lines.push(`📄 \`${mod.relativePath}\``);
  lines.push("");

  // Functions
  if (mod.functions.length > 0) {
    lines.push("## Functions");
    lines.push("");
    for (const fn of mod.functions) {
      const paramStr = fn.params.map((p) => p.name).join(", ");
      lines.push(`### \`${fn.name}(${paramStr})\``);
      lines.push("");
      if (fn.summary) {
        lines.push(fn.summary);
        lines.push("");
      }
      if (fn.description) {
        lines.push(fn.description);
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

  // Source Code
  lines.push("## Source");
  lines.push("");
  lines.push("```lua");
  lines.push(mod.sourceCode);
  lines.push("```");
  lines.push("");

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
    if (scheme.saturation) lines.push(`| Saturation | \`${scheme.saturation}\` |`);
    if (scheme.bgDark) lines.push(`| Background (Dark) | \`${scheme.bgDark}\` |`);
    if (scheme.bgLight) lines.push(`| Background (Light) | \`${scheme.bgLight}\` |`);
    if (scheme.fgDark) lines.push(`| Foreground (Dark) | \`${scheme.fgDark}\` |`);
    if (scheme.fgLight) lines.push(`| Foreground (Light) | \`${scheme.fgLight}\` |`);
    lines.push("");
  }

  // Color palette component
  if (scheme.bgDark && scheme.fgDark) {
    lines.push("## Preview");
    lines.push("");
    lines.push(
      `<ColorPreview bgDark="${scheme.bgDark}" bgLight="${scheme.bgLight || "#e5e5e5"}" fgDark="${scheme.fgDark}" fgLight="${scheme.fgLight || "#333333"}" name="${scheme.displayName}" />`
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

  // Source
  lines.push("## Source");
  lines.push("");
  lines.push("```lua");
  lines.push(scheme.rawSource);
  lines.push("```");
  lines.push("");

  return lines.join("\n");
}

function generateIndexMarkdown(
  modules: LuaModule[],
  colorSchemes: ColorScheme[]
): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push('title: "Neovim Configuration"');
  lines.push('description: "Complete documentation for the QDtb Neovim configuration"');
  lines.push("sidebar_position: 1");
  lines.push("slug: /");
  lines.push("---");
  lines.push("");
  lines.push("# QDtb Neovim Configuration");
  lines.push("");
  lines.push(
    "Auto-generated documentation from the QDtb Neovim Lua configuration files."
  );
  lines.push("");

  // Group modules by category
  const categories = new Map<string, LuaModule[]>();
  for (const mod of modules) {
    const cat = mod.category || "other";
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(mod);
  }

  const categoryLabels: Record<string, string> = {
    config: "⚙️ Core Configuration",
    plugins: "🔌 Plugins",
    colors: "🎨 Color Schemes",
    other: "📦 Other",
  };

  for (const [cat, mods] of categories) {
    lines.push(`## ${categoryLabels[cat] || cat}`);
    lines.push("");
    lines.push("| Module | Description |");
    lines.push("|--------|-------------|");
    for (const mod of mods) {
      const link = mod.category === "colors"
        ? `colors/${mod.name}`
        : `${mod.category}/${mod.name}`;
      lines.push(`| [${mod.moduleName || mod.name}](${link}) | ${mod.summary} |`);
    }
    lines.push("");
  }

  if (colorSchemes.length > 0) {
    lines.push("## 🎨 Color Schemes");
    lines.push("");
    lines.push("| Scheme | Description | Dark BG | Light BG |");
    lines.push("|--------|-------------|---------|----------|");
    for (const cs of colorSchemes) {
      lines.push(
        `| [${cs.displayName}](colors/${cs.name}) | ${cs.description} | \`${cs.bgDark || "—"}\` | \`${cs.bgLight || "—"}\` |`
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
  modules: LuaModule[],
  colorSchemes: ColorScheme[]
): SidebarItem[] {
  const sidebar: SidebarItem[] = [
    { type: "doc", label: "Overview", id: "index" },
  ];

  // Group by category
  const categories = new Map<string, LuaModule[]>();
  for (const mod of modules) {
    if (mod.category === "colors") continue; // handled separately
    const cat = mod.category || "other";
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(mod);
  }

  const categoryConfig: Record<string, { label: string; emoji: string }> = {
    config: { label: "Core Configuration", emoji: "⚙️" },
    plugins: { label: "Plugins", emoji: "🔌" },
    other: { label: "Other Modules", emoji: "📦" },
  };

  for (const [cat, mods] of categories) {
    const conf = categoryConfig[cat] || {
      label: cat,
      emoji: "📄",
    };
    sidebar.push({
      type: "category",
      label: `${conf.emoji} ${conf.label}`,
      items: mods.map((m) => ({
        type: "doc" as const,
        label: m.name,
        id: `${cat}/${m.name}`,
      })),
    });
  }

  // Color schemes category
  if (colorSchemes.length > 0) {
    sidebar.push({
      type: "category",
      label: "🎨 Color Schemes",
      items: colorSchemes.map((cs) => ({
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
      if (["doc", "node_modules", ".git", "domscheme-main"].includes(entry.name))
        continue;
      files.push(...findLuaFiles(fullPath, relPath));
    } else if (entry.name.endsWith(".lua") && entry.name !== "dkjson.lua" && entry.name !== "dump.lua") {
      files.push(fullPath);
    }
  }

  return files;
}

function categorizeFile(filePath: string, qdtbPath: string): string {
  const rel = path.relative(qdtbPath, filePath);
  if (rel.startsWith("colors/") || rel.startsWith("colors\\"))
    return "colors";
  if (
    rel.startsWith("lua/config/") ||
    rel.startsWith("lua\\config\\")
  )
    return "config";
  if (
    rel.startsWith("lua/plugins/") ||
    rel.startsWith("lua\\plugins\\")
  )
    return "plugins";
  return "other";
}

function getModuleName(filePath: string, qdtbPath: string): string {
  const rel = path.relative(qdtbPath, filePath);
  return rel
    .replace(/\.lua$/, "")
    .replace(/[\\/]/g, ".")
    .replace(/\.init$/, "");
}

// ── Plugin ───────────────────────────────────────────────────────────────────

export default function nvimDocusaurusPlugin(
  context: LoadContext,
  options: PluginOptions
): Plugin<void> {
  const qdtbPath =
    options.qdtbPath ?? path.resolve(context.siteDir, "../qdtb");
  const outputBase = path.resolve(context.siteDir, "docs");

  return {
    name: "nvim-docusaurus",

    async loadContent() {
      console.log(`\n🔌 nvim-docusaurus: Scanning ${qdtbPath}...`);

      // Clean previous generated docs
      // Clean previous generated docs (specific folders only to be safe)
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
      const luaFiles = findLuaFiles(qdtbPath);
      console.log(`   Found ${luaFiles.length} Lua files`);

      const modules: LuaModule[] = [];
      const colorSchemes: ColorScheme[] = [];

      for (const filePath of luaFiles) {
        const source = fs.readFileSync(filePath, "utf-8");
        const category = categorizeFile(filePath, qdtbPath);
        const fileName = path.basename(filePath);
        const name = path.basename(filePath, ".lua");
        const relativePath = path.relative(qdtbPath, filePath);

        const moduleInfo = extractModuleInfo(source);
        const functions = extractFunctions(source);
        const variables = extractVariables(source);

        const mod: LuaModule = {
          name,
          moduleName: moduleInfo.moduleName || getModuleName(filePath, qdtbPath),
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

        // For color files, also extract color data
        if (category === "colors") {
          const scheme = extractColors(source, fileName);
          colorSchemes.push(scheme);
        }
      }

      // Generate markdown files
      for (const mod of modules) {
        if (mod.category === "colors") {
          // Color schemes get special treatment
          const scheme = colorSchemes.find((s) => s.name === mod.name);
          if (scheme) {
            const outDir = path.join(outputBase, "colors");
            fs.mkdirSync(outDir, { recursive: true });
            const outFile = path.join(outDir, `${mod.name}.mdx`);
            fs.writeFileSync(outFile, generateColorSchemeMarkdown(scheme));
            console.log(`   📝 Generated: colors/${mod.name}.mdx`);
          }
        } else {
          const outDir = path.join(outputBase, mod.category);
          fs.mkdirSync(outDir, { recursive: true });
          const outFile = path.join(outDir, `${mod.name}.md`);
          fs.writeFileSync(outFile, generateModuleMarkdown(mod));
          console.log(`   📝 Generated: ${mod.category}/${mod.name}.md`);
        }
      }

      // Generate index
      const indexFile = path.join(outputBase, "index.md");
      fs.writeFileSync(indexFile, generateIndexMarkdown(modules, colorSchemes));
      console.log(`   📝 Generated: index.md`);

      // Generate sidebar data for the plugin
      const sidebarItems = generateSidebar(modules, colorSchemes);
      const sidebarFile = path.join(outputBase, "_sidebar.json");
      fs.writeFileSync(sidebarFile, JSON.stringify(sidebarItems, null, 2));
      console.log(`   📝 Generated: _sidebar.json`);

      console.log(
        `\n✅ nvim-docusaurus: Generated docs for ${modules.length} modules and ${colorSchemes.length} color schemes\n`
      );
    },

    async contentLoaded({ actions }) {
      // The docs are generated as markdown files so the standard
      // plugin-content-docs handles them. We just need to add the
      // sidebar configuration.
      const sidebarPath = path.join(outputBase, "_sidebar.json");
      if (fs.existsSync(sidebarPath)) {
        const sidebarData = JSON.parse(
          fs.readFileSync(sidebarPath, "utf-8")
        );
        // Store in global data so themes can access it
        actions.setGlobalData({
          apiSidebar: sidebarData,
        });
      }
    },

    getPathsToWatch() {
      // Watch all Lua files in qdtb for hot reload
      return [path.join(qdtbPath, "**/*.lua")];
    },
  };
}
