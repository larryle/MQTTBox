const mqtt = require('mqtt');
const fs = require('fs');

console.log('🧪 简单MQTT连接测试');
console.log('📋 测试目标: 验证mqtts协议使用TCP连接而不是WebSocket');

// 测试配置
const config = {
    host: 'a347c83gr2h8if-ats.iot.ap-southeast-2.amazonaws.com',
    port: 8883,
    protocol: 'mqtts',
    ca: '/Volumes/work/develop/workspace/documents/Server/amazon/iot/keys/AmazonRootCA1.pem',
    cert: '/Volumes/work/develop/workspace/documents/Server/amazon/iot/keys/64288fe322-certificate.pem.crt',
    key: '/Volumes/work/develop/workspace/documents/Server/amazon/iot/keys/64288fe322-private.pem.key'
};

// 检查证书文件
function checkFiles() {
    const files = [config.ca, config.cert, config.key];
    const missing = files.filter(f => !fs.existsSync(f));
    
    if (missing.length > 0) {
        console.error('❌ 缺少文件:', missing);
        return false;
    }
    console.log('✅ 证书文件检查通过');
    return true;
}

// 测试连接
function testConnection() {
    return new Promise((resolve, reject) => {
        console.log('\n🔌 开始连接测试...');
        
        const connectUrl = `${config.protocol}://${config.host}:${config.port}`;
        console.log(`🔗 连接URL: ${connectUrl}`);
        
        const options = {
            ca: fs.readFileSync(config.ca),
            cert: fs.readFileSync(config.cert),
            key: fs.readFileSync(config.key),
            transport: 'tcp',        // 强制TCP
            protocol: 'mqtts',       // 明确协议
            browser: false,          // 禁用浏览器模式
            webSocket: false,        // 禁用WebSocket
            keepalive: 60,
            clean: true,
            connectTimeout: 10000
        };
        
        console.log('⚙️ 连接选项:');
        console.log(`  - 传输: ${options.transport}`);
        console.log(`  - 协议: ${options.protocol}`);
        console.log(`  - 浏览器模式: ${options.browser}`);
        console.log(`  - WebSocket: ${options.webSocket}`);
        
        const client = mqtt.connect(connectUrl, options);
        
        const timeout = setTimeout(() => {
            client.end();
            reject(new Error('连接超时'));
        }, 10000);
        
        client.on('connect', () => {
            clearTimeout(timeout);
            console.log('✅ 连接成功！');
            console.log('📊 连接状态:', client.connected);
            
            // 测试发布
            const testMsg = JSON.stringify({
                test: 'MQTTBox连接测试',
                timestamp: new Date().toISOString()
            });
            
            client.publish('test/connection', testMsg, { qos: 0 }, (err) => {
                if (err) {
                    console.error('❌ 发布失败:', err.message);
                } else {
                    console.log('✅ 消息发布成功');
                }
                
                client.end();
                resolve({ success: true, connected: client.connected });
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
async function run() {
    try {
        if (!checkFiles()) {
            process.exit(1);
        }
        
        const result = await testConnection();
        console.log('\n🎉 测试完成！');
        console.log('📋 结果:', result);
        process.exit(0);
        
    } catch (error) {
        console.error('\n💥 测试失败:', error.message);
        process.exit(1);
    }
}

run();

