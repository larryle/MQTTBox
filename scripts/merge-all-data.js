#!/usr/bin/env node

/**
 * 数据合并脚本
 * 将所有历史数据合并到固定目录
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const homeDir = os.homedir();
const appSupportPath = path.join(homeDir, 'Library', 'Application Support');

const FIXED_APP_DIR = 'MQTTBox';
const FIXED_APP_PATH = path.join(appSupportPath, FIXED_APP_DIR);

const HISTORICAL_DIRS = [
    'mqttbox-mac',
    'mqttbox', 
    'MQTTBox-mac',
    'MQTTBox_mac'
];

console.log('🔄 开始数据合并...');

// 确保固定目录存在
fs.ensureDirSync(FIXED_APP_PATH);

// 合并所有历史数据
for (const dirName of HISTORICAL_DIRS) {
    const dirPath = path.join(appSupportPath, dirName);
    if (fs.existsSync(dirPath)) {
        console.log(`📁 处理 ${dirName}...`);
        
        // 复制所有子目录
        const subdirs = ['IndexedDB', 'databases', 'Local Storage', 'Session Storage'];
        for (const subdir of subdirs) {
            const sourcePath = path.join(dirPath, subdir);
            const targetPath = path.join(FIXED_APP_PATH, subdir);
            
            if (fs.existsSync(sourcePath)) {
                try {
                    // 如果目标目录已存在，先备份
                    if (fs.existsSync(targetPath)) {
                        const backupPath = targetPath + '.backup.' + Date.now();
                        fs.move(targetPath, backupPath);
                        console.log(`   📁 备份现有 ${subdir} 到 ${backupPath}`);
                    }
                    
                    // 复制数据
                    fs.copySync(sourcePath, targetPath);
                    console.log(`   ✅ 复制 ${subdir} 完成`);
                } catch (error) {
                    console.error(`   ❌ 复制 ${subdir} 失败:`, error.message);
                }
            }
        }
    }
}

console.log('🎉 数据合并完成！');
console.log('💡 现在所有数据都在固定目录中:', FIXED_APP_PATH);
