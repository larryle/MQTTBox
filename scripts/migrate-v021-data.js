#!/usr/bin/env node

/**
 * v0.2.1数据迁移脚本
 * 自动迁移v0.2.1版本的数据到当前版本
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

console.log('🔄 开始v0.2.1数据迁移...');

const homeDir = os.homedir();
const appSupportPath = path.join(homeDir, 'Library', 'Application Support');

const V021_DIR = 'mqttbox-mac';
const CURRENT_DIR = 'MQTTBox';
const V021_PATH = path.join(appSupportPath, V021_DIR);
const CURRENT_PATH = path.join(appSupportPath, CURRENT_DIR);

console.log('📁 源目录:', V021_PATH);
console.log('📁 目标目录:', CURRENT_PATH);

// 确保目标目录存在
fs.ensureDirSync(CURRENT_PATH);

// 需要迁移的子目录
const subdirs = ['IndexedDB', 'databases', 'Local Storage', 'Session Storage'];

let migratedCount = 0;

for (const subdir of subdirs) {
    const sourcePath = path.join(V021_PATH, subdir);
    const targetPath = path.join(CURRENT_PATH, subdir);
    
    if (fs.existsSync(sourcePath)) {
        console.log(`📁 迁移 ${subdir}...`);
        try {
            // 如果目标目录已存在，先备份
            if (fs.existsSync(targetPath)) {
                const backupPath = targetPath + '.backup.' + Date.now();
                fs.move(targetPath, backupPath);
                console.log(`   📁 备份现有 ${subdir} 到 ${backupPath}`);
            }
            
            // 复制数据
            fs.copySync(sourcePath, targetPath);
            console.log(`   ✅ ${subdir} 迁移完成`);
            migratedCount++;
        } catch (error) {
            console.error(`   ❌ ${subdir} 迁移失败:`, error.message);
        }
    } else {
        console.log(`   ⚠️  ${subdir} 目录不存在，跳过`);
    }
}

console.log(`\n📊 迁移完成: ${migratedCount} 个目录`);
console.log('💡 建议操作:');
console.log('1. 重启应用程序');
console.log('2. 检查数据是否正确加载');
console.log('3. 验证功能是否正常');
console.log('4. 测试数据持久性');

console.log('\n🎉 v0.2.1数据迁移完成！');
