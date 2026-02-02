# Publishing to VS Code Marketplace

This project is a VS Code extension. Publishing is done with `vsce`.

## Prerequisites

- A Microsoft publisher account that owns `mandarange`
- A Personal Access Token (PAT) with Marketplace publishing rights

## One-time setup

```bash
npm install -g @vscode/vsce
vsce login mandarange
```

## Publish

```bash
npm run package
vsce publish
```

## Verify

- Marketplace item: https://marketplace.visualstudio.com/items?itemName=mandarange.marauders-map-md
- Search terms: “MaraudersMapMD”, “Marauders Map MD”

## Notes

- `package.json` must have `"publisher": "mandarange"` to match the account.
- `npm run package` builds a minified bundle used for publishing.
