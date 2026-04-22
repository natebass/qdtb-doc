import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "QDtb documentation",
  tagline: "Personal developer environment documentation",
  favicon: "img/favicon.ico",

  future: {
    v4: true,
  },

  url: process.env.URL || "https://natebass.github.io",
  baseUrl: process.env.BASE_URL || "/QDtb-doc/",
  trailingSlash: false,

  organizationName: "natebass",
  projectName: "QDtb-doc",

  onBrokenLinks: "warn",

  markdown: {
    format: "detect",
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: undefined,
        },
        blog: {
          showReadingTime: true,
          editUrl: undefined,
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    "nvim-docusaurus",
    function addLuaPrismLanguage() {
      return {
        name: "docusaurus-plugin-lua-prism",
        configureWebpack() {
          return {};
        },
      };
    },
  ],

  themeConfig: {
    image: "img/logo.svg",
    colorMode: {
      defaultMode: "dark",
      respectPrefersColorScheme: true,
    },
    navbar: {
      logo: {
        alt: "QDtb Logo",
        src: "img/logo.jpeg",
      },
      items: [
        {
          to: "/faq",
          position: "left",
          html: 'About <span class="badge badge--new">New</span>',
          activeBaseRegex: "^$", // Never active
        },
        {
          to: "/blog",
          label: "Blog",
          position: "left",
          activeBaseRegex: "^/blog$",
        },
        {
          type: "docSidebar",
          sidebarId: "configSidebar",
          position: "left",
          label: "Config",
        },
        {
          type: "docSidebar",
          sidebarId: "powershellSidebar",
          position: "left",
          label: "PowerShell",
        },
        {
          type: "docSidebar",
          sidebarId: "fishSidebar",
          position: "left",
          label: "Fish",
        },

        {
          type: "docSidebar",
          sidebarId: "docusaurusSidebar",
          position: "left",
          label: "Docusaurus",
        },
        { to: "/faq", position: "right", label: "FAQ" },
        {
          href: "https://github.com/natebass/QDtb",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Lua API",
              to: "/docs",
            },
            {
              label: "Color Schemes",
              to: "/docs/colors/minigrey",
            },
          ],
        },
        {
          title: "Configuration",
          items: [
            {
              label: "Keymaps",
              to: "/docs/config/index#configkeymaps",
            },
            {
              label: "Options",
              to: "/docs/config/index#configoptions",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/natebass/QDtb",
            },
            {
              label: "FAQ",
              to: "/faq",
            },
          ],
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["lua", "bash", "json"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
