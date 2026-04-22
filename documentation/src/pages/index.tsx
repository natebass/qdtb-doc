import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import styles from "./index.module.css";

const plugins = [
  {
    emoji: "🎨",
    title: "Colorscheme cycler",
    description:
      "Cycle through your exisiting installed color schemes with a keyboard shortcut.",
    link: "/docs/plugins/qdtb/colorscheme_cycler",
  },
  {
    title: "Other plugins",
    description: (
      <>
        Some are still WIP.
        <ul>
          <li>
            <Link to="/docs/plugins/code_style">
              Language support and code style
            </Link>
          </li>
          <li>
            <Link to="/docs/plugins/qdtb">other</Link>
          </li>
        </ul>
      </>
    ),
    selectable: false,
  },
  {
    emoji: "🙌",
    description: (
      <>
        <b>Shout out to open-source plugins</b> like{" "}
        <Link to="https://github.com/echasnovski/mini.nvim">mini.nvim</Link>.
        For a list of plugins included in QDtb, check out{" "}
        <Link to="/docs/plugins/all">this page</Link>.
      </>
    ),
    selectable: false,
  },
];

const featureCategories = [
  {
    grade: 1,
    categoryTitle: "1. Intended for the public.",
    features: [
      {
        title: "Core Configuration",
        description:
          "Curated Vim options, global keymaps, and autocommands that prioritize performance and ergonomics.",
      },
      {
        title: "Smart Window Management",
        description:
          "Intelligent window resizing and navigation logic for efficient multi-file workflows.",
      },
      {
        title: "Fuzzy Finding",
        description:
          "Deep Telescope integration with custom pickers for project files, grep, and buffer search.",
      },
      {
        title: "LSP & Autocompletion",
        description:
          "Automated language server management with Mason and lsp-zero for an IDE-like experience.",
      },
      {
        title: "Git Integration",
        description:
          "Real-time hunk tracking and Git interface via Gitsigns and Fugitive.",
      },
    ],
  },
  {
    grade: 2,
    categoryTitle: "2. Probably not useful.",
    features: [
      {
        title: "Colorscheme Cycler",
        description:
          "Lua module to rotate through installed themes with on-screen notifications.",
      },
      {
        title: "Seasonal Hues",
        description:
          "Dynamic palette shifting based on the current season or time of day.",
      },
      {
        title: "Theme Previews",
        description:
          "Interactive UI for previewing mini.hues variations before applying them.",
      },
      {
        title: "Cursor Animations",
        description:
          "Subtle feedback animations for mode changes and large cursor jumps.",
      },
      {
        title: "Smooth Scrolling",
        description:
          "Fluid window animations and scrolling provided by mini.animate.",
      },
    ],
  },
  {
    grade: 3,
    categoryTitle:
      "3. definately not useful, these are my own customizations that are specific to me.",
    features: [
      {
        title: "Auto-Docs",
        description:
          "Custom pipeline for extracting LDoc annotations into this documentation site.",
      },
      {
        title: "Hardcoded Shortcuts",
        description:
          "Environment-specific keybindings for internal project paths and tools.",
      },
      {
        title: "Workspace Switching",
        description:
          "Automatic UI reconfiguration based on active repository branch or path.",
      },
      {
        title: "Experimental Hacks",
        description:
          "Unstable Lua snippets for testing bleeding-edge Neovim features.",
      },
    ],
  },
];

function PluginCard({
  emoji,
  title,
  description,
  link,
  selectable = true,
}: {
  emoji?: string;
  title: string;
  description: ReactNode;
  link?: string;
  selectable?: boolean;
}) {
  const cardContent = (
    <div
      className={clsx(
        styles.PluginCard,
        !selectable && styles.PluginCardStatic,
      )}
      style={{
        padding: "28px",
        borderRadius: "14px",
        border: "1px solid var(--ifm-color-emphasis-200)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        height: "100%",
        cursor: selectable ? "pointer" : "default",
      }}
    >
      {emoji && (
        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>{emoji}</div>
      )}
      <h3
        style={{
          fontSize: "1.15rem",
          fontWeight: 700,
          marginBottom: "8px",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <div
        style={{
          fontSize: "0.92rem",
          opacity: 0.75,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {description}
      </div>
    </div>
  );

  if (selectable && link) {
    return (
      <Link
        to={link}
        style={{
          textDecoration: "none",
          color: "inherit",
        }}
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero", styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroInner}>
          <Heading as="h1" className="hero__title">
            Neovim + PowerShell + Fish
          </Heading>
          <p className="hero__subtitle">
            Vim configuration with extra shell goodies.
          </p>
          <div className={styles.buttons}>
            <Link
              className="button button--secondary button--lg"
              to="#usefulness-ratings"
              style={{
                borderRadius: "10px",
                fontWeight: 600,
                padding: "12px 32px",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#e0e7ff",
                transition: "all 0.3s ease",
              }}
            >
              Find something useful →
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Home"
      description="Complete documentation for the QDtb Neovim configuration"
    >
      <HomepageHeader />
      <main>
        <section style={{ padding: "64px 0" }}>
          <div className="container" style={{ maxWidth: "1288px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                margin: "0 auto 24px",
                padding: "0 8px",
              }}
            >
              <h2 style={{ margin: 0 }}>Neovim plugins</h2>
              <img
                height={32}
                width={32}
                src="img/neovim_outlined.png"
                alt="Neovim logo"
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px",
                margin: "0 auto",
              }}
            >
              {plugins.map((plugin) => (
                <PluginCard key={plugin.title} {...plugin} />
              ))}
            </div>
          </div>
        </section>

        <section
          id="usefulness-ratings"
          style={{
            padding: "64px 0",
            borderTop: "1px solid var(--ifm-color-emphasis-200)",
            scrollMarginTop: "36px",
          }}
        >
          <div className="container" style={{ maxWidth: "1288px" }}>
            <div style={{ margin: "0 auto" }}>
              {featureCategories.map((category) => (
                <div key={category.grade} className={styles.FeatureSection}>
                  <div className={styles.CategoryTitle}>
                    {category.categoryTitle}
                  </div>
                  <div className={styles.FeatureGrid}>
                    {category.features.map((feature, idx) => (
                      <div key={idx} className={styles.FeatureItem}>
                        <h4>{feature.title}</h4>
                        <p>{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
