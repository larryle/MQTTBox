#!/bin/bash

echo "🍎 Apple代码签名设置脚本"
echo "================================"

# 检查是否已设置环境变量
if [ -z "$APPLE_ID" ] || [ -z "$APPLE_TEAM_ID" ]; then
    echo "❌ 请先设置以下环境变量："
    echo ""
    echo "export APPLE_ID=\"your-apple-id@example.com\""
    echo "export APPLE_ID_PASSWORD=\"your-app-specific-password\""
    echo "export APPLE_TEAM_ID=\"your-team-id\""
    echo ""
    echo "💡 获取这些信息的方法："
    echo "1. APPLE_ID: 您的Apple ID邮箱"
    echo "2. APPLE_TEAM_ID: 在Apple Developer Portal中查看Team ID"
    echo "3. APPLE_ID_PASSWORD: 需要创建App专用密码"
    echo ""
    echo "🔗 创建App专用密码："
    echo "https://appleid.apple.com/account/manage"
    echo "→ 登录和安全性 → App专用密码"
    exit 1
fi

echo "✅ 环境变量已设置"
echo "APPLE_ID: $APPLE_ID"
echo "APPLE_TEAM_ID: $APPLE_TEAM_ID"
echo ""

# 检查是否有开发者证书
echo "🔍 检查开发者证书..."
security find-identity -v -p codesigning

echo ""
echo "📋 下一步操作："
echo "1. 确保您有有效的Apple开发者账户"
echo "2. 下载并安装开发者证书到钥匙串"
echo "3. 运行: npm run dist:mac:arm64"
echo "4. 应用将自动进行代码签名和公证"
