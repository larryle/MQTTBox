#!/bin/bash

echo "🧪 MQTT连接测试脚本"
echo "===================="

# 检查Node.js版本
echo "📋 检查环境..."
echo "Node.js版本: $(node --version)"
echo "NPM版本: $(npm --version)"

# 进入测试目录
cd "$(dirname "$0")"

# 检查MQTT模块
echo "🔍 检查MQTT模块..."
if ! node -e "console.log('MQTT版本:', require('mqtt/package.json').version)" 2>/dev/null; then
    echo "❌ MQTT模块未安装，正在安装..."
    npm install mqtt@^4.3.8
fi

# 运行测试
echo "🚀 开始运行测试..."
node simple-mqtt-test.js

echo "✅ 测试完成"

