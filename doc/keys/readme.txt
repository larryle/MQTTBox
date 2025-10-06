App Store Connect API Key 使用说明（更新：Team Key、公证、仅 DMG 发布、S3 部署）

一、用途
- 供自动化工具（如 notarytool、公证/上传脚本、CI 构建）以团队身份访问 App Store Connect。
- 替代 Apple ID + App 专用密码的方式，更安全、可按环境分配最小权限。

二、前提
- 付费 Apple Developer Program 账号。
- 你在 App Store Connect 的角色为 Account Holder 或 Admin（才能创建密钥）。

三、生成 Team API Key（推荐 Team Keys）
1) 登录 App Store Connect → Users and Access → Integrations → App Store Connect API。
2) 选择 “Team Keys” 标签，点击 “Generate API Key”。
3) 角色（Role）建议选择：App Manager（最小可用权限）。若需更高权限可选 Admin。
4) 生成后获取：
   - Key ID（例如 ABCDEFGHIJ）
   - Issuer ID（团队固定 UUID）
   - 私钥文件 .p8（仅可下载一次，妥善保管，切勿入库）

四、在本机配置 notarytool 凭据
假设使用钥匙串配置名：AC_NOTARY

方式 A：使用 API Key（推荐）
xcrun notarytool store-credentials "AC_NOTARY" \
  --key /安全路径/AuthKey_XXXX.p8 \
  --key-id <KEY_ID> \
  --issuer <ISSUER_ID>

方式 B：使用 Apple ID（如未使用 API Key）
xcrun notarytool store-credentials "AC_NOTARY" \
  --apple-id <APPLE_ID> \
  --team-id <TEAM_ID> \
  --password <APP_SPECIFIC_PASSWORD>

环境变量（构建时需要）
export APPLE_TEAM_ID=<TEAM_ID>   # 例如：6J7RFSG6F3（Circumtec 团队）
# 可选：如用的不是默认名称
export APPLE_NOTARY_KEYCHAIN_PROFILE=AC_NOTARY

五、证书与签名（Developer ID Application）
- 在 Xcode → Settings/Preferences → Accounts → 选中团队 → Manage Certificates… → “+” 生成 “Developer ID Application”。
- 或在 Developer 网站用 CSR 申请，并导入到登录钥匙串。
- 本项目签名可自动发现；如需显式指定：
  export CSC_NAME="Circumtec Pty Ltd"  # 证书展示名，不带“Developer ID Application:”前缀

六、构建、公证与 staple（仅产出 DMG，不再生成 ZIP）
- 项目已配置 electron-builder afterSign 钩子（scripts/notarize.js），构建时会自动对 .app 进行公证。
- 生成 DMG 后，需对 DMG 本身再公证一次，然后 staple：
  1) 构建：
     npm run dist-mac
  2) 公证 DMG（示例，x64 与 arm64 各一次）：
     xcrun notarytool submit dist/MQTTBox-<ver>.dmg --keychain-profile AC_NOTARY --team-id <TEAM_ID> --wait
     xcrun notarytool submit dist/MQTTBox-<ver>-arm64.dmg --keychain-profile AC_NOTARY --team-id <TEAM_ID> --wait
  3) staple 与校验：
     npm run staple:mac

七、部署到 S3（circumtec.com/download/）
- 脚本：scripts/deploy.sh（仅上传 .dmg）
- 用法：
  bash scripts/deploy.sh
- 可选：
  - S3_URI 自定义上传路径：S3_URI=s3://circumtec.com/download/releases/ bash scripts/deploy.sh
  - DRY_RUN=true 仅预览不上传：DRY_RUN=true bash scripts/deploy.sh
- 提示：Bucket 开启 BlockPublicAcls 时不会添加 public-read；请通过 Bucket Policy/CloudFront 设置公开访问。

八、密钥轮换与撤销
- 在 App Store Connect → Team Keys 页面：
  - Revoke：立即失效（CI 需切换到新 Key）
  - 建议为不同环境/流水线创建不同 Key，最小权限、定期轮换
- .p8 丢失无法找回，只能 Revoke 后重新生成

九、安全建议
- .p8、密码等敏感信息不要提交到仓库，也不要上传到 Release。
- CI 使用平台 Secrets/Variables 管理 KEY_ID、ISSUER_ID；.p8 通过 Secret/Keychain 注入。
- 脚本与日志避免打印敏感变量值。

十、常见问题
- 401/权限不足：检查密钥角色是否为 App Manager/Admin；Issuer/Key ID 是否对应当前团队。
- notarytool 找不到凭据：确认 AC_NOTARY 已写入钥匙串，或传入正确的 --keychain-profile。
- 公证通过但 DMG 打开仍警告：缺少 staple；请运行 npm run staple:mac 并验证。

九: detail:

name: App Manager
Key ID: KD893Y374P
Issuer ID: 8392e016-c7b1-43db-8f06-1024bf7cd120
Team ID: 6J7RFSG6F3