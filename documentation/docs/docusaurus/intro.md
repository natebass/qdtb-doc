---
sidebar_position: 1
description: Introduction to the QDtb documentation and development environment.
---

# Getting Started

Welcome to the documentation for the **QDtb** developer environment — a Neovim-centric configuration designed for speed and aesthetic precision.

[Explore Setup](#-quick-commands) | [GitHub](https://github.com/natebass/qdtb)

## 🛠️ Infrastructure

This documentation site is built with **Docusaurus 3** and a custom theme. It is automatically deployed via GitHub Actions whenever the master branch is updated.

:::info Pro Tip
This documentation is automatically deployed via GitHub Actions whenever the master branch is updated.
:::

## ⚡ Quick Commands

| Command           | Description                              |
| :---------------- | :--------------------------------------- |
| `pnpm run start`  | Spin up a local hot-reloading server.    |
| `pnpm run build`  | Generate optimized static assets.        |
| `pnpm run deploy` | Push the latest changes to GitHub Pages. |

## 📂 Project Anatomy

| File                   | Purpose                                              |
| :--------------------- | :--------------------------------------------------- |
| `docusaurus.config.ts` | Main configuration, plugins, and theme options.      |
| `sidebars.ts`          | Defines the navigation structure and document order. |
| `src/css/custom.css`   | Custom styling and design tokens.                    |
| `src/components/`      | Reusable React components and MDX widgets.           |
