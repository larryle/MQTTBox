#!/bin/bash

# Quick GitHub Publishing Script for MQTTBox
# Simple script to push to GitHub without changing default git remote

set -e

echo "🚀 Quick GitHub Publish for MQTTBox"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the MQTTBox project root"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes"
    git status --short
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted"
        exit 1
    fi
fi

# Ensure we're on master branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "master" ]; then
    echo "⚠️  Warning: You're on branch '$CURRENT_BRANCH', not 'master'"
    read -p "Switch to master? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout master
    else
        echo "❌ Please switch to master branch first"
        exit 1
    fi
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
if git push larryle master; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🔗 Repository: https://github.com/larryle/MQTTBox"
    echo "📦 Releases: https://github.com/larryle/MQTTBox/releases"
else
    echo "❌ Failed to push to GitHub"
    exit 1
fi

# Show current status
echo
echo "📊 Current Status:"
echo "  • Default remote: $(git remote get-url origin)"
echo "  • GitHub remote: $(git remote get-url larryle)"
echo "  • Latest commit: $(git rev-parse --short HEAD)"
echo "  • Version: $(node -p "require('./package.json').version")"
