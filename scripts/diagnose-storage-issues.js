#!/usr/bin/env node

/**
 * 诊断存储问题脚本
 * 分析为什么在开发过程中客户端数据会不断丢失
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

console.log('🔍 诊断存储问题...\n');

const homeDir = os.homedir();
const appSupportPath = path.join(homeDir, 'Library', 'Application Support');

// 检查所有可能的MQTTBox相关目录
const possibleDirs = [
    'MQTTBox',
    'mqttbox-mac', 
    'mqttbox',
    'MQTTBox_mac',
    'MQTTBox-mac'
];

console.log('📁 检查所有可能的应用数据目录:');
console.log('=' .repeat(50));

let foundData = {};

for (const dirName of possibleDirs) {
    const dirPath = path.join(appSupportPath, dirName);
    console.log(`\n🔍 检查目录: ${dirName}`);
    console.log(`   路径: ${dirPath}`);
    
    if (!fs.existsSync(dirPath)) {
        console.log('   ❌ 目录不存在');
        continue;
    }
    
    // 检查关键子目录
    const subdirs = ['IndexedDB', 'databases', 'Local Storage', 'Session Storage'];
    const dirStatus = {};
    
    for (const subdir of subdirs) {
        const fullPath = path.join(dirPath, subdir);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath);
            const hasData = files.length > 0;
            dirStatus[subdir] = {
                exists: true,
                hasData: hasData,
                fileCount: files.length,
                files: files.slice(0, 5) // 只显示前5个文件
            };
            console.log(`   📁 ${subdir}: ${hasData ? '✅ 有数据' : '❌ 空目录'} (${files.length} 文件)`);
        } else {
            dirStatus[subdir] = { exists: false, hasData: false, fileCount: 0, files: [] };
            console.log(`   📁 ${subdir}: ❌ 不存在`);
        }
    }
    
    // 检查是否有任何数据
    const hasAnyData = Object.values(dirStatus).some(status => status.hasData);
    if (hasAnyData) {
        foundData[dirName] = dirStatus;
        console.log(`   ✅ 发现数据`);
    } else {
        console.log(`   ❌ 无数据`);
    }
}

console.log('\n📊 数据分布分析:');
console.log('=' .repeat(50));

if (Object.keys(foundData).length === 0) {
    console.log('❌ 未发现任何客户端数据');
} else {
    for (const [dirName, status] of Object.entries(foundData)) {
        console.log(`\n📁 ${dirName}:`);
        for (const [subdir, info] of Object.entries(status)) {
            if (info.exists && info.hasData) {
                console.log(`   📁 ${subdir}: ${info.fileCount} 文件`);
                if (info.files.length > 0) {
                    console.log(`      文件: ${info.files.join(', ')}`);
                }
            }
        }
    }
}

console.log('\n🔍 问题分析:');
console.log('=' .repeat(50));

console.log('1. **Origin 变化问题**:');
console.log('   - 开发环境: file:// origin');
console.log('   - 打包环境: 不同的 origin');
console.log('   - 应用名称变化: mqttbox-mac → MQTTBox');
console.log('   - IndexedDB 数据与 origin 绑定，origin 变化导致数据不可见');

console.log('\n2. **localforage 驱动配置问题**:');
console.log('   - 当前配置: driver: localforage.INDEXEDDB');
console.log('   - 问题: 强制使用 IndexedDB，但 origin 变化时数据不可见');
console.log('   - 解决方案: 需要稳定的 origin 或数据迁移机制');

console.log('\n3. **数据迁移机制不完善**:');
console.log('   - 当前: 只在 IndexedDB 为空时从 localStorage 导入');
console.log('   - 问题: 不处理 origin 变化的情况');
console.log('   - 需要: 跨 origin 的数据迁移机制');

console.log('\n💡 建议的解决方案:');
console.log('=' .repeat(50));

console.log('1. **固定 Origin 方案**:');
console.log('   - 在 main.js 中设置固定的 origin');
console.log('   - 确保所有环境使用相同的 origin');

console.log('2. **数据迁移方案**:');
console.log('   - 检测所有可能的存储位置');
console.log('   - 自动迁移数据到当前 origin');
console.log('   - 提供数据恢复机制');

console.log('3. **存储配置优化**:');
console.log('   - 使用稳定的存储配置');
console.log('   - 添加数据备份机制');
console.log('   - 提供数据导出/导入功能');

console.log('\n🎯 立即行动建议:');
console.log('=' .repeat(50));

console.log('1. 检查当前数据状态');
console.log('2. 实施 origin 固定方案');
console.log('3. 添加数据迁移逻辑');
console.log('4. 测试数据持久性');

console.log('\n🎉 诊断完成！');
