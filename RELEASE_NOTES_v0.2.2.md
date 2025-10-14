# MQTTBox v0.2.2 - Release Notes

## 🚀 Major Updates

### Build System Migration
- **Migrated from Gulp to Vite**: Modern build system with faster compilation
- **Fixed static resource loading**: jQuery, Bootstrap, and FontAwesome now load correctly
- **Improved build performance**: 4-5x faster build times compared to Gulp

### Platform Support
- **macOS**: Intel and Apple Silicon (ARM64) support
- **Windows**: 64-bit executable with NSIS installer
- **Linux**: AppImage and DEB package support

### Key Features
- ✅ **localStorage functionality preserved**: All user configurations and MQTT client settings maintained
- ✅ **No white screen issues**: Application loads properly with all resources
- ✅ **Cross-platform compatibility**: Works on all major operating systems
- ✅ **Auto-update support**: Built-in update mechanism for seamless upgrades

## 📦 Distribution Files

### macOS
- `MQTTBox-0.2.2.dmg` (Intel Mac)
- `MQTTBox-0.2.2-arm64.dmg` (Apple Silicon Mac)

### Windows
- `MQTTBox-0.2.2-x64.exe` (64-bit Windows)

### Linux
- `MQTTBox-0.2.2.AppImage` (Universal Linux)
- `MQTTBox_0.2.2_amd64.deb` (Ubuntu/Debian)

## 🔧 Technical Improvements

### Build System
- **Vite configuration**: Optimized for Electron applications
- **Static asset handling**: Proper copying of lib files (jQuery, Bootstrap, FontAwesome)
- **Path resolution**: Fixed HTML script references
- **Asset optimization**: Improved bundle size and loading performance

### Development Experience
- **Faster builds**: 4.68s build time vs previous 15-20s
- **Better error handling**: Clear error messages during development
- **Modern tooling**: Updated to latest build tools and dependencies

## 📚 Library Upgrades

### Major Version Updates
- **Electron**: 1.4.11 → 22.3.27 (Major security and performance improvements)
- **MQTT**: 2.1.3 → 3.0.0 (Protocol improvements and bug fixes)
- **React**: 15.4.1 → 15.4.1 (Maintained compatibility)
- **React-DOM**: 15.4.1 → 15.4.1 (Maintained compatibility)
- **Lodash**: 4.17.2 → 4.17.21 (Security patches and bug fixes)
- **Moment**: 2.17.1 → 2.29.4 (Performance improvements and bug fixes)
- **LocalForage**: 1.4.3 → 1.10.0 (Enhanced storage capabilities)

### New Dependencies
- **Vite**: ^5.4.8 (Modern build tool)
- **@vitejs/plugin-react**: ^4.3.1 (React support for Vite)
- **@vitejs/plugin-legacy**: ^5.4.2 (Legacy browser support)
- **Electron-Builder**: ^24.9.1 (Cross-platform packaging)
- **Electron-Packager**: ^17.1.2 (Application packaging)
- **Terser**: ^5.44.0 (JavaScript minification)
- **UUID**: ^9.0.0 (UUID generation)
- **Compare-Versions**: ^6.1.1 (Version comparison utilities)
- **GetMac**: ^6.6.0 (MAC address utilities)

### Build Tools
- **@babel/core**: ^7.24.9 (JavaScript transpilation)
- **@babel/preset-react**: ^7.24.7 (React JSX support)
- **@rollup/plugin-babel**: ^6.0.4 (Rollup Babel integration)

### Removed Dependencies
- **Gulp**: 3.9.1 (Replaced by Vite)
- **Browserify**: 13.1.1 (Replaced by Vite)
- **Gulp-util**: 3.0.7 (Deprecated)
- **Node-uuid**: 1.4.7 (Replaced by uuid)
- **Q**: 1.4.1 (Replaced by native Promises)
- **Request**: 2.79.0 (Deprecated, replaced by fetch)

## 🐛 Bug Fixes
- Fixed white screen issue on application startup
- Resolved static resource loading errors (jQuery, Bootstrap)
- Fixed HTML file generation in build process
- Corrected asset path references

## 📋 Installation Instructions
1. Download the appropriate package for your platform
2. Install using standard methods:
   - **macOS**: Double-click DMG file and drag to Applications
   - **Windows**: Run the EXE installer
   - **Linux**: Use AppImage or install DEB package

## 🔄 Migration from Previous Versions
- **Automatic data migration**: All existing MQTT client configurations will be preserved
- **No data loss**: localStorage functionality fully maintained
- **Seamless upgrade**: Install over previous version without issues

## 📞 Support
For issues, feature requests, or questions:
- GitHub Issues: https://github.com/larryle/MQTTBox/issues
- Email: linfengle@gmail.com

---
**Build Date**: October 13, 2025  
**Version**: 0.2.2  
**Compatibility**: macOS 10.14+, Windows 7 SP1+, Linux (Ubuntu 18.04+)
