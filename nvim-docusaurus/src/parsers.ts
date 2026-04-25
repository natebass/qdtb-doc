import type { LuaFunction, ColorInfo, ColorScheme } from "./types.js";

// ── Module Info Extraction ───────────────────────────────────────────────────

export function extractModuleInfo(source: string): {
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

// ── Function Extraction ──────────────────────────────────────────────────────

export function extractFunctions(source: string): LuaFunction[] {
  const functions: LuaFunction[] = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    // Detect function declarations
    const fnMatch = lines[i].match(
      /(?:local\s+)?(?:function\s+(\w[\w.:]*)|(\w[\w.]+)\s*=\s*function)\s*\(/,
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

// ── Variable Extraction ──────────────────────────────────────────────────────

export function extractVariables(
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

export function extractColors(source: string, fileName: string): ColorScheme {
  const colors: ColorInfo[] = [];

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
      const hiMatch = line.match(/(?:hi|nvim_set_hl).*?['"](\w[\w@.]+)['"]/);
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
