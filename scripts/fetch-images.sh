#!/usr/bin/env bash
# Downloads all site imagery generated with Nano Banana (via Higgsfield) into
# public/images, resized for the web. Run once after cloning:  bash scripts/fetch-images.sh
# Requires curl; uses ImageMagick (magick/convert) or macOS sips for resizing.
set -e
cd "$(dirname "$0")/.." && cd public/images
mkdir -p p
B=https://d8j0ntlcm91z4.cloudfront.net/user_3AgmoO1kEvlZmppIBOozz4803o0
resize() { # $1=png $2=jpg $3=maxpx
  if command -v magick >/dev/null; then magick "$1" -resize "$3x$3>" -strip -quality 74 "$2"
  elif command -v convert >/dev/null; then convert "$1" -resize "$3x$3>" -strip -quality 74 "$2"
  else sips -s format jpeg -s formatOptions 74 -Z "$3" "$1" --out "$2" >/dev/null; fi
  rm -f "$1"
}
fetch() { # $1=name $2=id $3=maxpx
  # skip if a real (non-placeholder) file exists; placeholders are tiny flat gradients
  if [ -f "$1.jpg" ] && [ "${FORCE:-0}" = 0 ] && [ "$(wc -c < "$1.jpg")" -gt 40000 ]; then echo "· $1 (exists)"; return; fi
  echo "→ $1"; curl -sSfL -o "$1.png" "$B/$2.png"; resize "$1.png" "$1.jpg" "$3"
}
# Hero, category and occasion imagery
while read -r name id; do fetch "$name" "$id" $([ "$name" = hero ] && echo 1800 || echo 1400); done <<'LIST'
hero hf_20261021_042031_d491c102-b12d-4de7-bae1-1b5aba7de0d1
cat-photobooks hf_20261021_043435_d2a1bff1-d1df-4f3b-a7af-f3d1269aedab
cat-frames hf_20261021_042031_2bd734dd-8558-49d5-b119-47a9068e9a35
cat-calendars hf_20261021_042032_ae7ffa4c-ab9e-4ae0-a748-d2413542717b
cat-kids hf_20261021_042032_58aecbd5-89cd-42a7-9976-2e5bba056c31
cat-decor hf_20261021_043435_5a5d6991-eaab-465b-aa4e-76a6258dd411
cat-gifts hf_20261021_042032_266e64cc-455e-433a-a4a3-73bacd30b8b2
cat-prints hf_20261021_042031_b067e3d8-65be-4dc6-a484-f10e80bdd291
cat-bags hf_20261021_042031_f19254ee-1bfe-45a2-ae6a-bb538e2dc192
diwali hf_20261021_042031_0c8b947e-bad0-47ee-b823-35f3d96e6e82
wedding hf_20261021_042031_bdfc4612-f7cf-42a4-aa9c-5af7eeec4ec9
birthday hf_20261021_042031_0f418d1d-3f33-4815-800f-4eeae3ef20de
LIST
# One hero image per product (87), listed in scripts/product-images.txt
while read -r name id; do fetch "$name" "$id" 1200; done < "$OLDPWD/scripts/product-images.txt"
echo "Done: $(ls *.jpg p/*.jpg | wc -l | tr -d ' ') images in public/images."
