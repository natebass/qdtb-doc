import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import styles from "./index.module.css";

const features = [
  {
    emoji: "⚙️",
    title: "Core Configuration",
    description:
      "Options, keymaps, autocommands — the foundational settings that shape the editing experience.",
    link: "/docs/config/options",
  },
  {
    emoji: "🎨",
    title: "Color Schemes",
    description:
      "Seasonal mini.hues themes — minigrey, miniautumn, minispring, minisummer, miniwinter — with interactive previews.",
    link: "/docs/colors/minigrey",
  },
  {
    emoji: "🔌",
    title: "Plugins",
    description:
      "Custom utilities: colorscheme cycler, session management, formatting, and more.",
    link: "/docs",
  },
  {
    emoji: "📖",
    title: "Auto-Generated",
    description:
      "Documentation is automatically extracted from LDoc annotations in the Lua source files.",
    link: "/docs",
  },
];

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroInner}>
          <Heading as="h1" className="hero__title">
            {siteConfig.title}
          </Heading>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className="button button--secondary button--lg"
              to="/docs"
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
              Browse API Documentation →
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
  link,
}: {
  emoji: string;
  title: string;
  description: string;
  link: string;
}) {
  return (
    <Link
      to={link}
      style={{
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        className={styles.featureCard}
        style={{
          padding: "28px",
          borderRadius: "14px",
          border: "1px solid var(--ifm-color-emphasis-200)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          height: "100%",
          cursor: "pointer",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>{emoji}</div>
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
        <p
          style={{
            fontSize: "0.92rem",
            opacity: 0.75,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>
    </Link>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="Home"
      description="Complete documentation for the QDtb Neovim configuration"
    >
      <HomepageHeader />
      <main>
        <section
          style={{
            padding: "64px 0",
          }}
        >
          <div className="container">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "20px",
                maxWidth: "1000px",
                margin: "0 auto",
              }}
            >
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
