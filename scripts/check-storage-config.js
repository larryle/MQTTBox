#!/usr/bin/env node

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
    
    console.log('\n📋 存储配置检查:');
    for (const check of checks) {
        const found = content.includes(check.pattern);
        console.log(`   ${found ? '✅' : '❌'} ${check.name}: ${found ? '正确' : '缺失'}`);
    }
} else {
    console.log('❌ MqttClientDbService.js 未找到');
}

// 检查 main.js
const mainPath = path.join(__dirname, '..', 'main.js');
if (fs.existsSync(mainPath)) {
    const content = fs.readFileSync(mainPath, 'utf8');
    
    console.log('\n📋 主进程配置检查:');
    const mainChecks = [
        { name: '固定userData路径', pattern: 'app.setPath.*userData', required: true },
        { name: 'MQTTBox目录', pattern: 'MQTTBox', required: true }
    ];
    
    for (const check of mainChecks) {
        const found = content.includes(check.pattern);
        console.log(`   ${found ? '✅' : '❌'} ${check.name}: ${found ? '正确' : '缺失'}`);
    }
} else {
    console.log('❌ main.js 未找到');
}

console.log('\n🎉 配置检查完成！');
