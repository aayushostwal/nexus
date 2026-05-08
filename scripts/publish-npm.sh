#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

MODE="dry-run"
BUMP=""
SKIP_GIT_CHECK="false"

usage() {
  cat <<'EOF'
Usage:
  scripts/publish-npm.sh --dry-run
  scripts/publish-npm.sh --publish
  scripts/publish-npm.sh --publish --bump patch

Options:
  --dry-run          Run validation and npm pack dry-run only. Default.
  --publish          Publish to npm after validation.
  --bump <type>      Bump npm version before validation. Use patch, minor, major, or a semver.
  --skip-git-check   Allow running with a dirty git working tree.
  -h, --help         Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      MODE="dry-run"
      shift
      ;;
    --publish)
      MODE="publish"
      shift
      ;;
    --bump)
      BUMP="${2:-}"
      if [[ -z "$BUMP" ]]; then
        echo "Missing value for --bump" >&2
        exit 1
      fi
      shift 2
      ;;
    --skip-git-check)
      SKIP_GIT_CHECK="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

package_name() {
  node -p "require('./package.json').name"
}

package_version() {
  node -p "require('./package.json').version"
}

sync_plugin_versions() {
  local version="$1"
  node - "$version" <<'NODE'
const fs = require("fs");
const version = process.argv[2];
const files = [
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
];

for (const file of files) {
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  json.version = version;
  if (Array.isArray(json.plugins)) {
    for (const plugin of json.plugins) {
      if (plugin.name === "nexus") plugin.version = version;
    }
  }
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}
NODE
}

require_clean_git() {
  if [[ "$SKIP_GIT_CHECK" == "true" ]]; then
    return
  fi

  if ! command -v git >/dev/null 2>&1; then
    return
  fi

  local status
  status="$(git status --short)"
  if [[ -n "$status" ]]; then
    echo "Git working tree has uncommitted changes:"
    echo "$status"
    echo
    echo "Commit or stash changes before publishing."
    exit 1
  fi
}

require_npm_auth() {
  if npm whoami >/tmp/nexus-npm-whoami 2>/tmp/nexus-npm-whoami.err; then
    echo "npm auth: $(cat /tmp/nexus-npm-whoami)"
    return
  fi

  echo "npm authentication is required."
  echo "Run locally: npm login"
  echo "In GitHub Actions: set NPM_TOKEN in repository secrets."
  echo "If your npm account has 2FA enabled, NPM_TOKEN must be an npm Automation token."
  exit 1
}

check_version_available() {
  local name="$1"
  local version="$2"

  if npm view "${name}@${version}" version >/tmp/nexus-npm-view 2>/dev/null; then
    echo "${name}@${version} already exists on npm."
    echo "Bump the version before publishing."
    exit 1
  fi

  echo "${name}@${version} is not published yet."
}

run_claude_validation_if_available() {
  if command -v claude >/dev/null 2>&1; then
    claude plugin validate .
  else
    echo "Skipping Claude plugin validation: claude command not found."
  fi
}

echo "Nexus npm publish script"
echo "Mode: ${MODE}"

require_clean_git

if [[ -n "$BUMP" ]]; then
  echo "Bumping version: ${BUMP}"
  npm version "$BUMP" --no-git-tag-version
  sync_plugin_versions "$(package_version)"
fi

NAME="$(package_name)"
VERSION="$(package_version)"

echo "Package: ${NAME}@${VERSION}"

npm test
run_claude_validation_if_available
npm pack --dry-run
require_npm_auth
check_version_available "$NAME" "$VERSION"

if [[ "$MODE" == "dry-run" ]]; then
  echo
  echo "Dry run complete. To publish:"
  echo "  scripts/publish-npm.sh --publish"
  exit 0
fi

set +e
npm publish --access public 2>/tmp/nexus-npm-publish.err
publish_status="$?"
set -e

if [[ "$publish_status" -ne 0 ]]; then
  cat /tmp/nexus-npm-publish.err >&2
  if grep -q "EOTP" /tmp/nexus-npm-publish.err; then
    echo >&2
    echo "npm rejected this publish because the token requires a one-time password." >&2
    echo "GitHub Actions cannot complete interactive OTP prompts." >&2
    echo "Fix: create an npm Automation token and save it as the GitHub Actions secret NPM_TOKEN." >&2
  fi
  exit "$publish_status"
fi

echo "Published ${NAME}@${VERSION}"
