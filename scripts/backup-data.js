#!/usr/bin/env node

/**
 * 数据备份脚本
 * 定期备份重要数据
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const homeDir = os.homedir();
const appSupportPath = path.join(homeDir, 'Library', 'Application Support');
const FIXED_APP_PATH = path.join(appSupportPath, 'MQTTBox');
const BACKUP_DIR = path.join(appSupportPath, 'MQTTBox-Backups');

console.log('💾 开始数据备份...');

// 创建备份目录
fs.ensureDirSync(BACKUP_DIR);

// 生成备份文件名
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

try {
    // 备份所有重要数据
    fs.copySync(FIXED_APP_PATH, backupPath);
    console.log(`✅ 数据备份完成: ${backupPath}`);
    
    // 清理旧备份（保留最近5个）
    const backups = fs.readdirSync(BACKUP_DIR)
        .filter(name => name.startsWith('backup-'))
        .map(name => ({
            name,
            path: path.join(BACKUP_DIR, name),
            time: fs.statSync(path.join(BACKUP_DIR, name)).mtime
        }))
        .sort((a, b) => b.time - a.time);
    
    if (backups.length > 5) {
        const toDelete = backups.slice(5);
        for (const backup of toDelete) {
            fs.removeSync(backup.path);
            console.log(`🗑️ 删除旧备份: ${backup.name}`);
        }
    }
    
} catch (error) {
    console.error('❌ 备份失败:', error.message);
}

console.log('🎉 备份完成！');
