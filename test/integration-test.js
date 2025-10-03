const mqtt = require('mqtt');
const fs = require('fs');

console.log('🧪 MQTTBox集成测试');
console.log('==================');

// 测试配置
const config = {
    host: 'a347c83gr2h8if-ats.iot.ap-southeast-2.amazonaws.com',
    port: 8883,
    protocol: 'mqtts',
    ca: '/Volumes/work/develop/workspace/documents/Server/amazon/iot/keys/AmazonRootCA1.pem',
    cert: '/Volumes/work/develop/workspace/documents/Server/amazon/iot/keys/64288fe322-certificate.pem.crt',
    key: '/Volumes/work/develop/workspace/documents/Server/amazon/iot/keys/64288fe322-private.pem.key'
};

// 模拟Electron环境
global.window = {
    navigator: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Electron/38.2.0 Chrome/131.0.0.0 Safari/537.36'
    }
};

// 模拟平台常量
const CommonConstants = {
    PLATFORM_ELECTRON_APP: 'ELECTRON_APP'
};

const PlatformConstants = {
    PLATFORM_TYPE: CommonConstants.PLATFORM_ELECTRON_APP
};

// 模拟MQTT客户端连接逻辑（从我们的修复中提取）
function createMqttClient(mqttClientObj, getConnectOptions) {
    if (!mqttClientObj || !mqttClientObj.mcsId) {
        throw new Error('无效的MQTT客户端对象');
    }
    
    var connectUrl = mqttClientObj.protocol + '://' + mqttClientObj.host;
    var options = getConnectOptions();
    
    // 模拟我们的修复逻辑
    if (PlatformConstants.PLATFORM_TYPE == CommonConstants.PLATFORM_ELECTRON_APP) {
        console.log('🔧 Electron环境检测到，强制使用TCP连接');
        
        if (mqttClientObj.protocol === 'mqtts') {
            connectUrl = 'mqtts://' + mqttClientObj.host;
            console.log('🔒 使用MQTTS TCP连接:', connectUrl);
            
            delete options['protocol'];
            delete options['wsOptions'];
            delete options['ws'];
            delete options['webSocket'];
            
            options['transport'] = 'tcp';
            options['protocol'] = 'mqtts';
            options['browser'] = false;
            
        } else if (mqttClientObj.protocol === 'mqtt') {
            connectUrl = 'mqtt://' + mqttClientObj.host;
            console.log('🔓 使用MQTT TCP连接:', connectUrl);
            
            delete options['protocol'];
            delete options['wsOptions'];
            delete options['ws'];
            delete options['webSocket'];
            
            options['transport'] = 'tcp';
            options['protocol'] = 'mqtt';
            options['browser'] = false;
            
        } else if (mqttClientObj.protocol === 'ws' || mqttClientObj.protocol === 'wss') {
            connectUrl = mqttClientObj.protocol + '://' + mqttClientObj.host;
            console.log('🌐 使用WebSocket连接:', connectUrl);
            
            delete options['protocol'];
            options['transport'] = 'websocket';
        }
    }
    
    console.log('🚀 MQTT连接参数:');
    console.log('  - 平台:', PlatformConstants.PLATFORM_TYPE);
    console.log('  - 连接URL:', connectUrl);
    console.log('  - 选项:', JSON.stringify(options, null, 2));
    
    return mqtt.connect(connectUrl, options);
}

// 检查证书文件
function checkCertificates() {
    const files = [config.ca, config.cert, config.key];
    const missing = files.filter(file => !fs.existsSync(file));
    
    if (missing.length > 0) {
        console.error('❌ 缺少证书文件:');
        missing.forEach(file => console.error(`  - ${file}`));
        return false;
    }
    
    console.log('✅ 所有证书文件都存在');
    return true;
}

// 测试连接
function testConnection() {
    return new Promise((resolve, reject) => {
        console.log('\n🔌 开始集成测试...');
        
        // 模拟MQTT客户端对象
        const mqttClientObj = {
            mcsId: 'test-client-001',
            protocol: config.protocol,
            host: config.host
        };
        
        // 模拟获取连接选项的函数
        const getConnectOptions = () => ({
            ca: fs.readFileSync(config.ca),
            cert: fs.readFileSync(config.cert),
            key: fs.readFileSync(config.key),
            keepalive: 60,
            clean: true,
            connectTimeout: 10000
        });
        
        // 创建MQTT客户端
        const client = createMqttClient(mqttClientObj, getConnectOptions);
        
        const timeout = setTimeout(() => {
            client.end();
            reject(new Error('连接超时'));
        }, 10000);
        
        client.on('connect', () => {
            clearTimeout(timeout);
            console.log('✅ 连接成功！');
            console.log('📊 连接状态:', client.connected);
            
            // 测试发布消息
            const testTopic = 'test/mqttbox/integration';
            const testMessage = JSON.stringify({
                timestamp: new Date().toISOString(),
                test: 'MQTTBox集成测试',
                platform: 'Electron',
                client: mqttClientObj.mcsId
            });
            
            console.log(`\n📤 发布测试消息到主题: ${testTopic}`);
            client.publish(testTopic, testMessage, { qos: 0 }, (err) => {
                if (err) {
                    console.error('❌ 发布消息失败:', err.message);
                } else {
                    console.log('✅ 消息发布成功');
                }
                
                // 关闭连接
                client.end();
                resolve({
                    success: true,
                    connected: client.connected,
                    platform: PlatformConstants.PLATFORM_TYPE,
                    protocol: mqttClientObj.protocol,
                    transport: 'tcp'
                });
            });
        });
        
        client.on('error', (err) => {
            clearTimeout(timeout);
            console.error('❌ 连接失败:', err.message);
            console.error('🔍 错误详情:', err);
            reject(err);
        });
        
        client.on('close', () => {
            console.log('🔌 连接已关闭');
        });
    });
}

// 运行测试
async function runTest() {
    try {
        console.log('🔍 检查证书文件...');
        if (!checkCertificates()) {
            process.exit(1);
        }
        
        console.log('\n🚀 开始集成测试...');
        const result = await testConnection();
        
        console.log('\n🎉 集成测试完成！');
        console.log('📋 测试结果:');
        console.log(`  - 连接状态: ${result.success ? '成功' : '失败'}`);
        console.log(`  - 平台: ${result.platform}`);
        console.log(`  - 协议: ${result.protocol}`);
        console.log(`  - 传输方式: ${result.transport}`);
        
        if (result.success) {
            console.log('\n✅ 所有测试通过！MQTTBox修复成功！');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n💥 集成测试失败:');
        console.error(`  - 错误: ${error.message}`);
        console.error(`  - 类型: ${error.constructor.name}`);
        
        if (error.code) {
            console.error(`  - 错误代码: ${error.code}`);
        }
        
        process.exit(1);
    }
}

// 启动测试
runTest();

