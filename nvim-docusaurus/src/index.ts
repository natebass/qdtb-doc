import type { LoadContext, Plugin } from "@docusaurus/types";
import fs from "fs";
import path from "path";

import type { LuaModule, PluginOptions, GroupMap } from "./types.js";
import {
  extractModuleInfo,
  extractFunctions,
  extractVariables,
  extractColors,
} from "./parsers.js";
import {
  PLUGINS_TO_CONSOLIDATE,
  findLuaFiles,
  getGroupInfo,
  getModuleName,
} from "./files.js";
import {
  generateModuleMarkdown,
  generateInitConfigMarkdown,
  generateOptionsConfigMarkdown,
  generateKeymapsConfigMarkdown,
  generateCategoryIndexMarkdown,
  generateConsolidatedModuleMarkdown,
  generateColorSchemeMarkdown,
  generateIndexMarkdown,
} from "./markdown.js";
import { generateSidebar } from "./sidebar.js";
import type { ColorScheme } from "./types.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Check whether a doc file is manually managed (not auto-generated).
 * A file is manual if it exists and does NOT contain `generated: true`
 * in its YAML frontmatter.
 */
function isManualDoc(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf-8");
  const fmMatch = content.match(/^---([\s\S]*?)---/);
  if (!fmMatch) return true; // No frontmatter at all → treat as manual
  return !fmMatch[1].includes("generated: true");
}

/**
 * Write a generated doc file, but only if the path isn't occupied by a
 * manually-managed document.
 */
function writeGeneratedFile(filePath: string, content: string): boolean {
  if (isManualDoc(filePath)) {
    console.log(`   ⏭️  Skipped (manual): ${path.basename(filePath)}`);
    return false;
  }
  fs.writeFileSync(filePath, content);
  return true;
}

// ── Plugin ───────────────────────────────────────────────────────────────────

export default function nvimDocusaurusPlugin(
  context: LoadContext,
  options: PluginOptions,
): Plugin<void> {
  const QdtbPath = options.QdtbPath ?? path.resolve(context.siteDir, "../QDtb");
  const outputBase = path.resolve(context.siteDir, "docs");

  return {
    name: "nvim-docusaurus",

    async loadContent() {
      console.log(`\n🔌 nvim-docusaurus: Scanning ${QdtbPath}...`);

      // Clean previous generated docs
      ["colors", "config", "plugins", "other"].forEach((dir) => {
        const p = path.join(outputBase, dir);
        if (fs.existsSync(p)) {
          fs.rmSync(p, { recursive: true, force: true });
        }
      });
      ["_sidebar.json"].forEach((file) => {
        const p = path.join(outputBase, file);
        if (fs.existsSync(p)) {
          fs.unlinkSync(p);
        }
      });

      // Ensure output directory exists
      fs.mkdirSync(outputBase, { recursive: true });

      // Find all Lua files
      const luaFiles = findLuaFiles(QdtbPath);
      console.log(`   Found ${luaFiles.length} Lua files`);

      const modules: LuaModule[] = [];
      const colorSchemes: ColorScheme[] = [];
      const groups: GroupMap = new Map();

      for (const filePath of luaFiles) {
        const source = fs.readFileSync(filePath, "utf-8");
        const { category, group: groupName } = getGroupInfo(filePath, QdtbPath);
        const fileName = path.basename(filePath);
        const name = path.basename(filePath, ".lua");
        const relativePath = path.relative(QdtbPath, filePath);

        const moduleInfo = extractModuleInfo(source);
        const functions = extractFunctions(source);
        const variables = extractVariables(source);

        const mod: LuaModule = {
          name,
          moduleName:
            moduleInfo.moduleName || getModuleName(filePath, QdtbPath),
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
              if (writeGeneratedFile(outFile, generateColorSchemeMarkdown(scheme))) {
                console.log(`   📝 Generated: colors/${mod.name}.mdx`);
              }
            }
          }
        } else if (info.category === "config" && info.groupName === "index") {
          // Break down core configuration
          const outDir = path.join(outputBase, "config");
          fs.mkdirSync(outDir, { recursive: true });

          const configFiles = [
            { name: "init.md", gen: generateInitConfigMarkdown },
            { name: "options.md", gen: generateOptionsConfigMarkdown },
            { name: "keymaps.md", gen: generateKeymapsConfigMarkdown },
          ];
          const written: string[] = [];
          for (const { name, gen } of configFiles) {
            if (writeGeneratedFile(path.join(outDir, name), gen(info.modules))) {
              written.push(name);
            }
          }
          if (written.length > 0) {
            console.log(`   📝 Generated: config/{${written.join(",")}}`);  
          }
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
            if (writeGeneratedFile(
              outFile,
              generateConsolidatedModuleMarkdown(info.groupName, info.modules),
            )) {
              console.log(
                `   📝 Generated: ${info.category}/${info.groupName}.md (consolidated)`,
              );
            }
          } else if (!isFolder) {
            const mod = info.modules[0];
            const outFile = path.join(outDir, `${mod.name}.md`);
            if (writeGeneratedFile(outFile, generateModuleMarkdown(mod))) {
              console.log(`   📝 Generated: ${info.category}/${mod.name}.md`);
            }
          } else {
            const groupDir = path.join(outDir, info.groupName);
            fs.mkdirSync(groupDir, { recursive: true });

            // Generate individual pages
            for (const mod of info.modules) {
              const outFile = path.join(groupDir, `${mod.name}.md`);
              if (writeGeneratedFile(outFile, generateModuleMarkdown(mod))) {
                console.log(
                  `   📝 Generated: ${info.category}/${info.groupName}/${mod.name}.md`,
                );
              }
            }

            // Generate index.md for the group
            const indexFile = path.join(groupDir, "index.md");
            if (writeGeneratedFile(
              indexFile,
              generateCategoryIndexMarkdown(
                info.groupName,
                info.modules,
                info.category,
              ),
            )) {
              console.log(
                `   📝 Generated: ${info.category}/${info.groupName}/index.md`,
              );
            }
          }
        }
      }

      // Generate module index
      const modulesIndexFile = path.join(outputBase, "modules.md");
      if (writeGeneratedFile(
        modulesIndexFile,
        generateIndexMarkdown(groups, colorSchemes),
      )) {
        console.log(`   📝 Generated: modules.md`);
      }

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
      return [path.join(QdtbPath, "**/*.lua")];
    },
  };
}
