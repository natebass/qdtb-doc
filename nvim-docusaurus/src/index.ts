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
  generateConsolidatedConfigMarkdown,
  generateCategoryIndexMarkdown,
  generateConsolidatedModuleMarkdown,
  generateColorSchemeMarkdown,
  generateIndexMarkdown,
} from "./markdown.js";
import { generateSidebar } from "./sidebar.js";
import type { ColorScheme } from "./types.js";

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
      ["index.md", "_sidebar.json"].forEach((file) => {
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
      return [path.join(QdtbPath, "**/*.lua")];
    },
  };
}
