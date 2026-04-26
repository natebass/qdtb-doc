import type { LoadContext, Plugin } from "@docusaurus/types";

export interface LuaFunction {
  name: string;
  summary: string;
  description: string;
  params: { name: string; type: string; description: string }[];
  returns: { type: string; description: string }[];
  lineNumber: number;
}

/**
 * Categories are like config, plugins, or colors.
 */
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
  category: string;
}

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

export interface SidebarItem {
  type: string;
  label?: string;
  items?: SidebarItem[];
  id?: string;
}
