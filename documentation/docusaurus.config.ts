import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'QDtb',
  tagline: 'Neovim Configuration Documentation',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://natebass.github.io',
  baseUrl: '/qdtb-doc/',
  trailingSlash: false,

  organizationName: 'natebass',
  projectName: 'qdtb-doc',

  onBrokenLinks: 'warn',

  markdown: {
    format: 'detect',
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: undefined,
        },
        blog: {
          showReadingTime: true,
          editUrl: undefined,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    'nvim-docusaurus',
    function addLuaPrismLanguage() {
      return {
        name: 'docusaurus-plugin-lua-prism',
        configureWebpack() {
          return {};
        },
      };
    },
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'QDtb',
      logo: {
        alt: 'QDtb Logo',
        src: 'img/logo.svg',
      },
      items: [
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          type: 'docSidebar',
          sidebarId: 'configSidebar',
          position: 'left',
          label: 'Config',
        },
        {
          href: 'https://github.com/natebass/qdtb',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Lua API',
              to: '/docs',
            },
            {
              label: 'Color Schemes',
              to: '/docs/colors/minigrey',
            },
          ],
        },
        {
          title: 'Configuration',
          items: [
            {
              label: 'Keymaps',
              to: '/docs/config/keymaps',
            },
            {
              label: 'Options',
              to: '/docs/config/options',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/natebass/qdtb',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} QDtb. Built with Docusaurus + nvim-docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['lua', 'bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
