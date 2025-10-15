#!/usr/bin/env node

/**
 * 根据客户端ID查找存储位置
 * 搜索特定客户端ID在哪个目录中
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const TARGET_CLIENT_ID = '54ca5f4f-3a8a-4419-8b0a-4f40ed1d4598';

console.log(`🔍 搜索客户端ID: ${TARGET_CLIENT_ID}\n`);

const homeDir = os.homedir();
const appSupportPath = path.join(homeDir, 'Library', 'Application Support');

// 所有可能的应用目录
const possibleDirs = [
    'MQTTBox',
    'mqttbox-mac',
    'mqttbox',
    'MQTTBox-mac',
    'MQTTBox_mac'
];

console.log('📁 检查所有可能的应用数据目录:');
console.log('=' .repeat(60));

let foundInDirs = [];

for (const dirName of possibleDirs) {
    const dirPath = path.join(appSupportPath, dirName);
    console.log(`\n🔍 检查目录: ${dirName}`);
    console.log(`   路径: ${dirPath}`);
    
    if (!fs.existsSync(dirPath)) {
        console.log('   ❌ 目录不存在');
        continue;
    }
    
    // 检查 IndexedDB 目录
    const indexedDbPath = path.join(dirPath, 'IndexedDB', 'file__0.indexeddb.leveldb');
    if (fs.existsSync(indexedDbPath)) {
        console.log('   📁 检查 IndexedDB...');
        try {
            const files = fs.readdirSync(indexedDbPath);
            let foundInIndexedDb = false;
            
            for (const file of files) {
                if (file.endsWith('.log')) {
                    const filePath = path.join(indexedDbPath, file);
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');
                        if (content.includes(TARGET_CLIENT_ID)) {
                            console.log(`   ✅ 在 IndexedDB 中找到客户端ID: ${file}`);
                            foundInIndexedDb = true;
                            foundInDirs.push({
                                dir: dirName,
                                path: dirPath,
                                location: 'IndexedDB',
                                file: file
                            });
                        }
                    } catch (e) {
                        // 忽略二进制文件读取错误
                    }
                }
            }
            
            if (!foundInIndexedDb) {
                console.log('   ❌ 在 IndexedDB 中未找到');
            }
        } catch (e) {
            console.log('   ❌ 无法读取 IndexedDB 目录');
        }
    } else {
        console.log('   ❌ IndexedDB 目录不存在');
    }
    
    // 检查 Local Storage 目录
    const localStoragePath = path.join(dirPath, 'Local Storage', 'leveldb');
    if (fs.existsSync(localStoragePath)) {
        console.log('   📁 检查 Local Storage...');
        try {
            const files = fs.readdirSync(localStoragePath);
            let foundInLocalStorage = false;
            
            for (const file of files) {
                if (file.endsWith('.log')) {
                    const filePath = path.join(localStoragePath, file);
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');
                        if (content.includes(TARGET_CLIENT_ID)) {
                            console.log(`   ✅ 在 Local Storage 中找到客户端ID: ${file}`);
                            foundInLocalStorage = true;
                            foundInDirs.push({
                                dir: dirName,
                                path: dirPath,
                                location: 'Local Storage',
                                file: file
                            });
                        }
                    } catch (e) {
                        // 忽略二进制文件读取错误
                    }
                }
            }
            
            if (!foundInLocalStorage) {
                console.log('   ❌ 在 Local Storage 中未找到');
            }
        } catch (e) {
            console.log('   ❌ 无法读取 Local Storage 目录');
        }
    } else {
        console.log('   ❌ Local Storage 目录不存在');
    }
}

console.log('\n📊 搜索结果总结:');
console.log('=' .repeat(60));

if (foundInDirs.length === 0) {
    console.log('❌ 未找到客户端ID:', TARGET_CLIENT_ID);
    console.log('\n💡 可能的原因:');
    console.log('1. 客户端ID不存在');
    console.log('2. 数据已被删除');
    console.log('3. 数据存储在其他位置');
    console.log('4. 数据格式不同');
} else {
    console.log(`✅ 找到客户端ID: ${TARGET_CLIENT_ID}`);
    console.log(`📁 存储位置数量: ${foundInDirs.length}`);
    
    for (const found of foundInDirs) {
        console.log(`\n📁 目录: ${found.dir}`);
        console.log(`   路径: ${found.path}`);
        console.log(`   位置: ${found.location}`);
        console.log(`   文件: ${found.file}`);
    }
    
    // 分析结果
    const dirs = [...new Set(foundInDirs.map(f => f.dir))];
    const locations = [...new Set(foundInDirs.map(f => f.location))];
    
    console.log('\n🔍 分析结果:');
    console.log(`   涉及目录: ${dirs.join(', ')}`);
    console.log(`   存储位置: ${locations.join(', ')}`);
    
    if (dirs.length > 1) {
        console.log('\n⚠️  警告: 客户端数据分散在多个目录中！');
        console.log('   这可能导致数据不一致问题。');
    }
    
    if (locations.includes('IndexedDB') && locations.includes('Local Storage')) {
        console.log('\n⚠️  警告: 客户端数据同时存在于 IndexedDB 和 Local Storage 中！');
        console.log('   这可能导致数据同步问题。');
    }
}

console.log('\n🎯 建议操作:');
console.log('=' .repeat(60));

if (foundInDirs.length > 0) {
    console.log('1. 检查数据一致性');
    console.log('2. 合并分散的数据');
    console.log('3. 清理重复数据');
    console.log('4. 统一存储位置');
} else {
    console.log('1. 检查客户端ID是否正确');
    console.log('2. 检查其他可能的存储位置');
    console.log('3. 检查数据是否被删除');
    console.log('4. 考虑数据恢复');
}

console.log('\n🎉 搜索完成！');
