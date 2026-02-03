#!/bin/bash

# Go to the directory this script lives in
cd "$(dirname "$0")"

# Load NVM if it exists (fixes 'npm not found' or wrong version issues)
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
elif [ -s "/usr/local/opt/nvm/nvm.sh" ]; then
  . "/usr/local/opt/nvm/nvm.sh"
elif [ -s "/opt/homebrew/opt/nvm/nvm.sh" ]; then
  . "/opt/homebrew/opt/nvm/nvm.sh"
fi

echo "🚀 Starting deploy..."

echo "📦 Building Vite project..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Aborting deploy."
  read -p "Press Enter to exit"
  exit 1
fi

echo "📝 Committing changes..."
git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"

echo "⬆️ Pushing to GitHub..."
git push origin main
if [ $? -ne 0 ]; then
  echo "❌ Git push failed."
  read -p "Press Enter to exit"
  exit 1
fi

echo "✅ Deploy complete!"
echo "🌍 GitHub Pages will update shortly."

read -p "Press Enter to close"
