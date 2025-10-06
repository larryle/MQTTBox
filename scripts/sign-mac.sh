#!/usr/bin/env bash
set -euo pipefail

# Inputs (customize if needed)
APP_PATH="dist/MQTTBox-darwin-x64/MQTTBox.app"
CERT_NAME="Developer ID Application: Circumtec Pty Ltd (6J7RFSG6F3)"

if [ ! -d "$APP_PATH" ]; then
  echo "App not found: $APP_PATH" >&2
  exit 1
fi

echo "[sign] Signing: $APP_PATH"

# Sign all nested components first (helpers, frameworks, dylibs)
find "$APP_PATH" -type f \( -perm +111 -o -name "*.dylib" -o -name "*.so" \) -print0 | \
  xargs -0 -I{} sh -c 'codesign --force --sign "$CERT_NAME" --timestamp --options runtime "{}"' CERT_NAME="$CERT_NAME"

# Sign Frameworks directories
if [ -d "$APP_PATH/Contents/Frameworks" ]; then
  find "$APP_PATH/Contents/Frameworks" -maxdepth 2 -type d -name "*.framework" -print0 | \
    xargs -0 -I{} sh -c 'codesign --force --sign "$CERT_NAME" --timestamp --options runtime "{}"' CERT_NAME="$CERT_NAME"
fi

# Finally sign the .app bundle
codesign --force --sign "$CERT_NAME" --timestamp --options runtime "$APP_PATH"

echo "[sign] Verifying signature"
codesign --verify --deep --strict --verbose=2 "$APP_PATH"
spctl -a -v "$APP_PATH" || true

echo "[sign] Done"


