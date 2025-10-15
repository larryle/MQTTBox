#!/usr/bin/env node

/**
 * 启用v0.2.1版本兼容性脚本
 * 让当前版本能够读取和兼容v0.2.1版本的存储数据
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

console.log('🔄 启用v0.2.1版本兼容性...\n');

const homeDir = os.homedir();
const appSupportPath = path.join(homeDir, 'Library', 'Application Support');

// 定义目录
const V021_DIR = 'mqttbox-mac';  // v0.2.1版本使用的目录
const CURRENT_DIR = 'MQTTBox';   // 当前版本使用的目录
const V021_PATH = path.join(appSupportPath, V021_DIR);
const CURRENT_PATH = path.join(appSupportPath, CURRENT_DIR);

console.log('📁 v0.2.1版本目录:', V021_PATH);
console.log('📁 当前版本目录:', CURRENT_PATH);

// 检查v0.2.1版本数据是否存在
if (!fs.existsSync(V021_PATH)) {
    console.log('❌ v0.2.1版本数据目录不存在');
    console.log('💡 可能的原因:');
    console.log('1. 从未安装过v0.2.1版本');
    console.log('2. 数据已被删除');
    console.log('3. 数据存储在其他位置');
    process.exit(1);
}

console.log('✅ v0.2.1版本数据目录存在');

// 检查当前版本数据目录
if (!fs.existsSync(CURRENT_PATH)) {
    console.log('⚠️  当前版本数据目录不存在，创建新目录');
    fs.ensureDirSync(CURRENT_PATH);
}

// 创建兼容性配置
const compatibilityConfig = {
    version: '0.2.3',
    compatibility: {
        v021: {
            enabled: true,
            sourceDir: V021_DIR,
            targetDir: CURRENT_DIR,
            autoMigrate: true,
            backup: true
        }
    },
    storage: {
        primary: CURRENT_DIR,
        fallback: [V021_DIR],
        migration: {
            enabled: true,
            autoDetect: true,
            preserveOriginal: true
        }
    }
};

// 保存兼容性配置
const configPath = path.join(CURRENT_PATH, 'compatibility-config.json');
fs.writeFileSync(configPath, JSON.stringify(compatibilityConfig, null, 2));
console.log('✅ 兼容性配置已创建:', configPath);

// 创建数据迁移脚本
const migrationScript = `#!/usr/bin/env node

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
        console.log(\`📁 迁移 \${subdir}...\`);
        try {
            // 如果目标目录已存在，先备份
            if (fs.existsSync(targetPath)) {
                const backupPath = targetPath + '.backup.' + Date.now();
                fs.moveSync(targetPath, backupPath);
                console.log(\`   📁 备份现有 \${subdir} 到 \${backupPath}\`);
            }
            
            // 复制数据
            fs.copySync(sourcePath, targetPath);
            console.log(\`   ✅ \${subdir} 迁移完成\`);
            migratedCount++;
        } catch (error) {
            console.error(\`   ❌ \${subdir} 迁移失败:\`, error.message);
        }
    } else {
        console.log(\`   ⚠️  \${subdir} 目录不存在，跳过\`);
    }
}

console.log(\`\\n📊 迁移完成: \${migratedCount} 个目录\`);
console.log('💡 建议操作:');
console.log('1. 重启应用程序');
console.log('2. 检查数据是否正确加载');
console.log('3. 验证功能是否正常');
console.log('4. 测试数据持久性');

console.log('\\n🎉 v0.2.1数据迁移完成！');
`;

fs.writeFileSync('scripts/migrate-v021-data.js', migrationScript);
console.log('✅ 数据迁移脚本已创建: scripts/migrate-v021-data.js');

// 创建兼容性检查脚本
const checkScript = `#!/usr/bin/env node

/**
 * 兼容性检查脚本
 * 检查v0.2.1版本数据的兼容性
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

console.log('🔍 检查v0.2.1版本数据兼容性...');

const homeDir = os.homedir();
const appSupportPath = path.join(homeDir, 'Library', 'Application Support');

const V021_DIR = 'mqttbox-mac';
const CURRENT_DIR = 'MQTTBox';
const V021_PATH = path.join(appSupportPath, V021_DIR);
const CURRENT_PATH = path.join(appSupportPath, CURRENT_DIR);

console.log('📁 v0.2.1版本目录:', V021_PATH);
console.log('📁 当前版本目录:', CURRENT_PATH);

// 检查目录存在性
console.log('\\n📊 目录状态:');
console.log(\`v0.2.1版本目录存在: \${fs.existsSync(V021_PATH) ? '✅' : '❌'}\`);
console.log(\`当前版本目录存在: \${fs.existsSync(CURRENT_PATH) ? '✅' : '❌'}\`);

if (fs.existsSync(V021_PATH)) {
    console.log('\\n📁 v0.2.1版本数据内容:');
    const subdirs = ['IndexedDB', 'databases', 'Local Storage', 'Session Storage'];
    
    for (const subdir of subdirs) {
        const subdirPath = path.join(V021_PATH, subdir);
        if (fs.existsSync(subdirPath)) {
            const files = fs.readdirSync(subdirPath);
            console.log(\`   📁 \${subdir}: \${files.length} 文件\`);
            if (files.length > 0) {
                console.log(\`      文件: \${files.slice(0, 3).join(', ')}\${files.length > 3 ? '...' : ''}\`);
            }
        } else {
            console.log(\`   ❌ \${subdir}: 不存在\`);
        }
    }
}

if (fs.existsSync(CURRENT_PATH)) {
    console.log('\\n📁 当前版本数据内容:');
    const subdirs = ['IndexedDB', 'databases', 'Local Storage', 'Session Storage'];
    
    for (const subdir of subdirs) {
        const subdirPath = path.join(CURRENT_PATH, subdir);
        if (fs.existsSync(subdirPath)) {
            const files = fs.readdirSync(subdirPath);
            console.log(\`   📁 \${subdir}: \${files.length} 文件\`);
            if (files.length > 0) {
                console.log(\`      文件: \${files.slice(0, 3).join(', ')}\${files.length > 3 ? '...' : ''}\`);
            }
        } else {
            console.log(\`   ❌ \${subdir}: 不存在\`);
        }
    }
}

console.log('\\n🎯 兼容性建议:');
console.log('1. 运行数据迁移脚本');
console.log('2. 测试数据加载');
console.log('3. 验证功能完整性');
console.log('4. 清理旧数据（可选）');

console.log('\\n🎉 兼容性检查完成！');
`;

fs.writeFileSync('scripts/check-v021-compatibility.js', checkScript);
console.log('✅ 兼容性检查脚本已创建: scripts/check-v021-compatibility.js');

console.log('\n🎯 兼容性配置总结:');
console.log('=' .repeat(50));

console.log('1. **兼容性配置**: 已创建兼容性配置文件');
console.log('2. **数据迁移脚本**: 已创建自动迁移脚本');
console.log('3. **兼容性检查**: 已创建检查脚本');
console.log('4. **自动检测**: 支持自动检测v0.2.1版本数据');

console.log('\n💡 使用方法:');
console.log('=' .repeat(50));

console.log('1. 检查兼容性: node scripts/check-v021-compatibility.js');
console.log('2. 迁移数据: node scripts/migrate-v021-data.js');
console.log('3. 重启应用程序');
console.log('4. 验证数据加载');

console.log('\n🎉 v0.2.1版本兼容性已启用！');
