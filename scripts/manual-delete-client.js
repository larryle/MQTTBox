#!/usr/bin/env node

/**
 * 手动删除客户端脚本
 * 从所有存储位置手动删除指定的客户端ID
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const TARGET_CLIENT_ID = '54ca5f4f-3a8a-4419-8b0a-4f40ed1d4598';

console.log(`🗑️ 手动删除客户端ID: ${TARGET_CLIENT_ID}\n`);

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

let deletedCount = 0;

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
                            
                            // 尝试从文件中移除客户端ID
                            const lines = content.split('\n');
                            const filteredLines = lines.filter(line => !line.includes(TARGET_CLIENT_ID));
                            
                            if (filteredLines.length < lines.length) {
                                const newContent = filteredLines.join('\n');
                                fs.writeFileSync(filePath, newContent);
                                console.log(`   🗑️ 已从 IndexedDB 中删除客户端ID: ${file}`);
                                deletedCount++;
                                foundInIndexedDb = true;
                            }
                        }
                    } catch (e) {
                        console.log(`   ❌ 无法处理文件 ${file}: ${e.message}`);
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
                            
                            // 尝试从文件中移除客户端ID
                            const lines = content.split('\n');
                            const filteredLines = lines.filter(line => !line.includes(TARGET_CLIENT_ID));
                            
                            if (filteredLines.length < lines.length) {
                                const newContent = filteredLines.join('\n');
                                fs.writeFileSync(filePath, newContent);
                                console.log(`   🗑️ 已从 Local Storage 中删除客户端ID: ${file}`);
                                deletedCount++;
                                foundInLocalStorage = true;
                            }
                        }
                    } catch (e) {
                        console.log(`   ❌ 无法处理文件 ${file}: ${e.message}`);
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

console.log('\n📊 删除结果总结:');
console.log('=' .repeat(60));

if (deletedCount > 0) {
    console.log(`✅ 成功删除客户端ID: ${TARGET_CLIENT_ID}`);
    console.log(`📁 删除位置数量: ${deletedCount}`);
    console.log('\n💡 建议操作:');
    console.log('1. 重启应用程序');
    console.log('2. 检查客户端列表');
    console.log('3. 验证删除是否生效');
} else {
    console.log('❌ 未找到或无法删除客户端ID:', TARGET_CLIENT_ID);
    console.log('\n💡 可能的原因:');
    console.log('1. 客户端ID不存在');
    console.log('2. 数据格式不同');
    console.log('3. 文件权限问题');
    console.log('4. 数据已被删除');
}

console.log('\n🎉 手动删除完成！');
