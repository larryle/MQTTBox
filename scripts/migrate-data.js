#!/usr/bin/env node

/**
 * Data Migration Script
 * Migrate client data from old version to new version
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get user data directories
const homeDir = os.homedir();
const oldAppDir = path.join(homeDir, 'Library', 'Application Support', 'mqttbox-mac');
const newAppDir = path.join(homeDir, 'Library', 'Application Support', 'MQTTBox');

console.log('🔄 Starting data migration...');
console.log('📁 Old app directory:', oldAppDir);
console.log('📁 New app directory:', newAppDir);

// Check if old directory exists
if (!fs.existsSync(oldAppDir)) {
    console.log('❌ Old app directory not found:', oldAppDir);
    process.exit(1);
}

// Create new directory if it doesn't exist
if (!fs.existsSync(newAppDir)) {
    console.log('📁 Creating new app directory...');
    fs.mkdirSync(newAppDir, { recursive: true });
}

// Copy IndexedDB data
const oldIndexedDBDir = path.join(oldAppDir, 'IndexedDB');
const newIndexedDBDir = path.join(newAppDir, 'IndexedDB');

if (fs.existsSync(oldIndexedDBDir)) {
    console.log('📁 Copying IndexedDB data...');
    if (fs.existsSync(newIndexedDBDir)) {
        console.log('🗑️ Removing existing IndexedDB directory...');
        fs.rmSync(newIndexedDBDir, { recursive: true, force: true });
    }
    
    console.log('📋 Copying from', oldIndexedDBDir, 'to', newIndexedDBDir);
    fs.cpSync(oldIndexedDBDir, newIndexedDBDir, { recursive: true });
    console.log('✅ IndexedDB data copied successfully');
} else {
    console.log('⚠️ Old IndexedDB directory not found:', oldIndexedDBDir);
}

// Copy other important data
const importantDirs = ['databases', 'GPUCache', 'DawnCache'];
importantDirs.forEach(dir => {
    const oldDir = path.join(oldAppDir, dir);
    const newDir = path.join(newAppDir, dir);
    
    if (fs.existsSync(oldDir)) {
        console.log(`📁 Copying ${dir}...`);
        if (fs.existsSync(newDir)) {
            fs.rmSync(newDir, { recursive: true, force: true });
        }
        fs.cpSync(oldDir, newDir, { recursive: true });
        console.log(`✅ ${dir} copied successfully`);
    }
});

// Copy any JSON files that might contain client data
const jsonFiles = ['clients.json', 'settings.json', 'data.json'];
jsonFiles.forEach(file => {
    const oldFile = path.join(oldAppDir, file);
    const newFile = path.join(newAppDir, file);
    
    if (fs.existsSync(oldFile)) {
        console.log(`📄 Copying ${file}...`);
        fs.copyFileSync(oldFile, newFile);
        console.log(`✅ ${file} copied successfully`);
    }
});

console.log('🎉 Data migration completed!');
console.log('💡 Please restart the application to see your data.');
