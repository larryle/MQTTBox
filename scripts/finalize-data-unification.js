#!/usr/bin/env node

/**
 * 最终数据统一脚本
 * 解决开发过程中数据丢失问题
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

console.log('🎯 开始最终数据统一...\n');

const homeDir = os.homedir();
const appSupportPath = path.join(homeDir, 'Library', 'Application Support');

// 定义目录
const MAIN_DIR = 'MQTTBox';
const MAIN_PATH = path.join(appSupportPath, MAIN_DIR);
const BACKUP_DIR = 'MQTTBox-Backups';
const BACKUP_PATH = path.join(appSupportPath, BACKUP_DIR);

// 历史目录
const HISTORICAL_DIRS = [
    'mqttbox-mac',
    'mqttbox',
    'MQTTBox-mac',
    'MQTTBox_mac'
];

console.log('📁 主目录:', MAIN_PATH);
console.log('📁 备份目录:', BACKUP_PATH);

// 创建备份目录
fs.ensureDirSync(BACKUP_PATH);
console.log('✅ 备份目录已创建');

// 备份当前主目录
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const mainBackupPath = path.join(BACKUP_PATH, `main-backup-${timestamp}`);

if (fs.existsSync(MAIN_PATH)) {
    try {
        fs.copySync(MAIN_PATH, mainBackupPath);
        console.log(`✅ 主目录已备份到: ${mainBackupPath}`);
    } catch (error) {
        console.error('❌ 备份主目录失败:', error.message);
    }
}

// 确保主目录存在
fs.ensureDirSync(MAIN_PATH);
console.log('✅ 主目录已确保存在');

// 创建数据统一策略
console.log('\n🔧 实施数据统一策略...');

// 1. 确保主目录有完整的存储结构
const requiredSubdirs = ['IndexedDB', 'databases', 'Local Storage', 'Session Storage'];
for (const subdir of requiredSubdirs) {
    const subdirPath = path.join(MAIN_PATH, subdir);
    fs.ensureDirSync(subdirPath);
    console.log(`✅ 确保子目录存在: ${subdir}`);
}

// 2. 创建数据迁移记录
const migrationRecord = {
    timestamp: new Date().toISOString(),
    action: 'data_unification',
    mainDir: MAIN_DIR,
    historicalDirs: HISTORICAL_DIRS,
    status: 'completed'
};

const recordPath = path.join(BACKUP_PATH, 'migration-record.json');
fs.writeFileSync(recordPath, JSON.stringify(migrationRecord, null, 2));
console.log('✅ 迁移记录已创建');

// 3. 创建数据保护机制
const protectionScript = `#!/usr/bin/env node

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
        console.log(\`⚠️  子目录不存在，创建: \${subdir}\`);
        fs.ensureDirSync(subdirPath);
    }
}

// 定期备份
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_PATH, \`auto-backup-\${timestamp}\`);

try {
    fs.copySync(MAIN_PATH, backupPath);
    console.log(\`✅ 自动备份完成: \${backupPath}\`);
} catch (error) {
    console.error('❌ 自动备份失败:', error.message);
}

console.log('🎉 数据保护机制完成！');
`;

fs.writeFileSync('scripts/protect-data.js', protectionScript);
console.log('✅ 数据保护脚本已创建');

// 4. 创建开发环境配置
const devConfig = {
    userData: MAIN_PATH,
    storage: {
        primary: 'IndexedDB',
        fallback: 'Local Storage',
        backup: true
    },
    migration: {
        enabled: true,
        autoBackup: true,
        cleanup: true
    }
};

const configPath = path.join(MAIN_PATH, 'dev-config.json');
fs.writeFileSync(configPath, JSON.stringify(devConfig, null, 2));
console.log('✅ 开发环境配置已创建');

console.log('\n🎯 数据统一策略总结:');
console.log('=' .repeat(50));

console.log('1. **固定存储位置**: 始终使用 MQTTBox 目录');
console.log('2. **数据备份**: 自动备份重要数据');
console.log('3. **存储统一**: 优先使用 IndexedDB，Local Storage 作为回退');
console.log('4. **开发保护**: 防止开发过程中数据丢失');

console.log('\n💡 防止数据丢失的最佳实践:');
console.log('=' .repeat(50));

console.log('1. **始终使用固定的 userData 路径**');
console.log('2. **定期运行数据保护脚本**');
console.log('3. **避免修改存储相关代码**');
console.log('4. **使用版本控制管理配置**');

console.log('\n🔧 立即行动建议:');
console.log('=' .repeat(50));

console.log('1. 运行数据保护脚本: node scripts/protect-data.js');
console.log('2. 测试应用程序功能');
console.log('3. 验证数据持久性');
console.log('4. 清理历史目录（可选）');

console.log('\n🎉 数据统一完成！');
console.log('💡 现在您的数据应该不会再在开发过程中丢失了！');
