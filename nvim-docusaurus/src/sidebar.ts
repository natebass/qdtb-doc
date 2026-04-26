import type { ColorScheme, GroupMap, SidebarItem } from "./types.js";
import { PLUGINS_TO_CONSOLIDATE } from "./files.js";

export function generateSidebar(
  groups: GroupMap,
  colorSchemes: ColorScheme[],
): SidebarItem[] {
  const sidebar: SidebarItem[] = [{ type: "doc", id: "index" }];

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
    const conf = categoryConfig[cat] || { label: cat, emoji: "📄" };

    if (cat === "config") {
      sidebar.push({ type: "doc", id: "config/init" });
      sidebar.push({ type: "doc", id: "config/options" });
      sidebar.push({ type: "doc", id: "config/keymaps" });
      continue;
    }

    sidebar.push({
      type: "category",
      label: `${conf.emoji} ${conf.label}`,
      items: groupKeys
        .sort((a, b) => {
          const order = ["code_style", "fold_this", "session_manager", "qdtb"];
          const idxA = order.indexOf(a);
          const idxB = order.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.localeCompare(b);
        })
        .map((groupKey) => {
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
              id: `${cat}/${groupName}`,
            };
          } else {
            return {
              type: "category",
              label: displayName,
              items: [
                {
                  type: "doc" as const,
                  id: `${cat}/${groupName}`,
                },
                ...info.modules
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((m) => ({
                    type: "doc" as const,
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
          id: `colors/${cs.name}`,
        })),
    });
  }

  sidebar.push({ type: "doc", id: "modules" });

  return sidebar;
}
