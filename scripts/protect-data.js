#!/usr/bin/env node

/**
 * 数据保护机制
 * 防止数据丢失的保护机制
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const homeDir = os.homedir();
const appSupportPath = path.join(homeDir, 'Library', 'Application Support');
const MAIN_DIR = 'MQTTBox';
const MAIN_PATH = path.join(appSupportPath, MAIN_DIR);
const BACKUP_DIR = 'MQTTBox-Backups';
const BACKUP_PATH = path.join(appSupportPath, BACKUP_DIR);

console.log('🛡️ 启动数据保护机制...');

// 检查主目录状态
if (!fs.existsSync(MAIN_PATH)) {
    console.log('❌ 主目录不存在，创建新目录');
    fs.ensureDirSync(MAIN_PATH);
}

// 检查关键子目录
const requiredSubdirs = ['IndexedDB', 'databases', 'Local Storage', 'Session Storage'];
for (const subdir of requiredSubdirs) {
    const subdirPath = path.join(MAIN_PATH, subdir);
    if (!fs.existsSync(subdirPath)) {
        console.log(`⚠️  子目录不存在，创建: ${subdir}`);
        fs.ensureDirSync(subdirPath);
    }
}

// 定期备份
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_PATH, `auto-backup-${timestamp}`);

try {
    fs.copySync(MAIN_PATH, backupPath);
    console.log(`✅ 自动备份完成: ${backupPath}`);
} catch (error) {
    console.error('❌ 自动备份失败:', error.message);
}

console.log('🎉 数据保护机制完成！');
