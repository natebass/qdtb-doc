import fs from "fs";
import path from "path";

export const PLUGINS_TO_CONSOLIDATE = [
  "code_style",
  "session_manager",
  "fold_this",
];

export function findLuaFiles(dir: string, basePath: string = ""): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        ["doc", "node_modules", ".git", "domscheme-main"].includes(entry.name)
      )
        continue;
      files.push(
        ...findLuaFiles(
          fullPath,
          basePath ? `${basePath}/${entry.name}` : entry.name,
        ),
      );
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

export function categorizeFile(filePath: string, QdtbPath: string): string {
  const rel = path.relative(QdtbPath, filePath);
  if (rel === "init.lua") return "config";
  if (rel.startsWith("colors/") || rel.startsWith("colors\\")) return "colors";
  if (rel.startsWith("lua/config/") || rel.startsWith("lua\\config\\"))
    return "config";
  if (rel.startsWith("lua/plugins/") || rel.startsWith("lua\\plugins\\"))
    return "plugins";
  return "other";
}

export function getModuleName(filePath: string, QdtbPath: string): string {
  const rel = path.relative(QdtbPath, filePath);
  return rel
    .replace(/\.lua$/, "")
    .replace(/[\\/]/g, ".")
    .replace(/\.init$/, "");
}

export function getGroupInfo(filePath: string, QdtbPath: string) {
  const rel = path.relative(QdtbPath, filePath);
  const parts = rel.split(path.sep);
  const category = categorizeFile(filePath, QdtbPath);
  if ((category === "plugins" || category === "config") && parts.length >= 4) {
    return { category, group: parts[2] };
  }
  if (category === "config") {
    return { category, group: "index" };
  }
  return { category, group: path.basename(filePath, ".lua") };
}
