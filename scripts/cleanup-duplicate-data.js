#!/usr/bin/env node

/**
 * 清理重复数据脚本
 * 统一客户端数据存储，避免数据分散问题
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

console.log('🧹 开始清理重复数据...\n');

const homeDir = os.homedir();
const appSupportPath = path.join(homeDir, 'Library', 'Application Support');

// 定义主目录和备份目录
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
console.log('📁 历史目录:', HISTORICAL_DIRS.join(', '));

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
} else {
    console.log('⚠️  主目录不存在，将创建新目录');
    fs.ensureDirSync(MAIN_PATH);
}

// 检查历史目录中的数据
console.log('\n🔍 检查历史目录中的数据...');
let totalClientsFound = 0;
const clientData = new Map();

for (const dirName of HISTORICAL_DIRS) {
    const dirPath = path.join(appSupportPath, dirName);
    if (fs.existsSync(dirPath)) {
        console.log(`\n📁 检查 ${dirName}:`);
        
        // 检查 IndexedDB
        const indexedDbPath = path.join(dirPath, 'IndexedDB', 'file__0.indexeddb.leveldb');
        if (fs.existsSync(indexedDbPath)) {
            try {
                const files = fs.readdirSync(indexedDbPath);
                let clientsInDir = 0;
                
                for (const file of files) {
                    if (file.endsWith('.log')) {
                        const filePath = path.join(indexedDbPath, file);
                        try {
                            const content = fs.readFileSync(filePath, 'utf8');
                            // 简单的客户端ID匹配（实际应用中需要更复杂的解析）
                            const clientIdMatches = content.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g);
                            if (clientIdMatches) {
                                clientsInDir += clientIdMatches.length;
                                for (const clientId of clientIdMatches) {
                                    if (!clientData.has(clientId)) {
                                        clientData.set(clientId, []);
                                    }
                                    clientData.get(clientId).push({
                                        dir: dirName,
                                        location: 'IndexedDB',
                                        file: file
                                    });
                                }
                            }
                        } catch (e) {
                            // 忽略二进制文件读取错误
                        }
                    }
                }
                
                if (clientsInDir > 0) {
                    console.log(`   📁 IndexedDB: ${clientsInDir} 个客户端`);
                    totalClientsFound += clientsInDir;
                } else {
                    console.log(`   📁 IndexedDB: 无客户端数据`);
                }
            } catch (e) {
                console.log(`   ❌ 无法读取 IndexedDB: ${e.message}`);
            }
        } else {
            console.log(`   ❌ IndexedDB 目录不存在`);
        }
        
        // 检查 Local Storage
        const localStoragePath = path.join(dirPath, 'Local Storage', 'leveldb');
        if (fs.existsSync(localStoragePath)) {
            try {
                const files = fs.readdirSync(localStoragePath);
                let clientsInDir = 0;
                
                for (const file of files) {
                    if (file.endsWith('.log')) {
                        const filePath = path.join(localStoragePath, file);
                        try {
                            const content = fs.readFileSync(filePath, 'utf8');
                            const clientIdMatches = content.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g);
                            if (clientIdMatches) {
                                clientsInDir += clientIdMatches.length;
                                for (const clientId of clientIdMatches) {
                                    if (!clientData.has(clientId)) {
                                        clientData.set(clientId, []);
                                    }
                                    clientData.get(clientId).push({
                                        dir: dirName,
                                        location: 'Local Storage',
                                        file: file
                                    });
                                }
                            }
                        } catch (e) {
                            // 忽略二进制文件读取错误
                        }
                    }
                }
                
                if (clientsInDir > 0) {
                    console.log(`   📁 Local Storage: ${clientsInDir} 个客户端`);
                } else {
                    console.log(`   📁 Local Storage: 无客户端数据`);
                }
            } catch (e) {
                console.log(`   ❌ 无法读取 Local Storage: ${e.message}`);
            }
        } else {
            console.log(`   ❌ Local Storage 目录不存在`);
        }
    } else {
        console.log(`\n📁 ${dirName}: 目录不存在`);
    }
}

console.log(`\n📊 数据统计:`);
console.log(`   总客户端数量: ${totalClientsFound}`);
console.log(`   唯一客户端ID: ${clientData.size}`);

// 分析重复数据
console.log('\n🔍 分析重复数据...');
let duplicateClients = 0;
let uniqueClients = 0;

for (const [clientId, locations] of clientData.entries()) {
    if (locations.length > 1) {
        duplicateClients++;
        console.log(`\n⚠️  重复客户端: ${clientId}`);
        for (const location of locations) {
            console.log(`   📁 ${location.dir}/${location.location}/${location.file}`);
        }
    } else {
        uniqueClients++;
    }
}

console.log(`\n📊 重复数据分析:`);
console.log(`   唯一客户端: ${uniqueClients}`);
console.log(`   重复客户端: ${duplicateClients}`);

// 创建数据清理建议
console.log('\n💡 数据清理建议:');
console.log('=' .repeat(50));

if (duplicateClients > 0) {
    console.log('1. 保留主目录 (MQTTBox) 中的数据');
    console.log('2. 删除历史目录中的重复数据');
    console.log('3. 统一使用 IndexedDB 存储');
    console.log('4. 清理 Local Storage 中的重复数据');
} else {
    console.log('1. 数据没有重复，无需清理');
    console.log('2. 可以安全删除历史目录');
}

console.log('\n🎯 下一步操作:');
console.log('=' .repeat(50));
console.log('1. 运行数据合并脚本');
console.log('2. 测试数据完整性');
console.log('3. 删除历史目录');
console.log('4. 验证应用程序功能');

console.log('\n🎉 数据清理分析完成！');
