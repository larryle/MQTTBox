#!/usr/bin/env bash
set -euo pipefail

# Configure notarytool keychain profile for App Store Connect API Key
# Usage:
#   APPLE_KEY_P8=/path/to/AuthKey_XXXX.p8 \
#   APPLE_KEY_ID=XXXX \
#   APPLE_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
#   APPLE_NOTARY_PROFILE=AC_NOTARY \
#   bash scripts/notary-setup.sh

: "${APPLE_KEY_P8:?APPLE_KEY_P8 is required}"
: "${APPLE_KEY_ID:?APPLE_KEY_ID is required}"
: "${APPLE_ISSUER_ID:?APPLE_ISSUER_ID is required}"
APPLE_NOTARY_PROFILE=${APPLE_NOTARY_PROFILE:-AC_NOTARY}

echo "[notarytool] Storing credentials to keychain profile: $APPLE_NOTARY_PROFILE"
xcrun notarytool store-credentials "$APPLE_NOTARY_PROFILE" \
  --key "$APPLE_KEY_P8" \
  --key-id "$APPLE_KEY_ID" \
  --issuer "$APPLE_ISSUER_ID"

echo "[notarytool] Done"


