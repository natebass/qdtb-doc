import React, { useState } from "react";

interface ColorPreviewProps {
  bgDark: string;
  bgLight: string;
  fgDark: string;
  fgLight: string;
  name: string;
}

const sampleCode = `local M = {}

--- Compute greeting message.
-- @param name string The user's name
-- @return string The greeting
function M.greet(name)
  local prefix = "Hello"
  return prefix .. ", " .. name .. "!"
end

-- Configuration table
M.config = {
  enabled = true,
  timeout = 300,
}

return M`;

const sampleLineNumbers = sampleCode.split("\n").map((_, i) => i + 1);

export default function ColorPreview({
  bgDark,
  bgLight,
  fgDark,
  fgLight,
  name,
}: ColorPreviewProps) {
  const [isDark, setIsDark] = useState(true);

  const bg = isDark ? bgDark : bgLight;
  const fg = isDark ? fgDark : fgLight;

  // Generate derived colors for syntax highlighting
  const adjustBrightness = (hex: string, amount: number): string => {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  };

  const commentColor = adjustBrightness(fg, isDark ? -60 : 60);
  const keywordColor = fg;
  const stringColor = isDark ? "#87cc87" : "#2d8a2d";
  const functionColor = isDark ? "#7ec8e3" : "#2e6b8a";
  const lineNumColor = adjustBrightness(bg, isDark ? 40 : -30);
  const cursorLineBg = adjustBrightness(bg, isDark ? 15 : -10);

  const renderLine = (line: string, lineNum: number) => {
    // Simple syntax highlighting
    let highlighted = line;

    // Comments
    if (line.trim().startsWith("--")) {
      return (
        <span style={{ color: commentColor, fontStyle: "italic" }}>
          {line}
        </span>
      );
    }

    // Keywords
    const keywords =
      /\b(local|function|return|end|if|then|else|true|false|nil|require)\b/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Split by strings first
    const stringRegex = /"([^"]*)"|'([^']*)'/g;
    let match: RegExpExecArray | null;
    const segments: { start: number; end: number; type: string }[] = [];

    while ((match = stringRegex.exec(line)) !== null) {
      segments.push({
        start: match.index,
        end: match.index + match[0].length,
        type: "string",
      });
    }

    let currentIdx = 0;
    for (let i = 0; i < line.length; i++) {
      const segment = segments.find((s) => i >= s.start && i < s.end);
      if (segment && i === segment.start) {
        // Push preceding text
        if (i > currentIdx) {
          parts.push(highlightKeywords(line.slice(currentIdx, i), keywordColor, functionColor));
        }
        parts.push(
          <span key={`str-${i}`} style={{ color: stringColor }}>
            {line.slice(segment.start, segment.end)}
          </span>
        );
        i = segment.end - 1;
        currentIdx = segment.end;
      }
    }
    if (currentIdx < line.length) {
      parts.push(highlightKeywords(line.slice(currentIdx), keywordColor, functionColor));
    }

    return <>{parts}</>;
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Toggle */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <button
          onClick={() => setIsDark(true)}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            border: `2px solid ${isDark ? "#6366f1" : "var(--ifm-color-emphasis-300)"}`,
            background: isDark ? "#6366f133" : "transparent",
            color: "var(--ifm-font-color-base)",
            cursor: "pointer",
            fontWeight: isDark ? 700 : 400,
            fontSize: "13px",
            fontFamily: "'Inter', system-ui, sans-serif",
            transition: "all 0.2s ease",
          }}
        >
          🌙 Dark
        </button>
        <button
          onClick={() => setIsDark(false)}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            border: `2px solid ${!isDark ? "#f59e0b" : "var(--ifm-color-emphasis-300)"}`,
            background: !isDark ? "#f59e0b22" : "transparent",
            color: "var(--ifm-font-color-base)",
            cursor: "pointer",
            fontWeight: !isDark ? 700 : 400,
            fontSize: "13px",
            fontFamily: "'Inter', system-ui, sans-serif",
            transition: "all 0.2s ease",
          }}
        >
          ☀️ Light
        </button>
      </div>

      {/* Editor Preview */}
      <div
        style={{
          background: bg,
          color: fg,
          borderRadius: "12px",
          overflow: "hidden",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          fontSize: "13px",
          lineHeight: 1.65,
          boxShadow: `0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)`,
          border: `1px solid ${adjustBrightness(bg, isDark ? 25 : -20)}`,
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 16px",
            background: adjustBrightness(bg, isDark ? -8 : 8),
            borderBottom: `1px solid ${adjustBrightness(bg, isDark ? 20 : -15)}`,
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", gap: "6px" }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#ff5f57",
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#febc2e",
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#28c840",
              }}
            />
          </div>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "11px",
              opacity: 0.5,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {name} — preview.lua
          </span>
        </div>

        {/* Code area */}
        <div style={{ padding: "16px 0", overflowX: "auto" }}>
          {sampleCode.split("\n").map((line, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                padding: "0 16px 0 0",
                background: idx === 5 ? cursorLineBg : "transparent",
                minHeight: "22px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "48px",
                  textAlign: "right",
                  color: lineNumColor,
                  paddingRight: "16px",
                  userSelect: "none",
                  flexShrink: 0,
                  fontSize: "12px",
                }}
              >
                {idx + 1}
              </span>
              <span style={{ whiteSpace: "pre" }}>
                {renderLine(line, idx)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function highlightKeywords(
  text: string,
  keywordColor: string,
  functionColor: string
): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const keywordRegex =
    /\b(local|function|return|end|if|then|else|true|false|nil|require)\b/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = keywordRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    parts.push(
      <span
        key={`kw-${match.index}`}
        style={{ color: keywordColor, fontWeight: 700 }}
      >
        {match[0]}
      </span>
    );
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }
  return <>{parts}</>;
}
