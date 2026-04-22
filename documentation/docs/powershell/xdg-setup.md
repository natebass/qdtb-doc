# Where does Powershell load the configuration?

On Linux (including Linux Mint), PowerShell follows the **XDG Base Directory Specification**. These are dotfolders in your home directory.

## Quick Reference

Inside a PowerShell session, you can use these variables:

```powershell
$PROFILE # The path to your profile script.
```

```powershell
$env:PSModulePath #List of search paths for modules.
```

```powershell
[System.Environment]::GetFolderPath('LocalApplicationData') # Points to ~/.local/share
```

## Configuration

**Path:** `~/.config/powershell/`

This directory holds your user-specific configuration.

- **`Microsoft.PowerShell_profile.ps1`**: The default interactive profile.
- **`Microsoft.VSCode_profile.ps1`**: This loads instead of PowerShell_profile when you run in the VSCode terminal.

## Data and State

**Path:** `~/.local/share/powershell/`

This is where user-installed modules go (e.g., via `Install-Module`).

## Cache

**Path:** `~/.cache/powershell/`

Used for transient data like:

- **Module Analysis Cache**: Speeds up tab completion and module discovery.
