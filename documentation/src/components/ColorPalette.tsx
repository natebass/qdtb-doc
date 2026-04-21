import React, { useState } from "react";

interface ColorInfo {
  name: string;
  hex: string;
  usage: string;
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1a1a2e" : "#f0f0f0";
}

function ColorSwatch({ color }: { color: ColorInfo }) {
  const [copied, setCopied] = useState(false);
  const textColor = getContrastColor(color.hex);

  const handleCopy = () => {
    navigator.clipboard.writeText(color.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="color-swatch"
      style={{
        background: color.hex,
        color: textColor,
        border: "none",
        borderRadius: "12px",
        padding: "0",
        cursor: "pointer",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        minHeight: "140px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        boxShadow: `0 4px 20px ${color.hex}33`,
      }}
      title={`Click to copy ${color.hex}`}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, transparent 30%, ${textColor === "#1a1a2e" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.1)"} 100%)`,
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: "relative",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
            letterSpacing: "0.02em",
            textTransform: "capitalize",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {color.name.replace(/_/g, " ")}
        </span>
        <code
          style={{
            fontSize: "12px",
            fontWeight: 500,
            opacity: 0.85,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            letterSpacing: "0.05em",
            background: "none",
            padding: 0,
            color: "inherit",
          }}
        >
          {copied ? "✓ Copied!" : color.hex}
        </code>
      </div>
    </button>
  );
}

export default function ColorPalette({ colors }: { colors: ColorInfo[] }) {
  if (!colors || colors.length === 0) return null;

  return (
    <div
      className="color-palette-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "16px",
        marginTop: "16px",
        marginBottom: "24px",
      }}
    >
      {colors.map((color, idx) => (
        <ColorSwatch key={`${color.hex}-${idx}`} color={color} />
      ))}
    </div>
  );
}
