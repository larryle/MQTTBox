# 🍎 Apple代码签名和公证指南

## 📋 **前提条件**

1. **Apple开发者账户** ($99/年)
2. **macOS系统** (用于构建)
3. **Xcode命令行工具**

## 🔧 **设置步骤**

### 1. 获取Apple开发者信息

#### 获取Team ID
1. 登录 [Apple Developer Portal](https://developer.apple.com)
2. 点击右上角您的名字
3. 查看 "Membership" 部分，找到 "Team ID"

#### 创建App专用密码
1. 访问 [Apple ID管理页面](https://appleid.apple.com/account/manage)
2. 登录您的Apple ID
3. 在 "登录和安全性" 部分，点击 "App专用密码"
4. 生成一个新的App专用密码（保存好，只显示一次）

### 2. 设置环境变量

```bash
# 设置您的Apple开发者信息
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="your-app-specific-password"
export APPLE_TEAM_ID="your-team-id"

# 验证设置
./scripts/setup-apple-signing.sh
```

### 3. 安装开发者证书

#### 方法1：通过Xcode自动管理
```bash
# 打开Xcode
open -a Xcode
# 在Xcode中登录您的Apple ID
# Xcode会自动下载和管理证书
```

#### 方法2：手动下载证书
1. 在Apple Developer Portal中下载证书
2. 双击安装到钥匙串
3. 确保证书在 "登录" 钥匙串中

### 4. 更新构建配置

编辑 `package.json` 中的 `identity` 字段：
```json
"identity": "Developer ID Application: Your Name (YOUR_TEAM_ID)"
```

## 🚀 **构建已签名的应用**

### 构建ARM64版本（推荐）
```bash
npm run dist:mac:arm64
```

### 构建无签名版本（用于测试）
```bash
npm run dist:mac:arm64:unsigned
```

### 使用构建脚本
```bash
./scripts/build-signed-mac.sh
```

## 🔍 **验证签名**

### 检查DMG签名
```bash
codesign -dv --verbose=4 dist/MQTTBox-0.2.3-arm64.dmg
```

### 检查应用签名
```bash
codesign -dv --verbose=4 dist/MQTTBox-0.2.3-arm64.dmg
```

### 验证公证状态
```bash
spctl -a -t exec -vv dist/MQTTBox-0.2.3-arm64.dmg
```

## ⚠️ **常见问题**

### 1. "No identity found"
- 确保开发者证书已安装到钥匙串
- 检查证书是否在 "登录" 钥匙串中
- 确保证书没有过期

### 2. "Notarization failed"
- 检查Apple ID和密码是否正确
- 确保Team ID正确
- 检查网络连接

### 3. "Gatekeeper assessment failed"
- 等待公证完成（可能需要几分钟）
- 检查公证状态：`xcrun altool --notarization-info <UUID>`

## 📚 **相关链接**

- [Apple代码签名指南](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Electron代码签名](https://www.electronjs.org/docs/latest/tutorial/code-signing)
- [公证服务](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

## 🎯 **最终结果**

成功构建后，用户将看到：
- ✅ 无安全警告
- ✅ 直接双击运行
- ✅ 通过Gatekeeper验证
- ✅ 显示为 "已验证的开发者"
