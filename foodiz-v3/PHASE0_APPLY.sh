#!/usr/bin/env bash
# Apply Phase 0 — flatten the repo locally and push to GitHub.
#
# Run this from the ROOT of your local foodiz-v3 clone (where the .git folder lives).
# The script is idempotent on its own actions but it WILL move your tree around,
# so commit or stash any local work first.
#
# Usage:
#   chmod +x PHASE0_APPLY.sh
#   ./PHASE0_APPLY.sh

set -euo pipefail

REPO_ROOT="$(pwd)"
APP_NESTED="foodiz-v3/foodiz-v3/foodiz-v3"   # adjust if your nesting differs

echo "==> Vérification de l'état git (doit être propre)"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERREUR: working tree non vide. Commit ou stash d'abord." >&2
  exit 1
fi

if [[ ! -d "$APP_NESTED/src" ]]; then
  echo "ERREUR: $APP_NESTED/src introuvable. Adapte la variable APP_NESTED en haut du script." >&2
  exit 1
fi

echo "==> Sauvegarde de .env.local s'il existe (juste au cas où)"
if [[ -f "$APP_NESTED/.env.local" ]]; then
  cp "$APP_NESTED/.env.local" "/tmp/foodiz-env-local.bak"
  echo "    Sauvegardé dans /tmp/foodiz-env-local.bak"
fi

echo "==> Création d'un staging /tmp/foodiz-flat"
rm -rf /tmp/foodiz-flat
mkdir -p /tmp/foodiz-flat

echo "==> Copie de l'app (niveau le plus profond) vers le staging"
cp -a "$APP_NESTED/." /tmp/foodiz-flat/

echo "==> Copie des specs (depuis la racine actuelle)"
cp -a FOODIZ_*.md /tmp/foodiz-flat/ 2>/dev/null || true

echo "==> Copie de supabase/ (priorité au niveau le plus profond qui contient 0009)"
mkdir -p /tmp/foodiz-flat/supabase/migrations
if [[ -d "foodiz-v3/foodiz-v3/supabase/migrations" ]]; then
  cp foodiz-v3/foodiz-v3/supabase/migrations/*.sql /tmp/foodiz-flat/supabase/migrations/
fi
# Au cas où certaines migrations n'existent qu'à des niveaux supérieurs
for level in "foodiz-v3/supabase/migrations" "supabase/migrations"; do
  if [[ -d "$level" ]]; then
    for f in "$level"/*.sql; do
      [[ -f "$f" ]] || continue
      bn=$(basename "$f")
      if [[ ! -f "/tmp/foodiz-flat/supabase/migrations/$bn" ]]; then
        cp "$f" "/tmp/foodiz-flat/supabase/migrations/$bn"
      fi
    done
  fi
done

echo "==> Copie de AUTH_IMPLEMENTATION_NOTES.md s'il existe"
find . -name "AUTH_IMPLEMENTATION_NOTES.md" -not -path "*/node_modules/*" \
  -exec cp -n {} /tmp/foodiz-flat/ \;

echo "==> Nettoyage .DS_Store"
find /tmp/foodiz-flat -name ".DS_Store" -delete

echo "==> Écriture d'un .gitignore durci"
cat > /tmp/foodiz-flat/.gitignore <<'EOF'
# Build output
dist
build

# Dependencies
node_modules

# Environment files (NEVER commit these — keys must stay local)
.env
.env.local
.env.*.local
.env.development
.env.production

# Local Vite cache
.vite
.cache

# Editor/OS noise
.DS_Store
Thumbs.db
*.swp
.idea
.vscode

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Test/coverage
coverage
.nyc_output

# Maquettes brutes (référence ponctuelle, pas du code source)
.tmp-maquettes
EOF

echo "==> Suppression de l'ancien arbre (sauf .git)"
find . -mindepth 1 -maxdepth 1 -not -name ".git" -exec rm -rf {} \;

echo "==> Copie du staging à la racine"
cp -a /tmp/foodiz-flat/. ./

echo "==> Suppression de .env.local du tracking (mais on le restaure localement)"
rm -f .env.local
if [[ -f "/tmp/foodiz-env-local.bak" ]]; then
  cp /tmp/foodiz-env-local.bak .env.local
  echo "    .env.local restauré localement (et ignoré par git via .gitignore)"
fi

echo "==> git add + commit"
git add -A
git commit -m "chore(repo): flatten 3-level nesting + secure .gitignore + drop tracked .env.local

Before: the app lived at foodiz-v3/foodiz-v3/foodiz-v3/foodiz-v3/, with the
specs and supabase/ duplicated 3 times across the intermediate directories,
and .env.local was committed (containing the project URL + ANON key).

After:
  - the app sits at the repo root (package.json, src/, vite.config.js, etc.)
  - supabase/migrations/ is at the root, with all 9 migrations
  - the 4 spec docs and AUTH_IMPLEMENTATION_NOTES are at the root
  - .gitignore is hardened
  - .env.local is removed from tracking"

echo ""
echo "==> ✅ Phase 0 appliquée localement. Vérifie que ça build :"
echo "    npm install && npm run build"
echo ""
echo "==> Puis push :"
echo "    git push origin main"
echo ""
echo "==> ⚠️ Action Vercel requise après push :"
echo "    Project Settings → Build & Development Settings → Root Directory : VIDE"
echo "    (Avant, tu avais peut-être 'foodiz-v3'. Maintenant, le package.json est à la racine.)"
