#!/bin/bash

# Navigate to the script's directory
cd "$(dirname "$0")"

# Load NVM (Node Version Manager) if it exists
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
elif [ -s "/usr/local/opt/nvm/nvm.sh" ]; then
  . "/usr/local/opt/nvm/nvm.sh"
elif [ -s "/opt/homebrew/opt/nvm/nvm.sh" ]; then
  . "/opt/homebrew/opt/nvm/nvm.sh"
fi

echo "🧹 Cleaning up old processes..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo "🚀 Starting Flashcard App..."

# Open the browser (give it a second to start)
(sleep 2 && open http://localhost:5173) &

# Start the dev server
npm run dev
