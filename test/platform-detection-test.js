const mqtt = require('mqtt');
const fs = require('fs');

console.log('🧪 平台检测和MQTT连接测试');
console.log('============================');

// 模拟不同的平台环境
const platforms = [
    {
        name: 'Electron环境',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Electron/38.2.0 Chrome/131.0.0.0 Safari/537.36',
        expected: 'ELECTRON_APP'
    },
    {
        name: 'Chrome扩展环境',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        chrome: { runtime: { id: 'test-extension' } },
        expected: 'CHROME_APP'
    },
    {
        name: 'Web浏览器环境',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        expected: 'WEB_APP'
    }
];

// 模拟平台检测逻辑
function detectPlatform(env) {
    if (env.userAgent && env.userAgent.includes('Electron')) {
        return 'ELECTRON_APP';
    } else if (env.chrome && env.chrome.runtime && env.chrome.runtime.id) {
        return 'CHROME_APP';
    } else {
        return 'WEB_APP';
    }
}

// 测试平台检测
function testPlatformDetection() {
    console.log('\n🔍 测试平台检测逻辑...');
    
    platforms.forEach(platform => {
        const detected = detectPlatform(platform);
        const passed = detected === platform.expected;
        
        console.log(`${passed ? '✅' : '❌'} ${platform.name}: ${detected} (期望: ${platform.expected})`);
        
        if (!passed) {
            console.error(`   用户代理: ${platform.userAgent}`);
        }
    });
}

// 测试MQTT连接配置
function testMqttConfig() {
    console.log('\n🔧 测试MQTT连接配置...');
    
    const configs = [
        {
            name: 'MQTTS TCP连接',
            protocol: 'mqtts',
            host: 'test.example.com',
            port: 8883,
            expected: {
                url: 'mqtts://test.example.com:8883',
                transport: 'tcp',
                protocol: 'mqtts',
                browser: false,
                webSocket: false
            }
        },
        {
            name: 'MQTT TCP连接',
            protocol: 'mqtt',
            host: 'test.example.com',
            port: 1883,
            expected: {
                url: 'mqtt://test.example.com:1883',
                transport: 'tcp',
                protocol: 'mqtt',
                browser: false,
                webSocket: false
            }
        },
        {
            name: 'WebSocket连接',
            protocol: 'ws',
            host: 'test.example.com',
            port: 8080,
            expected: {
                url: 'ws://test.example.com:8080',
                transport: 'websocket'
            }
        }
    ];
    
    configs.forEach(config => {
        console.log(`\n📋 测试 ${config.name}:`);
        
        // 模拟我们的连接逻辑
        let connectUrl = `${config.protocol}://${config.host}:${config.port}`;
        let options = {
            keepalive: 60,
            clean: true
        };
        
        // 模拟Electron环境的处理
        const platform = 'ELECTRON_APP';
        if (platform === 'ELECTRON_APP') {
            if (config.protocol === 'mqtts') {
                connectUrl = `mqtts://${config.host}:${config.port}`;
                delete options['protocol'];
                delete options['wsOptions'];
                delete options['ws'];
                delete options['webSocket'];
                options['transport'] = 'tcp';
                options['protocol'] = 'mqtts';
                options['browser'] = false;
            } else if (config.protocol === 'mqtt') {
                connectUrl = `mqtt://${config.host}:${config.port}`;
                delete options['protocol'];
                delete options['wsOptions'];
                delete options['ws'];
                delete options['webSocket'];
                options['transport'] = 'tcp';
                options['protocol'] = 'mqtt';
                options['browser'] = false;
            } else if (config.protocol === 'ws' || config.protocol === 'wss') {
                connectUrl = `${config.protocol}://${config.host}:${config.port}`;
                delete options['protocol'];
                options['transport'] = 'websocket';
            }
        }
        
        // 验证结果
        const passed = Object.keys(config.expected).every(key => {
            const actual = key === 'url' ? connectUrl : options[key];
            const expected = config.expected[key];
            return actual === expected;
        });
        
        console.log(`  ${passed ? '✅' : '❌'} 连接URL: ${connectUrl}`);
        console.log(`  ${passed ? '✅' : '❌'} 传输方式: ${options.transport}`);
        console.log(`  ${passed ? '✅' : '❌'} 协议: ${options.protocol}`);
        console.log(`  ${passed ? '✅' : '❌'} 浏览器模式: ${options.browser}`);
        console.log(`  ${passed ? '✅' : '❌'} WebSocket: ${options.webSocket}`);
        
        if (!passed) {
            console.error(`  期望: ${JSON.stringify(config.expected, null, 2)}`);
            console.error(`  实际: ${JSON.stringify({url: connectUrl, ...options}, null, 2)}`);
        }
    });
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始运行所有测试...\n');
    
    testPlatformDetection();
    testMqttConfig();
    
    console.log('\n🎉 所有测试完成！');
}

runAllTests();

