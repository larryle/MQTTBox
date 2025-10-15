#!/usr/bin/env node

/**
 * 测试v0.2.1兼容性脚本
 * 验证自动兼容性功能是否正常工作
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

console.log('🧪 测试v0.2.1兼容性...\n');

const homeDir = os.homedir();
const appSupportPath = path.join(homeDir, 'Library', 'Application Support');

const V021_DIR = 'mqttbox-mac';
const CURRENT_DIR = 'MQTTBox';
const V021_PATH = path.join(appSupportPath, V021_DIR);
const CURRENT_PATH = path.join(appSupportPath, CURRENT_DIR);

console.log('📁 v0.2.1版本目录:', V021_PATH);
console.log('📁 当前版本目录:', CURRENT_PATH);

// 检查目录状态
console.log('\n📊 目录状态检查:');
console.log(`v0.2.1版本目录存在: ${fs.existsSync(V021_PATH) ? '✅' : '❌'}`);
console.log(`当前版本目录存在: ${fs.existsSync(CURRENT_PATH) ? '✅' : '❌'}`);

// 检查数据内容
if (fs.existsSync(CURRENT_PATH)) {
    console.log('\n📁 当前版本数据内容:');
    const subdirs = ['IndexedDB', 'databases', 'Local Storage', 'Session Storage'];
    
    for (const subdir of subdirs) {
        const subdirPath = path.join(CURRENT_PATH, subdir);
        if (fs.existsSync(subdirPath)) {
            const files = fs.readdirSync(subdirPath);
            console.log(`   📁 ${subdir}: ${files.length} 文件`);
            if (files.length > 0) {
                console.log(`      文件: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`);
            }
        } else {
            console.log(`   ❌ ${subdir}: 不存在`);
        }
    }
}

// 检查兼容性配置
const compatibilityConfigPath = path.join(CURRENT_PATH, 'compatibility-config.json');
if (fs.existsSync(compatibilityConfigPath)) {
    console.log('\n📋 兼容性配置:');
    try {
        const config = JSON.parse(fs.readFileSync(compatibilityConfigPath, 'utf8'));
        console.log(`   版本: ${config.version}`);
        console.log(`   v0.2.1兼容性: ${config.compatibility.v021.enabled ? '✅ 启用' : '❌ 禁用'}`);
        console.log(`   自动迁移: ${config.compatibility.v021.autoMigrate ? '✅ 启用' : '❌ 禁用'}`);
        console.log(`   备份: ${config.compatibility.v021.backup ? '✅ 启用' : '❌ 禁用'}`);
    } catch (error) {
        console.log('   ❌ 无法读取兼容性配置');
    }
} else {
    console.log('\n📋 兼容性配置: ❌ 不存在');
}

// 检查备份文件
console.log('\n📁 备份文件检查:');
const backupFiles = fs.readdirSync(CURRENT_PATH).filter(file => file.includes('.backup.'));
if (backupFiles.length > 0) {
    console.log(`   发现 ${backupFiles.length} 个备份文件:`);
    backupFiles.forEach(file => {
        console.log(`     📁 ${file}`);
    });
} else {
    console.log('   ❌ 未发现备份文件');
}

console.log('\n🎯 兼容性测试结果:');
console.log('=' .repeat(50));

// 检查关键指标
const hasV021Data = fs.existsSync(V021_PATH);
const hasCurrentData = fs.existsSync(CURRENT_PATH);
const hasCompatibilityConfig = fs.existsSync(compatibilityConfigPath);
const hasBackups = backupFiles.length > 0;

console.log(`v0.2.1数据存在: ${hasV021Data ? '✅' : '❌'}`);
console.log(`当前数据存在: ${hasCurrentData ? '✅' : '❌'}`);
console.log(`兼容性配置: ${hasCompatibilityConfig ? '✅' : '❌'}`);
console.log(`数据备份: ${hasBackups ? '✅' : '❌'}`);

if (hasV021Data && hasCurrentData && hasCompatibilityConfig) {
    console.log('\n🎉 v0.2.1兼容性测试通过！');
    console.log('💡 建议操作:');
    console.log('1. 重启应用程序');
    console.log('2. 检查客户端列表');
    console.log('3. 验证数据加载');
    console.log('4. 测试功能完整性');
} else {
    console.log('\n⚠️  v0.2.1兼容性测试未完全通过');
    console.log('💡 建议操作:');
    console.log('1. 运行数据迁移脚本');
    console.log('2. 检查兼容性配置');
    console.log('3. 重新测试');
}

console.log('\n🎉 兼容性测试完成！');
