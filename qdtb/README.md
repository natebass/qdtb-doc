<div align="center">
  <img src="https://user-images.githubusercontent.com/292349/213446185-2db63fd5-8c84-459c-9f04-e286382d6e80.png">
</div>

<hr>

<h4 align="center">
  <a href="https://lazyvim.github.io/installation">Install</a>
  ·
  <a href="https://lazyvim.github.io/configuration">Configure</a>
  ·
  <a href="https://lazyvim.github.io">Docs</a>
</h4>

<div align="center"><p>
    <a href="https://github.com/LazyVim/LazyVim/releases/latest">
      <img alt="Latest release" src="https://img.shields.io/github/v/release/LazyVim/LazyVim?style=for-the-badge&logo=starship&color=C9CBFF&logoColor=D9E0EE&labelColor=302D41&include_prerelease&sort=semver" />
    </a>
    <a href="https://github.com/LazyVim/LazyVim/pulse">
      <img alt="Last commit" src="https://img.shields.io/github/last-commit/LazyVim/LazyVim?style=for-the-badge&logo=starship&color=8bd5ca&logoColor=D9E0EE&labelColor=302D41"/>
    </a>
    <a href="https://github.com/LazyVim/LazyVim/blob/main/LICENSE">
      <img alt="License" src="https://img.shields.io/github/license/LazyVim/LazyVim?style=for-the-badge&logo=starship&color=ee999f&logoColor=D9E0EE&labelColor=302D41" />
    </a>
    <a href="https://github.com/LazyVim/LazyVim/stargazers">
      <img alt="Stars" src="https://img.shields.io/github/stars/LazyVim/LazyVim?style=for-the-badge&logo=starship&color=c69ff5&logoColor=D9E0EE&labelColor=302D41" />
    </a>
    <a href="https://github.com/LazyVim/LazyVim/issues">
      <img alt="Issues" src="https://img.shields.io/github/issues/LazyVim/LazyVim?style=for-the-badge&logo=bilibili&color=F5E0DC&logoColor=D9E0EE&labelColor=302D41" />
    </a>
    <a href="https://github.com/LazyVim/LazyVim">
      <img alt="Repo Size" src="https://img.shields.io/github/repo-size/LazyVim/LazyVim?color=%23DDB6F2&label=SIZE&logo=codesandbox&style=for-the-badge&logoColor=D9E0EE&labelColor=302D41" />
    </a>
    <a href="https://natebass.github.io/qdtb-doc/blog">
      <img src="https://img.shields.io/badge/blog-latest_posts-orange?style=flat-square&logo=rss&logoColor=white" alt="Blog" />
    </a>
    <a href="https://natebass.github.io/qdtb-doc">
      <img src="https://img.shields.io/badge/docs-qdtb-blue?style=flat-square&logo=docusaurus&logoColor=white" alt="Docs" />
    </a>
</div>

# QDtb Neovim configuration documentation

Welcome to my personal Neovim configuration. It is partly based on [💤 lazy.nvim](https://github.com/folke/lazy.nvim). It uses mini.nvim plugins extensively.

![image](https://user-images.githubusercontent.com/292349/211285846-0b7bb3bf-0462-4029-b64c-4ee1d037fc1c.png)

![image](https://user-images.githubusercontent.com/292349/213447056-92290767-ea16-430c-8727-ce994c93e9cc.png)

## ⚡️ Requirements

- Neovim >= **0.12**
- a [Nerd Font](https://www.nerdfonts.com/) **_(optional)_**

## 🚀 Getting Started

1. Find your nvim configuration directory.
2. Delete all files in that directory.
3. Clone this repository into that directory.

> [NOTE]
> This project is meant to completely override the nvim configuration. Please backup your existing configuration. You can also just take what you want from this repository but copy-pasting individual settings or plugins.

## 📂 File Structure

This project uses the [Neovim Plugin Architecture](https://neovim.io/doc/user/lua.html#plugin-architecture) **(Not LazyVim package management)**. Installed plugins are located in `~/.local/share/nvim/site/pack/lazy/start/`.

<pre>
~/.config/nvim
├── lua
│   ├── config
│   │   ├── autocmds.lua
│   │   ├── keymaps.lua
│   │   ├── lazy.lua
│   │   └── options.lua
│   └── plugins
│       ├── spec1.lua
│       ├── **
│       └── spec2.lua
└── init.lua
</pre>

## ⚙️ Configuration

Refer to the [docs](https://lazyvim.github.io)
