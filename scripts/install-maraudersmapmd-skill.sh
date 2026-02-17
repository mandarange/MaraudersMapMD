#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RULE_PATH="${ROOT_DIR}/.cursor/rules/maraudersmapmd-skill.mdc"
RULE_URL="https://raw.githubusercontent.com/mandarange/MaraudersMapMD-skill/main/SKILL.md"
FULL_REPO_DIR="${ROOT_DIR}/.maraudersmapmd-skill"

WITH_FULL_REPO=0

if [[ "${1:-}" == "--full" ]]; then
  WITH_FULL_REPO=1
fi

mkdir -p "${ROOT_DIR}/.cursor/rules"

curl -fsSL "${RULE_URL}" -o "${RULE_PATH}"
echo "[ok] Installed rule file: ${RULE_PATH}"

if [[ ${WITH_FULL_REPO} -eq 1 ]]; then
  if [[ -d "${FULL_REPO_DIR}/.git" ]]; then
    git -C "${FULL_REPO_DIR}" pull --ff-only
    echo "[ok] Updated full skill repo: ${FULL_REPO_DIR}"
  else
    git clone https://github.com/mandarange/MaraudersMapMD-skill.git "${FULL_REPO_DIR}"
    echo "[ok] Cloned full skill repo: ${FULL_REPO_DIR}"
  fi
  echo "[ok] Python helper files are available under: ${FULL_REPO_DIR}"
fi

cat <<'EOF'
[next] Recommended prompt prefix for high trigger reliability:
Use MaraudersMapMD skill. Improve readability of this Markdown.
EOF
