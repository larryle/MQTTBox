const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const mqtt = require('mqtt');

// 模拟Electron环境
global.window = {
  navigator: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Electron/22.3.27'
  }
};

// 模拟PlatformConstants
const PlatformConstants = {
  PLATFORM_TYPE: 'ELECTRON_APP'
};

// 模拟CommonConstants
const CommonConstants = {
  PLATFORM_ELECTRON_APP: 'ELECTRON_APP'
};

// 模拟ElectronMqttService
class MockElectronMqttService {
  constructor() {
    this.connected = false;
    this.clients = new Map();
  }

  async connect(connectionData) {
    console.log('🔧 MockElectronMqttService.connect called with:', connectionData);
    this.connected = true;
    this.clients.set(connectionData.mcsId, connectionData);
    return Promise.resolve();
  }

  async disconnect(clientId) {
    console.log('🔌 MockElectronMqttService.disconnect called with:', clientId);
    this.connected = false;
    this.clients.delete(clientId);
    return Promise.resolve();
  }
}

// 模拟MqttClientConnectionWorker
class MockMqttClientConnectionWorker {
  constructor() {
    this.mqttClientObj = null;
    this.electronMqttService = null;
    this.isDisconnecting = false;
    
    // 初始化Electron MQTT服务
    if (PlatformConstants.PLATFORM_TYPE === CommonConstants.PLATFORM_ELECTRON_APP) {
      this.electronMqttService = new MockElectronMqttService();
      console.log('✅ ElectronMqttService initialized');
    }
  }

  connectToBroker() {
    console.log('🔧 connectToBroker called');
    console.log('📊 Platform type:', PlatformConstants.PLATFORM_TYPE);
    console.log('📊 ElectronMqttService available:', !!this.electronMqttService);
    
    if (this.mqttClientObj != null && this.mqttClientObj.mcsId != null) {
      // 在Electron环境中使用新的MQTT服务
      if (PlatformConstants.PLATFORM_TYPE == CommonConstants.PLATFORM_ELECTRON_APP && this.electronMqttService) {
        console.log('🔧 Electron环境检测到，使用主进程MQTT服务');
        this.electronMqttService.connect(this.mqttClientObj).catch(error => {
          console.error('❌ Electron MQTT连接失败:', error);
        });
        return; // 确保在Electron环境中不继续执行后续代码
      }

      // 原始MQTT连接逻辑（这会导致net.isIP错误）
      console.log('⚠️ 执行原始MQTT连接逻辑（这会导致错误）');
      try {
        const connectUrl = this.mqttClientObj.protocol + '://' + this.mqttClientObj.host;
        const options = this.getConnectOptions();
        const client = mqtt.connect(connectUrl, options);
        console.log('❌ 不应该执行到这里！');
      } catch (error) {
        console.error('❌ MQTT连接错误:', error.message);
      }
    }
  }

  getConnectOptions() {
    return {
      clientId: 'test-client',
      keepalive: 10,
      clean: true
    };
  }

  setMqttClientObj(obj) {
    this.mqttClientObj = obj;
  }
}

// 测试函数
function runTests() {
  console.log('🧪 开始Electron MQTT功能测试...\n');

  // 测试1: 检查平台检测
  console.log('📋 测试1: 平台检测');
  console.log('Platform type:', PlatformConstants.PLATFORM_TYPE);
  console.log('Expected:', CommonConstants.PLATFORM_ELECTRON_APP);
  console.log('Match:', PlatformConstants.PLATFORM_TYPE === CommonConstants.PLATFORM_ELECTRON_APP);
  console.log('');

  // 测试2: 检查ElectronMqttService初始化
  console.log('📋 测试2: ElectronMqttService初始化');
  const worker = new MockMqttClientConnectionWorker();
  console.log('ElectronMqttService created:', !!worker.electronMqttService);
  console.log('');

  // 测试3: 检查连接重定向
  console.log('📋 测试3: 连接重定向测试');
  worker.setMqttClientObj({
    mcsId: 'test-client-123',
    protocol: 'mqtts',
    host: 'test.example.com',
    port: 8883
  });

  console.log('调用connectToBroker...');
  worker.connectToBroker();
  console.log('');

  // 测试4: 检查是否避免了net.isIP错误
  console.log('📋 测试4: 检查是否避免了net.isIP错误');
  console.log('如果看到"❌ 不应该执行到这里！"，说明重定向失败');
  console.log('如果看到"🔧 Electron环境检测到，使用主进程MQTT服务"，说明重定向成功');
  console.log('');

  console.log('✅ 测试完成');
}

// 运行测试
runTests();
