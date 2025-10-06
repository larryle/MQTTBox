#!/bin/bash
set -euo pipefail
SRC=${1:-src/www/images/icon-128.png}
OUTDIR=build-icons.iconset
OUTICNS=src/www/images/icon.icns
rm -rf "$OUTDIR"
mkdir "$OUTDIR"
sips -z 16 16     "$SRC" --out "$OUTDIR/icon_16x16.png" >/dev/null
sips -z 32 32     "$SRC" --out "$OUTDIR/icon_16x16@2x.png" >/dev/null
sips -z 32 32     "$SRC" --out "$OUTDIR/icon_32x32.png" >/dev/null
sips -z 64 64     "$SRC" --out "$OUTDIR/icon_32x32@2x.png" >/dev/null
sips -z 128 128   "$SRC" --out "$OUTDIR/icon_128x128.png" >/dev/null
sips -z 256 256   "$SRC" --out "$OUTDIR/icon_128x128@2x.png" >/dev/null
sips -z 256 256   "$SRC" --out "$OUTDIR/icon_256x256.png" >/dev/null
sips -z 512 512   "$SRC" --out "$OUTDIR/icon_256x256@2x.png" >/dev/null
sips -z 512 512   "$SRC" --out "$OUTDIR/icon_512x512.png" >/dev/null
cp "$SRC" "$OUTDIR/icon_512x512@2x.png"
iconutil -c icns "$OUTDIR" -o "$OUTICNS"
echo "Generated $OUTICNS"
