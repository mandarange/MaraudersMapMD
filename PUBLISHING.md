# Publishing Guide

This project is a Cursor/Antigravity extension published to both VS Code Marketplace and OpenVSX.

## VS Code Marketplace

### Prerequisites

- A Microsoft publisher account that owns `Mandarange`
- A Personal Access Token (PAT) with Marketplace publishing rights

### One-time setup

```bash
npm install -g @vscode/vsce
vsce login Mandarange
```

### Publish

```bash
npm run package
vsce publish
```

### Verify

- Marketplace item: https://marketplace.visualstudio.com/items?itemName=Mandarange.marauders-map-md
- Search terms: "MaraudersMapMD", "Marauders Map MD"

---

## OpenVSX

### Prerequisites

- An OpenVSX account with Namespace `Mandarange`
- A Personal Access Token from https://open-vsx.org/user-settings/tokens

### One-time setup

```bash
npm install -g ovsx
```

### Publish

```bash
npm run package
ovsx publish marauders-map-md-<version>.vsix -p <YOUR_OPENVSX_TOKEN>
```

Or set the token as environment variable:

```bash
export OVSX_PAT=<YOUR_OPENVSX_TOKEN>
ovsx publish marauders-map-md-<version>.vsix
```

### Verify

- OpenVSX item: https://open-vsx.org/extension/Mandarange/marauders-map-md
- Search terms: "MaraudersMapMD", "Marauders Map MD"

---

## Notes

- `package.json` must have `"publisher": "Mandarange"` to match both accounts.
- `npm run package` builds a minified bundle used for publishing.
