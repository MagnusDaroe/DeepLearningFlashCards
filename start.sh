#!/usr/bin/env bash
# start.sh — install dependencies if needed, then launch the dev server

set -e
cd "$(dirname "$0")"

# Check Node.js
if ! command -v node &>/dev/null; then
    echo "Error: Node.js is not installed. Download it from https://nodejs.org" >&2
    exit 1
fi

# Check npm
if ! command -v npm &>/dev/null; then
    echo "Error: npm is not installed. It should come with Node.js." >&2
    exit 1
fi

# Install dependencies if node_modules is missing or package.json is newer
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting dev server..."
npm run dev -- --open
