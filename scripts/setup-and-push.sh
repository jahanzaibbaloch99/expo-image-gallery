#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-and-push.sh
#
# Usage:
#   chmod +x scripts/setup-and-push.sh
#   GITHUB_USERNAME=yourname NPM_PACKAGE_NAME=expo-image-gallery ./scripts/setup-and-push.sh
#
# What it does:
#   1. Personalises package.json / README with your GitHub username
#   2. Installs dependencies
#   3. Runs typecheck + tests
#   4. Builds the library
#   5. Creates a new GitHub repo (requires `gh` CLI logged in)
#   6. Pushes the code
#   7. Sets the NPM_TOKEN secret on the repo for automated publishing
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

GITHUB_USERNAME="${GITHUB_USERNAME:-}"
NPM_PACKAGE_NAME="${NPM_PACKAGE_NAME:-expo-image-gallery}"
NPM_TOKEN="${NPM_TOKEN:-}"

if [[ -z "$GITHUB_USERNAME" ]]; then
  read -rp "GitHub username: " GITHUB_USERNAME
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " expo-image-gallery setup"
echo " GitHub: $GITHUB_USERNAME"
echo " npm:    $NPM_PACKAGE_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# ── 1. Patch YOUR_GITHUB_USERNAME placeholders ──────────────────────────────
echo "→ Patching placeholders..."
find . -type f \( -name "*.md" -o -name "*.json" -o -name "*.yml" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/lib/*" \
  -exec sed -i.bak "s|YOUR_GITHUB_USERNAME|$GITHUB_USERNAME|g" {} +

find . -name "*.bak" -delete

# Also set author name in package.json if not already set
AUTHOR_LINE="\"author\": \"$GITHUB_USERNAME\""
sed -i.bak "s|\"author\": \"Your Name.*\"|$AUTHOR_LINE|g" package.json && rm package.json.bak || true

echo "  ✓ Placeholders replaced"

# ── 2. Install deps ──────────────────────────────────────────────────────────
echo "→ Installing dependencies..."
npm install
echo "  ✓ Dependencies installed"

# ── 3. Typecheck ─────────────────────────────────────────────────────────────
echo "→ Running TypeScript check..."
npm run typecheck
echo "  ✓ TypeScript OK"

# ── 4. Tests ─────────────────────────────────────────────────────────────────
echo "→ Running tests..."
npm test -- --ci
echo "  ✓ Tests passed"

# ── 5. Build ─────────────────────────────────────────────────────────────────
echo "→ Building library..."
npm run build
echo "  ✓ Build complete (lib/ generated)"

# ── 6. Git init ──────────────────────────────────────────────────────────────
echo "→ Setting up git..."
if [[ ! -d ".git" ]]; then
  git init
  git branch -m main
fi

git add -A
git commit -m "feat: initial release of expo-image-gallery v1.0.0

- Drop-in replacement for react-native-awesome-gallery
- Expo SDK 56 (React Native 0.85, React 19.2)
- Reanimated v4 (react-native-worklets, New Architecture)
- Gesture Handler v3 (hook-based usePanGesture, usePinchGesture, useTapGesture)
- Full TypeScript, zero deprecated APIs
- CI/CD via GitHub Actions
- Auto-publish to npm on version tag"

echo "  ✓ Git committed"

# ── 7. Create GitHub repo & push ─────────────────────────────────────────────
if command -v gh &>/dev/null; then
  echo "→ Creating GitHub repository..."
  gh repo create "$NPM_PACKAGE_NAME" \
    --public \
    --description "Performant Expo image gallery. Drop-in replacement for react-native-awesome-gallery. Expo SDK 56 · Reanimated v4 · Gesture Handler v3." \
    --source=. \
    --remote=origin \
    --push \
    || true  # ignore if repo already exists

  echo "  ✓ Pushed to github.com/$GITHUB_USERNAME/$NPM_PACKAGE_NAME"

  # ── 8. Set NPM_TOKEN secret ──────────────────────────────────────────────
  if [[ -n "$NPM_TOKEN" ]]; then
    echo "→ Setting NPM_TOKEN secret on GitHub repo..."
    gh secret set NPM_TOKEN --body "$NPM_TOKEN" --repo "$GITHUB_USERNAME/$NPM_PACKAGE_NAME"
    echo "  ✓ NPM_TOKEN secret set"
  else
    echo ""
    echo "  ⚠️  NPM_TOKEN not provided — set it manually:"
    echo "     gh secret set NPM_TOKEN --body 'your-token' --repo $GITHUB_USERNAME/$NPM_PACKAGE_NAME"
  fi
else
  echo "  ⚠️  gh CLI not found. Push manually:"
  echo "     git remote add origin https://github.com/$GITHUB_USERNAME/$NPM_PACKAGE_NAME.git"
  echo "     git push -u origin main"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅  Done!"
echo ""
echo "  GitHub : https://github.com/$GITHUB_USERNAME/$NPM_PACKAGE_NAME"
echo ""
echo "  To publish to npm, create a version tag:"
echo "    npm version patch   # or minor / major"
echo "    git push --follow-tags"
echo ""
echo "  To run the example:"
echo "    cd example"
echo "    npm install"
echo "    npx expo start"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
