import type { LoadContext, Plugin } from "@docusaurus/types";

// ── Lua Module Types ─────────────────────────────────────────────────────────

export interface LuaFunction {
  name: string;
  summary: string;
  description: string;
  params: { name: string; type: string; description: string }[];
  returns: { type: string; description: string }[];
  lineNumber: number;
}

export interface LuaModule {
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

// ── Color Types ──────────────────────────────────────────────────────────────

export interface ColorInfo {
  name: string;
  hex: string;
  usage: string;
}

export interface ColorScheme {
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

// ── Plugin Types ─────────────────────────────────────────────────────────────

export interface PluginOptions {
  QdtbPath?: string;
  outputDir?: string;
}

export interface GroupInfo {
  category: string;
  groupName: string;
  modules: LuaModule[];
}

export type GroupMap = Map<string, GroupInfo>;

// ── Sidebar Types ────────────────────────────────────────────────────────────

export interface SidebarItem {
  type: string;
  label: string;
  items?: SidebarItem[];
  id?: string;
}
