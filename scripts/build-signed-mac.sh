#!/bin/bash

echo "🍎 构建已签名的macOS应用"
echo "================================"

# 检查环境变量
if [ -z "$APPLE_ID" ] || [ -z "$APPLE_TEAM_ID" ]; then
    echo "❌ 请先设置Apple开发者环境变量"
    echo "运行: ./scripts/setup-apple-signing.sh"
    exit 1
fi

echo "🔨 开始构建..."
echo "APPLE_ID: $APPLE_ID"
echo "APPLE_TEAM_ID: $APPLE_TEAM_ID"
echo ""

# 清理之前的构建
echo "🧹 清理之前的构建..."
rm -rf dist/

# 构建应用
echo "📦 构建macOS应用..."
npm run dist:mac:arm64

if [ $? -eq 0 ]; then
    echo "✅ 构建完成！"
    echo ""
    echo "📁 输出文件："
    ls -la dist/*.dmg
    echo ""
    echo "🔍 验证签名："
    codesign -dv --verbose=4 dist/MQTTBox-0.2.3-arm64.dmg
    echo ""
    echo "🎉 应用已成功构建并签名！"
else
    echo "❌ 构建失败"
    exit 1
fi
