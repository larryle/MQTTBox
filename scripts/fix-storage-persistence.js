#!/usr/bin/env node

/**
 * 修复存储持久性问题
 * 实施完整的解决方案来防止数据丢失
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

console.log('🔧 修复存储持久性问题...\n');

const homeDir = os.homedir();
const appSupportPath = path.join(homeDir, 'Library', 'Application Support');

// 定义固定的应用目录
const FIXED_APP_DIR = 'MQTTBox';
const FIXED_APP_PATH = path.join(appSupportPath, FIXED_APP_DIR);

// 所有可能的历史目录
const HISTORICAL_DIRS = [
    'mqttbox-mac',
    'mqttbox', 
    'MQTTBox-mac',
    'MQTTBox_mac'
];

console.log('📁 固定应用目录:', FIXED_APP_PATH);
console.log('📁 历史目录:', HISTORICAL_DIRS.join(', '));

// 确保固定目录存在
fs.ensureDirSync(FIXED_APP_PATH);
console.log('✅ 固定目录已创建');

// 检查历史目录中的数据
console.log('\n🔍 检查历史目录中的数据...');
let totalDataFound = 0;

for (const dirName of HISTORICAL_DIRS) {
    const dirPath = path.join(appSupportPath, dirName);
    if (fs.existsSync(dirPath)) {
        console.log(`\n📁 检查 ${dirName}:`);
        
        // 检查关键子目录
        const subdirs = ['IndexedDB', 'databases', 'Local Storage', 'Session Storage'];
        let hasData = false;
        
        for (const subdir of subdirs) {
            const fullPath = path.join(dirPath, subdir);
            if (fs.existsSync(fullPath)) {
                const files = fs.readdirSync(fullPath);
                if (files.length > 0) {
                    hasData = true;
                    console.log(`   📁 ${subdir}: ${files.length} 文件`);
                }
            }
        }
        
        if (hasData) {
            totalDataFound++;
            console.log(`   ✅ 发现数据`);
        } else {
            console.log(`   ❌ 无数据`);
        }
    } else {
        console.log(`\n📁 ${dirName}: 目录不存在`);
    }
}

console.log(`\n📊 发现 ${totalDataFound} 个历史目录包含数据`);

// 创建数据合并脚本
const mergeScript = `#!/usr/bin/env node

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
        console.log(\`📁 处理 \${dirName}...\`);
        
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
                        fs.moveSync(targetPath, backupPath);
                        console.log(\`   📁 备份现有 \${subdir} 到 \${backupPath}\`);
                    }
                    
                    // 复制数据
                    fs.copySync(sourcePath, targetPath);
                    console.log(\`   ✅ 复制 \${subdir} 完成\`);
                } catch (error) {
                    console.error(\`   ❌ 复制 \${subdir} 失败:\`, error.message);
                }
            }
        }
    }
}

console.log('🎉 数据合并完成！');
console.log('💡 现在所有数据都在固定目录中:', FIXED_APP_PATH);
`;

fs.writeFileSync('scripts/merge-all-data.js', mergeScript);
console.log('✅ 数据合并脚本已创建: scripts/merge-all-data.js');

// 创建存储配置检查脚本
const configCheckScript = `#!/usr/bin/env node

/**
 * 存储配置检查脚本
 * 确保存储配置正确
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查存储配置...');

// 检查 MqttClientDbService.js
const dbServicePath = path.join(__dirname, '..', 'src', 'app', 'services', 'MqttClientDbService.js');
if (fs.existsSync(dbServicePath)) {
    const content = fs.readFileSync(dbServicePath, 'utf8');
    
    // 检查关键配置
    const checks = [
        { name: '存储名称', pattern: 'name: "MQTT_CLIENT_SETTINGS"', required: true },
        { name: 'IndexedDB驱动', pattern: 'driver: localforage.INDEXEDDB', required: true },
        { name: 'localStorage回退', pattern: 'window.localStorage', required: true },
        { name: '数据导入逻辑', pattern: 'Imported.*clients from localStorage', required: true }
    ];
    
    console.log('\\n📋 存储配置检查:');
    for (const check of checks) {
        const found = content.includes(check.pattern);
        console.log(\`   \${found ? '✅' : '❌'} \${check.name}: \${found ? '正确' : '缺失'}\`);
    }
} else {
    console.log('❌ MqttClientDbService.js 未找到');
}

// 检查 main.js
const mainPath = path.join(__dirname, '..', 'main.js');
if (fs.existsSync(mainPath)) {
    const content = fs.readFileSync(mainPath, 'utf8');
    
    console.log('\\n📋 主进程配置检查:');
    const mainChecks = [
        { name: '固定userData路径', pattern: 'app.setPath.*userData', required: true },
        { name: 'MQTTBox目录', pattern: 'MQTTBox', required: true }
    ];
    
    for (const check of mainChecks) {
        const found = content.includes(check.pattern);
        console.log(\`   \${found ? '✅' : '❌'} \${check.name}: \${found ? '正确' : '缺失'}\`);
    }
} else {
    console.log('❌ main.js 未找到');
}

console.log('\\n🎉 配置检查完成！');
`;

fs.writeFileSync('scripts/check-storage-config.js', configCheckScript);
console.log('✅ 存储配置检查脚本已创建: scripts/check-storage-config.js');

// 创建数据备份脚本
const backupScript = `#!/usr/bin/env node

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
const backupPath = path.join(BACKUP_DIR, \`backup-\${timestamp}\`);

try {
    // 备份所有重要数据
    fs.copySync(FIXED_APP_PATH, backupPath);
    console.log(\`✅ 数据备份完成: \${backupPath}\`);
    
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
            console.log(\`🗑️ 删除旧备份: \${backup.name}\`);
        }
    }
    
} catch (error) {
    console.error('❌ 备份失败:', error.message);
}

console.log('🎉 备份完成！');
`;

fs.writeFileSync('scripts/backup-data.js', backupScript);
console.log('✅ 数据备份脚本已创建: scripts/backup-data.js');

console.log('\n🎯 解决方案总结:');
console.log('=' .repeat(50));

console.log('1. **数据合并**: 运行 scripts/merge-all-data.js');
console.log('2. **配置检查**: 运行 scripts/check-storage-config.js');
console.log('3. **定期备份**: 运行 scripts/backup-data.js');
console.log('4. **固定Origin**: 确保 main.js 中设置了固定的 userData 路径');

console.log('\n💡 防止数据丢失的最佳实践:');
console.log('=' .repeat(50));

console.log('1. **始终使用固定的 userData 路径**');
console.log('2. **定期备份重要数据**');
console.log('3. **监控存储配置变化**');
console.log('4. **提供数据恢复机制**');

console.log('\n🎉 修复脚本创建完成！');
