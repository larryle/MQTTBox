#!/bin/bash

# MQTTBox GitHub Publishing Script
# This script publishes the current project to GitHub without changing the default git remote
# Author: Larry <linfengle@gmail.com>
# Date: $(date)

set -e  # Exit on any error

echo "🚀 MQTTBox GitHub Publishing Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "main.js" ]; then
    print_error "This script must be run from the MQTTBox project root directory"
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    print_error "Git is not installed or not in PATH"
    exit 1
fi

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    print_warning "GitHub CLI (gh) is not installed. Some features may not work."
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes. Please commit or stash them first."
    echo "Uncommitted files:"
    git status --porcelain
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Aborted by user"
        exit 1
    fi
fi

# Ensure we're on master branch
if [ "$CURRENT_BRANCH" != "master" ]; then
    print_warning "You're not on the master branch. Current branch: $CURRENT_BRANCH"
    read -p "Do you want to switch to master branch? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Switching to master branch..."
        git checkout master
    else
        print_error "Please switch to master branch manually and run the script again"
        exit 1
    fi
fi

# Check if larryle remote exists
if ! git remote get-url larryle &> /dev/null; then
    print_error "GitHub remote 'larryle' not found. Please add it first:"
    echo "git remote add larryle git@github.com:larryle/MQTTBox.git"
    exit 1
fi

print_status "Publishing to GitHub..."

# Push to GitHub (larryle remote)
print_status "Pushing to GitHub repository..."
if git push larryle master; then
    print_success "Code pushed to GitHub successfully"
else
    print_error "Failed to push to GitHub"
    exit 1
fi

# Get the latest commit hash for tagging
LATEST_COMMIT=$(git rev-parse HEAD)
print_status "Latest commit: $LATEST_COMMIT"

# Check if GitHub CLI is available for release management
if command -v gh &> /dev/null; then
    print_status "GitHub CLI detected. Managing releases..."
    
    # Check if we're authenticated
    if gh auth status &> /dev/null; then
        print_success "GitHub CLI authenticated"
        
        # Get current version from package.json
        VERSION=$(node -p "require('./package.json').version")
        print_status "Current version: $VERSION"
        
        # Check if release already exists
        if gh release view "v$VERSION" &> /dev/null; then
            print_warning "Release v$VERSION already exists"
            read -p "Do you want to update the existing release? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_status "Updating existing release..."
                gh release edit "v$VERSION" --latest
                print_success "Release v$VERSION updated"
            else
                print_status "Skipping release update"
            fi
        else
            print_status "Creating new release v$VERSION..."
            
            # Create release with notes
            RELEASE_NOTES="## 🚀 MQTTBox v$VERSION Release

### 📦 Distribution Files
- **macOS**: Intel and Apple Silicon (ARM64) support
- **Windows**: 64-bit executable with NSIS installer
- **Linux**: AppImage and DEB package support

### 🔧 Technical Improvements
- **Vite Build System**: Modern build system with faster compilation
- **Static Resource Loading**: Fixed jQuery, Bootstrap, and FontAwesome loading
- **Cross-platform Support**: Works on all major operating systems

### 📞 Support
- **GitHub Issues**: https://github.com/larryle/MQTTBox/issues
- **Email**: linfengle@gmail.com

---
**Build Date**: $(date)
**Version**: $VERSION
**Compatibility**: macOS 10.14+, Windows 10+, Linux (Ubuntu 18.04+)"
            
            if gh release create "v$VERSION" --title "MQTTBox v$VERSION" --notes "$RELEASE_NOTES"; then
                print_success "Release v$VERSION created successfully"
            else
                print_error "Failed to create release"
            fi
        fi
    else
        print_warning "GitHub CLI not authenticated. Please run 'gh auth login' first"
    fi
else
    print_warning "GitHub CLI not available. Manual release creation required."
    echo "Please visit: https://github.com/larryle/MQTTBox/releases"
fi

# Verify the push
print_status "Verifying GitHub repository..."
if git ls-remote larryle master &> /dev/null; then
    REMOTE_COMMIT=$(git ls-remote larryle master | cut -f1)
    if [ "$REMOTE_COMMIT" = "$LATEST_COMMIT" ]; then
        print_success "GitHub repository is up to date"
    else
        print_warning "GitHub repository may not be fully synchronized"
    fi
else
    print_error "Cannot verify GitHub repository"
fi

# Summary
echo
echo "=================================="
print_success "Publishing completed!"
echo "=================================="
echo "📊 Summary:"
echo "  • Code pushed to: https://github.com/larryle/MQTTBox"
echo "  • Default git remote: CodeCommit (unchanged)"
echo "  • Latest commit: $LATEST_COMMIT"
echo "  • Version: $(node -p "require('./package.json').version")"
echo
echo "🔗 Useful links:"
echo "  • Repository: https://github.com/larryle/MQTTBox"
echo "  • Releases: https://github.com/larryle/MQTTBox/releases"
echo "  • Issues: https://github.com/larryle/MQTTBox/issues"
echo
print_status "To publish again, simply run this script from the project root."
