#!/usr/bin/env node

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
console.log('\n📊 目录状态:');
console.log(`v0.2.1版本目录存在: ${fs.existsSync(V021_PATH) ? '✅' : '❌'}`);
console.log(`当前版本目录存在: ${fs.existsSync(CURRENT_PATH) ? '✅' : '❌'}`);

if (fs.existsSync(V021_PATH)) {
    console.log('\n📁 v0.2.1版本数据内容:');
    const subdirs = ['IndexedDB', 'databases', 'Local Storage', 'Session Storage'];
    
    for (const subdir of subdirs) {
        const subdirPath = path.join(V021_PATH, subdir);
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

console.log('\n🎯 兼容性建议:');
console.log('1. 运行数据迁移脚本');
console.log('2. 测试数据加载');
console.log('3. 验证功能完整性');
console.log('4. 清理旧数据（可选）');

console.log('\n🎉 兼容性检查完成！');
