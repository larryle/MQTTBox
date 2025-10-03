const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

// Test configuration
const testConfig = {
    // AWS IoT Core configuration
    host: 'a347c83gr2h8if-ats.iot.ap-southeast-2.amazonaws.com',
    port: 8883,
    protocol: 'mqtts',
    
    // Certificate file paths
    ca: '/Volumes/work/develop/workspace/documents/Server/amazon/iot/keys/AmazonRootCA1.pem',
    cert: '/Volumes/work/develop/workspace/documents/Server/amazon/iot/keys/64288fe322-certificate.pem.crt',
    key: '/Volumes/work/develop/workspace/documents/Server/amazon/iot/keys/64288fe322-private.pem.key',
    
    // Test timeout
    timeout: 10000
};

// Simulate Electron environment
global.window = {
    navigator: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Electron/38.2.0 Chrome/131.0.0.0 Safari/537.36'
    }
};

// Simulate platform constants
const CommonConstants = {
    PLATFORM_ELECTRON_APP: 'ELECTRON_APP'
};

const PlatformConstants = {
    PLATFORM_TYPE: CommonConstants.PLATFORM_ELECTRON_APP
};

console.log('🧪 Starting MQTT connection test...');
console.log('📋 Test configuration:');
console.log(`  - Host: ${testConfig.host}:${testConfig.port}`);
console.log(`  - Protocol: ${testConfig.protocol}`);
console.log(`  - CA Certificate: ${testConfig.ca}`);
console.log(`  - Client Certificate: ${testConfig.cert}`);
console.log(`  - Client Key: ${testConfig.key}`);

// Check if certificate files exist
function checkCertificates() {
    const files = [testConfig.ca, testConfig.cert, testConfig.key];
    const missing = files.filter(file => !fs.existsSync(file));
    
    if (missing.length > 0) {
        console.error('❌ Missing certificate files:');
        missing.forEach(file => console.error(`  - ${file}`));
        return false;
    }
    
    console.log('✅ All certificate files exist');
    return true;
}

// Test MQTT connection
function testMqttConnection() {
    return new Promise((resolve, reject) => {
        console.log('\n🔌 Starting connection test...');
        
        // Build connection URL
        const connectUrl = `${testConfig.protocol}://${testConfig.host}:${testConfig.port}`;
        console.log(`🔗 Connection URL: ${connectUrl}`);
        
        // Build connection options
        const options = {
            // Certificate configuration
            ca: fs.readFileSync(testConfig.ca),
            cert: fs.readFileSync(testConfig.cert),
            key: fs.readFileSync(testConfig.key),
            
            // Force TCP connection (simulate our fix)
            transport: 'tcp',
            protocol: 'mqtts',
            browser: false,
            webSocket: false,
            
            // Connection options
            keepalive: 60,
            clean: true,
            reconnectPeriod: 0, // Disable auto-reconnect for testing
            connectTimeout: testConfig.timeout
        };
        
        console.log('⚙️ Connection options:');
        console.log(`  - Transport: ${options.transport}`);
        console.log(`  - Protocol: ${options.protocol}`);
        console.log(`  - Browser mode: ${options.browser}`);
        console.log(`  - WebSocket: ${options.webSocket}`);
        console.log(`  - Keep alive: ${options.keepalive} seconds`);
        
        // Create MQTT client
        const client = mqtt.connect(connectUrl, options);
        
        // Set timeout
        const timeout = setTimeout(() => {
            client.end();
            reject(new Error('Connection timeout'));
        }, testConfig.timeout);
        
        // Connection successful
        client.on('connect', () => {
            clearTimeout(timeout);
            console.log('✅ Connection successful!');
            console.log('📊 Connection status:', client.connected);
            console.log('🔗 Connection URL:', client.options.href);
            
            // Test message publishing
            const testTopic = 'test/connection';
            const testMessage = JSON.stringify({
                timestamp: new Date().toISOString(),
                test: 'MQTTBox连接测试',
                platform: 'Electron'
            });
            
            console.log(`\n📤 Publishing test message to topic: ${testTopic}`);
            client.publish(testTopic, testMessage, { qos: 0 }, (err) => {
                if (err) {
                    console.error('❌ Message publish failed:', err.message);
                } else {
                    console.log('✅ Message published successfully');
                }
                
                // Close connection
                client.end();
                resolve({
                    success: true,
                    connected: client.connected,
                    url: connectUrl,
                    options: options
                });
            });
        });
        
        // Connection error
        client.on('error', (err) => {
            clearTimeout(timeout);
            console.error('❌ Connection failed:', err.message);
            console.error('🔍 Error details:', err);
            reject(err);
        });
        
        // Connection closed
        client.on('close', () => {
            console.log('🔌 Connection closed');
        });
        
        // Offline event
        client.on('offline', () => {
            console.log('📴 Connection offline');
        });
    });
}

// Run test
async function runTest() {
    try {
        console.log('🔍 Checking certificate files...');
        if (!checkCertificates()) {
            process.exit(1);
        }
        
        console.log('\n🚀 Starting MQTT connection test...');
        const result = await testMqttConnection();
        
        console.log('\n🎉 Test completed!');
        console.log('📋 Test results:');
        console.log(`  - Connection status: ${result.success ? 'Success' : 'Failed'}`);
        console.log(`  - Connection URL: ${result.url}`);
        console.log(`  - Transport: ${result.options.transport}`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n💥 Test failed:');
        console.error(`  - Error: ${error.message}`);
        console.error(`  - Type: ${error.constructor.name}`);
        
        if (error.code) {
            console.error(`  - Error code: ${error.code}`);
        }
        
        process.exit(1);
    }
}

// Start test
runTest();

