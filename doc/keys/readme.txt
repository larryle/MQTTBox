App Store Connect API Key Usage Guide (Updated: Team Key, Notarization, DMG-only Release, S3 Deployment)

I. Purpose
- For automation tools (such as notarytool, notarization/upload scripts, CI builds) to access App Store Connect as a team.
- Alternative to Apple ID + App-specific password method, more secure and can assign minimal permissions by environment.

II. Prerequisites
- Paid Apple Developer Program account.
- Your role in App Store Connect is Account Holder or Admin (to create keys).

III. Generate Team API Key (Recommended Team Keys)
1) Login to App Store Connect → Users and Access → Integrations → App Store Connect API.
2) Select "Team Keys" tab, click "Generate API Key".
3) Role recommendation: App Manager (minimum available permissions). If higher permissions needed, choose Admin.
4) After generation, obtain:
   - Key ID (e.g., ABCDEFGHIJ)
   - Issuer ID (team fixed UUID)
   - Private key file .p8 (downloadable only once, store securely, never commit to repository)

IV. Configure notarytool credentials on local machine
Assume using keychain profile name: AC_NOTARY

Method A: Using API Key (Recommended)
xcrun notarytool store-credentials "AC_NOTARY" \
  --key /secure/path/AuthKey_XXXX.p8 \
  --key-id <KEY_ID> \
  --issuer <ISSUER_ID>

Method B: Using Apple ID (if not using API Key)
xcrun notarytool store-credentials "AC_NOTARY" \
  --apple-id <APPLE_ID> \
  --team-id <TEAM_ID> \
  --password <APP_SPECIFIC_PASSWORD>

Environment variables (required during build)
export APPLE_TEAM_ID=<TEAM_ID>   # e.g.: 6J7RFSG6F3 (Circumtec team)
# Optional: if not using default name
export APPLE_NOTARY_KEYCHAIN_PROFILE=AC_NOTARY

V. Certificates and Signing (Developer ID Application)
- In Xcode → Settings/Preferences → Accounts → Select team → Manage Certificates… → "+" to generate "Developer ID Application".
- Or apply with CSR on Developer website and import to login keychain.
- This project can auto-discover signing; if explicit specification needed:
  export CSC_NAME="Circumtec Pty Ltd"  # Certificate display name, without "Developer ID Application:" prefix

VI. Build, Notarization and Staple (DMG output only, no ZIP)
- Project configured with electron-builder afterSign hook (scripts/notarize.js), automatically notarizes .app during build.
- After generating DMG, need to notarize DMG itself once more, then staple:
  1) Build:
     npm run dist-mac
  2) Notarize DMG (example, x64 and arm64 separately):
     xcrun notarytool submit dist/MQTTBox-<ver>.dmg --keychain-profile AC_NOTARY --team-id <TEAM_ID> --wait
     xcrun notarytool submit dist/MQTTBox-<ver>-arm64.dmg --keychain-profile AC_NOTARY --team-id <TEAM_ID> --wait
  3) Staple and verify:
     npm run staple:mac

VII. Deploy to S3 (circumtec.com/download/)
- Script: scripts/deploy.sh (uploads .dmg only)
- Usage:
  bash scripts/deploy.sh
- Options:
  - S3_URI custom upload path: S3_URI=s3://circumtec.com/download/releases/ bash scripts/deploy.sh
  - DRY_RUN=true preview only without upload: DRY_RUN=true bash scripts/deploy.sh
- Note: When Bucket has BlockPublicAcls enabled, won't add public-read; set public access via Bucket Policy/CloudFront.

VIII. Key Rotation and Revocation
- In App Store Connect → Team Keys page:
  - Revoke: Immediate invalidation (CI needs to switch to new Key)
  - Recommend creating different Keys for different environments/pipelines, minimal permissions, regular rotation
- .p8 loss cannot be recovered, only Revoke and regenerate

IX. Security Recommendations
- Don't commit .p8, passwords and other sensitive information to repository, don't upload to Release.
- CI uses platform Secrets/Variables to manage KEY_ID, ISSUER_ID; .p8 injected via Secret/Keychain.
- Scripts and logs avoid printing sensitive variable values.

X. Common Issues
- 401/Insufficient permissions: Check if key role is App Manager/Admin; if Issuer/Key ID corresponds to current team.
- notarytool can't find credentials: Confirm AC_NOTARY is written to keychain, or pass correct --keychain-profile.
- Notarization passed but DMG still shows warning when opened: Missing staple; run npm run staple:mac and verify.

IX: Details:

name: App Manager
Key ID: KD893Y374P
Issuer ID: 8392e016-c7b1-43db-8f06-1024bf7cd120
Team ID: 6J7RFSG6F3