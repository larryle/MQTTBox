# Data Persistence Solution

## Problem
Electron applications can lose user data when the app name, version, or installation path changes. This happens because Electron's `userData` path is determined by:

1. **App Name** (from `package.json`)
2. **Product Name** (from `package.json`)
3. **App ID** (from `package.json`)
4. **Version Number**
5. **Installation Path**

## Solution
We've implemented a **fixed userData path** that remains consistent across version updates.

### Implementation
In `main.js`, we set a fixed userData path before the app starts:

```javascript
// Set fixed userData path to ensure data persistence across version updates
// This prevents data loss when the app name or version changes
const homeDir = os.homedir();
let fixedUserDataPath;

if (process.platform === 'darwin') {
  // macOS
  fixedUserDataPath = path.join(homeDir, 'Library', 'Application Support', 'MQTTBox');
} else if (process.platform === 'win32') {
  // Windows
  fixedUserDataPath = path.join(homeDir, 'AppData', 'Roaming', 'MQTTBox');
} else {
  // Linux
  fixedUserDataPath = path.join(homeDir, '.config', 'MQTTBox');
}

app.setPath('userData', fixedUserDataPath);
console.log('[main] Fixed userData path:', fixedUserDataPath);
```

### Benefits
1. **Data Persistence**: User data survives version updates
2. **Cross-Platform**: Works on macOS, Windows, and Linux
3. **Consistent Path**: Always uses the same directory regardless of app changes
4. **No Migration Needed**: Data automatically persists in the same location

### Paths by Platform
- **macOS**: `~/Library/Application Support/MQTTBox/`
- **Windows**: `%APPDATA%/MQTTBox/`
- **Linux**: `~/.config/MQTTBox/`

### Migration Script
For existing users who have data in old locations, we provide a migration script:

```bash
node scripts/migrate-data.js
```

This script copies data from old app directories to the new fixed location.

## Testing
To verify the fix works:

1. **Before Fix**: Data was lost when version changed from 0.2.2 to 0.2.3
2. **After Fix**: Data persists across version updates
3. **Cross-Platform**: Works on all supported platforms

## Maintenance
- **No Action Required**: The fix is automatic and requires no maintenance
- **Version Updates**: Data will persist automatically
- **App Name Changes**: Data will persist automatically
- **Installation Path Changes**: Data will persist automatically

## Notes
- This solution ensures data persistence without requiring user intervention
- The fixed path is consistent across all platforms
- No data migration is needed for future updates
- The solution is transparent to users
