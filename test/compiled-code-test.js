const fs = require('fs');
const path = require('path');

// 读取编译后的代码
const compiledCodePath = path.join(__dirname, '../build/platform/PlatformMqttClientWorkerService.js');
const compiledCode = fs.readFileSync(compiledCodePath, 'utf8');

console.log('🧪 开始检查编译后的代码...\n');

// 检查1: 是否有Electron环境检测代码
console.log('📋 检查1: Electron环境检测代码');
const hasElectronDetection = compiledCode.includes('🔧 Electron环境检测到，使用主进程MQTT服务');
console.log('包含Electron环境检测代码:', hasElectronDetection);

// 检查2: 是否有ElectronMqttService导入
console.log('\n📋 检查2: ElectronMqttService导入');
const hasElectronMqttServiceImport = compiledCode.includes('require(\'../services/ElectronMqttService\')');
console.log('包含ElectronMqttService导入:', hasElectronMqttServiceImport);

// 检查3: 是否有ElectronMqttService初始化
console.log('\n📋 检查3: ElectronMqttService初始化');
const hasElectronMqttServiceInit = compiledCode.includes('new _ElectronMqttService2.default()');
console.log('包含ElectronMqttService初始化:', hasElectronMqttServiceInit);

// 检查4: 是否有return语句
console.log('\n📋 检查4: return语句');
const hasReturnStatement = compiledCode.includes('return; // 确保在Electron环境中不继续执行后续代码');
console.log('包含return语句:', hasReturnStatement);

// 检查5: 是否有mqtt.connect调用
console.log('\n📋 检查5: mqtt.connect调用');
const hasMqttConnect = compiledCode.includes('mqtt.connect');
console.log('包含mqtt.connect调用:', hasMqttConnect);

// 检查6: 检查ElectronMqttService文件是否存在
console.log('\n📋 检查6: ElectronMqttService文件存在性');
const electronMqttServicePath = path.join(__dirname, '../build/services/ElectronMqttService.js');
const electronMqttServiceExists = fs.existsSync(electronMqttServicePath);
console.log('ElectronMqttService文件存在:', electronMqttServiceExists);

if (electronMqttServiceExists) {
  const electronMqttServiceContent = fs.readFileSync(electronMqttServicePath, 'utf8');
  const hasClassDefinition = electronMqttServiceContent.includes('class ElectronMqttService');
  console.log('ElectronMqttService包含类定义:', hasClassDefinition);
}

// 检查7: 检查PlatformConstants和CommonConstants
console.log('\n📋 检查7: 常量定义');
const hasPlatformConstants = compiledCode.includes('PLATFORM_ELECTRON_APP');
const hasCommonConstants = compiledCode.includes('_CommonConstants2.default.PLATFORM_ELECTRON_APP');
console.log('包含PLATFORM_ELECTRON_APP:', hasPlatformConstants);
console.log('包含CommonConstants引用:', hasCommonConstants);

// 检查8: 检查条件判断逻辑
console.log('\n📋 检查8: 条件判断逻辑');
const hasConditionalCheck = compiledCode.includes('_PlatformConstants2.default.PLATFORM_TYPE == _CommonConstants2.default.PLATFORM_ELECTRON_APP && this.electronMqttService');
console.log('包含条件判断:', hasConditionalCheck);

// 总结
console.log('\n📊 测试总结:');
console.log('✅ Electron环境检测代码:', hasElectronDetection ? '✓' : '✗');
console.log('✅ ElectronMqttService导入:', hasElectronMqttServiceImport ? '✓' : '✗');
console.log('✅ ElectronMqttService初始化:', hasElectronMqttServiceInit ? '✓' : '✗');
console.log('✅ return语句:', hasReturnStatement ? '✓' : '✗');
console.log('✅ mqtt.connect调用:', hasMqttConnect ? '✓' : '✗');
console.log('✅ ElectronMqttService文件存在:', electronMqttServiceExists ? '✓' : '✗');
console.log('✅ 常量定义:', hasPlatformConstants && hasCommonConstants ? '✓' : '✗');
console.log('✅ 条件判断逻辑:', hasConditionalCheck ? '✓' : '✗');

// 如果所有检查都通过，但仍有问题，可能是运行时问题
if (hasElectronDetection && hasElectronMqttServiceImport && hasElectronMqttServiceInit && hasReturnStatement && electronMqttServiceExists && hasConditionalCheck) {
  console.log('\n🔍 所有代码检查都通过，问题可能是运行时的：');
  console.log('1. PlatformConstants.PLATFORM_TYPE 的值不正确');
  console.log('2. this.electronMqttService 为 null 或 undefined');
  console.log('3. 条件判断在运行时失败');
} else {
  console.log('\n❌ 发现问题，需要修复编译配置或代码');
}
