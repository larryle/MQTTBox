// 模拟Electron环境
global.window = {
  navigator: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Electron/22.3.27'
  }
};

// 模拟require函数
global.require = (modulePath) => {
  if (modulePath === '../services/ElectronMqttService') {
    return {
      default: class MockElectronMqttService {
        constructor() {
          console.log('🔧 MockElectronMqttService constructor called');
        }
        async connect(data) {
          console.log('🔧 MockElectronMqttService.connect called with:', data);
          return Promise.resolve();
        }
      }
    };
  }
  return {};
};

// 模拟_interopRequireDefault
global._interopRequireDefault = (obj) => obj && obj.__esModule ? obj : { default: obj };

// 模拟PlatformConstants
const PlatformConstants = {
  PLATFORM_TYPE: 'ELECTRON_APP'
};

// 模拟CommonConstants
const CommonConstants = {
  PLATFORM_ELECTRON_APP: 'ELECTRON_APP'
};

// 模拟编译后的代码逻辑
function testCompiledLogic() {
  console.log('🧪 开始运行时调试测试...\n');

  // 模拟编译后的代码
  const _PlatformConstants2 = { default: PlatformConstants };
  const _CommonConstants2 = { default: CommonConstants };
  const _ElectronMqttService2 = { default: class MockElectronMqttService {
    constructor() {
      console.log('🔧 MockElectronMqttService constructor called');
    }
    async connect(data) {
      console.log('🔧 MockElectronMqttService.connect called with:', data);
      return Promise.resolve();
    }
  }};

  console.log('📊 调试信息:');
  console.log('PlatformConstants.PLATFORM_TYPE:', _PlatformConstants2.default.PLATFORM_TYPE);
  console.log('CommonConstants.PLATFORM_ELECTRON_APP:', _CommonConstants2.default.PLATFORM_ELECTRON_APP);
  console.log('条件1 (PLATFORM_TYPE == PLATFORM_ELECTRON_APP):', 
    _PlatformConstants2.default.PLATFORM_TYPE == _CommonConstants2.default.PLATFORM_ELECTRON_APP);

  // 模拟构造函数
  function MockMqttClientConnectionWorker() {
    const _this = this;
    _this.mqttClientObj = null;
    _this.isDisconnecting = false;

    // 初始化Electron MQTT服务
    if (_PlatformConstants2.default.PLATFORM_TYPE === _CommonConstants2.default.PLATFORM_ELECTRON_APP) {
      console.log('🔧 初始化ElectronMqttService...');
      _this.electronMqttService = new _ElectronMqttService2.default();
      console.log('✅ ElectronMqttService created:', !!_this.electronMqttService);
    } else {
      console.log('❌ 不在Electron环境中，跳过ElectronMqttService初始化');
    }

    _this.connectToBroker = function() {
      console.log('\n🔧 connectToBroker called');
      console.log('📊 this.mqttClientObj:', _this.mqttClientObj);
      console.log('📊 this.electronMqttService:', !!_this.electronMqttService);

      if (_this.mqttClientObj != null && _this.mqttClientObj.mcsId != null) {
        // 在Electron环境中使用新的MQTT服务
        console.log('📊 条件检查:');
        console.log('  - PLATFORM_TYPE == PLATFORM_ELECTRON_APP:', 
          _PlatformConstants2.default.PLATFORM_TYPE == _CommonConstants2.default.PLATFORM_ELECTRON_APP);
        console.log('  - this.electronMqttService存在:', !!_this.electronMqttService);
        console.log('  - 组合条件:', 
          _PlatformConstants2.default.PLATFORM_TYPE == _CommonConstants2.default.PLATFORM_ELECTRON_APP && _this.electronMqttService);

        if (_PlatformConstants2.default.PLATFORM_TYPE == _CommonConstants2.default.PLATFORM_ELECTRON_APP && _this.electronMqttService) {
          console.log('🔧 Electron环境检测到，使用主进程MQTT服务');
          _this.electronMqttService.connect(_this.mqttClientObj).catch(function (error) {
            console.error('❌ Electron MQTT连接失败:', error);
          });
          console.log('✅ 执行return，跳过后续代码');
          return; // 确保在Electron环境中不继续执行后续代码
        }

        console.log('⚠️ 条件不满足，继续执行原始MQTT连接逻辑');
        // 这里会执行原始的mqtt.connect，导致net.isIP错误
        console.log('❌ 执行原始MQTT连接逻辑（这会导致net.isIP错误）');
      } else {
        console.log('❌ mqttClientObj为空或mcsId为空');
      }
    };

    return _this;
  }

  // 测试
  const worker = new MockMqttClientConnectionWorker();
  worker.mqttClientObj = {
    mcsId: 'test-client-123',
    protocol: 'mqtts',
    host: 'test.example.com',
    port: 8883
  };

  console.log('\n🧪 执行connectToBroker测试:');
  worker.connectToBroker();

  console.log('\n✅ 运行时调试测试完成');
}

// 运行测试
testCompiledLogic();
