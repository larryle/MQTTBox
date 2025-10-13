# MQTTBox Publishing Scripts

This directory contains scripts for publishing the MQTTBox project to GitHub while maintaining CodeCommit as the default git remote.

## 📋 Available Scripts

### 1. `publish-to-github.sh` - Full Publishing Script
**Complete publishing script with release management**

**Features:**
- ✅ Pushes code to GitHub
- ✅ Creates/updates GitHub releases
- ✅ Validates git status and branch
- ✅ Interactive prompts for safety
- ✅ Colored output and detailed logging
- ✅ GitHub CLI integration

**Usage:**
```bash
./scripts/publish-to-github.sh
```

### 2. `quick-publish.sh` - Quick Publishing Script
**Simple and fast publishing script**

**Features:**
- ✅ Quick push to GitHub
- ✅ Basic validation
- ✅ Minimal prompts
- ✅ Fast execution

**Usage:**
```bash
./scripts/quick-publish.sh
```

## 🔧 Prerequisites

### Required
- Git installed and configured
- GitHub remote configured as `larryle`
- Node.js (for version detection)

### Optional
- GitHub CLI (`gh`) for release management
- GitHub authentication (`gh auth login`)

## 🚀 Quick Start

1. **Ensure you're on the master branch:**
   ```bash
   git checkout master
   ```

2. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

3. **Run the publishing script:**
   ```bash
   # For full publishing with release management
   ./scripts/publish-to-github.sh
   
   # OR for quick publishing
   ./scripts/quick-publish.sh
   ```

## 📊 Git Remote Configuration

The scripts work with the following git remote setup:

```bash
# Default remote (CodeCommit - Sydney)
origin    https://git-codecommit.ap-southeast-2.amazonaws.com/v1/repos/MQTTBox

# GitHub remote (for publishing)
larryle   git@github.com:larryle/MQTTBox.git
```

## 🔄 Workflow

1. **Develop locally** with CodeCommit as default
2. **Commit changes** to CodeCommit
3. **Publish to GitHub** using the scripts
4. **Keep CodeCommit** as the primary remote

## 📝 Script Features

### Safety Checks
- ✅ Validates project directory
- ✅ Checks for uncommitted changes
- ✅ Ensures correct branch (master)
- ✅ Verifies remote configuration

### Publishing Process
- ✅ Pushes to GitHub without changing default remote
- ✅ Creates/updates releases (with GitHub CLI)
- ✅ Provides detailed feedback
- ✅ Shows useful links and status

### Error Handling
- ✅ Graceful error messages
- ✅ Interactive prompts for decisions
- ✅ Exit codes for automation
- ✅ Validation at each step

## 🛠️ Troubleshooting

### Common Issues

1. **"GitHub remote 'larryle' not found"**
   ```bash
   git remote add larryle git@github.com:larryle/MQTTBox.git
   ```

2. **"GitHub CLI not authenticated"**
   ```bash
   gh auth login
   ```

3. **"You have uncommitted changes"**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

4. **"You're not on the master branch"**
   ```bash
   git checkout master
   ```

### Manual Publishing

If scripts fail, you can manually publish:

```bash
# Push to GitHub
git push larryle master

# Create release (if GitHub CLI is available)
gh release create v0.2.2 --title "MQTTBox v0.2.2" --notes "Release notes"
```

## 📞 Support

For issues with the publishing scripts:
- **Email**: linfengle@gmail.com
- **GitHub Issues**: https://github.com/larryle/MQTTBox/issues

---

**Note**: These scripts are designed to maintain CodeCommit as the default git remote while enabling easy publishing to GitHub. The default remote (origin) remains unchanged.
